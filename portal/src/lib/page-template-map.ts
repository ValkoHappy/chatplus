import type { ActivePublicTemplateKind } from './template-kinds';

export type PageTemplateKind = ActivePublicTemplateKind;

export interface PageTemplateMapping {
  template: PageTemplateKind;
  canonicalTemplate: string;
  routes: string[];
  purpose: string;
}

export const PAGE_TEMPLATE_MAP: PageTemplateMapping[] = [
  {
    template: 'home',
    canonicalTemplate: 'home',
    routes: ['/'],
    purpose: 'Main product landing page with dedicated home composition.',
  },
  {
    template: 'structured',
    canonicalTemplate: 'structured',
    routes: [
      '/channels/[slug]',
      '/industries/[slug]',
      '/integrations/[slug]',
      '/solutions/[slug]',
      '/features/[slug]',
      '/for/[slug]',
      '/channels/[channel]/[industry]',
      '/channels/[channel]/[integration]',
      '/industries/[industry]/[solution]',
      '/integrations/[integration]/[solution]',
      '/for/[businessType]/[industry]',
      '/demo',
    ],
    purpose: 'Detail SEO pages and intersection pages.',
  },
  {
    template: 'directory',
    canonicalTemplate: 'directory',
    routes: ['/channels', '/industries', '/integrations', '/solutions', '/features', '/for'],
    purpose: 'Top-level catalog pages.',
  },
  {
    template: 'pricing',
    canonicalTemplate: 'pricing',
    routes: ['/pricing'],
    purpose: 'Pricing and commercial model.',
  },
  {
    template: 'partnership',
    canonicalTemplate: 'partnership',
    routes: ['/partnership'],
    purpose: 'Partner program and reseller/agency layer.',
  },
  {
    template: 'tenders',
    canonicalTemplate: 'tenders',
    routes: ['/solutions/tenders'],
    purpose: 'Specialized vertical template for the tenders scenario.',
  },
  {
    template: 'resource-hub',
    canonicalTemplate: 'resource_hub',
    routes: ['/docs', '/help', '/academy', '/blog', '/status'],
    purpose: 'Resource and knowledge pages.',
  },
  {
    template: 'brand-content',
    canonicalTemplate: 'brand_content',
    routes: ['/media', '/team', '/conversation', '/tv'],
    purpose: 'Brand and company content layer.',
  },
  {
    template: 'comparison',
    canonicalTemplate: 'comparison',
    routes: ['/compare/[slug]', '/vs/[slug]'],
    purpose: 'Comparison pages against alternatives.',
  },
  {
    template: 'campaign',
    canonicalTemplate: 'campaign',
    routes: ['/promo', '/prozorro'],
    purpose: 'Special campaign and vertical pages.',
  },
];
