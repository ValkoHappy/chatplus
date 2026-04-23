import { getPageV2Blueprint, validatePageV2BlueprintSections } from '../../config/page-v2-blueprints.mjs';
import { isReservedPageV2Route, normalizePageV2RoutePath } from '../../config/page-v2-routes.mjs';

export const AI_ALLOWED_PAGE_V2_BLUEPRINTS = Object.freeze(['campaign', 'brand', 'resource']);

const DEFAULT_ROUTE_PREFIX_BY_BLUEPRINT = Object.freeze({
  landing: '/pages',
  directory: '/directories',
  entity_detail: '/pages',
  entity_intersection: '/pages',
  comparison: '/pages',
  campaign: '/campaigns',
  resource: '/resources',
  brand: '/brand',
  system: '/pages',
});

const COMPONENT_BY_BLOCK_TYPE = Object.freeze({
  hero: 'page-blocks.hero',
  'rich-text': 'page-blocks.rich-text',
  'proof-stats': 'page-blocks.proof-stats',
  'cards-grid': 'page-blocks.cards-grid',
  'feature-list': 'page-blocks.feature-list',
  steps: 'page-blocks.steps',
  faq: 'page-blocks.faq',
  testimonial: 'page-blocks.testimonial',
  'related-links': 'page-blocks.related-links',
  'final-cta': 'page-blocks.final-cta',
  'pricing-plans': 'page-blocks.pricing-plans',
  'comparison-table': 'page-blocks.comparison-table',
  'before-after': 'page-blocks.before-after',
  'internal-links': 'page-blocks.internal-links',
});

const CYRILLIC_TO_LATIN = Object.freeze({
  '\u0430': 'a',
  '\u0431': 'b',
  '\u0432': 'v',
  '\u0433': 'g',
  '\u0434': 'd',
  '\u0435': 'e',
  '\u0451': 'e',
  '\u0436': 'zh',
  '\u0437': 'z',
  '\u0438': 'i',
  '\u0439': 'y',
  '\u043a': 'k',
  '\u043b': 'l',
  '\u043c': 'm',
  '\u043d': 'n',
  '\u043e': 'o',
  '\u043f': 'p',
  '\u0440': 'r',
  '\u0441': 's',
  '\u0442': 't',
  '\u0443': 'u',
  '\u0444': 'f',
  '\u0445': 'h',
  '\u0446': 'ts',
  '\u0447': 'ch',
  '\u0448': 'sh',
  '\u0449': 'sch',
  '\u044a': '',
  '\u044b': 'y',
  '\u044c': '',
  '\u044d': 'e',
  '\u044e': 'yu',
  '\u044f': 'ya',
});

function asString(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function slugifySegment(value = '') {
  const transliterated = `${value || ''}`
    .toLowerCase()
    .split('')
    .map((character) => CYRILLIC_TO_LATIN[character] ?? character)
    .join('');

  return transliterated
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/gi, ' ')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeLinkItem(item = {}) {
  const label = asString(item.label) || asString(item.title);
  const href = normalizePageV2RoutePath(asString(item.href) || asString(item.url));

  if (!label || !href || href === '/') {
    return null;
  }

  return {
    label,
    href,
    description: asString(item.description),
  };
}

function normalizeCardItem(item = {}) {
  const title = asString(item.title);
  const text = asString(item.text) || asString(item.description);

  if (!title && !text) {
    return null;
  }

  return {
    title: title || 'Benefit',
    text,
    eyebrow: asString(item.eyebrow),
    icon: asString(item.icon),
    secondary_text: asString(item.secondary_text || item.secondaryText),
  };
}

function normalizeStatItem(item = {}) {
  const label = asString(item.label);
  const value = asString(item.value);

  if (!label && !value) {
    return null;
  }

  return {
    label: label || 'Metric',
    value: value || 'Value',
    description: asString(item.description),
  };
}

function normalizeStepItem(item = {}) {
  const title = asString(item.title);
  const text = asString(item.text) || asString(item.description);

  if (!title && !text) {
    return null;
  }

  return {
    title: title || 'Step',
    text,
  };
}

function normalizeFaqItem(item = {}) {
  const question = asString(item.question) || asString(item.title);
  const answer = asString(item.answer) || asString(item.text);

  if (!question && !answer) {
    return null;
  }

  return {
    question: question || 'Question',
    answer: answer || 'Answer pending editorial review.',
  };
}

function normalizeSection(section = {}) {
  const blockType = asString(section.block_type || section.blockType);
  if (!blockType || !COMPONENT_BY_BLOCK_TYPE[blockType]) {
    return null;
  }

  switch (blockType) {
    case 'hero':
      return {
        __component: COMPONENT_BY_BLOCK_TYPE[blockType],
        title: asString(section.title) || 'New page draft',
        eyebrow: asString(section.eyebrow),
        subtitle: asString(section.subtitle),
        variant: asString(section.variant) || 'default',
        context_title: asString(section.context_title || section.contextTitle),
        context_text: asString(section.context_text || section.contextText),
        panel_items: asArray(section.panel_items || section.panelItems).map((item) => normalizeCardItem(item)).filter(Boolean),
        primary_label: asString(section.primary_label || section.primaryLabel),
        primary_url: asString(section.primary_url || section.primaryUrl),
        secondary_label: asString(section.secondary_label || section.secondaryLabel),
        secondary_url: asString(section.secondary_url || section.secondaryUrl),
        trust_facts: asArray(section.trust_facts || section.trustFacts).filter(Boolean),
      };
    case 'rich-text':
      return {
        __component: COMPONENT_BY_BLOCK_TYPE[blockType],
        title: asString(section.title),
        body: asString(section.body) || asString(section.text) || 'Editorial team will refine this block after AI generation.',
      };
    case 'proof-stats':
      return {
        __component: COMPONENT_BY_BLOCK_TYPE[blockType],
        title: asString(section.title),
        intro: asString(section.intro),
        variant: asString(section.variant) || 'cards',
        items: asArray(section.items).map((item) => normalizeStatItem(item)).filter(Boolean),
      };
    case 'cards-grid':
      return {
        __component: COMPONENT_BY_BLOCK_TYPE[blockType],
        title: asString(section.title),
        intro: asString(section.intro),
        variant: asString(section.variant) || 'default',
        items: asArray(section.items).map((item) => normalizeCardItem(item)).filter(Boolean),
      };
    case 'feature-list':
      return {
        __component: COMPONENT_BY_BLOCK_TYPE[blockType],
        title: asString(section.title),
        intro: asString(section.intro),
        items: asArray(section.items).map((item) => normalizeCardItem(item)).filter(Boolean),
      };
    case 'steps':
      return {
        __component: COMPONENT_BY_BLOCK_TYPE[blockType],
        title: asString(section.title),
        intro: asString(section.intro),
        variant: asString(section.variant) || 'cards',
        items: asArray(section.items).map((item) => normalizeStepItem(item)).filter(Boolean),
      };
    case 'faq':
      return {
        __component: COMPONENT_BY_BLOCK_TYPE[blockType],
        title: asString(section.title),
        intro: asString(section.intro),
        items: asArray(section.items).map((item) => normalizeFaqItem(item)).filter(Boolean),
      };
    case 'testimonial':
      return {
        __component: COMPONENT_BY_BLOCK_TYPE[blockType],
        title: asString(section.title),
        quote: asString(section.quote) || asString(section.text) || 'Editorial team will refine the final testimonial.',
        author: asString(section.author_name || section.authorName || section.author),
        role: asString(section.author_role || section.authorRole || section.role),
      };
    case 'related-links':
      return {
        __component: COMPONENT_BY_BLOCK_TYPE[blockType],
        title: asString(section.title),
        intro: asString(section.intro),
        links: asArray(section.links).map((item) => normalizeLinkItem(item)).filter(Boolean),
      };
    case 'final-cta':
      return {
        __component: COMPONENT_BY_BLOCK_TYPE[blockType],
        title: asString(section.title) || 'Ready for the next step?',
        text: asString(section.text) || asString(section.subtitle),
        primary_label: asString(section.primary_label || section.primaryLabel) || 'Request demo',
        primary_url: asString(section.primary_url || section.primaryUrl) || '/demo',
        secondary_label: asString(section.secondary_label || section.secondaryLabel),
        secondary_url: asString(section.secondary_url || section.secondaryUrl),
      };
    case 'pricing-plans':
      return {
        __component: COMPONENT_BY_BLOCK_TYPE[blockType],
        title: asString(section.title),
        intro: asString(section.intro),
        variant: asString(section.variant) || 'cards',
        items: asArray(section.items).map((item) => {
          const current = item || {};
          return {
            title: asString(current.title),
            label: asString(current.label),
            price: asString(current.price),
            period: asString(current.period),
            note: asString(current.note),
            text: asString(current.text),
            cta_label: asString(current.cta_label || current.ctaLabel),
            cta_url: asString(current.cta_url || current.ctaUrl),
            icon: asString(current.icon),
            kicker: asString(current.kicker),
            accent: Boolean(current.accent),
            features: asArray(current.features).filter(Boolean),
          };
        }).filter((item) => item.title || item.label || item.price),
      };
    case 'comparison-table':
      return {
        __component: COMPONENT_BY_BLOCK_TYPE[blockType],
        title: asString(section.title),
        intro: asString(section.intro),
        option_one_label: asString(section.option_one_label || section.optionOneLabel),
        option_two_label: asString(section.option_two_label || section.optionTwoLabel),
        option_highlight_label: asString(section.option_highlight_label || section.optionHighlightLabel),
        rows: asArray(section.rows).map((item) => ({
          parameter: asString(item.parameter),
          option_one: asString(item.option_one || item.optionOne),
          option_two: asString(item.option_two || item.optionTwo),
          option_highlight: asString(item.option_highlight || item.optionHighlight),
        })).filter((item) => item.parameter || item.option_one || item.option_two || item.option_highlight),
      };
    case 'before-after':
      return {
        __component: COMPONENT_BY_BLOCK_TYPE[blockType],
        title: asString(section.title),
        intro: asString(section.intro),
        before_title: asString(section.before_title || section.beforeTitle),
        after_title: asString(section.after_title || section.afterTitle),
        before_items: asArray(section.before_items || section.beforeItems).filter(Boolean),
        after_items: asArray(section.after_items || section.afterItems).filter(Boolean),
        quote: asString(section.quote),
        quote_author: asString(section.quote_author || section.quoteAuthor),
      };
    case 'internal-links':
      return {
        __component: COMPONENT_BY_BLOCK_TYPE[blockType],
        eyebrow: asString(section.eyebrow),
        title: asString(section.title),
        intro: asString(section.intro),
        links: asArray(section.links).map((item) => normalizeLinkItem(item)).filter(Boolean),
      };
    default:
      return null;
  }
}

function buildFallbackSection(blockType, context) {
  const title = context.title || 'New page draft';

  switch (blockType) {
    case 'hero':
      return normalizeSection({
        block_type: 'hero',
        eyebrow: 'CHATPLUS',
        title,
        subtitle: context.summary || 'AI draft is ready and waiting for editorial review.',
        primary_label: 'Request demo',
        primary_url: '/demo',
      });
    case 'rich-text':
      return normalizeSection({
        block_type: 'rich-text',
        title: 'About this page',
        body: context.summary || context.prompt || 'Editorial team will refine this block after AI generation.',
      });
    case 'cards-grid':
    case 'feature-list':
      return normalizeSection({
        block_type: blockType,
        title: 'Key highlights',
        items: [
          { title: 'Fast draft', text: 'This page was created as an AI draft and still needs editorial review.' },
          { title: 'Flexible editing', text: 'Editors can refine the content in Strapi without code changes.' },
        ],
      });
    case 'steps':
      return normalizeSection({
        block_type: 'steps',
        title: 'Next steps',
        items: [
          { title: 'Review draft', text: 'Open the page in Strapi and tighten the most important wording.' },
          { title: 'Check SEO', text: 'Validate title, description, and internal links before publish.' },
        ],
      });
    case 'faq':
      return normalizeSection({
        block_type: 'faq',
        title: 'Frequently asked questions',
        items: [
          {
            question: 'Can editors change this page manually?',
            answer: 'Yes. This is a normal page_v2 draft and can be freely edited in Strapi before publish.',
          },
        ],
      });
    case 'testimonial':
      return normalizeSection({
        block_type: 'testimonial',
        title: 'Editorial note',
        quote: 'AI drafts speed up page creation, but a human reviewer still makes the final call.',
        author_name: 'CHATPLUS team',
        author_role: 'Editorial review',
      });
    case 'related-links':
      return normalizeSection({
        block_type: 'related-links',
        title: 'Useful links',
        links: [{ label: 'Documentation', href: '/docs', description: 'Reference materials for the product and the editorial workflow.' }],
      });
    case 'final-cta':
      return normalizeSection({
        block_type: 'final-cta',
        title: 'Ready to continue?',
        text: 'After editorial review this page can be published and added to site navigation.',
        primary_label: 'Request demo',
        primary_url: '/demo',
      });
    default:
      return null;
  }
}

export function isAiBlueprintAllowed(blueprintId = '') {
  return AI_ALLOWED_PAGE_V2_BLUEPRINTS.includes(asString(blueprintId));
}

export function assertAiBlueprintAllowed(blueprintId = '') {
  if (!isAiBlueprintAllowed(blueprintId)) {
    throw new Error(
      `AI draft generation is not allowed for blueprint "${blueprintId}". ` +
      `Allowed blueprints: ${AI_ALLOWED_PAGE_V2_BLUEPRINTS.join(', ')}.`,
    );
  }
}

export function buildSafePageV2RoutePath({
  title = '',
  suggestedRoutePath = '',
  blueprintId = 'landing',
  existingRoutes = [],
  jobId = '',
}) {
  const warnings = [];
  const normalizedExisting = new Set(existingRoutes.map((item) => normalizePageV2RoutePath(item)).filter(Boolean));
  const blueprint = getPageV2Blueprint(blueprintId);
  const preferredPrefix = DEFAULT_ROUTE_PREFIX_BY_BLUEPRINT[blueprintId] || '/pages';
  const titleSlug = slugifySegment(title) || 'draft-page';
  const requestedPath = normalizePageV2RoutePath(suggestedRoutePath || `${preferredPrefix}/${titleSlug}`);

  let candidate = requestedPath;
  if (candidate === '/') {
    candidate = `${preferredPrefix}/${titleSlug}`;
  }

  if (isReservedPageV2Route(candidate)) {
    warnings.push(`Route ${candidate} collides with reserved routes and was moved under ${preferredPrefix}.`);
    candidate = normalizePageV2RoutePath(`${preferredPrefix}/${slugifySegment(candidate) || titleSlug}`);
  }

  let counter = 0;
  while (normalizedExisting.has(candidate)) {
    counter += 1;
    const suffix = jobId ? `-${jobId}` : `-${counter}`;
    warnings.push(`Route ${candidate} already exists. Added suffix ${suffix}.`);
    const baseSlug = slugifySegment(title) || 'draft-page';
    candidate = normalizePageV2RoutePath(`${preferredPrefix}/${baseSlug}${suffix}`);
  }

  if (blueprint && isReservedPageV2Route(candidate)) {
    throw new Error(`Could not build a safe route for blueprint ${blueprint.id}.`);
  }

  return {
    routePath: candidate,
    warnings,
  };
}

export function normalizeGeneratedPageV2Draft({ job = {}, aiDraft = {}, existingRoutes = [] }) {
  const blueprintId = asString(job.target_blueprint) || 'landing';
  const blueprint = getPageV2Blueprint(blueprintId);
  if (!blueprint) {
    throw new Error(`Unknown page_v2 blueprint: ${blueprintId}`);
  }

  const title = asString(aiDraft.title) || asString(job.title) || 'New page draft';
  const summary = asString(aiDraft.summary) || asString(job.request_prompt);
  const { routePath, warnings } = buildSafePageV2RoutePath({
    title,
    suggestedRoutePath: asString(aiDraft.route_path),
    blueprintId,
    existingRoutes,
    jobId: `${job.id || ''}`.trim(),
  });

  const sections = asArray(aiDraft.sections)
    .map((section) => normalizeSection(section))
    .filter(Boolean);

  for (const requiredBlock of blueprint.requiredBlocks) {
    const hasBlock = sections.some((section) => {
      const component = COMPONENT_BY_BLOCK_TYPE[requiredBlock];
      return section?.__component === component;
    });

    if (!hasBlock) {
      const fallback = buildFallbackSection(requiredBlock, {
        title,
        summary,
        prompt: asString(job.request_prompt),
      });
      if (fallback) {
        sections.push(fallback);
        warnings.push(`Added fallback required block: ${requiredBlock}.`);
      }
    }
  }

  const simplifiedSections = sections.map((section) => ({
    block_type: Object.entries(COMPONENT_BY_BLOCK_TYPE).find(([, component]) => component === section.__component)?.[0] || '',
  }));
  const validation = validatePageV2BlueprintSections(blueprintId, simplifiedSections);
  if (!validation.ok) {
    throw new Error(validation.errors.join(' '));
  }

  const relationMapping = Object.freeze({
    target_channels: 'channels',
    target_industries: 'industries',
    target_integrations: 'integrations',
    target_solutions: 'solutions',
    target_features: 'features',
    target_business_types: 'business_types',
    target_competitors: 'competitors',
  });

  const relationData = {};
  for (const [jobField, pageField] of Object.entries(relationMapping)) {
    relationData[pageField] = asArray(job[jobField])
      .map((item) => item?.documentId || item?.id)
      .filter(Boolean);
  }

  return {
    data: {
      title,
      slug: slugifySegment(asString(aiDraft.slug) || title) || 'draft-page',
      route_path: routePath,
      locale: asString(aiDraft.locale) || 'ru',
      page_kind: blueprint.pageKind,
      template_variant: asString(aiDraft.template_variant) || blueprint.templateVariant,
      generation_mode: job.job_type === 'scheduled' ? 'ai_generated' : 'ai_assisted',
      source_mode: 'hybrid',
      editorial_status: 'review',
      seo_title: asString(aiDraft.seo_title) || title,
      seo_description: asString(aiDraft.seo_description) || summary || 'AI draft page waiting for editorial review.',
      canonical: asString(aiDraft.canonical),
      robots: asString(aiDraft.robots) || 'index,follow',
      nav_group: asString(aiDraft.nav_group) || 'resources',
      nav_label: asString(aiDraft.nav_label) || title,
      nav_description: asString(aiDraft.nav_description) || summary,
      nav_order: Number(aiDraft.nav_order || 100),
      show_in_header: Boolean(aiDraft.show_in_header),
      show_in_footer: Boolean(aiDraft.show_in_footer),
      show_in_sitemap: aiDraft.show_in_sitemap !== false,
      sitemap_priority: typeof aiDraft.sitemap_priority === 'number' ? aiDraft.sitemap_priority : 0.5,
      sitemap_changefreq: asString(aiDraft.sitemap_changefreq) || 'weekly',
      generation_prompt: asString(job.request_prompt),
      ai_metadata: {
        blueprint: blueprintId,
        generated_from_job_id: job.id || null,
        generated_at: new Date().toISOString(),
        requested_by: asString(job.requested_by),
        warnings,
      },
      human_review_required: true,
      owner: asString(job.requested_by),
      reviewer: asString(aiDraft.reviewer),
      breadcrumbs: asArray(aiDraft.breadcrumbs).map((item) => normalizeLinkItem(item)).filter(Boolean),
      internal_links: asArray(aiDraft.internal_links).map((item) => normalizeLinkItem(item)).filter(Boolean),
      sections,
      ...relationData,
    },
    warnings,
    blueprint,
  };
}

export function buildGenerationReport({ job = {}, pageDraft, warnings = [], model = '', dryRun = false }) {
  return {
    ok: true,
    dry_run: dryRun,
    job_type: job.job_type || null,
    blueprint: job.target_blueprint || null,
    page_title: pageDraft.data.title,
    route_path: pageDraft.data.route_path,
    page_kind: pageDraft.data.page_kind,
    template_variant: pageDraft.data.template_variant,
    generation_mode: pageDraft.data.generation_mode,
    section_types: pageDraft.data.sections.map((section) => section.__component),
    warnings,
    model,
    generated_at: new Date().toISOString(),
  };
}
