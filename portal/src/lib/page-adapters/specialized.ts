import {
  compactDescription,
  fill,
  getPageTemplate,
  makeBreadcrumbs,
  makeLinks,
} from './shared.ts';

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

function withCompetitorCmsFields(page: any, competitor: any, template: any) {
  return {
    ...page,
    hero_eyebrow: competitor.hero_eyebrow || competitor.eyebrow || page.hero_eyebrow || template.hero_eyebrow,
    problem_intro: competitor.compare_summary || page.problem_intro,
    solution_title: competitor.advantages_title || competitor.strengths_title || page.solution_title || template.solution_title,
    solution_intro: competitor.advantages_intro || page.solution_intro,
    faq_title: competitor.faq_title || page.faq_title || template.faq_title,
    compare_summary: competitor.compare_summary || '',
    compare_points: Array.isArray(competitor.compare_points) ? competitor.compare_points : [],
    section_labels: competitor.section_labels || {},
    sticky_cta_title: competitor.sticky_cta_title || competitor.final_cta_title || page.sticky_cta_title,
    sticky_cta_text: competitor.sticky_cta_text || competitor.final_cta_text || page.sticky_cta_text,
  };
}

export function adaptCompetitorPage(competitor: any, context: any, mode: 'compare' | 'vs') {
  const template = getPageTemplate(context.settings, 'details', mode);
  const strengths = Array.isArray(competitor.our_strengths) ? competitor.our_strengths : [];
  const weaknesses = Array.isArray(competitor.weaknesses) ? competitor.weaknesses : [];

  return withCompetitorCmsFields({
    meta_title: competitor.seo_title || fill(template.meta_title, { name: competitor.name }),
    meta_description: competitor.seo_description || competitor.hero_description,
    h1: fill(template.h1, { name: competitor.name }),
    hero_eyebrow: competitor.hero_eyebrow || competitor.eyebrow || template.hero_eyebrow,
    subtitle: competitor.hero_description,
    hero_cta_primary_label: competitor.final_cta_label,
    hero_cta_primary_url: '/demo',
    problem_title: competitor.weaknesses_title || template.problem_title,
    problem_intro: competitor.compare_summary || '',
    problems: weaknesses.map((item: string) => ({
      title: item,
      text: '',
    })),
    solution_title: competitor.strengths_title || template.solution_title,
    solution_intro: competitor.advantages_intro || '',
    solution_steps: strengths.map((item: string, index: number) => ({
      title: item || `Преимущество ${index + 1}`,
      text: '',
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
  }, competitor, template);
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
