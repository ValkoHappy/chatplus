import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AI_ALLOWED_PAGE_V2_BLUEPRINTS,
  assertAiBlueprintAllowed,
  buildGenerationReport,
  buildSafePageV2RoutePath,
  isAiBlueprintAllowed,
  normalizeGeneratedPageV2Draft,
} from '../scripts/page-v2-generation/shared.mjs';

test('buildSafePageV2RoutePath moves reserved paths under a safe namespace', () => {
  const result = buildSafePageV2RoutePath({
    title: 'Pricing page clone',
    suggestedRoutePath: '/pricing',
    blueprintId: 'campaign',
    existingRoutes: [],
    jobId: '42',
  });

  assert.equal(result.routePath, '/campaigns/pricing');
  assert.ok(result.warnings.some((warning) => warning.includes('reserved routes')));
});

test('buildSafePageV2RoutePath appends suffix on existing page_v2 collisions', () => {
  const result = buildSafePageV2RoutePath({
    title: 'Spring Launch',
    suggestedRoutePath: '/campaigns/spring-launch',
    blueprintId: 'campaign',
    existingRoutes: ['/campaigns/spring-launch'],
    jobId: '88',
  });

  assert.equal(result.routePath, '/campaigns/spring-launch-88');
  assert.ok(result.warnings.some((warning) => warning.includes('already exists')));
});

test('normalizeGeneratedPageV2Draft enforces blueprint requirements and relation mapping', () => {
  const normalized = normalizeGeneratedPageV2Draft({
    job: {
      id: 17,
      title: 'AI launch page',
      job_type: 'manual_request',
      target_blueprint: 'campaign',
      request_prompt: 'Сделай страницу запуска нового продукта',
      requested_by: 'alexey',
      target_channels: [{ id: 3, name: 'Telegram' }],
      target_industries: [{ id: 7, name: 'Retail' }],
    },
    aiDraft: {
      title: 'Запуск нового продукта',
      route_path: '/promo',
      seo_title: 'Запуск нового продукта',
      seo_description: 'Черновик страницы запуска нового продукта.',
      sections: [
        {
          block_type: 'hero',
          title: 'Запуск нового продукта',
          subtitle: 'Подготовленный AI draft для редакторского review.',
        },
      ],
    },
    existingRoutes: ['/campaigns/spring-launch'],
  });

  assert.equal(normalized.data.page_kind, 'campaign');
  assert.equal(normalized.data.template_variant, 'showcase');
  assert.equal(normalized.data.generation_mode, 'ai_assisted');
  assert.equal(normalized.data.source_mode, 'hybrid');
  assert.equal(normalized.data.editorial_status, 'review');
  assert.equal(normalized.data.human_review_required, true);
  assert.equal(normalized.data.channels[0], 3);
  assert.equal(normalized.data.industries[0], 7);
  assert.ok(normalized.data.sections.some((section) => section.__component === 'page-blocks.cards-grid'));
  assert.ok(normalized.data.sections.some((section) => section.__component === 'page-blocks.final-cta'));
  assert.equal(normalized.data.route_path, '/campaigns/promo');
});

test('buildGenerationReport captures draft metadata for job review', () => {
  const report = buildGenerationReport({
    job: {
      job_type: 'scheduled',
      target_blueprint: 'resource',
    },
    pageDraft: {
      data: {
        title: 'AI guide',
        route_path: '/resources/ai-guide',
        page_kind: 'resource',
        template_variant: 'editorial',
        generation_mode: 'ai_generated',
        sections: [
          { __component: 'page-blocks.hero' },
          { __component: 'page-blocks.rich-text' },
        ],
      },
    },
    warnings: ['Route adjusted'],
    model: 'gpt-4o-mini',
    dryRun: true,
  });

  assert.equal(report.dry_run, true);
  assert.equal(report.blueprint, 'resource');
  assert.equal(report.route_path, '/resources/ai-guide');
  assert.deepEqual(report.section_types, ['page-blocks.hero', 'page-blocks.rich-text']);
  assert.equal(report.model, 'gpt-4o-mini');
});

test('AI generation is limited to manually confirmed blueprint families', () => {
  assert.deepEqual(AI_ALLOWED_PAGE_V2_BLUEPRINTS, ['campaign', 'brand', 'resource']);
  assert.equal(isAiBlueprintAllowed('campaign'), true);
  assert.equal(isAiBlueprintAllowed('brand'), true);
  assert.equal(isAiBlueprintAllowed('resource'), true);
  assert.equal(isAiBlueprintAllowed('landing'), false);
  assert.equal(isAiBlueprintAllowed('comparison'), false);
});

test('assertAiBlueprintAllowed rejects unsupported blueprint families', () => {
  assert.doesNotThrow(() => assertAiBlueprintAllowed('campaign'));
  assert.throws(
    () => assertAiBlueprintAllowed('landing'),
    /AI draft generation is not allowed for blueprint "landing"/,
  );
});
