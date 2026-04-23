import { readFile } from 'node:fs/promises';

import {
  assertAiBlueprintAllowed,
  buildGenerationReport,
  normalizeGeneratedPageV2Draft,
} from './page-v2-generation/shared.mjs';

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

async function fetchExistingPageRoutes() {
  const data = unwrapCollection(await request('/page-v2s?pagination[pageSize]=500&fields[0]=route_path'));
  return data.map((item) => item.route_path).filter(Boolean);
}

async function updateGenerationJob(job, data) {
  const key = job.documentId || job.id;
  return request(`/generation-jobs/${encodeURIComponent(key)}`, {
    method: 'PUT',
    body: JSON.stringify({ data }),
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

function buildPrompts(job) {
  const blueprint = job.target_blueprint || 'landing';
  const prompt = job.request_prompt || job.title;
  const entities = relationSummary(job);

  return {
    systemPrompt: [
      'You create a page_v2 draft for CHATPLUS.',
      'Return only a valid JSON object with no markdown.',
      'Do not publish the page and do not mention internal system fields.',
      'Use only these block types: hero, rich-text, proof-stats, cards-grid, feature-list, steps, faq, testimonial, related-links, final-cta.',
      'Make the result suitable for editorial review: concrete, useful, and free of invented facts.',
      'If the prompt lacks exact facts, use careful wording and leave room for a human editor to refine the page.',
      'The JSON must contain: title, route_path, seo_title, seo_description, nav_group, nav_label, nav_description, sections, breadcrumbs, internal_links.',
    ].join('\n'),
    userPrompt: [
      `Blueprint: ${blueprint}`,
      `Job title: ${job.title || ''}`,
      `Request prompt: ${prompt}`,
      entities ? `Entity context:\n${entities}` : 'Entity context: none',
      'For each section include block_type and only the fields that belong to that block.',
      'Write the draft in Russian unless the request explicitly asks for another language.',
    ].join('\n\n'),
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

async function processJob(job, existingRoutes) {
  assertAiBlueprintAllowed(job.target_blueprint);

  await updateGenerationJob(job, {
    status: 'running',
    run_report: {
      status: 'running',
      started_at: new Date().toISOString(),
    },
  });

  try {
    const { systemPrompt, userPrompt } = buildPrompts(job);
    const aiDraft = await callOpenAI({ systemPrompt, userPrompt });
    const pageDraft = normalizeGeneratedPageV2Draft({
      job,
      aiDraft,
      existingRoutes,
    });
    const report = buildGenerationReport({
      job,
      pageDraft,
      warnings: pageDraft.warnings,
      model: OPENAI_MODEL,
      dryRun,
    });

    if (dryRun) {
      await updateGenerationJob(job, {
        status: 'queued',
        run_report: report,
      });
      return { action: 'dry-run', job, report };
    }

    const page = await createOrUpdatePageDraft(job, pageDraft.data);
    const updatedJob = await updateGenerationJob(job, {
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
    await updateGenerationJob(job, {
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

  const jobs = await fetchJobs();
  if (jobs.length === 0) {
    console.log('No generation jobs matched the current filters.');
    return;
  }

  const existingRoutes = await fetchExistingPageRoutes();
  for (const job of jobs) {
    const result = await processJob(job, existingRoutes);
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
