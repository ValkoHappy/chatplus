import {
  applyAiDraftToPage,
  createGenerationJobForPage,
  duplicatePageForEditor,
  getGenerationJobTargetPage,
  getAiDraftPreview,
  runAiForGenerationJob,
} from './utils/generation-job-ai-actions';

function throwHttpError(ctx: any, error: unknown) {
  const status = Number((error as any)?.status || (error as any)?.statusCode || 500);
  const message = error instanceof Error ? error.message : String(error);
  ctx.throw(status, message);
}

export default {
  register({ strapi }: { strapi: any }) {
    strapi.admin.routes['page-v2-ai'] = {
      type: 'admin',
      routes: [
        {
          method: 'POST',
          path: '/page-v2-ai/pages/:id/duplicate',
          handler: async (ctx: any) => {
            const id = String(ctx.params.id || '').trim();
            if (!id) {
              ctx.throw(400, 'Page id is required.');
            }

            try {
              const requestedBy = ctx.state?.user?.email || ctx.state?.user?.username || '';
              ctx.body = await duplicatePageForEditor(strapi, id, {
                ...(ctx.request.body || {}),
                requested_by: requestedBy,
              });
            } catch (error) {
              throwHttpError(ctx, error);
            }
          },
          config: {
            policies: ['admin::isAuthenticatedAdmin'],
          },
        },
        {
          method: 'POST',
          path: '/page-v2-ai/pages/:id/create-generation-job',
          handler: async (ctx: any) => {
            const id = String(ctx.params.id || '').trim();
            if (!id) {
              ctx.throw(400, 'Page id is required.');
            }

            try {
              const requestedBy = ctx.state?.user?.email || ctx.state?.user?.username || '';
              ctx.body = await createGenerationJobForPage(strapi, id, requestedBy);
            } catch (error) {
              throwHttpError(ctx, error);
            }
          },
          config: {
            policies: ['admin::isAuthenticatedAdmin'],
          },
        },
        {
          method: 'GET',
          path: '/page-v2-ai/generation-jobs/:id/target-page',
          handler: async (ctx: any) => {
            const id = String(ctx.params.id || '').trim();
            if (!id) {
              ctx.throw(400, 'Generation Job id is required.');
            }

            try {
              ctx.body = await getGenerationJobTargetPage(strapi, id);
            } catch (error) {
              throwHttpError(ctx, error);
            }
          },
          config: {
            policies: ['admin::isAuthenticatedAdmin'],
          },
        },
        {
          method: 'POST',
          path: '/page-v2-ai/generation-jobs/:id/run-ai',
          handler: async (ctx: any) => {
            const id = String(ctx.params.id || '').trim();
            if (!id) {
              ctx.throw(400, 'Generation Job id is required.');
            }

            try {
              ctx.body = await runAiForGenerationJob(strapi, id);
            } catch (error) {
              throwHttpError(ctx, error);
            }
          },
          config: {
            policies: ['admin::isAuthenticatedAdmin'],
          },
        },
        {
          method: 'POST',
          path: '/page-v2-ai/generation-jobs/:id/apply-ai-draft',
          handler: async (ctx: any) => {
            const id = String(ctx.params.id || '').trim();
            if (!id) {
              ctx.throw(400, 'Generation Job id is required.');
            }

            try {
              ctx.body = await applyAiDraftToPage(strapi, id);
            } catch (error) {
              throwHttpError(ctx, error);
            }
          },
          config: {
            policies: ['admin::isAuthenticatedAdmin'],
          },
        },
        {
          method: 'GET',
          path: '/page-v2-ai/generation-jobs/:id/ai-preview',
          handler: async (ctx: any) => {
            const id = String(ctx.params.id || '').trim();
            if (!id) {
              ctx.throw(400, 'Generation Job id is required.');
            }

            try {
              ctx.body = await getAiDraftPreview(strapi, id);
            } catch (error) {
              throwHttpError(ctx, error);
            }
          },
          config: {
            policies: ['admin::isAuthenticatedAdmin'],
          },
        },
      ],
    };
  },
  bootstrap() {},
};
