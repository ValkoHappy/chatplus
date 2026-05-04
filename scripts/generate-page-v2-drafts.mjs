import { readFile } from 'node:fs/promises';

import {
  assertAiGenerationJobAllowed,
  buildCatalogEntityCreateData,
  buildAiChatClientConfig,
  buildGenerationReport,
  CATALOG_ENTITY_FAMILIES,
  getTargetPageContext,
  normalizeCatalogEntityProposals,
  normalizeGeneratedPageV2Draft,
  parseAiJsonObject,
  validateVisiblePageV2DraftContent,
} from './page-v2-generation/shared.mjs';
import {
  formatAiBlockPlanForPrompt,
  formatAiPageCompositionStandardForPrompt,
  getAiBlockPlan,
} from '../config/page-v2-ai-block-planner.mjs';
import {
  isLocalStrapiUrl,
  upsertPageDocumentWithService,
  withLocalStrapi,
} from './lib/page-v2-document-service.mjs';

const STRAPI_URL = (process.env.STRAPI_URL || '').replace(/\/+$/, '');
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || '';
const AI_CHAT_CONFIG = buildAiChatClientConfig();

const args = process.argv.slice(2);
const argMap = new Map(
  args
    .filter((arg) => arg.startsWith('--') && arg.includes('='))
    .map((arg) => {
      const [key, value] = arg.split('=');
      return [key, value];
    }),
);

const reportMode = args.includes('--report');
const queuedMode = args.includes('--queued');
const dryRun = args.includes('--dry-run');
const approveEntityProposals = args.includes('--approve-entity-proposals');
const jobId = argMap.get('--job-id') || '';
const jobTypeFilter = argMap.get('--job-type') || '';
const limit = Number(argMap.get('--limit') || 10);
const mockResponseFile = argMap.get('--mock-response-file') || process.env.PAGE_V2_GENERATION_MOCK_RESPONSE_FILE || '';

if (!STRAPI_URL || !STRAPI_TOKEN) {
  console.error('STRAPI_URL and STRAPI_TOKEN are required.');
  process.exit(1);
}

if (!reportMode && !AI_CHAT_CONFIG.apiKey && !mockResponseFile) {
  console.error('OPENROUTER_API_KEY, AI_API_KEY, OPENAI_API_KEY or --mock-response-file is required for page_v2 draft generation.');
  process.exit(1);
}

function normalizeGenerationJobUpdate(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return data;
  }

  const normalized = { ...data };
  if (Object.prototype.hasOwnProperty.call(normalized, 'status')) {
    normalized.job_status = normalized.job_status || normalized.status;
    delete normalized.status;
  }

  return normalized;
}

function unwrapRecord(entry) {
  if (!entry) {
    return null;
  }

  if (entry.attributes && typeof entry.attributes === 'object') {
    return {
      id: entry.id,
      documentId: entry.documentId || entry.attributes.documentId,
      ...entry.attributes,
    };
  }

  return entry;
}

function unwrapCollection(json) {
  return Array.isArray(json?.data) ? json.data.map((entry) => unwrapRecord(entry)).filter(Boolean) : [];
}

function unwrapSingle(json) {
  return unwrapRecord(json?.data);
}

function addGenerationJobPopulate(query) {
  query.set('populate[target_page][populate][0]', 'sections');
  query.set('populate[target_page][populate][1]', 'breadcrumbs');
  query.set('populate[target_page][populate][2]', 'internal_links');

  for (const relation of [
    'target_channels',
    'target_industries',
    'target_integrations',
    'target_solutions',
    'target_features',
    'target_business_types',
    'target_competitors',
  ]) {
    query.set(`populate[${relation}]`, 'true');
  }

  return query;
}

async function request(path, init = {}) {
  const response = await fetch(`${STRAPI_URL}/api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${STRAPI_TOKEN}`,
      ...(init.headers || {}),
    },
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${init.method || 'GET'} ${path} failed: ${response.status} ${JSON.stringify(json)}`);
  }

  return json;
}

function buildJobQuery() {
  const filters = [];
  if (jobId) {
    filters.push(`filters[id][$eq]=${encodeURIComponent(jobId)}`);
  } else if (queuedMode) {
    filters.push('filters[job_status][$eq]=queued');
  }

  if (jobTypeFilter) {
    filters.push(`filters[job_type][$eq]=${encodeURIComponent(jobTypeFilter)}`);
  }

  const query = new URLSearchParams();
  query.set('pagination[pageSize]', String(limit));
  query.set('sort[0]', 'updatedAt:asc');
  addGenerationJobPopulate(query);

  for (const filter of filters) {
    const [key, value] = filter.split('=');
    query.set(key, value);
  }

  return `/generation-jobs?${query.toString()}`;
}

async function fetchJobs() {
  if (jobId) {
    const query = addGenerationJobPopulate(new URLSearchParams());
    const record = unwrapRecord((await request(`/generation-jobs/${encodeURIComponent(jobId)}?${query.toString()}`)).data);
    return record ? [record] : [];
  }

  return unwrapCollection(await request(buildJobQuery()));
}

async function fetchJobsLocal() {
  return withLocalStrapi({}, async (strapi) => {
    const service = strapi.documents('api::generation-job.generation-job');
    const populate = {
      target_page: {
        populate: ['sections', 'breadcrumbs', 'internal_links'],
      },
      target_channels: true,
      target_industries: true,
      target_integrations: true,
      target_solutions: true,
      target_features: true,
      target_business_types: true,
      target_competitors: true,
    };

    if (jobId) {
      const directDocument = typeof jobId === 'string' && Number.isNaN(Number(jobId))
        ? await service.findOne({
            documentId: jobId,
            status: 'draft',
            populate,
          }).catch(() => null)
        : null;

      if (directDocument) {
        return [directDocument];
      }

      const byNumericId = await service.findMany({
        status: 'draft',
        filters: { id: { $eq: Number(jobId) || -1 } },
        populate,
      });

      return Array.isArray(byNumericId) ? byNumericId.slice(0, 1) : [];
    }

    const filters = {};
    if (queuedMode) {
      filters.job_status = { $eq: 'queued' };
    }
    if (jobTypeFilter) {
      filters.job_type = { $eq: jobTypeFilter };
    }

    return service.findMany({
      status: 'draft',
      filters,
      sort: ['updatedAt:asc'],
      populate,
      pagination: {
        page: 1,
        pageSize: limit,
      },
    });
  });
}

async function fetchExistingPageRoutes() {
  const routes = [];
  let page = 1;
  let pageCount = 1;

  do {
    const result = await request(`/page-v2s?pagination[page]=${page}&pagination[pageSize]=100&fields[0]=route_path`);
    const data = unwrapCollection(result);
    routes.push(...data.map((item) => item.route_path).filter(Boolean));
    pageCount = Number(result?.meta?.pagination?.pageCount || 1);
    page += 1;
  } while (page <= pageCount);

  return routes;
}

async function fetchExistingPageRoutesLocal() {
  return withLocalStrapi({}, async (strapi) => {
    const service = strapi.documents('api::page-v2.page-v2');
    const [drafts, published] = await Promise.all([
      service.findMany({
        status: 'draft',
        fields: ['route_path'],
        pagination: { page: 1, pageSize: 5000 },
      }),
      service.findMany({
        status: 'published',
        fields: ['route_path'],
        pagination: { page: 1, pageSize: 5000 },
      }),
    ]);

    return [...(drafts || []), ...(published || [])]
      .map((item) => item?.route_path)
      .filter(Boolean);
  });
}

async function fetchBlueprintMap() {
  const result = await request('/page-blueprints?pagination[pageSize]=100');
  const map = new Map();
  for (const item of unwrapCollection(result)) {
    if (item.blueprint_id) {
      map.set(item.blueprint_id, item.documentId || item.id);
    }
  }
  return map;
}

async function fetchBlueprintMapLocal() {
  return withLocalStrapi({}, async (strapi) => {
    const service = strapi.documents('api::page-blueprint.page-blueprint');
    const records = await service.findMany({
      status: 'draft',
      pagination: { page: 1, pageSize: 500 },
    });

    const map = new Map();
    for (const item of records || []) {
      if (item?.blueprint_id) {
        map.set(item.blueprint_id, item.documentId || item.id);
      }
    }

    return map;
  });
}

async function fetchCatalogEntities() {
  const result = {};
  for (const [family, config] of Object.entries(CATALOG_ENTITY_FAMILIES)) {
    const records = [];
    let page = 1;
    let pageCount = 1;

    do {
      const query = new URLSearchParams();
      query.set('pagination[page]', String(page));
      query.set('pagination[pageSize]', '100');
      query.set('fields[0]', 'name');
      query.set('fields[1]', 'slug');
      const response = await request(`/${config.endpoint}?${query.toString()}`);
      records.push(...unwrapCollection(response));
      pageCount = Number(response?.meta?.pagination?.pageCount || 1);
      page += 1;
    } while (page <= pageCount);

    result[family] = records;
  }
  return result;
}

async function fetchCatalogEntitiesLocal() {
  return withLocalStrapi({}, async (strapi) => {
    const result = {};
    for (const [family, config] of Object.entries(CATALOG_ENTITY_FAMILIES)) {
      const service = strapi.documents(config.uid);
      const [drafts, published] = await Promise.all([
        service.findMany({
          status: 'draft',
          fields: ['name', 'slug'],
          pagination: { page: 1, pageSize: 1000 },
        }),
        service.findMany({
          status: 'published',
          fields: ['name', 'slug'],
          pagination: { page: 1, pageSize: 1000 },
        }),
      ]);

      const byDocumentId = new Map();
      for (const item of [...(drafts || []), ...(published || [])]) {
        byDocumentId.set(item.documentId || item.id, item);
      }
      result[family] = [...byDocumentId.values()];
    }
    return result;
  });
}

async function createCatalogEntity(proposal) {
  const data = buildCatalogEntityCreateData(proposal);
  return unwrapSingle(await request(`/${proposal.endpoint}`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  }));
}

async function createCatalogEntitiesLocal(proposals = []) {
  return withLocalStrapi({}, async (strapi) => {
    const created = [];
    for (const proposal of proposals) {
      const service = strapi.documents(proposal.uid);
      const data = buildCatalogEntityCreateData(proposal);
      const document = await service.create({
        status: 'draft',
        data,
      });

      created.push({
        ...proposal,
        id: document?.id || null,
        documentId: document?.documentId || null,
        publication_status: 'draft',
      });
    }
    return created;
  });
}

async function createCatalogEntities(proposals = []) {
  const created = [];
  for (const proposal of proposals) {
    const document = await createCatalogEntity(proposal);
    created.push({
      ...proposal,
      id: document?.id || null,
      documentId: document?.documentId || null,
      publication_status: 'draft',
    });
  }
  return created;
}

function attachCreatedEntitiesToJob(job, createdEntities = []) {
  const nextJob = { ...job };
  for (const entity of createdEntities) {
    const config = CATALOG_ENTITY_FAMILIES[entity.family];
    if (!config) {
      continue;
    }
    nextJob[config.jobField] = [
      ...(Array.isArray(nextJob[config.jobField]) ? nextJob[config.jobField] : []),
      {
        id: entity.id,
        documentId: entity.documentId,
        name: entity.name,
        slug: entity.slug,
      },
    ].filter((item) => item.id || item.documentId);
  }
  return nextJob;
}

function buildCreatedEntityRelationUpdate(job, createdEntities = []) {
  const data = {};
  for (const entity of createdEntities) {
    const config = CATALOG_ENTITY_FAMILIES[entity.family];
    if (!config) {
      continue;
    }
    const existingIds = (Array.isArray(job[config.jobField]) ? job[config.jobField] : [])
      .map((item) => unwrapRecord(item)?.documentId || unwrapRecord(item)?.id)
      .filter(Boolean);
    const createdId = entity.documentId || entity.id;
    if (createdId) {
      data[config.jobField] = [...new Set([...existingIds, createdId])];
    }
  }
  return data;
}

function resolveDuplicateEntities(duplicates = []) {
  return duplicates
    .map((entity) => ({
      ...entity,
      id: entity.duplicate_match?.id || null,
      documentId: entity.duplicate_match?.documentId || null,
      name: entity.duplicate_match?.name || entity.name,
      slug: entity.duplicate_match?.slug || entity.slug,
      status: 'resolved_existing',
    }))
    .filter((entity) => entity.id || entity.documentId);
}

async function updateGenerationJob(job, data) {
  const key = job.documentId || job.id;
  return request(`/generation-jobs/${encodeURIComponent(key)}`, {
    method: 'PUT',
    body: JSON.stringify({ data: normalizeGenerationJobUpdate(data) }),
  });
}

async function updateGenerationJobLocal(job, data) {
  return withLocalStrapi({}, async (strapi) => {
    const service = strapi.documents('api::generation-job.generation-job');
    const key = job.documentId || job.id;

    let documentId = typeof key === 'string' && Number.isNaN(Number(key)) ? key : null;
    if (!documentId) {
      documentId = (await service.findMany({
        status: 'draft',
        filters: { id: { $eq: Number(key) || -1 } },
      }))?.[0]?.documentId || null;
    }

    if (!documentId) {
      throw new Error(`Generation job ${key} was not found in local Strapi.`);
    }

    return {
      data: await service.update({
        documentId,
        status: 'draft',
        data: normalizeGenerationJobUpdate(data),
        populate: ['target_page'],
      }),
    };
  });
}

async function createOrUpdatePageDraft(job, pageData) {
  const targetPage = unwrapRecord(job.target_page);
  const key = targetPage?.documentId || targetPage?.id;

  if (!key) {
    return unwrapRecord((await request('/page-v2s?status=draft', {
      method: 'POST',
      body: JSON.stringify({ data: pageData }),
    })).data);
  }

  return unwrapRecord((await request(`/page-v2s/${encodeURIComponent(key)}?status=draft`, {
    method: 'PUT',
    body: JSON.stringify({ data: pageData }),
  })).data);
}

async function createOrUpdatePageDraftLocal(job, pageData) {
  return withLocalStrapi({}, async (strapi) => {
    const service = strapi.documents('api::page-v2.page-v2');
    const targetPage = unwrapRecord(job.target_page);
    const targetDocumentId = targetPage?.documentId || null;

    if (targetDocumentId) {
      const page = await service.update({
        documentId: targetDocumentId,
        status: 'draft',
        data: pageData,
        populate: ['blueprint', 'sections'],
      });

      if (!page) {
        throw new Error(`Local target page_v2 draft was not updated for documentId ${targetDocumentId}.`);
      }

      return page;
    }

    await upsertPageDocumentWithService(service, {
      routePath: pageData.route_path,
      data: pageData,
      blueprint: pageData.blueprint || null,
      locale: pageData.locale || 'ru',
      publish: false,
    });

    const page = (await service.findMany({
      status: 'draft',
      filters: { route_path: { $eq: pageData.route_path } },
      populate: ['blueprint', 'sections'],
    }))?.[0] || null;

    if (!page) {
      throw new Error(`Local page_v2 draft was not found after upsert for route ${pageData.route_path}.`);
    }

    return page;
  });
}

function relationSummary(job) {
  const mappings = [
    ['target_channels', 'channels'],
    ['target_industries', 'industries'],
    ['target_integrations', 'integrations'],
    ['target_solutions', 'solutions'],
    ['target_features', 'features'],
    ['target_business_types', 'business types'],
    ['target_competitors', 'competitors'],
  ];

  return mappings
    .map(([key, label]) => {
      const names = (job[key] || []).map((item) => unwrapRecord(item)?.name || unwrapRecord(item)?.title).filter(Boolean);
      if (names.length === 0) {
        return null;
      }

      return `${label}: ${names.join(', ')}`;
    })
    .filter(Boolean)
    .join('\n');
}

function shouldSuppressEntityProposals(job = {}) {
  const prompt = `${job.request_prompt || ''}\n${job.title || ''}`.toLowerCase();
  return [
    'no proposed_entities',
    'do not add proposed_entities',
    'do not propose entities',
    'do not create catalog entities',
    'не добавляй proposed_entities',
    'не предлагай новые справочники',
    'не создавай новые справочники',
  ].some((marker) => prompt.includes(marker));
}

export function buildPrompts(job) {
  const targetPageContext = getTargetPageContext(job);
  const blueprint = job.target_blueprint || targetPageContext?.page_kind || 'landing';
  const prompt = job.request_prompt || job.title;
  const entities = relationSummary(job);
  const blockPlan = getAiBlockPlan(job);

  return {
    systemPrompt: [
      'You rewrite and fill content for an existing CHATPLUS page_v2 draft.',
      'Return only a valid JSON object with no markdown.',
      'Do not publish the page and do not mention internal system fields.',
      'AI is in locked-layout content mode. You may rewrite visible text, cards, steps, FAQ answers, SEO text, and CTA labels only.',
      'Do not add, remove, reorder, or rename sections. Do not change any section block_type. Do not change any existing section variant.',
      'Do not create a new route, new page kind, new template, breadcrumbs, sticky CTA, floating CTA, or custom layout.',
      'The render target is the existing page_v2 renderer and page-v2 primitives only. Legacy templates are visual references only, not a renderer choice.',
      'Use the target page structure exactly as the layout source; the JSON sections array must match target_page.sections by count, order, block_type, and variant.',
      'Make the result suitable for editorial review: concrete, useful, and free of invented facts.',
      'If the prompt lacks exact facts, use careful wording and leave room for a human editor to refine the page.',
      'The JSON must contain: title, route_path, seo_title, seo_description, nav_group, nav_label, nav_description, sections, breadcrumbs, internal_links.',
      'Always set breadcrumbs to an empty array. The frontend renderer builds standard breadcrumbs from page metadata.',
      'Visible content rule: never return an empty visible section. Any cards-grid, feature-list, steps, faq, proof-stats, related-links, internal-links, pricing-plans, comparison-table, or before-after section must contain non-empty item/link/row arrays.',
      'Use exact section contracts: cards-grid uses items[{title,text}], steps uses items[{title,text}], faq uses items[{question,answer}], proof-stats uses items[{label,value,description}], related-links/internal-links use links[{label,href,description}].',
      'When using multiple cards-grid sections, set variant to explain the role: problems, pillars, editorial, integrations, stack, or use_cases. Do not return one generic cards-grid for the whole page.',
      'Hero sections should include 3-4 short trust_facts when the page standard asks for them, so the family layout hero has content on both sides.',
      'Do not use unsupported array names such as features, advantages, scenarios, process, workflow, questions, or faqs unless you also put the same content into the exact items/links field for that section.',
      'Do not invent numeric claims, 24/7 claims, profit/growth claims, medical outcomes, prices, integrations, or guarantees unless the request or entity context explicitly provides them.',
      'For campaign, brand, and resource pages, keep the same original family page density and section order from the selected target Page.',
      'If the prompt needs a catalog entity that was not supplied in Entity context, add it only under proposed_entities. Do not put invented entities directly into page relations.',
      'If the request says not to add proposed_entities or not to create new catalog entities, return proposed_entities as an empty object.',
      'proposed_entities may include arrays for: channels, industries, integrations, solutions, features, business_types, competitors. Each item must have name, slug, description, and optional reason, seo_title, seo_description.',
    ].join('\n'),
    userPrompt: [
      `Blueprint: ${blueprint}`,
      `Job title: ${job.title || ''}`,
      `Request prompt: ${prompt}`,
      entities ? `Entity context:\n${entities}` : 'Entity context: none',
      targetPageContext
        ? [
            'Target page to refine:',
            JSON.stringify(targetPageContext, null, 2),
            'Locked-layout rules: keep the same route_path, page_kind, template_variant, section count, section order, block_type, and variant. Rewrite the content inside those sections only. If a section currently has too little text, fill that same section instead of adding a new one.',
          ].join('\n')
        : 'Target page to refine: missing. This job is invalid because free page creation is disabled.',
      `CHATPLUS page composition standard:\n${formatAiPageCompositionStandardForPrompt(blueprint)}`,
      `AI block plan reference (validation only; do not change the target layout):\n${formatAiBlockPlanForPrompt(blockPlan)}`,
      'For each section include block_type and only the fields that belong to that block.',
      'Required output examples for visible sections:',
      '{"block_type":"cards-grid","variant":"problems","title":"...","intro":"...","items":[{"title":"...","text":"..."},{"title":"...","text":"..."},{"title":"...","text":"..."}]}',
      '{"block_type":"cards-grid","variant":"pillars","title":"...","intro":"...","items":[{"title":"...","text":"..."},{"title":"...","text":"..."},{"title":"...","text":"..."}]}',
      '{"block_type":"cards-grid","variant":"use_cases","title":"...","intro":"...","items":[{"title":"...","text":"..."},{"title":"...","text":"..."},{"title":"...","text":"..."}]}',
      '{"block_type":"steps","title":"...","intro":"...","items":[{"title":"...","text":"..."},{"title":"...","text":"..."}]}',
      '{"block_type":"before-after","title":"...","intro":"...","before_title":"До CHATPLUS","after_title":"После CHATPLUS","before_items":[{"title":"...","text":"..."},{"title":"...","text":"..."}],"after_items":[{"title":"...","text":"..."},{"title":"...","text":"..."}]}',
      '{"block_type":"comparison-table","title":"...","intro":"...","option_one_label":"Без CHATPLUS","option_two_label":"Ручной процесс","option_highlight_label":"С CHATPLUS","rows":[{"parameter":"...","option_one":"...","option_two":"...","option_highlight":"..."},{"parameter":"...","option_one":"...","option_two":"...","option_highlight":"..."}]}',
      '{"block_type":"faq","title":"...","items":[{"question":"...","answer":"..."},{"question":"...","answer":"..."}]}',
      '{"block_type":"final-cta","title":"...","text":"...","primary_label":"Записаться на демо","primary_url":"/demo"}',
      'Write the draft in Russian unless the request explicitly asks for another language.',
    ].join('\n\n'),
    blockPlan,
  };
}

async function callOpenAI({ systemPrompt, userPrompt }) {
  if (mockResponseFile) {
    return parseAiJsonObject(await readFile(mockResponseFile, 'utf8'));
  }

  const response = await fetch(AI_CHAT_CONFIG.chatCompletionsUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_CHAT_CONFIG.apiKey}`,
    },
    body: JSON.stringify({
      model: AI_CHAT_CONFIG.model,
      response_format: { type: 'json_object' },
      temperature: Number(process.env.AI_TEMPERATURE || 0.2),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`AI chat API error: ${response.status} ${JSON.stringify(json)}`);
  }

  return parseAiJsonObject(json.choices?.[0]?.message?.content || '{}');
}

async function generateValidatedPageDraft({
  job,
  existingRoutes,
  blueprintDocumentId,
  blockPlan,
  baseSystemPrompt,
  baseUserPrompt,
  existingEntitiesByFamily,
}) {
  let lastErrors = [];
  let lastAiDraft = null;
  let lastEntityReview = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const repairPrompt = lastErrors.length
      ? [
          baseUserPrompt,
          'The previous JSON draft was rejected by validation.',
          `Validation errors: ${lastErrors.join(' ')}`,
          'Return a corrected full JSON object. Keep the exact target page layout: same section count, same order, same block_type values, same variants. Remove every unsupported marketing claim. Do not say 24/7, round-the-clock, always online, constant availability, exact setup time, "a few seconds", implementation time, profit growth, sales growth, guarantees, prices, tariffs, or cost unless the human prompt explicitly provides them. Use cautious wording such as "helps organize requests", "keeps message history visible", "lets a human review the response", and "can be configured during onboarding". Keep visible item arrays non-empty.',
        ].join('\n\n')
      : baseUserPrompt;

    const aiDraft = await callOpenAI({ systemPrompt: baseSystemPrompt, userPrompt: repairPrompt });
    if (shouldSuppressEntityProposals(job)) {
      aiDraft.proposed_entities = {};
      aiDraft.new_entities = {};
    }
    const entityReview = normalizeCatalogEntityProposals({ aiDraft, existingEntitiesByFamily });
    const resolvedEntities = resolveDuplicateEntities(entityReview.duplicates);
    const jobForValidation = attachCreatedEntitiesToJob(job, resolvedEntities);
    const pageDraft = normalizeGeneratedPageV2Draft({
      job: jobForValidation,
      aiDraft,
      existingRoutes,
      blueprintDocumentId,
      blockPlan,
    });
    const contentValidation = validateVisiblePageV2DraftContent(pageDraft.data);

    lastAiDraft = aiDraft;
    lastEntityReview = entityReview;

    if (contentValidation.ok) {
      return {
        aiDraft,
        entityReview,
        pageDraft,
        validationAttempts: attempt,
      };
    }

    lastErrors = contentValidation.errors;
  }

  throw new Error(
    `AI draft failed visible content validation after 3 attempt(s): ${lastErrors.join(' ')}`,
    { cause: { aiDraft: lastAiDraft, entityReview: lastEntityReview } },
  );
}

function buildEntityReviewReport({ job = {}, entityReview, model = '', dryRun = false }) {
  return {
    ok: true,
    dry_run: dryRun,
    status: 'needs_entity_review',
    mode: 'entity_review',
    job_type: job.job_type || null,
    blueprint: job.target_blueprint || null,
    proposed_entities: entityReview.proposals,
    pending_entities: entityReview.pending,
    duplicate_entities: entityReview.duplicates,
    warnings: entityReview.warnings,
    model,
    generated_at: new Date().toISOString(),
    next_step: 'Review proposed_entities. Re-run with --approve-entity-proposals to create missing catalog entries and generate the Page draft.',
  };
}

async function processJob(job, existingRoutes, blueprintMap, existingEntitiesByFamily = {}) {
  const localMode = isLocalStrapiUrl(STRAPI_URL);
  const updateJob = localMode ? updateGenerationJobLocal : updateGenerationJob;
  const upsertPageDraft = localMode ? createOrUpdatePageDraftLocal : createOrUpdatePageDraft;
  const createEntities = localMode ? createCatalogEntitiesLocal : createCatalogEntities;

  try {
    assertAiGenerationJobAllowed(job);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await updateJob(job, {
      status: 'failed',
      run_report: {
        status: 'failed',
        error: message,
        failed_at: new Date().toISOString(),
      },
    });
    return {
      action: 'failed',
      job,
      error: message,
    };
  }

  await updateJob(job, {
    status: 'running',
    run_report: {
      status: 'running',
      started_at: new Date().toISOString(),
    },
  });

  try {
    const { systemPrompt, userPrompt, blockPlan } = buildPrompts(job);
    const targetPageContext = getTargetPageContext(job);
    const blueprintDocumentId = blueprintMap.get(job.target_blueprint || targetPageContext?.page_kind || '') || null;
    const {
      aiDraft,
      entityReview,
      pageDraft: validatedPageDraft,
      validationAttempts,
    } = await generateValidatedPageDraft({
      job,
      existingRoutes,
      blueprintDocumentId,
      blockPlan,
      baseSystemPrompt: systemPrompt,
      baseUserPrompt: userPrompt,
      existingEntitiesByFamily,
    });

    let jobForDraft = job;
    let createdEntities = [];
    const resolvedEntities = resolveDuplicateEntities(entityReview.duplicates);
    if (entityReview.pending.length && !approveEntityProposals) {
      const report = buildEntityReviewReport({
        job,
        entityReview,
        model: AI_CHAT_CONFIG.model,
        dryRun,
      });

      await updateJob(job, {
        status: 'needs_entity_review',
        run_report: report,
      });

      return {
        action: 'needs_entity_review',
        job,
        report,
      };
    }

    if (entityReview.pending.length && approveEntityProposals && !dryRun) {
      createdEntities = await createEntities(entityReview.pending);
    }

    const entitiesForRelations = [...resolvedEntities, ...createdEntities];
    if (entitiesForRelations.length && !dryRun) {
      const relationUpdate = buildCreatedEntityRelationUpdate(job, entitiesForRelations);
      if (Object.keys(relationUpdate).length) {
        await updateJob(job, relationUpdate);
      }
      jobForDraft = attachCreatedEntitiesToJob(job, entitiesForRelations);
    }

    const pageDraft = entitiesForRelations.length
      ? normalizeGeneratedPageV2Draft({
          job: jobForDraft,
          aiDraft,
          existingRoutes,
          blueprintDocumentId,
          blockPlan,
        })
      : validatedPageDraft;
    const finalContentValidation = validateVisiblePageV2DraftContent(pageDraft.data);
    if (!finalContentValidation.ok) {
      throw new Error(`AI draft failed visible content validation after entity relation mapping: ${finalContentValidation.errors.join(' ')}`);
    }
    const report = buildGenerationReport({
      job: jobForDraft,
      pageDraft,
      warnings: [...entityReview.warnings, ...pageDraft.warnings],
      model: AI_CHAT_CONFIG.model,
      dryRun,
      blockPlan,
    });
    report.validation_attempts = validationAttempts;
    report.proposed_entities = entityReview.proposals;
    report.created_entities = createdEntities.map((entity) => ({
      family: entity.family,
      id: entity.id,
      documentId: entity.documentId,
      name: entity.name,
      slug: entity.slug,
      publication_status: entity.publication_status || 'draft',
    }));
    report.resolved_existing_entities = resolvedEntities.map((entity) => ({
      family: entity.family,
      id: entity.id,
      documentId: entity.documentId,
      name: entity.name,
      slug: entity.slug,
    }));

    if (dryRun) {
      await updateJob(job, {
        status: 'queued',
        run_report: report,
      });
      return { action: 'dry-run', job, report };
    }

    const page = await upsertPageDraft(jobForDraft, pageDraft.data);
    const updatedJob = await updateJob(job, {
      status: 'draft_ready',
      target_page: page?.id || null,
      run_report: {
        ...report,
        target_page_id: page?.id || null,
        target_page_document_id: page?.documentId || null,
      },
    });

    return {
      action: 'draft_ready',
      job: unwrapRecord(updatedJob.data) || job,
      page,
      report,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await updateJob(job, {
      status: 'failed',
      run_report: {
        status: 'failed',
        error: message,
        failed_at: new Date().toISOString(),
      },
    });
    return {
      action: 'failed',
      job,
      error: message,
    };
  }
}

async function runReport() {
  const jobs = unwrapCollection(await request(`/generation-jobs?pagination[pageSize]=${limit}&sort[0]=updatedAt:desc&populate=*`));
  console.log(`Generation jobs from ${STRAPI_URL}`);
  for (const job of jobs) {
    console.log(`- #${job.id} ${job.title} | type=${job.job_type} | status=${job.job_status || job.status || '-'} | blueprint=${job.target_blueprint || '-'}`);
  }
}

async function main() {
  if (reportMode) {
    await runReport();
    return;
  }

  const localMode = isLocalStrapiUrl(STRAPI_URL);
  const jobs = localMode ? await fetchJobsLocal() : await fetchJobs();
  if (jobs.length === 0) {
    console.log('No generation jobs matched the current filters.');
    return;
  }

  const blueprintMap = localMode ? await fetchBlueprintMapLocal() : await fetchBlueprintMap();
  const existingRoutes = localMode ? await fetchExistingPageRoutesLocal() : await fetchExistingPageRoutes();
  const existingEntitiesByFamily = localMode ? await fetchCatalogEntitiesLocal() : await fetchCatalogEntities();
  for (const job of jobs) {
    const result = await processJob(job, existingRoutes, blueprintMap, existingEntitiesByFamily);
    if (result.action === 'draft_ready' && result.page?.route_path) {
      existingRoutes.push(result.page.route_path);
    }

    if (result.action === 'failed') {
      console.error(`FAILED job #${job.id}: ${result.error}`);
      continue;
    }

    const resultTarget = result.report.route_path
      || `${Object.values(result.report.proposed_entities || {}).flat().length} entity proposal(s)`;
    console.log(`${result.action.toUpperCase()} job #${job.id}: ${resultTarget}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
