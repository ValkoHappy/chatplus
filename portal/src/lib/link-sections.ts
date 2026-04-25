export interface LinkItem {
  label?: string;
  href?: string;
  description?: string;
}

export interface NavigationGroup {
  title?: string;
  items?: LinkItem[];
}

export type InternalLinksVariant =
  | 'related'
  | 'next_steps'
  | 'comparisons'
  | 'docs'
  | 'solutions';

export type InternalLinksEntityType =
  | 'channel'
  | 'industry'
  | 'integration'
  | 'business_type'
  | 'feature'
  | 'solution'
  | 'generic';

export interface InternalLinksContext {
  entityType?: InternalLinksEntityType;
  entityName?: string;
  pageSlug?: string;
  preserveTitle?: boolean;
}

export interface LinkSectionPageData {
  navigation_groups_title?: string;
  navigation_groups_intro?: string;
  navigation_groups?: NavigationGroup[];
  internal_links_eyebrow?: string;
  internal_links_title?: string;
  internal_links_intro?: string;
  internal_links?: LinkItem[];
  internal_links_variant?: InternalLinksVariant;
  internal_links_context?: InternalLinksContext;
}

type NavigationGroupKind =
  | 'industries_for_channel'
  | 'integrations_for_channel'
  | 'solutions_for_industry'
  | 'solutions_for_integration'
  | 'industries_for_business_type';

const LEGACY_TITLES = new Set([
  '',
  'смежные страницы',
  'готовые страницы и сценарии',
  'related pages',
  'смежные решения chat plus',
  'узнайте больше о chat plus',
]);

const DOCS_SLUGS = new Set(['pricing', 'docs', 'help', 'status', 'academy', 'blog']);
const NEXT_STEP_SLUGS = new Set([
  'home',
  'partnership',
  'promo',
  'prozorro',
  'media',
  'team',
  'tv',
  'conversation',
  'dev',
  'demo',
]);

function normalizeTitle(title?: string) {
  return (title || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function hasItems(items?: LinkItem[]) {
  return Array.isArray(items) && items.some((item) => item?.label && item?.href);
}

function hasGroups(groups?: NavigationGroup[]) {
  return Array.isArray(groups) && groups.some((group) => group?.title && hasItems(group.items));
}

function getContext(page: LinkSectionPageData) {
  return page.internal_links_context || {};
}

function getEntityName(page: LinkSectionPageData) {
  return getContext(page).entityName?.trim() || '';
}

function getEntityType(page: LinkSectionPageData) {
  return getContext(page).entityType || 'generic';
}

function isHelpLikePage(page: LinkSectionPageData) {
  const slug = getContext(page).pageSlug || '';
  return DOCS_SLUGS.has(slug);
}

export function isLegacyLinkSectionTitle(title?: string) {
  return LEGACY_TITLES.has(normalizeTitle(title));
}

export function inferLandingPageLinkSectionProps(slug: string) {
  if (DOCS_SLUGS.has(slug)) {
    return {
      internal_links_variant: 'docs' as InternalLinksVariant,
      internal_links_context: {
        entityType: 'generic' as InternalLinksEntityType,
        pageSlug: slug,
      },
    };
  }

  if (NEXT_STEP_SLUGS.has(slug)) {
    return {
      internal_links_variant: 'next_steps' as InternalLinksVariant,
      internal_links_context: {
        entityType: 'generic' as InternalLinksEntityType,
        pageSlug: slug,
      },
    };
  }

  return {
    internal_links_variant: 'related' as InternalLinksVariant,
    internal_links_context: {
      entityType: 'generic' as InternalLinksEntityType,
      pageSlug: slug,
    },
  };
}

export function getNavigationGroupTitle(kind: NavigationGroupKind, entityName: string) {
  switch (kind) {
    case 'industries_for_channel':
      return `Отрасли для ${entityName}`;
    case 'integrations_for_channel':
      return `Интеграции с ${entityName}`;
    case 'solutions_for_industry':
      return `Решения для ${entityName}`;
    case 'solutions_for_integration':
      return `Сценарии с ${entityName}`;
    case 'industries_for_business_type':
      return `Ниши для ${entityName}`;
    default:
      return 'Готовые сценарии';
  }
}

export function resolveNavigationGroupsTitle(page: LinkSectionPageData) {
  if (!hasGroups(page.navigation_groups)) {
    return '';
  }

  if (!isLegacyLinkSectionTitle(page.navigation_groups_title)) {
    return page.navigation_groups_title?.trim() || '';
  }

  const entityType = getEntityType(page);
  const entityName = getEntityName(page);

  switch (entityType) {
    case 'channel':
      return entityName ? `Где использовать ${entityName}` : 'Где использовать этот канал';
    case 'industry':
      return entityName ? `Готовые решения для ${entityName}` : 'Готовые решения для вашей ниши';
    case 'integration':
      return entityName ? `Готовые сценарии с ${entityName}` : 'Готовые сценарии для интеграции';
    case 'business_type':
      return entityName ? `Отраслевые сценарии для ${entityName}` : 'Отраслевые сценарии';
    default:
      return 'Готовые сценарии';
  }
}

export function resolveNavigationGroupsIntro(page: LinkSectionPageData) {
  if (!hasGroups(page.navigation_groups)) {
    return '';
  }

  if (page.navigation_groups_intro?.trim()) {
    return page.navigation_groups_intro.trim();
  }

  const entityType = getEntityType(page);
  const entityName = getEntityName(page);

  switch (entityType) {
    case 'channel':
      return entityName
        ? `Выберите отрасль или интеграцию, чтобы открыть готовый сценарий запуска ${entityName} в вашем процессе.`
        : 'Выберите отрасль или интеграцию и откройте готовый сценарий запуска.';
    case 'industry':
      return entityName
        ? `Ниже собраны готовые сценарии по ключевым задачам внутри ниши ${entityName}.`
        : 'Ниже собраны готовые сценарии по ключевым задачам внутри вашей ниши.';
    case 'integration':
      return entityName
        ? `Посмотрите, какие процессы можно собрать вокруг ${entityName} без отдельной разработки.`
        : 'Посмотрите, какие процессы можно собрать вокруг этой интеграции без отдельной разработки.';
    case 'business_type':
      return entityName
        ? `Выберите нишу и откройте отраслевой сценарий для формата ${entityName}.`
        : 'Выберите нишу и откройте отраслевой сценарий под свой формат работы.';
    default:
      return 'Ниже собраны готовые страницы по теме, чтобы быстрее перейти к нужному сценарию.';
  }
}

export function resolveNavigationGroupsEyebrow(page: LinkSectionPageData) {
  if (!hasGroups(page.navigation_groups)) {
    return '';
  }

  switch (getEntityType(page)) {
    case 'channel':
      return 'Сценарии по каналу';
    case 'industry':
      return 'Сценарии по нише';
    case 'integration':
      return 'Сценарии по интеграции';
    case 'business_type':
      return 'Сценарии по формату';
    default:
      return 'Готовые сценарии';
  }
}

export function resolveInternalLinksTitle(page: LinkSectionPageData) {
  if (!hasItems(page.internal_links)) {
    return '';
  }

  if (page.internal_links_context?.preserveTitle && page.internal_links_title?.trim()) {
    return page.internal_links_title.trim();
  }

  if (!isLegacyLinkSectionTitle(page.internal_links_title)) {
    return page.internal_links_title?.trim() || '';
  }

  const variant = page.internal_links_variant || 'related';
  const entityType = getEntityType(page);

  if (variant === 'comparisons') {
    return 'Другие сравнения';
  }

  if (variant === 'docs' || isHelpLikePage(page)) {
    return 'Полезные страницы';
  }

  if (variant === 'solutions' || entityType === 'feature' || entityType === 'solution') {
    return 'Что еще можно подключить';
  }

  if (variant === 'next_steps') {
    return 'Куда перейти дальше';
  }

  return 'Что еще посмотреть';
}

export function resolveInternalLinksIntro(page: LinkSectionPageData) {
  if (!hasItems(page.internal_links)) {
    return '';
  }

  if (page.internal_links_intro?.trim()) {
    return page.internal_links_intro.trim();
  }

  const variant = page.internal_links_variant || 'related';
  const entityType = getEntityType(page);

  if (variant === 'comparisons') {
    return 'Соседние сравнения, если вы еще оцениваете альтернативы и подходящий стек.';
  }

  if (variant === 'docs' || isHelpLikePage(page)) {
    return 'Материалы и разделы, которые помогут быстрее разобраться в запуске, цене и возможностях платформы.';
  }

  if (variant === 'solutions' || entityType === 'feature' || entityType === 'solution') {
    return 'Смежные модули и сценарии, которые обычно подключают рядом с этой функцией.';
  }

  if (variant === 'next_steps') {
    return 'Короткие переходы в соседние разделы, если хотите собрать решение под свой процесс.';
  }

  return 'Связанные разделы и сценарии, которые помогают быстрее перейти к нужной конфигурации.';
}

export function resolveInternalLinksEyebrow(page: LinkSectionPageData) {
  if (!hasItems(page.internal_links)) {
    return '';
  }

  if (page.internal_links_eyebrow?.trim()) {
    return page.internal_links_eyebrow.trim();
  }

  const variant = page.internal_links_variant || 'related';

  switch (variant) {
    case 'comparisons':
      return 'Сравнения';
    case 'docs':
      return 'Полезные материалы';
    case 'solutions':
      return 'Соседние модули';
    case 'next_steps':
      return 'Следующий шаг';
    default:
      return 'По теме страницы';
  }
}

export function getLinkIcon(href = '') {
  if (href.startsWith('/channels')) return 'lucide:message-circle-more';
  if (href.startsWith('/industries')) return 'lucide:briefcase-business';
  if (href.startsWith('/integrations')) return 'lucide:plug';
  if (href.startsWith('/features')) return 'lucide:sparkles';
  if (href.startsWith('/solutions')) return 'lucide:layout-grid';
  if (href.startsWith('/pricing')) return 'lucide:badge-dollar-sign';
  if (href.startsWith('/docs') || href.startsWith('/help') || href.startsWith('/academy')) return 'lucide:file-text';
  if (href.startsWith('/blog') || href.startsWith('/media')) return 'lucide:newspaper';
  if (href.startsWith('/demo')) return 'lucide:play';
  if (href.startsWith('/for')) return 'lucide:users';
  if (href.startsWith('/compare') || href.startsWith('/vs')) return 'lucide:scale';
  if (href.startsWith('/status')) return 'lucide:activity';
  return 'lucide:arrow-right';
}
