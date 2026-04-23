import { PAGE_V2_NAV_GROUPS } from '../../../config/page-v2-routes.mjs';
import { stripBasePath } from './urls.ts';
import { getSpecialPageLinkMeta } from './special-pages.ts';

export interface NavLink {
  label: string;
  href: string;
  description?: string;
  navOrder?: number;
}

export interface NavColumn {
  title: string;
  links: NavLink[];
}

export interface PageV2NavRecord {
  route_path: string;
  title?: string;
  nav_label?: string;
  nav_description?: string;
  nav_group?: string;
  nav_order?: number;
  show_in_header?: boolean;
  show_in_footer?: boolean;
  show_in_sitemap?: boolean;
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
  { label: 'Партнерам', href: '/partnership' },
];

const FOOTER_COLUMNS: NavColumn[] = [
  {
    title: 'Продукт',
    links: [
      { label: 'Цены', href: '/pricing', description: 'Тарифы, коммерческая модель и формат запуска.' },
      { label: 'Демо', href: '/demo', description: 'Запись на демонстрацию и быстрый старт с командой.' },
      { label: 'Партнерам', href: '/partnership', description: 'Программа для агентств, интеграторов и реселлеров.' },
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

function mapPageV2Link(page: PageV2NavRecord): NavLink {
  return {
    label: page.nav_label || page.title || page.route_path,
    href: page.route_path,
    description: page.nav_description || '',
    navOrder: typeof page.nav_order === 'number' ? page.nav_order : 100,
  };
}

function sortDynamicLinks(links: NavLink[]) {
  return [...links].sort((a, b) => {
    const orderDelta = (a.navOrder || 100) - (b.navOrder || 100);
    if (orderDelta !== 0) {
      return orderDelta;
    }

    return a.label.localeCompare(b.label, 'ru');
  });
}

function appendUniqueLinks(baseLinks: NavLink[], extraLinks: NavLink[]) {
  const merged = [...baseLinks];

  for (const link of extraLinks) {
    const existingIndex = merged.findIndex((current) => current.href === link.href);
    if (existingIndex >= 0) {
      merged[existingIndex] = {
        ...merged[existingIndex],
        ...link,
      };
      continue;
    }

    merged.push(link);
  }

  return merged;
}

function footerTitleForGroup(group?: string) {
  switch (group) {
    case 'product':
      return 'Продукт';
    case 'catalogs':
      return 'Каталоги';
    case 'resources':
      return 'Ресурсы';
    case 'company':
      return 'Компания';
    case 'special':
      return 'Спецразделы';
    default:
      return 'Ресурсы';
  }
}

export function getHeaderLinks(provided: Partial<NavLink>[] = [], dynamicPages: PageV2NavRecord[] = []) {
  const lookup = buildLinkLookup([provided]);
  const baseLinks = HEADER_LINKS.map((link) => ({
    ...lookup.get(link.href),
    label: link.label,
    href: link.href,
  }));
  const dynamicLinks = sortDynamicLinks(
    dynamicPages
      .filter((page) => page.show_in_header)
      .map((page) => mapPageV2Link(page)),
  );

  return appendUniqueLinks(baseLinks, dynamicLinks);
}

export function getFooterColumns(
  provided: Array<{ title?: string; links?: Partial<NavLink>[] }> = [],
  dynamicPages: PageV2NavRecord[] = [],
) {
  const lookup = buildLinkLookup(provided.map((column) => column.links || []));
  const columns = FOOTER_COLUMNS.map((column) => ({
    title: column.title,
    links: column.links.map((link) => ({
      ...lookup.get(link.href),
      label: link.label,
      href: link.href,
      description: lookup.get(link.href)?.description || link.description,
    })),
  }));

  const dynamicByTitle = new Map<string, NavLink[]>();
  for (const page of dynamicPages.filter((item) => item.show_in_footer)) {
    const title = footerTitleForGroup(page.nav_group);
    const current = dynamicByTitle.get(title) || [];
    current.push(mapPageV2Link(page));
    dynamicByTitle.set(title, current);
  }

  for (const column of columns) {
    const dynamicLinks = sortDynamicLinks(dynamicByTitle.get(column.title) || []);
    column.links = appendUniqueLinks(column.links, dynamicLinks);
    dynamicByTitle.delete(column.title);
  }

  for (const [title, links] of dynamicByTitle.entries()) {
    columns.push({
      title,
      links: sortDynamicLinks(links),
    });
  }

  return columns;
}

export function getMobileNavSections(headerLinks: NavLink[], footerColumns: NavColumn[]) {
  const footerMap = new Map(footerColumns.map((column) => [column.title, column.links]));

  return [
    { title: PAGE_V2_NAV_GROUPS.primary, links: headerLinks },
    { title: 'Ресурсы', links: footerMap.get('Ресурсы') || [] },
    { title: 'Компания', links: footerMap.get('Компания') || [] },
    { title: 'Спецразделы', links: footerMap.get('Спецразделы') || [] },
  ].filter((section) => section.links.length > 0);
}

export function getSiteMapGroups(footerColumns: NavColumn[], dynamicPages: PageV2NavRecord[] = []) {
  const existing = new Set<string>();
  for (const column of footerColumns) {
    for (const link of column.links) {
      existing.add(link.href);
    }
  }

  const groupedDynamic = new Map<string, NavLink[]>();
  for (const page of dynamicPages.filter((item) => item.show_in_sitemap)) {
    const link = mapPageV2Link(page);
    if (existing.has(link.href)) {
      continue;
    }

    const title = footerTitleForGroup(page.nav_group);
    const current = groupedDynamic.get(title) || [];
    current.push(link);
    groupedDynamic.set(title, current);
  }

  const extraGroups = [...groupedDynamic.entries()].map(([title, links]) => ({
    title,
    links: sortDynamicLinks(links),
  }));

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
    ...extraGroups,
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
