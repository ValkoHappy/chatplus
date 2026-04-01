import { getNavigationGroupTitle } from './link-sections';

function fill(template: any, values: Record<string, string>) {
  if (typeof template !== 'string') {
    return '';
  }

  return template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');
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

function inferDirectoryCtaLabel(key: string, item: any) {
  const name = item?.name || '';

  switch (key) {
    case 'channels':
      return name ? `Подключить ${name}` : 'Подключить канал';
    case 'integrations':
      return name ? `Подключить ${name}` : 'Подключить интеграцию';
    case 'features':
      return name ? `Попробовать ${name}` : 'Попробовать функцию';
    case 'solutions':
      return name ? `Смотреть ${name}` : 'Смотреть решение';
    case 'industries':
      return name ? `Смотреть кейс ${name}` : 'Смотреть кейс';
    case 'business_types':
      return name ? `Смотреть сценарий ${name}` : 'Смотреть сценарий';
    default:
      return 'Подробнее';
  }
}

function makeIntegrationBlocks(items: any[] = [], limit = 6) {
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

function makeUseCaseItems(items: any[] = [], limit = 4) {
  return items.slice(0, limit).map((item) => ({
    title: item?.title || item?.label || item?.name || '',
    text: compactSecondaryText(item?.text || item?.desc || item?.description || '', 76),
  }));
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

function normalizeKeywordSource(text: string) {
  return text.toLowerCase().replace(/ё/g, 'е');
}

function describeCompetitorWeakness(title: string, competitorName: string) {
  const normalized = normalizeKeywordSource(title);

  if (/(дорог|цена|стоим|нацен|порог|оплат)/.test(normalized)) {
    return `У ${competitorName} это ограничение напрямую бьет по стоимости владения и делает рост команды менее предсказуемым.`;
  }

  if (/(ai|агент|резолюц|автомат)/.test(normalized)) {
    return `Из-за этого сложнее масштабировать автоматизацию без отдельных доплат, ручных компромиссов и потери скорости.`;
  }

  if (/(whatsapp|telegram|канал|омниканал)/.test(normalized)) {
    return `В реальном процессе это ограничивает омниканальный контур и вынуждает собирать коммуникации из нескольких сервисов.`;
  }

  if (/(crm|интеграц|calendar|календар)/.test(normalized)) {
    return 'Команде приходится дольше связывать данные и переносить контекст между внешними системами вручную.';
  }

  if (/(внедр|настрой|запуск|слож)/.test(normalized)) {
    return 'Из-за этого запуск затягивается, а стоимость внедрения растет еще до первых измеримых результатов.';
  }

  if (/(white-label|агентств|партнер)/.test(normalized)) {
    return 'Для агентств и интеграторов это усложняет упаковку сервиса под собственную модель продаж и сопровождения.';
  }

  return 'В рабочем процессе это создает лишние ограничения для команды, которой нужен быстрый запуск и понятная экономика.';
}

function describeChatPlusStrength(title: string) {
  const normalized = normalizeKeywordSource(title);

  if (/(дешев|цена|стоим|нацен|фиксир)/.test(normalized)) {
    return 'Chat Plus закрывает этот сценарий в более предсказуемой модели без скрытых доплат и резкого роста счета.';
  }

  if (/(ai|агент|календар|автозапис)/.test(normalized)) {
    return 'Команда получает готовую автоматизацию из коробки и быстрее доводит лид до следующего шага без ручных связок.';
  }

  if (/(whatsapp|telegram|канал|омниканал)/.test(normalized)) {
    return 'Это позволяет держать каналы в одном контуре и не собирать стек из нескольких разрозненных инструментов.';
  }

  if (/(crm|интеграц|amo|bitrix|altegio|outlook|google)/.test(normalized)) {
    return 'Данные и коммуникации остаются связанными, а запуск не упирается в кастомную разработку и ручные переносы.';
  }

  if (/(быстр|запуск|15 минут|внедр)/.test(normalized)) {
    return 'За счет этого внедрение занимает меньше времени и быстрее превращается в рабочий сценарий для команды.';
  }

  if (/(поддерж|русск|снг|локаль)/.test(normalized)) {
    return 'Это снижает операционные риски на старте и упрощает внедрение для локальной команды и партнеров.';
  }

  if (/(white-label|агентств|партнер)/.test(normalized)) {
    return 'Партнер может упаковать готовый сценарий под своим брендом без лишней надстройки поверх продукта.';
  }

  return 'Это дает более практичную B2B-конфигурацию под быстрый запуск, омниканал и работу команды в одном контуре.';
}

export function getPageTemplate(settings: any, group: string, key: string) {
  const template = settings?.page_templates?.[group]?.[key];

  if (!template) {
    throw new Error(`Missing Strapi page template: ${group}.${key}`);
  }

  return template;
}

export function adaptChannelPage(channel: any, context: any) {
  const template = getPageTemplate(context.settings, 'details', 'channels');
  const relatedChannels = context.channels.filter((item: any) => item.slug !== channel.slug).slice(0, 3);
  const relatedIndustries = context.industries.slice(0, 3);

  return {
    meta_title: channel.seo_title || fill(template.meta_title, { name: channel.name }),
    meta_description: channel.seo_description || channel.description,
    h1: channel.h1 || fill(template.h1, { name: channel.name }),
    subtitle: channel.subtitle || channel.description,
    hero_cta_primary_label: channel.cta,
    hero_cta_primary_url: '/demo',
    hero_cta_secondary_label: template.hero_cta_secondary_label,
    hero_cta_secondary_url: template.hero_cta_secondary_url,
    problem_title: channel.problem_title || fill(template.problem_title, { name: channel.name }),
    problem_intro: channel.problem_intro || fill(template.problem_intro, { name: channel.name }),
    problems: (Array.isArray(channel.problems) && channel.problems.length > 0) ? channel.problems : (Array.isArray(template.problem_points) ? template.problem_points : []),
    problem_summary: channel.problem_summary || fill(template.problem_summary, { name: channel.name }),
    solution_title: channel.solution_title || fill(template.solution_title, { name: channel.name }),
    solution_intro: channel.solution_intro || fill(template.solution_intro, { name: channel.name }),
    solution_steps: makeSteps((Array.isArray(channel.solution_steps) && channel.solution_steps.length > 0) ? channel.solution_steps : channel.steps),
    features_title: channel.features_title || fill(template.features_title, { name: channel.name }),
    features: makeFeatureItems(channel.features),
    integrations_title: channel.integrations_title || fill(template.integrations_title, { name: channel.name }),
    integration_blocks: makeIntegrationBlocks(context.integrations),
    roi_title: channel.roi_title || fill(template.roi_title, { name: channel.name }),
    roi_intro: channel.roi_intro || fill(template.roi_intro, { name: channel.name }),
    roi_without_items: channel.roi_without_items || [],
    roi_with_items: channel.roi_with_items || makeRoiItems(channel.roi_metrics),
    roi_quote: channel.roi_quote || '',
    faq_title: channel.faq_title || template.faq_title,
    faqs: makeFaq(channel.faq),
    breadcrumbs: makeBreadcrumbs([
      { label: 'Главная', href: '/' },
      { label: 'Каналы', href: '/channels' },
      { label: channel.name },
    ]),
    navigation_groups_title: `Где использовать ${channel.name}`,
    navigation_groups: makeNavigationGroups([
      {
        title: getNavigationGroupTitle('industries_for_channel', channel.name),
        items: context.industries.map((item: any) => ({
          label: item.name,
          href: `/channels/${channel.slug}/${item.slug}`,
          description: item.description,
        })),
      },
      {
        title: getNavigationGroupTitle('integrations_for_channel', channel.name),
        items: context.integrations.map((item: any) => ({
          label: item.name,
          href: `/channels/${channel.slug}/${item.slug}`,
          description: item.description,
        })),
      },
    ]),
    navigation_groups_intro: `Выберите отрасль или интеграцию, чтобы открыть готовый сценарий запуска ${channel.name} в вашем процессе.`,
    internal_links_title: template.internal_links_title,
    internal_links_variant: 'related',
    internal_links_context: {
      entityType: 'channel',
      entityName: channel.name,
      pageSlug: channel.slug,
    },
    internal_links: makeLinks([
      ...relatedChannels.map((item: any) => ({ label: item.name, href: `/channels/${item.slug}`, description: item.description })),
      ...relatedIndustries.map((item: any) => ({ label: item.name, href: `/industries/${item.slug}`, description: item.description })),
      { label: template.pricing_label, href: '/pricing', description: template.pricing_description },
    ]),
    sticky_cta_title: channel.sticky_cta_title || fill(template.sticky_cta_title, { name: channel.name }),
    sticky_cta_text: channel.sticky_cta_text || fill(template.sticky_cta_text, { name: channel.name }),
    sticky_cta_primary_label: channel.cta || template.sticky_cta_primary_label,
    sticky_cta_primary_url: '/demo',
  };
}

export function adaptIndustryPage(industry: any, context: any) {
  const template = getPageTemplate(context.settings, 'details', 'industries');
  const relatedIndustries = context.industries.filter((item: any) => item.slug !== industry.slug).slice(0, 3);
  const topChannels = context.channels.slice(0, 3);

  return {
    meta_title: industry.seo_title || fill(template.meta_title, { name: industry.name }),
    meta_description: industry.seo_description || industry.description,
    h1: industry.h1 || fill(template.h1, { name: industry.name }),
    subtitle: industry.subtitle || industry.description,
    hero_cta_primary_label: industry.cta,
    hero_cta_primary_url: '/demo',
    hero_cta_secondary_label: template.hero_cta_secondary_label,
    hero_cta_secondary_url: template.hero_cta_secondary_url,
    problem_title: industry.problem_title || fill(template.problem_title, { name: industry.name }),
    problem_intro: industry.problem_intro || industry.pain,
    problems: (Array.isArray(industry.problems) && industry.problems.length > 0) ? industry.problems : [{ title: template.problem_point_title, text: industry.pain }],
    solution_title: industry.solution_title || fill(template.solution_title, { name: industry.name }),
    solution_intro: industry.solution_intro || industry.solution,
    solution_steps: makeSteps(industry.solution_steps || []),
    features_title: industry.features_title || fill(template.features_title, { name: industry.name }),
    features: makeFeatureItems(industry.features),
    integrations_title: industry.integrations_title || fill(template.integrations_title, { name: industry.name }),
    integration_blocks: makeIntegrationBlocks(topChannels),
    roi_title: industry.roi_title || fill(template.roi_title, { name: industry.name }),
    roi_without_items: industry.roi_without_items || [],
    roi_with_items: industry.roi_with_items || [],
    roi_quote: industry.roi_quote || '',
    faq_title: industry.faq_title || fill(template.faq_title, { name: industry.name }),
    faqs: makeFaq(industry.faq),
    use_cases_title: industry.use_cases_title || `Где Chat Plus помогает в отрасли «${industry.name}»`,
    use_cases: makeUseCaseItems(context.solutions),
    breadcrumbs: makeBreadcrumbs([
      { label: 'Главная', href: '/' },
      { label: 'Отрасли', href: '/industries' },
      { label: industry.name },
    ]),
    navigation_groups_title: `Готовые решения для ${industry.name}`,
    navigation_groups_intro: `Ниже собраны готовые сценарии по ключевым задачам внутри ниши ${industry.name}.`,
    navigation_groups: makeNavigationGroups([
      {
        title: getNavigationGroupTitle('solutions_for_industry', industry.name),
        items: context.solutions.map((item: any) => ({
          label: item.name,
          href: `/industries/${industry.slug}/${item.slug}`,
          description: item.description,
        })),
      },
    ]),
    internal_links_title: template.internal_links_title,
    internal_links_variant: 'related',
    internal_links_context: {
      entityType: 'industry',
      entityName: industry.name,
      pageSlug: industry.slug,
    },
    internal_links: makeLinks([
      ...relatedIndustries.map((item: any) => ({ label: item.name, href: `/industries/${item.slug}`, description: item.description })),
      ...topChannels.map((item: any) => ({ label: item.name, href: `/channels/${item.slug}`, description: item.description })),
    ]),
    sticky_cta_title: industry.sticky_cta_title || fill(template.sticky_cta_title, { name: industry.name }),
    sticky_cta_text: industry.sticky_cta_text || fill(template.sticky_cta_text, { name: industry.name }),
    sticky_cta_primary_label: industry.cta || template.sticky_cta_primary_label,
    sticky_cta_primary_url: '/demo',
  };
}

export function adaptIntegrationPage(integration: any, context: any) {
  const template = getPageTemplate(context.settings, 'details', 'integrations');
  const relatedIntegrations = context.integrations.filter((item: any) => item.slug !== integration.slug).slice(0, 4);

  return {
    meta_title: integration.seo_title || fill(template.meta_title, { name: integration.name, category: integration.category || '' }),
    meta_description: integration.seo_description || integration.description,
    h1: integration.h1 || fill(template.h1, { name: integration.name }),
    subtitle: integration.subtitle || integration.description,
    hero_cta_primary_label: integration.cta,
    hero_cta_primary_url: '/demo',
    hero_cta_secondary_label: template.hero_cta_secondary_label,
    hero_cta_secondary_url: template.hero_cta_secondary_url,
    problem_title: integration.problem_title || fill(template.problem_title, { name: integration.name }),
    problem_intro: integration.problem_intro || fill(template.problem_intro, { name: integration.name, category: integration.category || '' }),
    problems: (Array.isArray(integration.problems) && integration.problems.length > 0) ? integration.problems : [],
    solution_title: integration.solution_title || fill(template.solution_title, { name: integration.name }),
    solution_intro: integration.solution_intro || fill(template.solution_intro, { name: integration.name }),
    solution_steps: makeSteps(integration.solution_steps || []),
    features_title: integration.features_title || fill(template.features_title, { name: integration.name }),
    features: makeFeatureItems(integration.features),
    roi_title: integration.roi_title || '',
    roi_without_items: integration.roi_without_items || [],
    roi_with_items: integration.roi_with_items || [],
    roi_quote: integration.roi_quote || '',
    faq_title: integration.faq_title || fill(template.faq_title, { name: integration.name }),
    faqs: makeFaq(integration.faq),
    use_cases_title: fill(template.use_cases_title, { name: integration.name }),
    use_cases: makeUseCaseItems(context.channels),
    breadcrumbs: makeBreadcrumbs([
      { label: 'Главная', href: '/' },
      { label: 'Интеграции', href: '/integrations' },
      { label: integration.name },
    ]),
    navigation_groups_title: `Готовые сценарии с ${integration.name}`,
    navigation_groups_intro: `Посмотрите, какие процессы можно собрать вокруг ${integration.name} без отдельной разработки.`,
    navigation_groups: makeNavigationGroups([
      {
        title: getNavigationGroupTitle('solutions_for_integration', integration.name),
        items: context.solutions.map((item: any) => ({
          label: item.name,
          href: `/integrations/${integration.slug}/${item.slug}`,
          description: item.description,
        })),
      },
    ]),
    internal_links_title: template.internal_links_title,
    internal_links_variant: 'related',
    internal_links_context: {
      entityType: 'integration',
      entityName: integration.name,
      pageSlug: integration.slug,
    },
    internal_links: makeLinks([
      ...relatedIntegrations.map((item: any) => ({ label: item.name, href: `/integrations/${item.slug}`, description: item.description })),
      ...context.solutions.slice(0, 3).map((item: any) => ({ label: item.name, href: `/solutions/${item.slug}`, description: item.description })),
    ]),
    sticky_cta_title: integration.sticky_cta_title || fill(template.sticky_cta_title, { name: integration.name }),
    sticky_cta_text: integration.sticky_cta_text || fill(template.sticky_cta_text, { name: integration.name }),
    sticky_cta_primary_label: integration.cta || template.sticky_cta_primary_label,
    sticky_cta_primary_url: '/demo',
  };
}

export function adaptFeaturePage(feature: any, context: any) {
  const template = getPageTemplate(context.settings, 'details', 'features');

  return {
    meta_title: feature.seo_title || fill(template.meta_title, { name: feature.name }),
    meta_description: feature.seo_description || feature.description,
    h1: feature.h1 || fill(template.h1, { name: feature.name }),
    subtitle: feature.subtitle || feature.description,
    hero_cta_primary_label: feature.cta,
    hero_cta_primary_url: '/demo',
    problem_title: feature.problem_title || fill(template.problem_title, { name: feature.name }),
    problem_intro: feature.problem_intro || '',
    problems: (Array.isArray(feature.problems) && feature.problems.length > 0) ? feature.problems : [],
    solution_title: feature.solution_title || fill(template.solution_title, { name: feature.name }),
    solution_intro: feature.solution_intro || '',
    solution_steps: makeSteps(feature.solution_steps || []),
    features_title: feature.features_title || fill(template.features_title, { name: feature.name }),
    features: makeFeatureItems(feature.features),
    roi_title: feature.roi_title || '',
    roi_without_items: feature.roi_without_items || [],
    roi_with_items: feature.roi_with_items || [],
    roi_quote: feature.roi_quote || '',
    faq_title: feature.faq_title || fill(template.faq_title, { name: feature.name }),
    faqs: makeFaq(feature.faq),
    integrations_title: feature.integrations_title || `С какими сервисами работает функция «${feature.name}»`,
    integration_blocks: makeIntegrationBlocks(context.integrations),
    use_cases_title: feature.use_cases_title || `Где функция «${feature.name}» даёт результат`,
    use_cases: makeUseCaseItems(context.industries),
    breadcrumbs: makeBreadcrumbs([
      { label: 'Главная', href: '/' },
      { label: 'Возможности', href: '/features' },
      { label: feature.name },
    ]),
    internal_links_title: template.internal_links_title,
    internal_links_variant: 'solutions',
    internal_links_context: {
      entityType: 'feature',
      entityName: feature.name,
      pageSlug: feature.slug,
    },
    internal_links: makeLinks([
      ...context.features.filter((item: any) => item.slug !== feature.slug).slice(0, 4).map((item: any) => ({ label: item.name, href: `/features/${item.slug}`, description: item.description })),
      { label: template.docs_label, href: '/docs', description: template.docs_description },
    ]),
    sticky_cta_title: feature.sticky_cta_title || fill(template.sticky_cta_title, { name: feature.name }),
    sticky_cta_text: feature.sticky_cta_text || fill(template.sticky_cta_text, { name: feature.name }),
    sticky_cta_primary_label: feature.cta || template.sticky_cta_primary_label,
    sticky_cta_primary_url: '/demo',
  };
}

export function adaptSolutionPage(solution: any, context: any) {
  const template = getPageTemplate(context.settings, 'details', 'solutions');

  return {
    meta_title: solution.seo_title || fill(template.meta_title, { name: solution.name }),
    meta_description: solution.seo_description || solution.description,
    h1: solution.h1 || fill(template.h1, { name: solution.name }),
    subtitle: solution.subtitle || solution.description,
    hero_cta_primary_label: solution.cta,
    hero_cta_primary_url: '/demo',
    problem_title: solution.problem_title || fill(template.problem_title, { name: solution.name }),
    problem_intro: solution.problem_intro || fill(template.problem_intro, { name: solution.name }),
    problems: (Array.isArray(solution.problems) && solution.problems.length > 0) ? solution.problems : [],
    solution_title: solution.solution_title || fill(template.solution_title, { name: solution.name }),
    solution_intro: solution.solution_intro || fill(template.solution_intro, { name: solution.name }),
    solution_steps: makeSteps(solution.solution_steps || []),
    features_title: solution.features_title || fill(template.features_title, { name: solution.name }),
    features: makeFeatureItems(solution.features),
    integrations_title: fill(template.integrations_title, { name: solution.name }),
    integration_blocks: makeIntegrationBlocks(context.integrations),
    roi_title: solution.roi_title || '',
    roi_without_items: solution.roi_without_items || [],
    roi_with_items: solution.roi_with_items || [],
    roi_quote: solution.roi_quote || '',
    faq_title: solution.faq_title || fill(template.faq_title, { name: solution.name }),
    faqs: makeFaq(solution.faq),
    use_cases_title: fill(template.use_cases_title, { name: solution.name }),
    use_cases: makeUseCaseItems(context.industries),
    breadcrumbs: makeBreadcrumbs([
      { label: 'Главная', href: '/' },
      { label: 'Решения', href: '/solutions' },
      { label: solution.name },
    ]),
    internal_links_title: template.internal_links_title,
    internal_links_variant: 'solutions',
    internal_links_context: {
      entityType: 'solution',
      entityName: solution.name,
      pageSlug: solution.slug,
    },
    internal_links: makeLinks([
      ...context.solutions.filter((item: any) => item.slug !== solution.slug).slice(0, 4).map((item: any) => ({ label: item.name, href: `/solutions/${item.slug}`, description: item.description })),
      ...context.channels.slice(0, 3).map((item: any) => ({ label: item.name, href: `/channels/${item.slug}`, description: item.description })),
    ]),
    sticky_cta_title: solution.sticky_cta_title || fill(template.sticky_cta_title, { name: solution.name }),
    sticky_cta_text: solution.sticky_cta_text || fill(template.sticky_cta_text, { name: solution.name }),
    sticky_cta_primary_label: solution.cta || template.sticky_cta_primary_label,
    sticky_cta_primary_url: '/demo',
  };
}

export function adaptBusinessTypePage(bt: any, context: any) {
  const relatedTypes = context.businessTypes.filter((item: any) => item.slug !== bt.slug).slice(0, 4);

  return {
    meta_title: bt.seo_title || bt.hero_title || `Chat Plus для ${bt.name}`,
    meta_description: bt.seo_description || bt.description,
    h1: bt.hero_title || `Chat Plus для ${bt.name}`,
    subtitle: bt.description,
    hero_cta_primary_label: bt.cta,
    hero_cta_primary_url: '/demo',
    hero_cta_secondary_label: bt.hero_secondary_cta_label,
    hero_cta_secondary_url: bt.hero_secondary_cta_url || '#solution',
    problem_title: bt.problem_title,
    problems: (bt.problem_points || []).map((point: string, index: number) => ({ title: `Проблема ${index + 1}`, text: point })),
    solution_title: bt.solution_title,
    solution_intro: (bt.solution_points || []).join(' '),
    solution_steps: makeSteps(bt.steps),
    features_title: bt.features_title,
    features: makeFeatureItems(bt.features),
    integrations_title: bt.integrations_title,
    integration_blocks: (bt.integrations || []).map((item: any) => ({ label: item.name, text: item.href || '' })),
    roi_title: bt.roi_title,
    roi_intro: bt.roi_intro,
    roi_with_items: makeRoiItems(bt.roi_metrics),
    roi_quote: bt.roi_quote,
    faq_title: bt.faq_title,
    faqs: makeFaq(bt.faq),
    breadcrumbs: makeBreadcrumbs([
      { label: 'Главная', href: '/' },
      { label: 'Для бизнеса', href: '/for' },
      { label: bt.name },
    ]),
    navigation_groups_title: `Отраслевые сценарии для ${bt.name}`,
    navigation_groups_intro: `Выберите нишу и откройте отраслевой сценарий для формата ${bt.name}.`,
    navigation_groups: makeNavigationGroups([
      {
        title: getNavigationGroupTitle('industries_for_business_type', bt.name),
        items: context.industries.map((item: any) => ({
          label: item.name,
          href: `/for/${bt.slug}/${item.slug}`,
          description: item.description,
        })),
      },
    ]),
    internal_links_title: bt.related_types_title,
    internal_links_variant: 'related',
    internal_links_context: {
      entityType: 'business_type',
      entityName: bt.name,
      pageSlug: bt.slug,
    },
    internal_links: makeLinks([
      ...relatedTypes.map((item: any) => ({ label: item.name, href: `/for/${item.slug}`, description: item.description })),
      ...context.industries.slice(0, 3).map((item: any) => ({ label: item.name, href: `/industries/${item.slug}`, description: item.description })),
      ...context.channels.slice(0, 3).map((item: any) => ({ label: item.name, href: `/channels/${item.slug}`, description: item.description })),
      { label: bt.pricing_link_label, href: '/pricing', description: '' },
    ]),
    sticky_cta_title: bt.final_cta_title,
    sticky_cta_text: bt.final_cta_text,
    sticky_cta_primary_label: bt.final_cta_label,
    sticky_cta_primary_url: '/demo',
  };
}

export function adaptCompetitorPage(competitor: any, context: any, mode: 'compare' | 'vs') {
  const template = getPageTemplate(context.settings, 'details', mode);
  const competitorName = competitor.name || 'конкурента';
  const strengths = Array.isArray(competitor.our_strengths) ? competitor.our_strengths : [];
  const weaknesses = Array.isArray(competitor.weaknesses) ? competitor.weaknesses : [];

  return {
    meta_title: competitor.seo_title || fill(template.meta_title, { name: competitor.name }),
    meta_description: competitor.seo_description || competitor.hero_description,
    h1: fill(template.h1, { name: competitor.name }),
    hero_eyebrow: competitor.eyebrow || template.hero_eyebrow,
    subtitle: competitor.hero_description,
    hero_cta_primary_label: competitor.final_cta_label,
    hero_cta_primary_url: '/demo',
    problem_title: competitor.weaknesses_title || template.problem_title,
    problem_intro: `Слабые места ${competitorName} обычно проявляются, когда команде нужен быстрый запуск, прозрачная экономика и единый омниканальный процесс.`,
    problems: weaknesses.map((item: string) => ({
      title: item,
      text: describeCompetitorWeakness(item, competitorName),
    })),
    solution_title: competitor.strengths_title || template.solution_title,
    solution_intro: `Ниже — сильные стороны Chat Plus в тех сценариях, где важно быстро внедрить систему и не раздувать стоимость владения.`,
    solution_steps: strengths.map((item: string, index: number) => ({
      title: item || `Преимущество ${index + 1}`,
      text: describeChatPlusStrength(item || ''),
    })),
    features_title: undefined,
    features: [],
    comparison_title: competitor.pricing_title || template.comparison_title,
    comparison_rows: [
      {
        parameter: template.price_parameter_label,
        option_one: competitor.price,
        option_two: competitor.competitor_price_caption,
        chat_plus: competitor.our_price,
      },
      {
        parameter: template.model_parameter_label,
        option_one: template.model_option_one,
        option_two: template.model_option_two,
        chat_plus: template.model_chat_plus,
      },
    ],
    breadcrumbs: makeBreadcrumbs([
      { label: 'Главная', href: '/' },
      { label: 'Сравнения', href: '/compare' },
      { label: competitor.name },
    ]),
    internal_links_title: template.internal_links_title,
    internal_links_variant: 'comparisons',
    internal_links_context: {
      entityType: 'generic',
      entityName: competitor.name,
      pageSlug: competitor.slug,
    },
    internal_links: makeLinks(
      context.competitors
        .filter((item: any) => item.slug !== competitor.slug)
        .slice(0, 4)
        .map((item: any) => ({ label: item.name, href: `/${mode}/${item.slug}`, description: item.hero_description }))
    ),
    sticky_cta_title: competitor.final_cta_title,
    sticky_cta_text: competitor.final_cta_text,
    sticky_cta_primary_label: competitor.final_cta_label,
    sticky_cta_primary_url: '/demo',
  };
}

export function adaptChannelIndustryPage(channel: any, industry: any, context: any) {
  const template = getPageTemplate(context.settings, 'details', 'channel_industry');

  return {
    meta_title: fill(template.meta_title, { channel: channel.name, industry: industry.name }),
    meta_description: fill(template.meta_description, { channel: channel.name, industry: industry.name }),
    h1: fill(template.h1, { channel: channel.name, industry: industry.name }),
    subtitle: fill(template.subtitle, { channel: channel.name, industry: industry.name }),
    hero_cta_primary_label: template.hero_cta_primary_label,
    hero_cta_primary_url: '/demo',
    problem_title: fill(template.problem_title, { channel: channel.name, industry: industry.name }),
    problem_intro: industry.problem_intro || industry.pain,
    solution_title: fill(template.solution_title, { channel: channel.name, industry: industry.name }),
    solution_intro: industry.solution_intro || industry.solution,
    solution_steps: makeSteps((Array.isArray(channel.solution_steps) && channel.solution_steps.length > 0) ? channel.solution_steps : channel.steps),
    features_title: template.features_title,
    features: makeFeatureItems([...(industry.features || []), ...(channel.features || [])].slice(0, 6)),
    integrations_title: template.integrations_title,
    integration_blocks: makeIntegrationBlocks(context.integrations),
    breadcrumbs: makeBreadcrumbs([
      { label: 'Главная', href: '/' },
      { label: 'Каналы', href: '/channels' },
      { label: channel.name, href: `/channels/${channel.slug}` },
      { label: industry.name },
    ]),
    internal_links_title: template.internal_links_title,
    internal_links_variant: 'next_steps',
    internal_links_context: {
      entityType: 'generic',
      entityName: `${channel.name} × ${industry.name}`,
      pageSlug: `${channel.slug}/${industry.slug}`,
    },
    internal_links: makeLinks([
      { label: channel.name, href: `/channels/${channel.slug}`, description: channel.description },
      { label: industry.name, href: `/industries/${industry.slug}`, description: industry.description },
      ...context.solutions.slice(0, 3).map((item: any) => ({ label: item.name, href: `/solutions/${item.slug}`, description: item.description })),
    ]),
    sticky_cta_title: fill(template.sticky_cta_title, { channel: channel.name, industry: industry.name }),
    sticky_cta_text: fill(template.sticky_cta_text, { channel: channel.name, industry: industry.name }),
    sticky_cta_primary_label: template.sticky_cta_primary_label,
    sticky_cta_primary_url: '/demo',
  };
}

export function adaptDirectoryPage(key: string, settings: any, items: any[]) {
  const template = getPageTemplate(settings, 'directories', key);

  return {
    metaTitle: template.meta_title,
    metaDescription: template.meta_description,
    title: template.h1,
    subtitle: template.subtitle,
    primaryLabel: template.hero_cta_primary_label,
    primaryUrl: template.hero_cta_primary_url,
    items: items.map((item) => ({
      href: `${template.base_path}/${item.slug}`,
      title: item.name,
      description: compactDescription(item.description),
      icon: item.icon,
      badges: [],
      ctaLabel: item.cta || template.card_cta_label || inferDirectoryCtaLabel(key, item),
    })),
    stickyTitle: template.sticky_cta_title,
    stickyText: template.sticky_cta_text,
    stickyPrimaryLabel: template.sticky_cta_primary_label,
    stickyPrimaryUrl: template.sticky_cta_primary_url,
  };
}


export function adaptChannelIntegrationPage(channel: any, integration: any, context: any) {
  const template = getPageTemplate(context.settings, 'details', 'channel_industry');
  return {
    meta_title: `Интеграция ${channel.name} и ${integration.name} | Chat Plus`,
    meta_description: `Настройте связку ${channel.name} и ${integration.name} за 5 минут. Автоматизация продаж и поддержка клиентов без программирования.`,
    h1: `Связка ${channel.name} и ${integration.name}`,
    subtitle: `Объедините всю силу мессенджера ${channel.name} и решения ${integration.name}.`,
    hero_cta_primary_label: template.hero_cta_primary_label,
    hero_cta_primary_url: '/demo',
    problem_title: `Почему бизнесу не хватает просто ${channel.name}`,
    problem_intro: `Добавление ${integration.name} решает главную проблему масштабирования.`,
    solution_title: `Мощь ${channel.name} внутри ${integration.name}`,
    solution_intro: `Вся переписка, автоматизация и аналитика теперь в едином рабочем окне.`,
    solution_steps: makeSteps((Array.isArray(channel.solution_steps) && channel.solution_steps.length > 0) ? channel.solution_steps : channel.steps),
    features_title: `Ключевые возможности`,
    features: makeFeatureItems([...(channel.features || []), ...(integration.features || [])].slice(0, 6)),
    integrations_title: template.integrations_title,
    integration_blocks: makeIntegrationBlocks(context.integrations),
    breadcrumbs: makeBreadcrumbs([
      { label: 'Главная', href: '/' },
      { label: 'Каналы', href: '/channels' },
      { label: channel.name, href: `/channels/${channel.slug}` },
      { label: integration.name },
    ]),
    internal_links_title: template.internal_links_title,
    internal_links_variant: 'next_steps',
    internal_links_context: {
      entityType: 'generic',
      entityName: `${channel.name} × ${integration.name}`,
      pageSlug: `${channel.slug}/${integration.slug}`,
    },
    internal_links: makeLinks([
      { label: channel.name, href: `/channels/${channel.slug}`, description: channel.description },
      { label: integration.name, href: `/integrations/${integration.slug}`, description: integration.description },
      ...context.solutions.slice(0, 3).map((item: any) => ({ label: item.name, href: `/solutions/${item.slug}`, description: item.description })),
    ]),
    sticky_cta_title: `Запустите интеграцию ${channel.name} + ${integration.name}`,
    sticky_cta_text: `Оставьте заявку, и мы покажем, как это работает на практике.`,
    sticky_cta_primary_label: template.sticky_cta_primary_label,
    sticky_cta_primary_url: '/demo',
  };
}

export function adaptIndustrySolutionPage(industry: any, solution: any, context: any) {
  const template = getPageTemplate(context.settings, 'details', 'channel_industry');
  return {
    meta_title: `${solution.name} для отрасли: ${industry.name} | Chat Plus`,
    meta_description: `Готовые сценарии ${solution.name} специально для ниши ${industry.name}.`,
    h1: `${solution.name} для ниши: ${industry.name}`,
    subtitle: `Решение, которое меняет правила игры для сектора ${industry.name}.`,
    hero_cta_primary_label: template.hero_cta_primary_label,
    hero_cta_primary_url: '/demo',
    problem_title: `Частые ошибки в сфере ${industry.name}`,
    problem_intro: industry.problem_intro || industry.pain || '',
    solution_title: `Как ${solution.name} закрывает эти боли`,
    solution_intro: industry.solution_intro || industry.solution || '',
    solution_steps: makeSteps(solution.steps || []),
    features_title: `Специализированные функции`,
    features: makeFeatureItems([...(solution.features || []), ...(industry.features || [])].slice(0, 6)),
    integrations_title: template.integrations_title,
    integration_blocks: makeIntegrationBlocks(context.integrations),
    breadcrumbs: makeBreadcrumbs([
      { label: 'Главная', href: '/' },
      { label: 'Отрасли', href: '/industries' },
      { label: industry.name, href: `/industries/${industry.slug}` },
      { label: solution.name },
    ]),
    internal_links_title: template.internal_links_title,
    internal_links_variant: 'next_steps',
    internal_links_context: {
      entityType: 'generic',
      entityName: `${industry.name} × ${solution.name}`,
      pageSlug: `${industry.slug}/${solution.slug}`,
    },
    internal_links: makeLinks([
      { label: industry.name, href: `/industries/${industry.slug}`, description: industry.description },
      { label: solution.name, href: `/solutions/${solution.slug}`, description: solution.description },
      ...context.channels.slice(0, 3).map((item: any) => ({ label: item.name, href: `/channels/${item.slug}`, description: item.description })),
    ]),
    sticky_cta_title: `Внедрить ${solution.name} для ${industry.name}`,
    sticky_cta_text: `Оставьте заявку, и мы обсудим ваш проект.`,
    sticky_cta_primary_label: template.sticky_cta_primary_label,
    sticky_cta_primary_url: '/demo',
  };
}

export function adaptIntegrationSolutionPage(integration: any, solution: any, context: any) {
  const template = getPageTemplate(context.settings, 'details', 'channel_industry');
  return {
    meta_title: `${solution.name} через связку с ${integration.name} | Chat Plus`,
    meta_description: `Используйте ${integration.name} для максимальной эффективности процесса ${solution.name}.`,
    h1: `${solution.name} в синергии с ${integration.name}`,
    subtitle: `Лучшие практики автоматизации бизнес-процессов.`,
    hero_cta_primary_label: template.hero_cta_primary_label,
    hero_cta_primary_url: '/demo',
    problem_title: `Слабые места стандартного ${solution.name}`,
    problem_intro: `Без прозрачной интеграции с ${integration.name} процесс ломается.`,
    solution_title: `Как Chat Plus объединяет эти решения`,
    solution_intro: `Плавная передача данных и аналитики.`,
    solution_steps: makeSteps(solution.steps || []),
    features_title: `Специализированные функции`,
    features: makeFeatureItems([...(solution.features || []), ...(integration.features || [])].slice(0, 6)),
    integrations_title: template.integrations_title,
    integration_blocks: makeIntegrationBlocks(context.integrations),
    breadcrumbs: makeBreadcrumbs([
      { label: 'Главная', href: '/' },
      { label: 'Интеграции', href: '/integrations' },
      { label: integration.name, href: `/integrations/${integration.slug}` },
      { label: solution.name },
    ]),
    internal_links_title: template.internal_links_title,
    internal_links_variant: 'next_steps',
    internal_links_context: {
      entityType: 'generic',
      entityName: `${integration.name} × ${solution.name}`,
      pageSlug: `${integration.slug}/${solution.slug}`,
    },
    internal_links: makeLinks([
      { label: integration.name, href: `/integrations/${integration.slug}`, description: integration.description },
      { label: solution.name, href: `/solutions/${solution.slug}`, description: solution.description },
      ...context.channels.slice(0, 3).map((item: any) => ({ label: item.name, href: `/channels/${item.slug}`, description: item.description })),
    ]),
    sticky_cta_title: `Запустить инструмент`,
    sticky_cta_text: `Оставьте заявку, и мы обсудим ваш проект.`,
    sticky_cta_primary_label: template.sticky_cta_primary_label,
    sticky_cta_primary_url: '/demo',
  };
}

export function adaptBusinessTypeIndustryPage(businessType: any, industry: any, context: any) {
  const template = getPageTemplate(context.settings, 'details', 'channel_industry');
  return {
    meta_title: `Платформа ${businessType.name} для ниши ${industry.name} | Chat Plus`,
    meta_description: `Специализированное решение для формата ${businessType.name} в индустрии ${industry.name}.`,
    h1: `Решение ${businessType.name} для: ${industry.name}`,
    subtitle: `Оптимизируем ваши процессы с учетом специфики ниши.`,
    hero_cta_primary_label: template.hero_cta_primary_label,
    hero_cta_primary_url: '/demo',
    problem_title: `Ограничения формата ${businessType.name}`,
    problem_intro: industry.problem_intro || industry.pain || '',
    solution_title: `Преимущества Chat Plus`,
    solution_intro: industry.solution_intro || industry.solution || '',
    solution_steps: makeSteps(industry.steps || []),
    features_title: `Специализированные функции`,
    features: makeFeatureItems([...(businessType.features || []), ...(industry.features || [])].slice(0, 6)),
    integrations_title: template.integrations_title,
    integration_blocks: makeIntegrationBlocks(context.integrations),
    breadcrumbs: makeBreadcrumbs([
      { label: 'Главная', href: '/' },
      { label: 'Для бизнеса', href: '/for' },
      { label: businessType.name, href: `/for/${businessType.slug}` },
      { label: industry.name },
    ]),
    internal_links_title: template.internal_links_title,
    internal_links_variant: 'next_steps',
    internal_links_context: {
      entityType: 'generic',
      entityName: `${businessType.name} × ${industry.name}`,
      pageSlug: `${businessType.slug}/${industry.slug}`,
    },
    internal_links: makeLinks([
      { label: industry.name, href: `/industries/${industry.slug}`, description: industry.description },
      { label: businessType.name, href: `/for/${businessType.slug}`, description: businessType.description },
      ...context.channels.slice(0, 3).map((item: any) => ({ label: item.name, href: `/channels/${item.slug}`, description: item.description })),
    ]),
    sticky_cta_title: `Начать работу`,
    sticky_cta_text: `Оставьте заявку, и мы обсудим ваш проект.`,
    sticky_cta_primary_label: template.sticky_cta_primary_label,
    sticky_cta_primary_url: '/demo',
  };
}
