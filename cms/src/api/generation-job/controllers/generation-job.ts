import { factories } from '@strapi/strapi';

import {
  applyAiDraftToPage,
  getAiDraftPreview,
  runAiForGenerationJob,
} from '../../../utils/generation-job-ai-actions';

const GENERATION_JOB_UID = 'api::generation-job.generation-job' as any;

export default factories.createCoreController(GENERATION_JOB_UID, ({ strapi }) => ({
  async runAi(ctx) {
    const id = String(ctx.params.id || '').trim();
    if (!id) {
      ctx.throw(400, 'Generation Job id is required.');
    }

    ctx.body = await runAiForGenerationJob(strapi, id);
  },

  async applyAiDraft(ctx) {
    const id = String(ctx.params.id || '').trim();
    if (!id) {
      ctx.throw(400, 'Generation Job id is required.');
    }

    ctx.body = await applyAiDraftToPage(strapi, id);
  },

  async previewAiDraft(ctx) {
    const id = String(ctx.params.id || '').trim();
    if (!id) {
      ctx.throw(400, 'Generation Job id is required.');
    }

    ctx.body = await getAiDraftPreview(strapi, id);
  },
}));
