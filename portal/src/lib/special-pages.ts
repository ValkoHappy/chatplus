export type SpecialPageSlug =
  | 'academy'
  | 'blog'
  | 'docs'
  | 'help'
  | 'status'
  | 'media'
  | 'team'
  | 'conversation'
  | 'tv'
  | 'promo'
  | 'prozorro';

export interface SpecialPageLinkMeta {
  label: string;
  description: string;
}

export interface SpecialPageOverride {
  meta_title?: string;
  meta_description?: string;
  h1?: string;
  subtitle?: string;
  hero_eyebrow?: string;
  hero_variant?: 'resource' | 'company' | 'campaign';
  hero_highlights_label?: string;
  hero_highlights?: string[];
  hero_trust_facts?: string[];
  problem_title?: string;
  problem_intro?: string;
  problems?: { title: string; text: string }[];
  problem_summary?: string;
  solution_title?: string;
  solution_intro?: string;
  solution_steps?: { title: string; text: string }[];
  features_title?: string;
  features?: { title: string; text: string }[];
  integrations_title?: string;
  roi_title?: string;
  roi_intro?: string;
  roi_without_items?: string[];
  roi_with_items?: string[];
  roi_quote?: string;
  use_cases_title?: string;
  use_cases?: { title: string; audience?: string; text: string }[];
  faq_title?: string;
  faqs?: { question: string; answer: string }[];
  internal_links_variant?: 'related' | 'next_steps' | 'comparisons' | 'docs' | 'solutions';
  sticky_cta_title?: string;
  sticky_cta_text?: string;
  sticky_cta_primary_label?: string;
  sticky_cta_secondary_label?: string;
}

export const SPECIAL_PAGE_LINKS: Partial<Record<SpecialPageSlug, SpecialPageLinkMeta>> = {
  academy: {
    label: 'Академия',
    description: 'Гайды, разборы и материалы по запуску омниканальных сценариев.',
  },
  blog: {
    label: 'Блог',
    description: 'Контент, кейсы и продуктовые заметки команды Chat Plus.',
  },
  docs: {
    label: 'Документация',
    description: 'API, интеграции и технические материалы по платформе.',
  },
  help: {
    label: 'Помощь',
    description: 'Справка по запуску, логике работы и следующему шагу.',
  },
  status: {
    label: 'Статус',
    description: 'Страница доступности сервисов, обновлений и инцидентов.',
  },
  media: {
    label: 'Медиа',
    description: 'Материалы для публикаций, анонсов и внешней упаковки.',
  },
  team: {
    label: 'Команда',
    description: 'Кто делает Chat Plus и как команда думает о продукте.',
  },
  conversation: {
    label: 'Диалоги',
    description: 'Подход Chat Plus к клиентскому разговору как к управляемому процессу.',
  },
  tv: {
    label: 'Видео',
    description: 'Демо, разборы интерфейса и объяснение продукта в движении.',
  },
  promo: {
    label: 'Промо',
    description: 'Офферы, упаковка и материалы для маркетинга и продаж.',
  },
  prozorro: {
    label: 'Prozorro',
    description: 'Сценарий мониторинга закупок и реакции команды в одном контуре.',
  },
};

export function getSpecialPageLinkMeta(slug: string) {
  return SPECIAL_PAGE_LINKS[slug as SpecialPageSlug];
}

// CMS-first compatibility layer:
// keep the API shape, but stop storing page copy in code.
export const SPECIAL_PAGE_OVERRIDES: Partial<Record<SpecialPageSlug, SpecialPageOverride>> = {};

export function getLandingPageOverride(slug: string) {
  return SPECIAL_PAGE_OVERRIDES[slug as SpecialPageSlug];
}
