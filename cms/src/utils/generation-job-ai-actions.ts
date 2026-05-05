import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const GENERATION_JOB_UID = 'api::generation-job.generation-job' as any;
const PAGE_V2_UID = 'api::page-v2.page-v2' as any;

function isDocumentLookupMiss(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || '');
  return message.includes('Document with id') && message.includes('not found');
}

async function findDraftDocumentByDocumentId(service: any, documentId: string, populate: any) {
  try {
    const entry = await service.findOne({
      documentId,
      status: 'draft',
      populate,
    });
    if (entry) {
      return entry;
    }
  } catch (error) {
    if (!isDocumentLookupMiss(error)) {
      throw error;
    }
  }

  return (await service.findMany({
    status: 'draft',
    filters: { documentId: { $eq: documentId } },
    populate,
    pagination: { page: 1, pageSize: 1 },
  }))?.[0] || null;
}

function normalizeRoutePath(value = '') {
  const routePath = typeof value === 'string' ? value.trim() : '';
  if (!routePath || routePath === '/') {
    return '/';
  }

  return `/${routePath.replace(/^\/+/, '').replace(/\/+$/, '')}`;
}

function findProjectRoot() {
  const candidates = [
    process.cwd(),
    path.resolve(process.cwd(), '..'),
    '/app',
    '/workspace',
  ];

  for (const candidate of candidates) {
    if (existsSync(path.join(candidate, 'scripts', 'generate-page-v2-drafts.mjs'))) {
      return candidate;
    }
  }

  throw new Error('Page v2 AI runner was not found. Expected scripts/generate-page-v2-drafts.mjs.');
}

function runGeneratorForJob(jobKey: string) {
  const projectRoot = findProjectRoot();
  const scriptPath = path.join(projectRoot, 'scripts', 'generate-page-v2-drafts.mjs');
  const child = spawn(
    process.execPath,
    [
      scriptPath,
      `--job-id=${jobKey}`,
      '--candidate-only',
      '--limit=1',
    ],
    {
      cwd: projectRoot,
      env: {
        ...process.env,
        STRAPI_URL: process.env.AI_RUNNER_STRAPI_URL || 'http://127.0.0.1:1337',
        STRAPI_TOKEN: process.env.AI_RUNNER_STRAPI_TOKEN || 'local-mode',
        STRAPI_APP_DIR: process.env.AI_RUNNER_STRAPI_APP_DIR || '/app/cms',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error('AI generation timed out after 180 seconds.'));
    }, 180_000);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(new Error(`AI generation failed with exit code ${code}: ${stderr || stdout}`));
    });
  });
}

export async function findGenerationJob(strapi: any, idOrDocumentId: string) {
  const service = strapi.documents(GENERATION_JOB_UID);
  const populate = {
    target_page: {
      populate: ['sections', 'breadcrumbs', 'internal_links'],
    },
  };

  if (Number.isNaN(Number(idOrDocumentId))) {
    return findDraftDocumentByDocumentId(service, idOrDocumentId, populate);
  }

  return (await service.findMany({
    status: 'draft',
    filters: { id: { $eq: Number(idOrDocumentId) || -1 } },
    populate,
    pagination: { page: 1, pageSize: 1 },
  }))?.[0] || null;
}

export function buildCandidatePreviewUrl(job: any) {
  const publicSiteUrl = `${process.env.PUBLIC_SITE_URL || ''}`.replace(/\/+$/, '');
  const previewToken = process.env.PREVIEW_TOKEN || '';
  const documentId = job?.documentId || '';

  if (!publicSiteUrl || !previewToken || !documentId) {
    return '';
  }

  return `${publicSiteUrl}/preview/generation-job/${encodeURIComponent(documentId)}?token=${encodeURIComponent(previewToken)}`;
}

export function buildPagePreviewUrl(documentId: string) {
  const publicSiteUrl = `${process.env.PUBLIC_SITE_URL || ''}`.replace(/\/+$/, '');
  const previewToken = process.env.PREVIEW_TOKEN || '';

  if (!publicSiteUrl || !previewToken || !documentId) {
    return '';
  }

  return `${publicSiteUrl}/preview/page/${encodeURIComponent(documentId)}?token=${encodeURIComponent(previewToken)}`;
}

export async function findPageForGeneration(strapi: any, idOrDocumentId: string) {
  const service = strapi.documents(PAGE_V2_UID);

  if (Number.isNaN(Number(idOrDocumentId))) {
    return findDraftDocumentByDocumentId(service, idOrDocumentId, ['blueprint']);
  }

  return (await service.findMany({
    status: 'draft',
    filters: { id: { $eq: Number(idOrDocumentId) || -1 } },
    populate: ['blueprint'],
    pagination: { page: 1, pageSize: 1 },
  }))?.[0] || null;
}

export async function createGenerationJobForPage(strapi: any, pageId: string, requestedBy = '') {
  const page = await findPageForGeneration(strapi, pageId);
  if (!page?.documentId) {
    const error = new Error(`Page ${pageId} was not found.`);
    (error as any).status = 404;
    throw error;
  }

  const now = new Date();
  const stamp = now.toISOString().replace(/[-:T]/g, '').slice(0, 12);
  const routePath = normalizeRoutePath(page.route_path || page.slug || '');
  const pageLabel = routePath || page.title || page.slug || page.documentId;
  const targetBlueprint = page.page_kind || 'landing';

  const job = await strapi.documents(GENERATION_JOB_UID).create({
    status: 'draft',
    data: {
      title: `AI refill ${pageLabel} ${stamp}`,
      job_type: 'manual_request',
      job_status: 'queued',
      target_blueprint: targetBlueprint,
      block_strategy: 'auto',
      request_prompt:
        `Доработай выбранную Page ${pageLabel}. Сохрани текущий порядок и типы блоков, заполни пустые места, улучшай тексты на русском и не меняй route_path.`,
      requested_by: requestedBy || 'strapi-editor',
      target_page: {
        connect: [page.documentId],
      },
      run_report: {
        created_from_page: true,
        source_page_id: page.id,
        source_page_document_id: page.documentId,
        source_page_route_path: page.route_path || null,
        created_at: now.toISOString(),
      },
    } as any,
    populate: ['target_page'],
  });

  return {
    ok: true,
    job,
    job_document_id: job?.documentId || null,
    page_document_id: page.documentId,
  };
}

export async function getGenerationJobTargetPage(strapi: any, id: string) {
  const job = await findGenerationJob(strapi, id);
  if (!job) {
    const error = new Error(`Generation Job ${id} was not found.`);
    (error as any).status = 404;
    throw error;
  }

  const targetPage = job.target_page || null;
  if (!targetPage?.documentId) {
    const error = new Error('Generation Job has no linked target_page.');
    (error as any).status = 400;
    throw error;
  }

  return {
    ok: true,
    page_document_id: targetPage.documentId,
    page_id: targetPage.id || null,
    route_path: targetPage.route_path || null,
    title: targetPage.title || null,
  };
}

export async function runAiForGenerationJob(strapi: any, id: string) {
  const before = await findGenerationJob(strapi, id);
  if (!before) {
    const error = new Error(`Generation Job ${id} was not found.`);
    (error as any).status = 404;
    throw error;
  }

  const jobKey = before.documentId || before.id || id;
  await runGeneratorForJob(String(jobKey));

  const after = await findGenerationJob(strapi, String(jobKey));
  if (!after?.generated_draft?.data) {
    const message = after?.run_report?.error
      || after?.run_report?.message
      || 'AI generation finished without a generated draft.';
    const error = new Error(message);
    (error as any).status = 400;
    throw error;
  }

  return {
    ok: true,
    job_status: after?.job_status || null,
    preview_url: buildCandidatePreviewUrl(after),
    run_report: after?.run_report || null,
    generated_draft_ready: Boolean(after?.generated_draft?.data),
  };
}

export async function applyAiDraftToPage(strapi: any, id: string) {
  const job = await findGenerationJob(strapi, id);
  if (!job) {
    const error = new Error(`Generation Job ${id} was not found.`);
    (error as any).status = 404;
    throw error;
  }

  const draftData = job.generated_draft?.data;
  if (!draftData || typeof draftData !== 'object' || Array.isArray(draftData)) {
    const error = new Error('Generation Job has no generated_draft.data to apply.');
    (error as any).status = 400;
    throw error;
  }

  const targetPage = job.target_page || null;
  const targetDocumentId = targetPage?.documentId || job.generated_draft?.target_page_document_id || null;
  if (!targetDocumentId) {
    const error = new Error('Generation Job has no target_page documentId.');
    (error as any).status = 400;
    throw error;
  }

  const page = await strapi.documents(PAGE_V2_UID).update({
    documentId: targetDocumentId,
    status: 'draft',
    data: {
      ...draftData,
      route_path: normalizeRoutePath(draftData.route_path || targetPage?.route_path),
    },
    populate: ['sections', 'blueprint'],
  });

  const appliedAt = new Date().toISOString();
  await strapi.documents(GENERATION_JOB_UID).update({
    documentId: job.documentId,
    status: 'draft',
    data: {
      job_status: 'approved',
      applied_at: appliedAt,
      run_report: {
        ...(job.run_report || {}),
        applied: true,
        applied_at: appliedAt,
        target_page_id: page?.id || targetPage?.id || null,
        target_page_document_id: page?.documentId || targetDocumentId,
      },
    } as any,
  });

  return {
    ok: true,
    job_status: 'approved',
    applied_at: appliedAt,
    target_page_document_id: page?.documentId || targetDocumentId,
    preview_url: buildPagePreviewUrl(page?.documentId || targetDocumentId),
  };
}

export async function getAiDraftPreview(strapi: any, id: string) {
  const job = await findGenerationJob(strapi, id);
  if (!job) {
    const error = new Error(`Generation Job ${id} was not found.`);
    (error as any).status = 404;
    throw error;
  }

  const previewUrl = buildCandidatePreviewUrl(job);
  if (!previewUrl) {
    const error = new Error('Preview is not configured. PUBLIC_SITE_URL and PREVIEW_TOKEN are required.');
    (error as any).status = 400;
    throw error;
  }

  return {
    ok: true,
    preview_url: previewUrl,
  };
}
