export type PageTemplateKind =
  | 'home'
  | 'structured'
  | 'directory'
  | 'pricing'
  | 'partnership'
  | 'tenders'
  | 'resource-hub'
  | 'brand-content'
  | 'comparison'
  | 'campaign';

export interface PageTemplateMapping {
  template: PageTemplateKind;
  routes: string[];
  purpose: string;
}

export const PAGE_TEMPLATE_MAP: PageTemplateMapping[] = [
  {
    template: 'home',
    routes: ['/'],
    purpose: 'Главная продуктовая страница с отдельной home-композицией.',
  },
  {
    template: 'structured',
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
    purpose: 'Detail/SEO-страницы и страницы пересечений.',
  },
  {
    template: 'directory',
    routes: ['/channels', '/industries', '/integrations', '/solutions', '/features', '/for'],
    purpose: 'Каталоги верхнего уровня.',
  },
  {
    template: 'pricing',
    routes: ['/pricing'],
    purpose: 'Цены и коммерческая модель.',
  },
  {
    template: 'partnership',
    routes: ['/partnership'],
    purpose: 'Партнёрская программа и resell/agency слой.',
  },
  {
    template: 'tenders',
    routes: ['/solutions/tenders'],
    purpose: 'Специализированный вертикальный шаблон под тендерный сценарий.',
  },
  {
    template: 'resource-hub',
    routes: ['/docs', '/help', '/academy', '/blog', '/status'],
    purpose: 'Ресурсные и knowledge-страницы.',
  },
  {
    template: 'brand-content',
    routes: ['/media', '/team', '/conversation', '/tv'],
    purpose: 'Брендовый и company/content слой.',
  },
  {
    template: 'comparison',
    routes: ['/compare/[slug]', '/vs/[slug]'],
    purpose: 'Страницы сравнения Chat Plus с альтернативами.',
  },
  {
    template: 'campaign',
    routes: ['/promo', '/prozorro'],
    purpose: 'Спецстраницы и vertical/campaign сценарии.',
  },
];
