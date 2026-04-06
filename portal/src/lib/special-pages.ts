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
