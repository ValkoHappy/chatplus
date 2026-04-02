import {
  fill,
  getPageTemplate,
  makeBreadcrumbs,
  makeFeatureItems,
  makeIntegrationBlocks,
  makeLinks,
  makeSteps,
  pickFirstMeaningfulString,
} from './shared.ts';

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
      entityName: `${channel.name} — ${industry.name}`,
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

export function adaptChannelIntegrationPage(channel: any, integration: any, context: any) {
  const template = getPageTemplate(context.settings, 'details', 'channel_industry');
  const pairName = `${channel.name} — ${integration.name}`;
  const pairSubtitle = pickFirstMeaningfulString(
    integration.subtitle,
    integration.description,
    channel.subtitle,
    channel.description,
  );

  return {
    meta_title: `${pairName} | Chat Plus`,
    meta_description: pickFirstMeaningfulString(integration.seo_description, integration.description, channel.seo_description, channel.description),
    h1: pairName,
    subtitle: pairSubtitle,
    hero_cta_primary_label: template.hero_cta_primary_label,
    hero_cta_primary_url: '/demo',
    problem_title: fill(template.problem_title, { channel: channel.name, industry: integration.name, integration: integration.name }) || pairName,
    problem_intro: pickFirstMeaningfulString(integration.problem_intro, integration.description, channel.problem_intro, channel.description),
    solution_title: fill(template.solution_title, { channel: channel.name, industry: integration.name, integration: integration.name }) || pairName,
    solution_intro: pickFirstMeaningfulString(integration.solution_intro, integration.description, channel.solution_intro, channel.description),
    solution_steps: makeSteps((Array.isArray(channel.solution_steps) && channel.solution_steps.length > 0) ? channel.solution_steps : channel.steps),
    features_title: template.features_title,
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
      entityName: `${channel.name} — ${integration.name}`,
      pageSlug: `${channel.slug}/${integration.slug}`,
    },
    internal_links: makeLinks([
      { label: channel.name, href: `/channels/${channel.slug}`, description: channel.description },
      { label: integration.name, href: `/integrations/${integration.slug}`, description: integration.description },
      ...context.solutions.slice(0, 3).map((item: any) => ({ label: item.name, href: `/solutions/${item.slug}`, description: item.description })),
    ]),
    sticky_cta_title: fill(template.sticky_cta_title, { channel: channel.name, industry: integration.name, integration: integration.name }) || pairName,
    sticky_cta_text: fill(template.sticky_cta_text, { channel: channel.name, industry: integration.name, integration: integration.name }) || pairSubtitle,
    sticky_cta_primary_label: template.sticky_cta_primary_label,
    sticky_cta_primary_url: '/demo',
  };
}

export function adaptIndustrySolutionPage(industry: any, solution: any, context: any) {
  const template = getPageTemplate(context.settings, 'details', 'channel_industry');
  const pairName = `${industry.name} — ${solution.name}`;
  const pairSubtitle = pickFirstMeaningfulString(
    solution.subtitle,
    solution.description,
    industry.subtitle,
    industry.description,
  );

  return {
    meta_title: `${pairName} | Chat Plus`,
    meta_description: pickFirstMeaningfulString(solution.seo_description, solution.description, industry.seo_description, industry.description),
    h1: pairName,
    subtitle: pairSubtitle,
    hero_cta_primary_label: template.hero_cta_primary_label,
    hero_cta_primary_url: '/demo',
    problem_title: fill(template.problem_title, { channel: solution.name, industry: industry.name, solution: solution.name }) || pairName,
    problem_intro: industry.problem_intro || industry.pain || '',
    solution_title: fill(template.solution_title, { channel: solution.name, industry: industry.name, solution: solution.name }) || pairName,
    solution_intro: solution.solution_intro || solution.description || industry.solution_intro || industry.solution || '',
    solution_steps: makeSteps(solution.steps || solution.solution_steps || []),
    features_title: template.features_title,
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
      entityName: `${industry.name} — ${solution.name}`,
      pageSlug: `${industry.slug}/${solution.slug}`,
    },
    internal_links: makeLinks([
      { label: industry.name, href: `/industries/${industry.slug}`, description: industry.description },
      { label: solution.name, href: `/solutions/${solution.slug}`, description: solution.description },
      ...context.channels.slice(0, 3).map((item: any) => ({ label: item.name, href: `/channels/${item.slug}`, description: item.description })),
    ]),
    sticky_cta_title: fill(template.sticky_cta_title, { channel: solution.name, industry: industry.name, solution: solution.name }) || pairName,
    sticky_cta_text: fill(template.sticky_cta_text, { channel: solution.name, industry: industry.name, solution: solution.name }) || pairSubtitle,
    sticky_cta_primary_label: template.sticky_cta_primary_label,
    sticky_cta_primary_url: '/demo',
  };
}

export function adaptIntegrationSolutionPage(integration: any, solution: any, context: any) {
  const template = getPageTemplate(context.settings, 'details', 'channel_industry');
  const pairName = `${integration.name} — ${solution.name}`;
  const pairSubtitle = pickFirstMeaningfulString(
    solution.subtitle,
    solution.description,
    integration.subtitle,
    integration.description,
  );

  return {
    meta_title: `${pairName} | Chat Plus`,
    meta_description: pickFirstMeaningfulString(solution.seo_description, solution.description, integration.seo_description, integration.description),
    h1: pairName,
    subtitle: pairSubtitle,
    hero_cta_primary_label: template.hero_cta_primary_label,
    hero_cta_primary_url: '/demo',
    problem_title: fill(template.problem_title, { channel: solution.name, industry: integration.name, integration: integration.name, solution: solution.name }) || pairName,
    problem_intro: pickFirstMeaningfulString(solution.problem_intro, solution.description, integration.problem_intro, integration.description),
    solution_title: fill(template.solution_title, { channel: solution.name, industry: integration.name, integration: integration.name, solution: solution.name }) || pairName,
    solution_intro: pickFirstMeaningfulString(solution.solution_intro, solution.description, integration.solution_intro, integration.description),
    solution_steps: makeSteps(solution.steps || []),
    features_title: template.features_title,
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
      entityName: `${integration.name} — ${solution.name}`,
      pageSlug: `${integration.slug}/${solution.slug}`,
    },
    internal_links: makeLinks([
      { label: integration.name, href: `/integrations/${integration.slug}`, description: integration.description },
      { label: solution.name, href: `/solutions/${solution.slug}`, description: solution.description },
      ...context.channels.slice(0, 3).map((item: any) => ({ label: item.name, href: `/channels/${item.slug}`, description: item.description })),
    ]),
    sticky_cta_title: fill(template.sticky_cta_title, { channel: solution.name, industry: integration.name, integration: integration.name, solution: solution.name }) || pairName,
    sticky_cta_text: fill(template.sticky_cta_text, { channel: solution.name, industry: integration.name, integration: integration.name, solution: solution.name }) || pairSubtitle,
    sticky_cta_primary_label: template.sticky_cta_primary_label,
    sticky_cta_primary_url: '/demo',
  };
}

export function adaptBusinessTypeIndustryPage(businessType: any, industry: any, context: any) {
  const template = getPageTemplate(context.settings, 'details', 'channel_industry');
  const pairName = `${businessType.name} — ${industry.name}`;
  const pairSubtitle = pickFirstMeaningfulString(
    businessType.subtitle,
    businessType.description,
    industry.subtitle,
    industry.description,
  );

  return {
    meta_title: `${pairName} | Chat Plus`,
    meta_description: pickFirstMeaningfulString(businessType.description, industry.description),
    h1: pairName,
    subtitle: pairSubtitle,
    hero_cta_primary_label: template.hero_cta_primary_label,
    hero_cta_primary_url: '/demo',
    problem_title: fill(template.problem_title, { channel: businessType.name, industry: industry.name, businessType: businessType.name }) || pairName,
    problem_intro: industry.problem_intro || industry.pain || '',
    solution_title: fill(template.solution_title, { channel: businessType.name, industry: industry.name, businessType: businessType.name }) || pairName,
    solution_intro: industry.solution_intro || industry.solution || '',
    solution_steps: makeSteps(industry.steps || []),
    features_title: template.features_title,
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
      entityName: `${businessType.name} — ${industry.name}`,
      pageSlug: `${businessType.slug}/${industry.slug}`,
    },
    internal_links: makeLinks([
      { label: industry.name, href: `/industries/${industry.slug}`, description: industry.description },
      { label: businessType.name, href: `/for/${businessType.slug}`, description: businessType.description },
      ...context.channels.slice(0, 3).map((item: any) => ({ label: item.name, href: `/channels/${item.slug}`, description: item.description })),
    ]),
    sticky_cta_title: fill(template.sticky_cta_title, { channel: businessType.name, industry: industry.name, businessType: businessType.name }) || pairName,
    sticky_cta_text: fill(template.sticky_cta_text, { channel: businessType.name, industry: industry.name, businessType: businessType.name }) || pairSubtitle,
    sticky_cta_primary_label: template.sticky_cta_primary_label,
    sticky_cta_primary_url: '/demo',
  };
}
