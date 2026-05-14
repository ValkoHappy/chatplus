import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AI_ALLOWED_PAGE_V2_BLUEPRINTS,
  assertAiBlueprintAllowed,
  assertAiGenerationJobAllowed,
  buildCatalogEntityCreateData,
  buildAiChatClientConfig,
  buildGenerationReport,
  buildSafePageV2RoutePath,
  getTargetPageContext,
  isAiBlueprintAllowed,
  normalizeCatalogEntityProposals,
  parseAiJsonObject,
  normalizeGeneratedPageV2Draft,
  validateLockedPageV2Layout,
  validateVisiblePageV2DraftContent,
} from '../scripts/page-v2-generation/shared.mjs';
import {
  formatAiPageCompositionStandardForPrompt,
  getAiBlockPlan,
} from '../config/page-v2-ai-block-planner.mjs';

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

test('buildSafePageV2RoutePath keeps AI campaign drafts under campaign prefix', () => {
  const result = buildSafePageV2RoutePath({
    title: 'WhatsApp campaign',
    suggestedRoutePath: '/campaign-whatsapp',
    blueprintId: 'campaign',
    existingRoutes: [],
    jobId: '101',
  });

  assert.equal(result.routePath, '/campaigns/campaign-whatsapp');
  assert.ok(result.warnings.some((warning) => warning.includes('standard campaign prefix')));
});

test('normalizeGeneratedPageV2Draft enforces blueprint requirements and relation mapping', () => {
  const blockPlan = getAiBlockPlan({
    target_blueprint: 'campaign',
    request_prompt: 'Landing with problems, workflow steps, FAQ, and ROI proof.',
  });
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
      breadcrumbs: [{ label: 'AI breadcrumb', href: '/wrong' }],
      sections: [
        {
          block_type: 'hero',
          title: 'Запуск нового продукта',
          subtitle: 'Подготовленный AI draft для редакторского review.',
        },
      ],
    },
    existingRoutes: ['/campaigns/spring-launch'],
    blueprintDocumentId: 'blueprint-campaign-doc',
    blockPlan,
  });

  assert.equal(normalized.data.page_kind, 'campaign');
  assert.equal(normalized.data.template_variant, 'showcase');
  assert.equal(normalized.data.generation_mode, 'ai_assisted');
  assert.equal(normalized.data.source_mode, 'hybrid');
  assert.equal(normalized.data.editorial_status, 'review');
  assert.equal(normalized.data.migration_ready, false);
  assert.notEqual(normalized.data.parity_status, 'approved');
  assert.equal(normalized.data.legacy_template_family, 'campaign');
  assert.equal(normalized.data.human_review_required, true);
  assert.equal(normalized.data.blueprint, 'blueprint-campaign-doc');
  assert.equal(normalized.data.channels[0], 3);
  assert.equal(normalized.data.industries[0], 7);
  assert.deepEqual(normalized.data.breadcrumbs, []);
  assert.ok(normalized.data.sections.some((section) => section.__component === 'page-blocks.cards-grid'));
  assert.ok(normalized.data.sections.some((section) => section.__component === 'page-blocks.final-cta'));
  assert.equal(normalized.data.route_path, '/campaigns/promo');
  assert.equal(normalized.data.ai_metadata.blueprint_document_id, 'blueprint-campaign-doc');
  assert.deepEqual(normalized.data.ai_metadata.block_plan.preferred_blocks, blockPlan.preferredBlocks);
});

test('normalizeGeneratedPageV2Draft does not create catalog entities from AI output', () => {
  const normalized = normalizeGeneratedPageV2Draft({
    job: {
      id: 171,
      title: 'AI catalog entity smoke',
      job_type: 'manual_request',
      target_blueprint: 'campaign',
      request_prompt: 'Create a page and suggest a new industry.',
    },
    aiDraft: {
      title: 'AI catalog entity smoke',
      route_path: '/campaigns/ai-catalog-entity-smoke',
      seo_title: 'AI catalog entity smoke',
      seo_description: 'Draft page for checking catalog relation safety.',
      channels: [{ id: 999, name: 'Imaginary channel' }],
      industries: [{ id: 998, name: 'Imaginary industry' }],
      new_entities: {
        industries: [{ name: 'Imaginary industry', slug: 'imaginary-industry' }],
      },
      sections: [
        {
          block_type: 'hero',
          title: 'AI catalog entity smoke',
        },
      ],
    },
    existingRoutes: [],
  });

  assert.deepEqual(normalized.data.channels, []);
  assert.deepEqual(normalized.data.industries, []);
  assert.deepEqual(normalized.data.integrations, []);
  assert.deepEqual(normalized.data.solutions, []);
  assert.deepEqual(normalized.data.features, []);
  assert.deepEqual(normalized.data.business_types, []);
  assert.deepEqual(normalized.data.competitors, []);
});

test('normalizeGeneratedPageV2Draft replaces invented internal links with safe routes', () => {
  const normalized = normalizeGeneratedPageV2Draft({
    job: {
      id: 173,
      title: 'AI link safety',
      job_type: 'manual_request',
      target_blueprint: 'resource',
      request_prompt: 'Create a resource with links.',
    },
    aiDraft: {
      title: 'AI link safety',
      route_path: '/resources/ai-link-safety',
      seo_title: 'AI link safety',
      seo_description: 'Draft page for link safety.',
      sections: [
        {
          block_type: 'hero',
          title: 'AI link safety',
          primary_label: 'Open fake',
          primary_url: '/features/ai-review',
          secondary_label: 'Open fake secondary',
          secondary_url: '/resources/missing-guide',
        },
        { block_type: 'rich-text', title: 'Context', body: 'Context.' },
        {
          block_type: 'internal-links',
          title: 'Links',
          links: [
            { label: 'Fake deep page', href: '/features/ai-review', description: 'Invented URL.' },
            { label: 'Features', href: '/features', description: 'Known safe route.' },
          ],
        },
      ],
    },
    existingRoutes: ['/resources/ai-link-safety'],
  });

  const links = normalized.data.sections.find((section) => section.__component === 'page-blocks.internal-links').links;
  const hero = normalized.data.sections.find((section) => section.__component === 'page-blocks.hero');
  assert.equal(hero.primary_url, '/demo');
  assert.equal(hero.secondary_url, '/features');
  assert.deepEqual(links.map((link) => link.href), ['/features', '/solutions', '/integrations']);
  assert.ok(normalized.warnings.some((warning) => warning.includes('AI internal link')));
});

test('normalizeGeneratedPageV2Draft maps common AI field aliases into visible page blocks', () => {
  const normalized = normalizeGeneratedPageV2Draft({
    job: {
      id: 172,
      title: 'Telegram для стоматологий',
      job_type: 'manual_request',
      target_blueprint: 'campaign',
      request_prompt: 'Сделай содержательную страницу для стоматологий.',
    },
    aiDraft: {
      title: 'Telegram для стоматологий',
      route_path: '/campaigns/telegram-stomatologii-ai-smoke',
      sections: [
        {
          block_type: 'hero',
          headline: 'Пациенты пишут в Telegram, администратор отвечает в CHATPLUS',
          description: 'Соберите обращения, ответы и запись на прием в одном рабочем процессе.',
          cta: { label: 'Записаться на демо', url: '/demo' },
        },
        {
          block_type: 'cards-grid',
          heading: 'Что перестает теряться',
          advantages: [
            { heading: 'Первичные обращения', description: 'Новые пациенты получают ответ быстрее.' },
            { heading: 'Вопросы после приема', body: 'Администратор видит историю переписки.' },
          ],
        },
        {
          block_type: 'steps',
          heading: 'Как внедрить',
          workflow: [
            { heading: 'Подключить канал', content: 'Добавьте Telegram как рабочий канал.' },
          ],
        },
        {
          block_type: 'faq',
          heading: 'Вопросы',
          faqs: [
            { question: 'Можно ли обещать автоматическую запись?', answer: 'Только если такой сценарий настроен отдельно.' },
          ],
        },
        {
          block_type: 'final-cta',
          heading: 'Проверьте сценарий на демо',
          description: 'Покажем, как обращения попадают в общий поток.',
          cta: { label: 'Записаться на демо', url: '/demo' },
        },
      ],
    },
    existingRoutes: [],
  });

  const hero = normalized.data.sections.find((section) => section.__component === 'page-blocks.hero');
  const cards = normalized.data.sections.find((section) => section.__component === 'page-blocks.cards-grid');
  const steps = normalized.data.sections.find((section) => section.__component === 'page-blocks.steps');
  const faq = normalized.data.sections.find((section) => section.__component === 'page-blocks.faq');
  const cta = normalized.data.sections.find((section) => section.__component === 'page-blocks.final-cta');

  assert.equal(hero.title, 'Пациенты пишут в Telegram, администратор отвечает в CHATPLUS');
  assert.equal(hero.subtitle, 'Соберите обращения, ответы и запись на прием в одном рабочем процессе.');
  assert.equal(cards.title, 'Что перестает теряться');
  assert.equal(cards.items.length, 2);
  assert.equal(cards.items[0].title, 'Первичные обращения');
  assert.equal(steps.items[0].text, 'Добавьте Telegram как рабочий канал.');
  assert.equal(faq.items[0].answer, 'Только если такой сценарий настроен отдельно.');
  assert.equal(cta.title, 'Проверьте сценарий на демо');
  assert.equal(cta.primary_url, '/demo');
});

test('validateVisiblePageV2DraftContent rejects empty visible section arrays', () => {
  const result = validateVisiblePageV2DraftContent({
    title: 'Broken AI draft',
    seo_title: 'Broken AI draft',
    seo_description: 'Broken AI draft description',
    sections: [
      { __component: 'page-blocks.hero', title: 'Broken AI draft' },
      { __component: 'page-blocks.cards-grid', title: 'Empty cards', items: [] },
      { __component: 'page-blocks.steps', title: 'Empty steps', items: [] },
      { __component: 'page-blocks.faq', title: 'Empty FAQ', items: [] },
    ],
  });

  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes('cards-grid')));
  assert.ok(result.errors.some((error) => error.includes('steps')));
  assert.ok(result.errors.some((error) => error.includes('faq')));
});

test('validateVisiblePageV2DraftContent accepts contentful AI drafts', () => {
  const result = validateVisiblePageV2DraftContent({
    title: 'Contentful AI draft',
    seo_title: 'Contentful AI draft',
    seo_description: 'Contentful AI draft description',
    sections: [
      { __component: 'page-blocks.hero', title: 'Contentful AI draft' },
      { __component: 'page-blocks.cards-grid', title: 'Cards', items: [{ title: 'One', text: 'Text' }] },
      { __component: 'page-blocks.steps', title: 'Steps', items: [{ title: 'One', text: 'Text' }] },
      { __component: 'page-blocks.faq', title: 'FAQ', items: [{ question: 'Q', answer: 'A' }] },
    ],
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
});

test('validateVisiblePageV2DraftContent rejects sparse family drafts', () => {
  const result = validateVisiblePageV2DraftContent({
    page_kind: 'campaign',
    title: 'Sparse campaign',
    seo_title: 'Sparse campaign',
    seo_description: 'Sparse campaign description',
    sections: [
      { __component: 'page-blocks.hero', title: 'Sparse campaign', trust_facts: ['Контроль ответов'] },
      { __component: 'page-blocks.cards-grid', variant: 'pillars', title: 'Cards', items: [{ title: 'One', text: 'Text' }] },
      { __component: 'page-blocks.faq', title: 'FAQ', items: [{ question: 'Q', answer: 'A' }] },
    ],
  });

  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes('too sparse')));
  assert.ok(result.errors.some((error) => error.includes('variant "problems"')));
  assert.ok(result.errors.some((error) => error.includes('hero trust_facts')));
});

test('validateVisiblePageV2DraftContent accepts complete family drafts', () => {
  const result = validateVisiblePageV2DraftContent({
    page_kind: 'campaign',
    title: 'Complete campaign',
    seo_title: 'Complete campaign',
    seo_description: 'Complete campaign description',
    sections: [
      { __component: 'page-blocks.hero', title: 'Complete campaign', trust_facts: ['Контроль ответа', 'История диалогов', 'Роли команды'] },
      { __component: 'page-blocks.cards-grid', variant: 'problems', title: 'Problems', items: [{ title: 'One', text: 'Text' }, { title: 'Two', text: 'Text' }, { title: 'Three', text: 'Text' }] },
      { __component: 'page-blocks.cards-grid', variant: 'pillars', title: 'Pillars', items: [{ title: 'One', text: 'Text' }, { title: 'Two', text: 'Text' }, { title: 'Three', text: 'Text' }] },
      { __component: 'page-blocks.rich-text', title: 'Context', body: 'Readable context for editors.' },
      { __component: 'page-blocks.steps', title: 'Steps', items: [{ title: 'One', text: 'Text' }, { title: 'Two', text: 'Text' }, { title: 'Three', text: 'Text' }] },
      { __component: 'page-blocks.cards-grid', variant: 'use_cases', title: 'Use cases', items: [{ title: 'One', text: 'Text' }, { title: 'Two', text: 'Text' }, { title: 'Three', text: 'Text' }] },
      { __component: 'page-blocks.faq', title: 'FAQ', items: [{ question: 'Q1', answer: 'A' }, { question: 'Q2', answer: 'A' }, { question: 'Q3', answer: 'A' }, { question: 'Q4', answer: 'A' }] },
      { __component: 'page-blocks.internal-links', title: 'Links', links: [{ label: 'Demo', href: '/demo' }] },
      { __component: 'page-blocks.final-cta', title: 'CTA', text: 'Text', primary_url: '/demo' },
    ],
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
});

test('validateVisiblePageV2DraftContent rejects unsupported AI marketing claims', () => {
  const result = validateVisiblePageV2DraftContent({
    title: 'Telegram для стоматологий',
    seo_title: 'Telegram для стоматологий',
    seo_description: 'Отвечайте пациентам 24/7 и увеличьте конверсию.',
    sections: [
      { __component: 'page-blocks.hero', title: 'Telegram для стоматологий' },
      { __component: 'page-blocks.cards-grid', title: 'Cards', items: [{ title: 'One', text: 'Настройка занимает 1-2 дня.' }] },
    ],
  });

  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes('24/7')));
  assert.ok(result.errors.some((error) => error.includes('growth')));
  assert.ok(result.errors.some((error) => error.includes('implementation time')));
});

test('validateVisiblePageV2DraftContent allows cautious improve wording without sales claims', () => {
  const result = validateVisiblePageV2DraftContent({
    title: 'AI draft with cautious wording',
    seo_title: 'AI draft with cautious wording',
    seo_description: 'Помогает повысить прозрачность проверки ответов без обещаний роста продаж.',
    sections: [
      { __component: 'page-blocks.hero', title: 'Помогает повысить прозрачность ответов' },
      { __component: 'page-blocks.cards-grid', title: 'Cards', items: [{ title: 'Контроль', text: 'Команда может улучшить порядок проверки перед отправкой.' }] },
    ],
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
});

test('validateVisiblePageV2DraftContent rejects price and vague speed claims', () => {
  const result = validateVisiblePageV2DraftContent({
    title: 'AI draft with risky claims',
    seo_title: 'AI draft with risky claims',
    seo_description: 'Черновик страницы.',
    sections: [
      { __component: 'page-blocks.hero', title: 'Проверка ответа занимает несколько секунд' },
      { __component: 'page-blocks.cards-grid', title: 'Cards', items: [{ title: 'Стоимость', text: 'Стоимость тарифа от 5000 рублей.' }] },
    ],
  });

  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes('implementation time')));
  assert.ok(result.errors.some((error) => error.includes('price or tariff')));
});

test('normalizeCatalogEntityProposals extracts pending catalog entities for review', () => {
  const result = normalizeCatalogEntityProposals({
    aiDraft: {
      proposed_entities: {
        industries: [
          {
            name: 'Салоны красоты',
            slug: 'beauty-salons',
            description: 'Салоны красоты, которым нужно отвечать клиентам в мессенджерах.',
            reason: 'Prompt asks for a salon-specific page.',
          },
        ],
      },
    },
    existingEntitiesByFamily: {
      industries: [{ id: 1, name: 'Автобизнес', slug: 'auto' }],
    },
  });

  assert.equal(result.pending.length, 1);
  assert.equal(result.pending[0].family, 'industries');
  assert.equal(result.pending[0].slug, 'beauty-salons');
  assert.equal(result.pending[0].job_field, 'target_industries');
  assert.deepEqual(result.duplicates, []);
});

test('normalizeCatalogEntityProposals marks existing catalog entities as duplicates', () => {
  const result = normalizeCatalogEntityProposals({
    aiDraft: {
      proposed_entities: {
        integrations: [
          {
            name: 'Bitrix24',
            slug: 'bitrix24',
            description: 'Интеграция с Bitrix24.',
          },
        ],
      },
    },
    existingEntitiesByFamily: {
      integrations: [{ id: 77, documentId: 'bitrix-doc', name: 'Bitrix24', slug: 'bitrix24' }],
    },
  });

  assert.equal(result.pending.length, 0);
  assert.equal(result.duplicates.length, 1);
  assert.equal(result.duplicates[0].duplicate_match.documentId, 'bitrix-doc');
});

test('buildCatalogEntityCreateData creates managed frozen draft records for approved proposals', () => {
  const data = buildCatalogEntityCreateData({
    name: 'Салоны красоты',
    slug: 'beauty-salons',
    description: 'Салоны красоты, которым нужно отвечать клиентам в мессенджерах.',
  });

  assert.deepEqual(data, {
    name: 'Салоны красоты',
    slug: 'beauty-salons',
    description: 'Салоны красоты, которым нужно отвечать клиентам в мессенджерах.',
    seo_title: '',
    seo_description: '',
    content_origin: 'managed',
    record_mode: 'managed',
    sync_strategy: 'frozen',
  });
  assert.equal(Object.hasOwn(data, 'publishedAt'), false);
});

test('normalizeGeneratedPageV2Draft coerces invalid AI enum fields to safe defaults', () => {
  const normalized = normalizeGeneratedPageV2Draft({
    job: {
      id: 18,
      title: 'DeepSeek enum smoke',
      job_type: 'manual_request',
      target_blueprint: 'campaign',
      request_prompt: 'Create a safe campaign draft.',
    },
    aiDraft: {
      title: 'DeepSeek enum smoke',
      route_path: '/campaigns/deepseek-enum-smoke',
      template_variant: 'landing-page',
      nav_group: 'navigation',
      nav_order: 'first',
      sitemap_priority: 'high',
      sitemap_changefreq: 'sometimes',
      sections: [
        {
          block_type: 'hero',
          title: 'DeepSeek enum smoke',
        },
        {
          block_type: 'final-cta',
          title: 'Ready for the next step?',
          primary_label: 'Request demo',
          primary_url: '/demo',
        },
      ],
    },
    existingRoutes: [],
  });

  assert.equal(normalized.data.template_variant, 'showcase');
  assert.equal(normalized.data.nav_group, 'resources');
  assert.equal(normalized.data.nav_order, 100);
  assert.equal(normalized.data.sitemap_priority, 0.5);
  assert.equal(normalized.data.sitemap_changefreq, 'weekly');
  const finalCta = normalized.data.sections.find((section) => section.__component === 'page-blocks.final-cta');
  assert.equal(finalCta.title, 'Следующий шаг');
  assert.equal(finalCta.primary_label, 'Записаться на демо');
  assert.ok(normalized.warnings.some((warning) => warning.includes('Invalid nav_group')));
  assert.ok(normalized.warnings.some((warning) => warning.includes('Invalid template_variant')));
  assert.ok(normalized.warnings.some((warning) => warning.includes('Invalid sitemap_changefreq')));
});

test('normalizeGeneratedPageV2Draft refines the selected target page without changing its route', () => {
  const normalized = normalizeGeneratedPageV2Draft({
    job: {
      id: 19,
      title: 'Refine AI draft',
      job_type: 'manual_request',
      target_blueprint: 'resource',
      request_prompt: 'Доработай текущую страницу: добавь больше конкретики и FAQ.',
      target_page: {
        id: 91,
        documentId: 'target-page-doc',
        title: 'Старый черновик',
        route_path: '/resources/existing-ai-guide',
        page_kind: 'resource',
        template_variant: 'editorial',
        sections: [
          {
            __component: 'page-blocks.hero',
            title: 'Старый заголовок',
            subtitle: 'Черновой подзаголовок.',
          },
          {
            __component: 'page-blocks.rich-text',
            title: 'Старый текст',
            body: 'Черновой текст.',
          },
        ],
      },
    },
    aiDraft: {
      title: 'Обновленный AI guide',
      route_path: '/resources/new-ai-guide',
      seo_title: 'Обновленный AI guide',
      sections: [
        {
          block_type: 'hero',
          title: 'Обновленный AI guide',
        },
        {
          block_type: 'rich-text',
          title: 'Что изменилось',
          body: 'Страница доработана по новому промпту.',
        },
      ],
    },
    existingRoutes: ['/resources/existing-ai-guide'],
  });

  assert.equal(normalized.data.route_path, '/resources/existing-ai-guide');
  assert.equal(normalized.data.ai_metadata.refines_target_page_id, 91);
  assert.equal(normalized.data.ai_metadata.refines_target_page_document_id, 'target-page-doc');
  assert.ok(normalized.warnings.some((warning) => warning.includes('target_page route')));
  assert.equal(Object.hasOwn(normalized.data, 'channels'), false);
  assert.equal(Object.hasOwn(normalized.data, 'industries'), false);
});

test('normalizeGeneratedPageV2Draft rejects AI attempts to change selected page layout', () => {
  assert.throws(
    () => normalizeGeneratedPageV2Draft({
      job: {
        id: 191,
        title: 'Refine layout guard',
        job_type: 'manual_request',
        target_blueprint: 'campaign',
        request_prompt: 'Rewrite texts only.',
        target_page: {
          id: 92,
          documentId: 'layout-guard-doc',
          title: 'Existing campaign',
          route_path: '/campaigns/existing-campaign',
          page_kind: 'campaign',
          template_variant: 'showcase',
          sections: [
            { __component: 'page-blocks.hero', variant: 'split-panel', title: 'Hero' },
            { __component: 'page-blocks.cards-grid', variant: 'problems', title: 'Problems' },
            { __component: 'page-blocks.final-cta', variant: 'dark', title: 'CTA' },
          ],
        },
      },
      aiDraft: {
        title: 'Existing campaign rewritten',
        route_path: '/campaigns/changed',
        sections: [
          { block_type: 'hero', variant: 'split-panel', title: 'New hero' },
          { block_type: 'rich-text', title: 'Illegal new block', body: 'Nope.' },
          { block_type: 'final-cta', variant: 'dark', title: 'CTA' },
        ],
      },
      existingRoutes: ['/campaigns/existing-campaign'],
    }),
    /Locked AI content mode rejected layout changes/,
  );
});

test('normalizeGeneratedPageV2Draft lets AI first-fill an empty selected page', () => {
  const normalized = normalizeGeneratedPageV2Draft({
    job: {
      id: 193,
      title: 'First fill empty page',
      job_type: 'manual_request',
      target_blueprint: 'landing',
      request_prompt: 'Create a complete landing page.',
      target_page: {
        id: 94,
        documentId: 'empty-page-doc',
        title: 'Empty landing',
        route_path: '/test-ai-page',
        page_kind: 'landing',
        template_variant: 'default',
        sections: [],
      },
    },
    aiDraft: {
      title: 'Filled landing',
      route_path: '/changed-by-ai',
      sections: [
        { block_type: 'hero', title: 'Hero', subtitle: 'Subtitle' },
        { block_type: 'final-cta', title: 'CTA', text: 'Talk to us', primary_url: '/demo' },
      ],
    },
    existingRoutes: ['/test-ai-page'],
  });

  assert.equal(normalized.data.route_path, '/test-ai-page');
  assert.equal(normalized.data.sections.length, 2);
  assert.equal(normalized.data.sections[0].__component, 'page-blocks.hero');
  assert.equal(normalized.data.sections[1].__component, 'page-blocks.final-cta');
});

test('normalizeGeneratedPageV2Draft keeps target page variants and accepts its real section family', () => {
  const normalized = normalizeGeneratedPageV2Draft({
    job: {
      id: 192,
      title: 'Refill real landing layout',
      job_type: 'manual_request',
      target_blueprint: 'landing',
      request_prompt: 'Rewrite text only.',
      target_page: {
        id: 93,
        documentId: 'landing-layout-doc',
        title: 'Existing landing',
        route_path: '/ai-layout-preview/landing',
        page_kind: 'landing',
        template_variant: 'default',
        sections: [
          { __component: 'page-blocks.hero', variant: 'split-panel', title: 'Hero' },
          { __component: 'page-blocks.comparison-table', variant: 'criteria', title: 'Table' },
          { __component: 'page-blocks.final-cta', variant: 'dark', title: 'CTA' },
        ],
      },
    },
    aiDraft: {
      title: 'Existing landing rewritten',
      sections: [
        { block_type: 'hero', variant: 'default', title: 'New hero' },
        {
          block_type: 'comparison-table',
          variant: 'default',
          title: 'Сравнение',
          rows: [{ feature: 'Контроль ответа', chatplus: 'Есть проверка человеком', alternative: 'Зависит от настройки' }],
        },
        { block_type: 'final-cta', variant: 'light', title: 'CTA', text: 'Проверить сценарий', primary_url: '/demo' },
      ],
    },
    existingRoutes: ['/ai-layout-preview/landing'],
  });

  assert.equal(normalized.data.route_path, '/ai-layout-preview/landing');
  assert.deepEqual(
    normalized.data.sections.map((section) => section.variant),
    ['split-panel', 'criteria', 'dark'],
  );
  assert.ok(normalized.warnings.some((warning) => warning.includes('was reset to locked target variant')));
});

test('normalizeGeneratedPageV2Draft maps AI aliases for before-after and comparison-table', () => {
  const normalized = normalizeGeneratedPageV2Draft({
    job: {
      id: 193,
      title: 'Refill table aliases',
      job_type: 'manual_request',
      target_blueprint: 'comparison',
      request_prompt: 'Rewrite text only.',
      target_page: {
        id: 94,
        documentId: 'comparison-layout-doc',
        title: 'Existing comparison',
        route_path: '/ai-layout-preview/comparison',
        page_kind: 'comparison',
        template_variant: 'comparison',
        sections: [
          { __component: 'page-blocks.hero', title: 'Hero' },
          { __component: 'page-blocks.before-after', title: 'Before after' },
          { __component: 'page-blocks.comparison-table', title: 'Table' },
        ],
      },
    },
    aiDraft: {
      title: 'Existing comparison rewritten',
      sections: [
        { block_type: 'hero', title: 'New hero' },
        {
          block_type: 'before-after',
          title: 'До и после',
          before: [{ problem: 'Ответы разбросаны по чатам', description: 'Менеджер сверяет историю вручную.' }],
          after: [{ result: 'История собрана в одном месте', description: 'Оператор видит контекст перед ответом.' }],
        },
        {
          block_type: 'comparison-table',
          title: 'Сравнение',
          criteria: [
            {
              feature: 'Контроль ответа',
              alternative: 'Ответ уходит без общей проверки',
              recommended: 'Ответ проверяет оператор',
              chatplus: 'Черновик можно изменить перед отправкой',
            },
          ],
        },
      ],
    },
    existingRoutes: ['/ai-layout-preview/comparison'],
  });

  const beforeAfter = normalized.data.sections.find((section) => section.__component === 'page-blocks.before-after');
  const table = normalized.data.sections.find((section) => section.__component === 'page-blocks.comparison-table');
  const visible = validateVisiblePageV2DraftContent(normalized.data);

  assert.equal(beforeAfter.before_items.length, 1);
  assert.equal(beforeAfter.after_items.length, 1);
  assert.deepEqual(table.rows[0], {
    parameter: 'Контроль ответа',
    option_one: 'Ответ уходит без общей проверки',
    option_two: 'Ответ проверяет оператор',
    option_highlight: 'Черновик можно изменить перед отправкой',
  });
  assert.equal(visible.ok, true);
});

test('validateLockedPageV2Layout accepts same block order and variants only', () => {
  const ok = validateLockedPageV2Layout(
    [
      { __component: 'page-blocks.hero', variant: 'split-panel' },
      { __component: 'page-blocks.cards-grid', variant: 'problems' },
    ],
    [
      { __component: 'page-blocks.hero', variant: 'split-panel' },
      { __component: 'page-blocks.cards-grid', variant: 'problems' },
    ],
  );
  const broken = validateLockedPageV2Layout(
    [
      { __component: 'page-blocks.hero', variant: 'split-panel' },
      { __component: 'page-blocks.cards-grid', variant: 'problems' },
    ],
    [
      { __component: 'page-blocks.hero', variant: 'default' },
      { __component: 'page-blocks.cards-grid', variant: 'pillars' },
      { __component: 'page-blocks.faq' },
    ],
  );

  assert.equal(ok.ok, true);
  assert.equal(broken.ok, false);
  assert.ok(broken.errors.some((error) => error.includes('exactly 2')));
  assert.ok(broken.errors.some((error) => error.includes('variant must stay "split-panel"')));
});

test('getTargetPageContext creates compact current-page context for refinement prompts', () => {
  const context = getTargetPageContext({
    target_page: {
      id: 7,
      documentId: 'page-doc',
      title: 'WhatsApp для салонов',
      route_path: '/campaigns/whatsapp-salons',
      page_kind: 'campaign',
      template_variant: 'showcase',
      seo_description: 'Описание страницы',
      sections: [
        {
          __component: 'page-blocks.hero',
          title: 'Запись клиентов через WhatsApp',
          subtitle: 'Автоматизируйте ответы и запись.',
        },
      ],
    },
  });

  assert.equal(context.documentId, 'page-doc');
  assert.equal(context.route_path, '/campaigns/whatsapp-salons');
  assert.deepEqual(context.sections[0], {
    block_type: 'hero',
    title: 'Запись клиентов через WhatsApp',
    subtitle: 'Автоматизируйте ответы и запись.',
  });
});

test('buildGenerationReport captures draft metadata for job review', () => {
  const blockPlan = getAiBlockPlan({
    target_blueprint: 'resource',
    request_prompt: 'Guide with article text, FAQ, and internal links.',
  });
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
        seo_title: 'AI guide SEO',
        seo_description: 'AI guide description',
        sections: [
          {
            __component: 'page-blocks.hero',
            block_type: 'hero',
            variant: 'default',
            title: 'AI guide hero',
            intro: 'A short intro',
            items: [{ title: 'First point', text: 'First point text' }],
          },
          { __component: 'page-blocks.rich-text', title: 'Main text' },
        ],
      },
    },
    warnings: ['Route adjusted'],
    model: 'gpt-4o-mini',
    dryRun: true,
    blockPlan,
  });

  assert.equal(report.dry_run, true);
  assert.equal(report.mode, 'create_new');
  assert.equal(report.blueprint, 'resource');
  assert.equal(report.route_path, '/resources/ai-guide');
  assert.equal(report.generated_preview.title, 'AI guide');
  assert.equal(report.generated_preview.seo_title, 'AI guide SEO');
  assert.equal(report.generated_preview.sections[0].title, 'AI guide hero');
  assert.deepEqual(report.generated_preview.sections[0].items[0], {
    title: 'First point',
    text: 'First point text',
  });
  assert.deepEqual(report.section_types, ['page-blocks.hero', 'page-blocks.rich-text']);
  assert.equal(report.block_plan.strategy, 'auto');
  assert.ok(report.block_plan.preferred_blocks.includes('faq'));
  assert.equal(report.model, 'gpt-4o-mini');
});

test('buildGenerationReport marks refinement jobs and target page ids', () => {
  const report = buildGenerationReport({
    job: {
      job_type: 'manual_request',
      target_blueprint: 'resource',
      target_page: {
        id: 42,
        documentId: 'target-doc',
        title: 'Existing page',
        route_path: '/resources/existing-page',
      },
    },
    pageDraft: {
      data: {
        title: 'Existing page refined',
        route_path: '/resources/existing-page',
        page_kind: 'resource',
        template_variant: 'editorial',
        generation_mode: 'ai_assisted',
        sections: [{ __component: 'page-blocks.hero' }],
      },
    },
  });

  assert.equal(report.mode, 'refine_existing');
  assert.equal(report.target_page_id, 42);
  assert.equal(report.target_page_document_id, 'target-doc');
});

test('buildGenerationReport includes FAQ items in generated preview questions', () => {
  const report = buildGenerationReport({
    job: { job_type: 'manual_request', target_blueprint: 'resource' },
    pageDraft: {
      data: {
        title: 'FAQ page',
        route_path: '/resources/faq-page',
        page_kind: 'resource',
        template_variant: 'editorial',
        generation_mode: 'ai_assisted',
        sections: [
          {
            __component: 'page-blocks.faq',
            block_type: 'faq',
            title: 'FAQ',
            items: [
              { question: 'How does it work?', answer: 'The draft updates the selected Page.' },
            ],
          },
        ],
      },
    },
  });

  assert.deepEqual(report.generated_preview.sections[0].questions[0], {
    question: 'How does it work?',
    answer: 'The draft updates the selected Page.',
  });
});

test('target page prompt context redacts unsupported old claims before AI sees them', () => {
  const context = getTargetPageContext({
    target_page: {
      title: 'Existing page',
      route_path: '/resources/existing',
      page_kind: 'resource',
      seo_description: 'Launch in 15 minutes with 24/7 support.',
      sections: [
        {
          block_type: 'cards-grid',
          title: 'Setup in 15 minutes',
          items: [{ title: '24/7 answers', text: 'Useful but unsupported old copy.' }],
        },
      ],
    },
  });

  const serialized = JSON.stringify(context);
  assert.ok(!serialized.includes('15 minutes'));
  assert.ok(!serialized.includes('24/7'));
  assert.ok(serialized.includes('[redacted unsupported time claim]'));
  assert.ok(serialized.includes('[redacted unsupported availability claim]'));
});

test('AI block planner lets the model choose blocks inside blueprint guardrails', () => {
  const plan = getAiBlockPlan({
    target_blueprint: 'campaign',
    request_prompt: 'Create a launch page with problems, setup steps, FAQ, ROI, and pricing comparison.',
    target_blocks: ['hero', 'comparison-table', 'cards-grid', 'faq'],
  });

  assert.equal(plan.blueprint, 'campaign');
  assert.equal(plan.strategy, 'auto');
  assert.ok(plan.preferredBlocks.includes('hero'));
  assert.ok(plan.preferredBlocks.includes('cards-grid'));
  assert.ok(plan.preferredBlocks.includes('steps'));
  assert.ok(plan.preferredBlocks.includes('faq'));
  assert.ok(!plan.preferredBlocks.includes('comparison-table'));
  assert.ok(plan.rejectedBlocks.includes('comparison-table'));
  assert.ok(plan.rejectedBlocks.includes('before-after'));
});

test('AI page standard gives campaign drafts a complete page shape', () => {
  const plan = getAiBlockPlan({
    target_blueprint: 'campaign',
    request_prompt: 'Create a WhatsApp campaign page with benefits, features, steps, FAQ, and CTA.',
  });
  const standard = formatAiPageCompositionStandardForPrompt('campaign');

  assert.deepEqual(plan.preferredBlocks.slice(0, 7), [
    'hero',
    'cards-grid',
    'rich-text',
    'steps',
    'faq',
    'related-links',
    'final-cta',
  ]);
  assert.match(standard, /Target visible section count: 6-8/);
  assert.match(standard, /Do not create breadcrumbs/);
  assert.match(standard, /Use FAQ with exactly 5 practical questions/);
});

test('AI page standards keep brand and resource drafts on page-v2 primitive layouts', () => {
  const brandPlan = getAiBlockPlan({
    target_blueprint: 'brand',
    request_prompt: 'Create a brand page with context, capabilities, steps, FAQ, links, and CTA.',
  });
  const resourcePlan = getAiBlockPlan({
    target_blueprint: 'resource',
    request_prompt: 'Create an explanatory resource page with prose, cards, FAQ, links, and CTA.',
  });
  const brandStandard = formatAiPageCompositionStandardForPrompt('brand');
  const resourceStandard = formatAiPageCompositionStandardForPrompt('resource');

  assert.deepEqual(brandPlan.preferredBlocks.slice(0, 7), [
    'hero',
    'cards-grid',
    'rich-text',
    'steps',
    'faq',
    'internal-links',
    'final-cta',
  ]);
  assert.deepEqual(resourcePlan.preferredBlocks.slice(0, 6), [
    'hero',
    'rich-text',
    'cards-grid',
    'steps',
    'faq',
    'internal-links',
  ]);
  assert.ok(resourcePlan.preferredBlocks.includes('final-cta'));
  assert.match(brandStandard, /Use route_path under \/brand\//);
  assert.match(resourceStandard, /Use route_path under \/resources\//);
  assert.match(brandStandard, /Do not create sticky/);
  assert.match(resourceStandard, /Do not create breadcrumbs/);
});

test('AI block planner supports explicit custom block lists without bypassing blueprint rules', () => {
  const plan = getAiBlockPlan({
    target_blueprint: 'resource',
    block_strategy: 'custom',
    target_blocks: ['hero', 'rich-text', 'faq', 'internal-links', 'pricing-plans'],
  });

  assert.deepEqual(plan.requiredBlocks, ['hero', 'rich-text']);
  assert.ok(plan.preferredBlocks.includes('internal-links'));
  assert.ok(!plan.preferredBlocks.includes('pricing-plans'));
  assert.ok(plan.rejectedBlocks.includes('pricing-plans'));
});

test('AI content refill supports every page_v2 kind but only with target_page', () => {
  assert.deepEqual(AI_ALLOWED_PAGE_V2_BLUEPRINTS, [
    'landing',
    'directory',
    'entity_detail',
    'entity_intersection',
    'comparison',
    'campaign',
    'resource',
    'brand',
    'system',
  ]);
  assert.equal(isAiBlueprintAllowed('campaign'), true);
  assert.equal(isAiBlueprintAllowed('brand'), true);
  assert.equal(isAiBlueprintAllowed('resource'), true);
  assert.equal(isAiBlueprintAllowed('landing'), true);
  assert.equal(isAiBlueprintAllowed('comparison'), true);
  assert.throws(
    () => assertAiGenerationJobAllowed({ target_blueprint: 'campaign' }),
    /free page creation is disabled/,
  );
  assert.doesNotThrow(() => assertAiGenerationJobAllowed({
    target_blueprint: 'comparison',
    target_page: {
      title: 'Compare page',
      route_path: '/compare/example',
      page_kind: 'comparison',
      sections: [{ __component: 'page-blocks.hero', title: 'Compare page' }],
    },
  }));
});

test('assertAiBlueprintAllowed rejects unknown blueprint families and job/page mismatches', () => {
  assert.doesNotThrow(() => assertAiBlueprintAllowed('landing'));
  assert.throws(
    () => assertAiBlueprintAllowed('unknown'),
    /AI draft generation is not allowed for blueprint "unknown"/,
  );
  assert.throws(
    () => assertAiGenerationJobAllowed({
      target_blueprint: 'campaign',
      target_page: {
        title: 'Landing page',
        route_path: '/pages/landing',
        page_kind: 'landing',
      },
    }),
    /must match target_page page_kind/,
  );
});

test('buildAiChatClientConfig defaults to OpenAI-compatible chat completions', () => {
  const config = buildAiChatClientConfig({
    OPENAI_API_KEY: 'openai-key',
    OPENAI_MODEL: 'gpt-4o-mini',
  });

  assert.equal(config.apiKey, 'openai-key');
  assert.equal(config.model, 'gpt-4o-mini');
  assert.equal(config.chatCompletionsUrl, 'https://api.openai.com/v1/chat/completions');
});

test('buildAiChatClientConfig supports custom OpenAI-compatible providers', () => {
  const config = buildAiChatClientConfig({
    AI_API_KEY: 'provider-key',
    AI_MODEL: 'deepseek-chat',
    AI_API_BASE_URL: 'https://api.deepseek.com/v1/',
    OPENAI_API_KEY: 'openai-key',
    OPENAI_MODEL: 'gpt-4o-mini',
  });

  assert.equal(config.apiKey, 'provider-key');
  assert.equal(config.model, 'deepseek-chat');
  assert.equal(config.chatCompletionsUrl, 'https://api.deepseek.com/v1/chat/completions');
});

test('buildAiChatClientConfig treats OPENROUTER_API_KEY as OpenRouter by default', () => {
  const config = buildAiChatClientConfig({
    OPENROUTER_API_KEY: 'openrouter-key',
    OPENROUTER_MODEL: 'deepseek/deepseek-chat',
  });

  assert.equal(config.apiKey, 'openrouter-key');
  assert.equal(config.model, 'deepseek/deepseek-chat');
  assert.equal(config.chatCompletionsUrl, 'https://openrouter.ai/api/v1/chat/completions');
});

test('buildAiChatClientConfig treats DEEPSEEK_API_KEY as direct DeepSeek by default', () => {
  const config = buildAiChatClientConfig({
    DEEPSEEK_API_KEY: 'deepseek-key',
  });

  assert.equal(config.apiKey, 'deepseek-key');
  assert.equal(config.model, 'deepseek-chat');
  assert.equal(config.chatCompletionsUrl, 'https://api.deepseek.com/v1/chat/completions');
});

test('parseAiJsonObject accepts UTF-8 BOM JSON from mock files', () => {
  const parsed = parseAiJsonObject('\uFEFF{"title":"Smoke"}');

  assert.deepEqual(parsed, { title: 'Smoke' });
});
