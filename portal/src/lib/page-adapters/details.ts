import { getNavigationGroupTitle } from '../link-sections.ts';
import {
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
  prioritizeBySlugs,
} from './shared.ts';

const PRIORITY_USE_CASE_INDUSTRIES = ['retail', 'travel', 'med', 'education', 'horeca', 'real-estate'];
const PRIORITY_RELATED_CHANNELS = ['viber', 'sms', 'whatsapp', 'voip'];
const PRIORITY_RELATED_FEATURES = ['white-label', 'reactive', 'api'];
const PRIORITY_RELATED_SOLUTIONS = ['crm', 'onboarding', 'nps', 'support'];
const PRIORITY_SOLUTION_CHANNELS = ['viber', 'sms', 'whatsapp'];

export function adaptChannelPage(channel: any, context: any) {
  const template = getPageTemplate(context.settings, 'details', 'channels');
  const relatedChannels = prioritizeBySlugs(
    context.channels.filter((item: any) => item.slug !== channel.slug),
    PRIORITY_RELATED_CHANNELS,
  ).slice(0, 3);
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
  const relatedIndustries = prioritizeBySlugs(
    context.industries.filter((item: any) => item.slug !== industry.slug),
    PRIORITY_USE_CASE_INDUSTRIES,
  ).slice(0, 3);
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
    use_cases: makeUseCaseItems(prioritizeBySlugs(context.industries, PRIORITY_USE_CASE_INDUSTRIES)),
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
      ...prioritizeBySlugs(
        context.features.filter((item: any) => item.slug !== feature.slug),
        PRIORITY_RELATED_FEATURES,
      ).slice(0, 4).map((item: any) => ({ label: item.name, href: `/features/${item.slug}`, description: item.description })),
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
    use_cases: makeUseCaseItems(prioritizeBySlugs(context.industries, PRIORITY_USE_CASE_INDUSTRIES)),
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
      ...prioritizeBySlugs(
        context.solutions.filter((item: any) => item.slug !== solution.slug),
        PRIORITY_RELATED_SOLUTIONS,
      ).slice(0, 4).map((item: any) => ({ label: item.name, href: `/solutions/${item.slug}`, description: item.description })),
      ...prioritizeBySlugs(context.channels, PRIORITY_SOLUTION_CHANNELS).slice(0, 3).map((item: any) => ({ label: item.name, href: `/channels/${item.slug}`, description: item.description })),
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
      ...prioritizeBySlugs(context.industries, PRIORITY_USE_CASE_INDUSTRIES).slice(0, 3).map((item: any) => ({ label: item.name, href: `/industries/${item.slug}`, description: item.description })),
      ...context.channels.slice(0, 3).map((item: any) => ({ label: item.name, href: `/channels/${item.slug}`, description: item.description })),
      { label: bt.pricing_link_label, href: '/pricing', description: '' },
    ]),
    sticky_cta_title: bt.final_cta_title,
    sticky_cta_text: bt.final_cta_text,
    sticky_cta_primary_label: bt.final_cta_label,
    sticky_cta_primary_url: '/demo',
  };
}
