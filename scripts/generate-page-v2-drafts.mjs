import { readFile } from 'node:fs/promises';

import {
  assertAiBlueprintAllowed,
  buildGenerationReport,
  normalizeGeneratedPageV2Draft,
} from './page-v2-generation/shared.mjs';
import { formatAiBlockPlanForPrompt, getAiBlockPlan } from '../config/page-v2-ai-block-planner.mjs';
import {
  isLocalStrapiUrl,
  upsertPageDocumentWithService,
  withLocalStrapi,
} from './lib/page-v2-document-service.mjs';

const STRAPI_URL = (process.env.STRAPI_URL || '').replace(/\/+$/, '');
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

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
const jobId = argMap.get('--job-id') || '';
const jobTypeFilter = argMap.get('--job-type') || '';
const limit = Number(argMap.get('--limit') || 10);
const mockResponseFile = argMap.get('--mock-response-file') || process.env.PAGE_V2_GENERATION_MOCK_RESPONSE_FILE || '';

if (!STRAPI_URL || !STRAPI_TOKEN) {
  console.error('STRAPI_URL and STRAPI_TOKEN are required.');
  process.exit(1);
}

if (!reportMode && !OPENAI_API_KEY && !mockResponseFile) {
  console.error('OPENAI_API_KEY or --mock-response-file is required for page_v2 draft generation.');
  process.exit(1);
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
    filters.push('filters[status][$eq]=queued');
  }

  if (jobTypeFilter) {
    filters.push(`filters[job_type][$eq]=${encodeURIComponent(jobTypeFilter)}`);
  }

  const query = new URLSearchParams();
  query.set('pagination[pageSize]', String(limit));
  query.set('sort[0]', 'updatedAt:asc');
  query.set('populate', '*');

  for (const filter of filters) {
    const [key, value] = filter.split('=');
    query.set(key, value);
  }

  return `/generation-jobs?${query.toString()}`;
}

async function fetchJobs() {
  if (jobId) {
    const record = unwrapRecord((await request(`/generation-jobs/${encodeURIComponent(jobId)}?populate=*`)).data);
    return record ? [record] : [];
  }

  return unwrapCollection(await request(buildJobQuery()));
}

async function fetchJobsLocal() {
  return withLocalStrapi({}, async (strapi) => {
    const service = strapi.documents('api::generation-job.generation-job');
    const populate = [
      'target_page',
      'target_channels',
      'target_industries',
      'target_integrations',
      'target_solutions',
      'target_features',
      'target_business_types',
      'target_competitors',
    ];

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
      filters.status = { $eq: 'queued' };
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

async function updateGenerationJob(job, data) {
  const key = job.documentId || job.id;
  return request(`/generation-jobs/${encodeURIComponent(key)}`, {
    method: 'PUT',
    body: JSON.stringify({ data }),
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
        data,
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

async function createOrUpdatePageDraftLocal(_job, pageData) {
  return withLocalStrapi({}, async (strapi) => {
    const service = strapi.documents('api::page-v2.page-v2');
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

export function buildPrompts(job) {
  const blueprint = job.target_blueprint || 'landing';
  const prompt = job.request_prompt || job.title;
  const entities = relationSummary(job);
  const blockPlan = getAiBlockPlan(job);

  return {
    systemPrompt: [
      'You create a page_v2 draft for CHATPLUS.',
      'Return only a valid JSON object with no markdown.',
      'Do not publish the page and do not mention internal system fields.',
      'Choose section block types from the provided block plan and allowed block contracts.',
      'Make the result suitable for editorial review: concrete, useful, and free of invented facts.',
      'If the prompt lacks exact facts, use careful wording and leave room for a human editor to refine the page.',
      'The JSON must contain: title, route_path, seo_title, seo_description, nav_group, nav_label, nav_description, sections, breadcrumbs, internal_links.',
    ].join('\n'),
    userPrompt: [
      `Blueprint: ${blueprint}`,
      `Job title: ${job.title || ''}`,
      `Request prompt: ${prompt}`,
      entities ? `Entity context:\n${entities}` : 'Entity context: none',
      `AI block plan:\n${formatAiBlockPlanForPrompt(blockPlan)}`,
      'For each section include block_type and only the fields that belong to that block.',
      'Write the draft in Russian unless the request explicitly asks for another language.',
    ].join('\n\n'),
    blockPlan,
  };
}

async function callOpenAI({ systemPrompt, userPrompt }) {
  if (mockResponseFile) {
    return JSON.parse(await readFile(mockResponseFile, 'utf8'));
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      response_format: { type: 'json_object' },
      temperature: 0.4,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${JSON.stringify(json)}`);
  }

  return JSON.parse(json.choices?.[0]?.message?.content || '{}');
}

async function processJob(job, existingRoutes, blueprintMap) {
  const localMode = isLocalStrapiUrl(STRAPI_URL);
  const updateJob = localMode ? updateGenerationJobLocal : updateGenerationJob;
  const upsertPageDraft = localMode ? createOrUpdatePageDraftLocal : createOrUpdatePageDraft;

  try {
    assertAiBlueprintAllowed(job.target_blueprint);
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
    const aiDraft = await callOpenAI({ systemPrompt, userPrompt });
    const blueprintDocumentId = blueprintMap.get(job.target_blueprint || '') || null;
    const pageDraft = normalizeGeneratedPageV2Draft({
      job,
      aiDraft,
      existingRoutes,
      blueprintDocumentId,
      blockPlan,
    });
    const report = buildGenerationReport({
      job,
      pageDraft,
      warnings: pageDraft.warnings,
      model: OPENAI_MODEL,
      dryRun,
      blockPlan,
    });

    if (dryRun) {
      await updateJob(job, {
        status: 'queued',
        run_report: report,
      });
      return { action: 'dry-run', job, report };
    }

    const page = await upsertPageDraft(job, pageDraft.data);
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
    console.log(`- #${job.id} ${job.title} | type=${job.job_type} | status=${job.status} | blueprint=${job.target_blueprint || '-'}`);
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
  for (const job of jobs) {
    const result = await processJob(job, existingRoutes, blueprintMap);
    if (result.action === 'draft_ready' && result.page?.route_path) {
      existingRoutes.push(result.page.route_path);
    }

    if (result.action === 'failed') {
      console.error(`FAILED job #${job.id}: ${result.error}`);
      continue;
    }

    console.log(`${result.action.toUpperCase()} job #${job.id}: ${result.report.route_path}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
