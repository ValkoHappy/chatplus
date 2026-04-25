function fill(template: any, values: Record<string, string>) {
  if (typeof template !== 'string') {
    return '';
  }

  return template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');
}

function compactSecondaryText(text: string, limit = 84) {
  if (typeof text !== 'string' || !text.trim()) {
    return '';
  }

  const normalized = text.replace(/\s+/g, ' ').trim();
  const firstSentence = normalized.split(/(?<=[.!?])\s+/)[0] || normalized;

  if (firstSentence.length <= limit) {
    return firstSentence;
  }

  return `${firstSentence.slice(0, limit).trimEnd()}…`;
}

function compactDescription(text: string, limit = 72) {
  if (typeof text !== 'string' || !text.trim()) {
    return '';
  }

  const normalized = text.replace(/\s+/g, ' ').trim();
  const firstSentence = normalized.split(/(?<=[.!?])\s+/)[0] || normalized;

  if (firstSentence.length <= limit) {
    return firstSentence;
  }

  return `${firstSentence.slice(0, limit).trimEnd()}…`;
}

function pickFirstMeaningfulString(...values: any[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  return '';
}

function makeFeatureItems(items: any[] = []) {
  return items.map((item) => {
    if (typeof item === 'string') {
      return { title: item, text: '' };
    }

    return {
      title: item?.title || item?.label || item?.name || '',
      text: compactSecondaryText(item?.text || item?.desc || item?.description || '', 88),
    };
  });
}

function makeSteps(items: any[] = []) {
  return items.map((item, index) => ({
    title: item?.title || `Шаг ${index + 1}`,
    text: item?.text || item?.desc || item?.description || '',
  }));
}

function makeFaq(items: any[] = []) {
  return items.map((item) => ({
    question: item?.question || item?.q || '',
    answer: item?.answer || item?.a || '',
  }));
}

function makeRoiItems(items: any[] = []) {
  return items.map((item) => {
    if (typeof item === 'string') {
      return item;
    }

    return [item?.value, item?.label].filter(Boolean).join(' — ');
  });
}

function prioritizeBySlugs(items: any[] = [], preferredSlugs: string[] = []) {
  const preferred = preferredSlugs
    .map((slug) => items.find((item) => item?.slug === slug))
    .filter(Boolean);
  const preferredSet = new Set(preferred.map((item) => item.slug));

  return [
    ...preferred,
    ...items.filter((item) => !preferredSet.has(item?.slug)),
  ];
}

function makeIntegrationBlocks(items: any[] = [], limit = 16) {
  return items.slice(0, limit).map((item) => ({
    label: item?.name || '',
    text: compactSecondaryText(item?.description || '', 72),
  }));
}

function makeLinks(items: any[] = []) {
  return items
    .filter(Boolean)
    .map((item) => ({
      label: item.label,
      href: item.href,
      description: compactSecondaryText(item.description || '', 58),
    }));
}

function makeBreadcrumbs(items: any[] = []) {
  return items
    .filter((item) => item?.label)
    .map((item) => ({
      label: item.label,
      href: item.href,
    }));
}

function makeNavigationGroups(groups: any[] = []) {
  return groups
    .map((group) => ({
      title: group?.title || '',
      items: makeLinks(group?.items || []),
    }))
    .filter((group) => group.title && group.items.length > 0);
}

function makeUseCaseItems(items: any[] = [], limit = 10) {
  return items.slice(0, limit).map((item) => ({
    title: item?.title || item?.label || item?.name || '',
    text: compactSecondaryText(item?.text || item?.desc || item?.description || '', 76),
  }));
}

function getPageTemplate(settings: any, group: string, key: string) {
  const template = settings?.page_templates?.[group]?.[key];

  if (!template) {
    throw new Error(`Missing Strapi page template: ${group}.${key}`);
  }

  return template;
}

export {
  compactDescription,
  compactSecondaryText,
  fill,
  getPageTemplate,
  makeBreadcrumbs,
  makeFaq,
  makeFeatureItems,
  makeIntegrationBlocks,
  makeLinks,
  makeNavigationGroups,
  makeRoiItems,
  makeSteps,
  makeUseCaseItems,
  pickFirstMeaningfulString,
  prioritizeBySlugs,
};
