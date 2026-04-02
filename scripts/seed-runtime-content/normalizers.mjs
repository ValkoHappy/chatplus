import { stripReservedKeysDeep } from './ownership.mjs';

function hasStructuredSeoFields(item = {}) {
  return Boolean(
    item.h1 ||
    item.subtitle ||
    item.problem_title ||
    item.solution_title ||
    item.sticky_cta_title
  );
}

function normalizeFaqItems(items = []) {
  return items
    .filter(Boolean)
    .map((item) => ({
      q: item.q || item.question || '',
      a: item.a || item.answer || '',
    }))
    .filter((item) => item.q && item.a);
}

function normalizeStepItems(items = []) {
  return items
    .filter(Boolean)
    .map((item, index) => ({
      step: String(index + 1),
      title: item.title || `Step ${index + 1}`,
      desc: item.desc || item.text || item.description || '',
    }))
    .filter((item) => item.title || item.desc);
}

function normalizeRoiItems(items = []) {
  return items
    .filter(Boolean)
    .map((item) => {
      if (typeof item === 'string') {
        return item;
      }

      return [item.value, item.label, item.text].filter(Boolean).join(' - ');
    })
    .filter(Boolean);
}

function buildStructuredContent(item = {}) {
  const blocks = [];

  const pushText = (value) => {
    if (typeof value === 'string' && value.trim()) {
      blocks.push(value.trim());
    }
  };

  const pushList = (items = []) => {
    items.forEach((value) => {
      if (typeof value === 'string' && value.trim()) {
        blocks.push(`- ${value.trim()}`);
      }
    });
  };

  const pushCardList = (items = []) => {
    items.forEach((entry) => {
      const title = entry?.title || entry?.question || '';
      const text = entry?.text || entry?.answer || '';

      if (title) {
        blocks.push(`### ${title}`);
      }

      pushText(text);
    });
  };

  if (item.h1) {
    blocks.push(`# ${item.h1}`);
  }

  pushText(item.subtitle);

  if (item.problem_title) {
    blocks.push(`## ${item.problem_title}`);
  }
  pushText(item.problem_intro);
  pushCardList(item.problems);

  if (item.solution_title) {
    blocks.push(`## ${item.solution_title}`);
  }
  pushText(item.solution_intro);
  pushCardList(item.solution_steps);

  if (item.features_title) {
    blocks.push(`## ${item.features_title}`);
  }
  pushCardList(item.features);

  if (item.roi_title) {
    blocks.push(`## ${item.roi_title}`);
  }
  pushList(item.roi_without_items);
  pushList(item.roi_with_items);
  pushText(item.roi_quote);

  if (Array.isArray(item.faqs) && item.faqs.length) {
    blocks.push('## FAQ');
    pushCardList(item.faqs);
  }

  if (item.sticky_cta_title) {
    blocks.push(`## ${item.sticky_cta_title}`);
  }
  pushText(item.sticky_cta_text);

  return blocks.join('\n\n').trim();
}

function prepareStructuredSeedItem(endpoint, item) {
  if (!hasStructuredSeoFields(item)) {
    return item;
  }

  const base = {
    slug: item.slug,
    name: item.name,
    emoji: item.emoji || '',
    icon: item.icon || '',
    description: item.description || item.subtitle || '',
    h1: item.h1 || item.name || '',
    subtitle: item.subtitle || item.description || '',
    problem_title: item.problem_title || '',
    problem_intro: item.problem_intro || item.pain || '',
    problems: Array.isArray(item.problems) ? item.problems : [],
    solution_title: item.solution_title || '',
    solution_intro: item.solution_intro || item.solution || '',
    solution_steps: Array.isArray(item.solution_steps) ? item.solution_steps : (Array.isArray(item.steps) ? item.steps : []),
    features_title: item.features_title || '',
    features: Array.isArray(item.features) ? item.features : [],
    roi_title: item.roi_title || '',
    roi_without_items: Array.isArray(item.roi_without_items) ? item.roi_without_items : [],
    roi_with_items: Array.isArray(item.roi_with_items) ? item.roi_with_items : [],
    roi_quote: item.roi_quote || '',
    faq_title: item.faq_title || 'FAQ',
    sticky_cta_title: item.sticky_cta_title || '',
    sticky_cta_text: item.sticky_cta_text || '',
    cta: item.cta || '',
    seo_title: item.seo_title || (item.h1 ? `${item.h1} | Chat Plus` : ''),
    seo_description: item.seo_description || item.subtitle || item.description || '',
    faq: normalizeFaqItems(item.faq || item.faqs || []),
    content: buildStructuredContent(item),
  };

  if (endpoint === 'channels' || endpoint === 'industries' || endpoint === 'solutions') {
    base.roi_metrics = normalizeRoiItems(item.roi_metrics || item.roi_with_items || []);
  }

  if (endpoint === 'channels' || endpoint === 'solutions') {
    base.steps = normalizeStepItems(item.steps || item.solution_steps || []);
  }

  if (endpoint === 'industries' || endpoint === 'solutions') {
    base.pain = base.problem_intro;
    base.solution = base.solution_intro;
  }

  return base;
}

function prepareCollectionItem(endpoint, item) {
  if (
    endpoint === 'channels' ||
    endpoint === 'industries' ||
    endpoint === 'solutions' ||
    endpoint === 'integrations' ||
    endpoint === 'features'
  ) {
    return prepareStructuredSeedItem(endpoint, item);
  }

  if (endpoint === 'business-types') {
    const { sticky_cta_title, sticky_cta_text, ...rest } = item;
    return stripReservedKeysDeep(rest);
  }

  return stripReservedKeysDeep(item);
}

export {
  buildStructuredContent,
  normalizeFaqItems,
  normalizeRoiItems,
  normalizeStepItems,
  prepareCollectionItem,
  prepareStructuredSeedItem,
};
