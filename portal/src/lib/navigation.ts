import { stripBasePath } from './urls';
import { getSpecialPageLinkMeta } from './special-pages';

export interface NavLink {
  label: string;
  href: string;
  description?: string;
}

export interface NavColumn {
  title: string;
  links: NavLink[];
}

function specialLink(href: string, fallbackLabel: string, fallbackDescription: string): NavLink {
  const meta = getSpecialPageLinkMeta(href.replace(/^\//, ''));
  return {
    label: meta?.label || fallbackLabel,
    href,
    description: meta?.description || fallbackDescription,
  };
}

const HEADER_LINKS: NavLink[] = [
  { label: 'Каналы', href: '/channels' },
  { label: 'Отрасли', href: '/industries' },
  { label: 'Интеграции', href: '/integrations' },
  { label: 'Решения', href: '/solutions' },
  { label: 'Возможности', href: '/features' },
  { label: 'Для бизнеса', href: '/for' },
  { label: 'Цены', href: '/pricing' },
  { label: 'Партнёрам', href: '/partnership' },
];

const FOOTER_COLUMNS: NavColumn[] = [
  {
    title: 'Продукт',
    links: [
      { label: 'Цены', href: '/pricing', description: 'Тарифы, коммерческая модель и формат запуска.' },
      { label: 'Демо', href: '/demo', description: 'Запись на демонстрацию и быстрый старт с командой.' },
      { label: 'Партнёрам', href: '/partnership', description: 'Программа для агентств, интеграторов и реселлеров.' },
      { label: 'Для бизнеса', href: '/for', description: 'Сценарии Chat Plus под формат и модель бизнеса.' },
    ],
  },
  {
    title: 'Каталоги',
    links: [
      { label: 'Каналы', href: '/channels', description: 'Все каналы коммуникации и их продуктовые страницы.' },
      { label: 'Отрасли', href: '/industries', description: 'Сценарии по нишам и сегментам бизнеса.' },
      { label: 'Интеграции', href: '/integrations', description: 'Связки с CRM, календарями и внешними сервисами.' },
      { label: 'Решения', href: '/solutions', description: 'Готовые продуктовые сценарии и процессы.' },
      { label: 'Возможности', href: '/features', description: 'Функциональные модули платформы Chat Plus.' },
    ],
  },
  {
    title: 'Ресурсы',
    links: [
      { label: 'Документация', href: '/docs', description: 'Документация, материалы и продуктовые инструкции.' },
      { label: 'Помощь', href: '/help', description: 'Справка и вспомогательные материалы по запуску.' },
      { label: 'Академия', href: '/academy', description: 'Обучающий раздел по внедрению и сценариям.' },
      { label: 'Блог', href: '/blog', description: 'Контент-маркетинг, кейсы и материалы команды.' },
      { label: 'Статус', href: '/status', description: 'Служебная страница статуса и доступности платформы.' },
    ],
  },
  {
    title: 'Компания',
    links: [
      { label: 'Медиа', href: '/media', description: 'Медиа-материалы, презентации и публичные ресурсы.' },
      { label: 'Команда', href: '/team', description: 'Кто стоит за Chat Plus и как с нами связаться.' },
      specialLink('/conversation', 'Диалоги', 'Подход Chat Plus к клиентским диалогам как к системе.'),
      specialLink('/tv', 'Видео', 'Демо, разборы интерфейса и визуальный слой продукта.'),
    ],
  },
  {
    title: 'Спецразделы',
    links: [
      specialLink('/promo', 'Промо', 'Офферы, упаковка и материалы для маркетинга и продаж.'),
      specialLink('/prozorro', 'Prozorro', 'Сценарий мониторинга закупок и реакции команды в одном контуре.'),
      { label: 'Сравнения', href: '/compare', description: 'Сравнения Chat Plus с другими платформами.' },
      { label: 'Карта сайта', href: '/site-map', description: 'HTML-карта сайта по всем ключевым разделам.' },
    ],
  },
];

function buildLinkLookup(collections: Array<Array<Partial<NavLink>> | undefined>) {
  const lookup = new Map<string, Partial<NavLink>>();

  for (const collection of collections) {
    for (const item of collection || []) {
      if (!item?.href) continue;
      lookup.set(item.href, item);
    }
  }

  return lookup;
}

export function getHeaderLinks(provided: Partial<NavLink>[] = []) {
  const lookup = buildLinkLookup([provided]);

  return HEADER_LINKS.map((link) => ({
    ...lookup.get(link.href),
    label: link.label,
    href: link.href,
  }));
}

export function getFooterColumns(provided: Array<{ title?: string; links?: Partial<NavLink>[] }> = []) {
  const lookup = buildLinkLookup(provided.map((column) => column.links || []));

  return FOOTER_COLUMNS.map((column) => ({
    title: column.title,
    links: column.links.map((link) => ({
      ...lookup.get(link.href),
      label: link.label,
      href: link.href,
      description: lookup.get(link.href)?.description || link.description,
    })),
  }));
}

export function getMobileNavSections(headerLinks: NavLink[], footerColumns: NavColumn[]) {
  const footerMap = new Map(footerColumns.map((column) => [column.title, column.links]));

  return [
    { title: 'Основное', links: headerLinks },
    { title: 'Ресурсы', links: footerMap.get('Ресурсы') || [] },
    { title: 'Компания', links: footerMap.get('Компания') || [] },
    { title: 'Спецразделы', links: footerMap.get('Спецразделы') || [] },
  ].filter((section) => section.links.length > 0);
}

export function getSiteMapGroups(footerColumns: NavColumn[]) {
  return [
    {
      title: 'Главное',
      links: [
        { label: 'Главная', href: '/', description: 'Точка входа в продуктовую экосистему Chat Plus.' },
      ],
    },
    {
      title: 'Ключевые сценарии',
      links: [
        {
          label: 'AI Calendar',
          href: '/features/ai-calendar',
          description: 'AI-календарь для автоматизации записи, согласований и нагрузки команды.',
        },
        {
          label: 'Тендеры',
          href: '/solutions/tenders',
          description: 'Сценарий Chat Plus для работы с тендерами, закупками и внутренними командами.',
        },
      ],
    },
    ...footerColumns,
  ];
}

export function isPathActive(pathname: string, href: string) {
  const normalizedPathname = stripBasePath(pathname);

  if (href === '/') {
    return normalizedPathname === '/';
  }

  if (href === '/compare') {
    return normalizedPathname === '/compare' || normalizedPathname.startsWith('/compare/') || normalizedPathname.startsWith('/vs/');
  }

  return normalizedPathname === href || normalizedPathname.startsWith(`${href}/`);
}
