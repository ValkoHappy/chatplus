import { useFetchClient, type StrapiApp } from '@strapi/strapi/admin';
import type { PanelComponent, PanelComponentProps } from '@strapi/content-manager/strapi-admin';
import { useState, type CSSProperties } from 'react';

type GuideItem = {
  key: string;
  description: string;
};

type GuideSection = {
  title: string;
  items: GuideItem[];
};

type GuideConfig = {
  title: string;
  intro: string;
  sections: GuideSection[];
};

const CMS_MODELS = new Set([
  'api::landing-page.landing-page',
  'api::page-v2.page-v2',
  'api::generation-job.generation-job',
  'api::tenders-page.tenders-page',
  'api::business-types-page.business-types-page',
  'api::site-setting.site-setting',
  'api::competitor.competitor',
  'api::solution.solution',
  'api::channel.channel',
  'api::industry.industry',
  'api::integration.integration',
  'api::feature.feature',
  'api::business-type.business-type',
]);

const REFERENCE_MODELS = new Set([
  'api::channel.channel',
  'api::industry.industry',
  'api::integration.integration',
  'api::solution.solution',
  'api::feature.feature',
  'api::business-type.business-type',
  'api::competitor.competitor',
]);

function readDocument(document: PanelComponentProps['document']) {
  if (document && typeof document === 'object') {
    return document as Record<string, unknown>;
  }

  return {};
}

function pickLabel(record: Record<string, unknown>) {
  const explicitMode = typeof record.record_mode === 'string' ? record.record_mode : '';
  const sourceMode = typeof record.source_mode === 'string' ? record.source_mode : '';

  if (sourceMode === 'managed') {
    return 'Редактируется вручную в CMS';
  }

  if (sourceMode === 'hybrid') {
    return 'Гибридная страница';
  }

  if (explicitMode === 'managed') {
    return 'Редактируется вручную в CMS';
  }

  if (explicitMode === 'settings') {
    return 'Системная singleton-запись';
  }

  if (explicitMode === 'imported') {
    return 'Импортировано системой';
  }

  if (record.content_origin === 'managed') {
    return 'Legacy managed marker';
  }

  if (record.content_origin === 'generated') {
    return 'Legacy imported marker';
  }

  return 'Режим не определен';
}

const GENERATION_JOB_GUIDE: GuideConfig = {
  title: 'Как заполнять',
  intro:
    'Эта форма нужна, чтобы AI дополнил уже существующую Page. Сначала выбери страницу, потом укажи тип страницы и текст задачи.',
  sections: [
    {
      title: 'Обязательно',
      items: [
        { key: 'title', description: 'Понятное название задачи. Лучше коротко и по делу.' },
        { key: 'job_type', description: 'manual_request или scheduled.' },
        { key: 'target_page', description: 'Уже существующая Page, которую AI должен заполнить или доработать.' },
        { key: 'target_blueprint', description: 'Тип этой Page. Должен совпадать с page_kind у выбранной страницы.' },
        { key: 'request_prompt', description: 'Главная инструкция для AI: тема, цель, аудитория, CTA и ограничения.' },
      ],
    },
    {
      title: 'Можно оставить пустым',
      items: [
        { key: 'requested_by', description: 'Кто создал задачу. Полезно для истории, но не обязательно.' },
        { key: 'target_channels', description: 'Контекст по каналам: WhatsApp, Telegram, Email и т.д.' },
        { key: 'target_industries', description: 'Контекст по отрасли: beauty, медицина, retail.' },
        { key: 'target_integrations', description: 'Контекст по интеграциям: amoCRM, Bitrix24, YClients и т.д.' },
        { key: 'target_solutions', description: 'Какие сценарии или решения нужно учитывать в тексте.' },
        { key: 'target_features', description: 'Какие функции продукта стоит упомянуть в контексте.' },
        { key: 'target_business_types', description: 'Тип бизнеса, если он помогает AI точнее писать текст.' },
        { key: 'target_competitors', description: 'Конкуренты для сравнения, если это реально нужно.' },
        { key: 'run_report', description: 'Технический отчёт выполнения. Обычно трогать не надо.' },
      ],
    },
    {
      title: 'Не путать',
      items: [
        { key: 'job_status', description: 'Статус самой задачи, не статус страницы.' },
        { key: 'target_blueprint', description: 'Это тип страницы, а не её название или slug.' },
        { key: 'target_page', description: 'Ссылка на готовую Page, а не создание новой страницы тут.' },
      ],
    },
  ],
};

const PAGE_GUIDE: GuideConfig = {
  title: 'Как заполнять Page',
  intro:
    'Это основная публичная страница сайта. Здесь редактируют адрес, тип макета, блоки, SEO и видимость страницы.',
  sections: [
    {
      title: 'Главное',
      items: [
        { key: 'title', description: 'Внутреннее имя страницы. Можно сделать понятным для редактора.' },
        { key: 'route_path', description: 'Публичный URL. Менять осторожно, это адрес страницы.' },
        { key: 'page_kind', description: 'Тип страницы: landing, directory, entity_detail, comparison и т.д.' },
        { key: 'blueprint', description: 'Правила для секций: какие блоки можно использовать и в каком наборе.' },
        { key: 'sections', description: 'Главное место редактирования контента и порядка блоков.' },
      ],
    },
    {
      title: 'Перед публикацией',
      items: [
        { key: 'seo_title', description: 'Title для поиска и сниппета.' },
        { key: 'seo_description', description: 'Description для поиска и сниппета.' },
        { key: 'show_in_header', description: 'Показывать ссылку в шапке сайта.' },
        { key: 'show_in_footer', description: 'Показывать ссылку в футере.' },
        { key: 'show_in_sitemap', description: 'Включить страницу в sitemap.' },
        { key: 'editorial_status', description: 'Перед publish ставь approved.' },
      ],
    },
    {
      title: 'Не трогать без нужды',
      items: [
        { key: 'migration_ready', description: 'Это safety gate для старых URL.' },
        { key: 'parity_status', description: 'Статус визуальной проверки после миграции.' },
        { key: 'legacy_template_family', description: 'Какой старый renderer обслуживает страницу.' },
        { key: 'legacy_layout_signature', description: 'Техническая подпись старого макета.' },
      ],
    },
  ],
};

const PAGE_BLUEPRINT_GUIDE: GuideConfig = {
  title: 'Что такое Blueprint',
  intro:
    'Blueprint не содержит контент страницы. Он задаёт правила: какие блоки доступны, какие обязательны и какой стартовый набор дать странице.',
  sections: [
    {
      title: 'Обязательно',
      items: [
        { key: 'blueprint_id', description: 'Уникальный ключ blueprint. Пример: campaign, brand, resource.' },
        { key: 'page_kind', description: 'Для какого типа Page используется blueprint.' },
      ],
    },
    {
      title: 'Самое важное',
      items: [
        { key: 'template_variant', description: 'Вариант представления для этого blueprint.' },
        { key: 'required_blocks', description: 'Какие блоки обязательно должны быть на странице.' },
        { key: 'allowed_blocks', description: 'Какие блоки AI и редактор могут использовать.' },
        { key: 'default_sections', description: 'Стартовый набор секций для новой страницы.' },
        { key: 'is_active', description: 'Если выключить, blueprint нельзя использовать для новых страниц.' },
      ],
    },
    {
      title: 'Не путать',
      items: [
        { key: 'description', description: 'Это пояснение для редактора, а не контент страницы.' },
        { key: 'pages', description: 'Связанные страницы, а не сам шаблон.' },
      ],
    },
  ],
};

const PAGE_VERSION_GUIDE: GuideConfig = {
  title: 'Версии и откат',
  intro:
    'Page Version — это история снимков страницы. Здесь смотрят, что менялось, и при необходимости возвращают предыдущий вариант.',
  sections: [
    {
      title: 'Что важно',
      items: [
        { key: 'page', description: 'Какая Page относится к этой версии.' },
        { key: 'version_number', description: 'Номер снимка.' },
        { key: 'route_path', description: 'Маршрут страницы на момент снимка.' },
        { key: 'editorial_status', description: 'Статус страницы на момент версии.' },
      ],
    },
    {
      title: 'Обычно не трогать',
      items: [
        { key: 'snapshot', description: 'Технический снимок состояния страницы.' },
        { key: 'checksum', description: 'Контрольная сумма снимка.' },
        { key: 'source_action', description: 'Какой операцией создана версия.' },
        { key: 'created_by_label', description: 'Имя автора снимка, если оно есть.' },
      ],
    },
  ],
};

const SITE_SETTINGS_GUIDE: GuideConfig = {
  title: 'Глобальные настройки',
  intro:
    'Это не отдельная страница, а общие настройки сайта: шапка, футер, CTA, шаблоны и системные дефолты.',
  sections: [
    {
      title: 'Что сюда входит',
      items: [
        { key: 'site_name', description: 'Название сайта.' },
        { key: 'site_url', description: 'Базовый URL.' },
        { key: 'default_description', description: 'Глобальное описание по умолчанию.' },
        { key: 'header_links', description: 'Ссылки в шапке.' },
        { key: 'footer_columns', description: 'Колонки футера.' },
        { key: 'sticky_cta_text', description: 'Текст sticky CTA.' },
      ],
    },
    {
      title: 'Не путать',
      items: [
        { key: 'record_mode', description: 'Служебный режим записи.' },
        { key: 'sync_strategy', description: 'Как настройки синхронизируются.' },
      ],
    },
  ],
};

const LANDING_PAGE_GUIDE: GuideConfig = {
  title: 'Legacy Landing Page',
  intro:
    'Это старая продающая страница. Она остаётся в CMS для совместимости, но новые задачи лучше вести через Page.',
  sections: [
    {
      title: 'Смотреть в первую очередь',
      items: [
        { key: 'slug', description: 'Адрес или ключ записи.' },
        { key: 'h1', description: 'Основной заголовок страницы.' },
        { key: 'subtitle', description: 'Подзаголовок.' },
        { key: 'content', description: 'Основной текст/контент, если он ещё используется.' },
      ],
    },
    {
      title: 'Не путать',
      items: [
        { key: 'record_mode', description: 'Служебный маркер записи.' },
        { key: 'sync_strategy', description: 'Как запись синхронизируется.' },
      ],
    },
  ],
};

const TENDERS_PAGE_GUIDE: GuideConfig = {
  title: 'Tenders Page',
  intro:
    'Это отдельная служебная страница раздела тендеров. Её редактируют как готовую страницу, а не как blueprint.',
  sections: [
    {
      title: 'Что важно',
      items: [
        { key: 'title', description: 'Внутреннее название страницы.' },
        { key: 'slug', description: 'Публичный ключ/адрес.' },
        { key: 'hero_*', description: 'Hero-секция и первые экраны.' },
        { key: 'faq', description: 'Блок вопросов и ответов.' },
      ],
    },
    {
      title: 'Не путать',
      items: [
        { key: 'content_origin', description: 'Служебный признак источника.' },
        { key: 'record_mode', description: 'Служебный режим записи.' },
      ],
    },
  ],
};

const BUSINESS_TYPES_PAGE_GUIDE: GuideConfig = {
  title: 'Business Types Page',
  intro:
    'Это служебная страница-агрегатор по типам бизнеса. Обычно её меняют только точечно и с пониманием маршрута.',
  sections: [
    {
      title: 'Что смотреть',
      items: [
        { key: 'title', description: 'Название страницы.' },
        { key: 'slug', description: 'Публичный адрес.' },
        { key: 'sections', description: 'Содержимое страницы и порядок блоков.' },
      ],
    },
    {
      title: 'Не путать',
      items: [
        { key: 'sync_strategy', description: 'Как страница синхронизируется.' },
        { key: 'record_mode', description: 'Служебный режим записи.' },
      ],
    },
  ],
};

const REFERENCE_GUIDES: Record<string, GuideConfig> = {
  'api::channel.channel': {
    title: 'Справочник: Channel',
    intro: 'Это справочник для каналов коммуникации. Он нужен как контекст для страниц и AI, а не как отдельная страница.',
    sections: [
      {
        title: 'Обычно редактируют',
        items: [
          { key: 'slug', description: 'Технический ключ канала.' },
          { key: 'name', description: 'Название канала.' },
          { key: 'description', description: 'Короткое описание канала.' },
        ],
      },
      {
        title: 'Не трогать без причины',
        items: [
          { key: 'content_origin', description: 'Служебный признак источника.' },
          { key: 'record_mode', description: 'Служебный режим записи.' },
          { key: 'manual_override_fields', description: 'Список ручных правок.' },
        ],
      },
    ],
  },
  'api::industry.industry': {
    title: 'Справочник: Industry',
    intro: 'Это справочник отраслей. Он нужен для фильтров, связей и AI-контекста.',
    sections: [
      {
        title: 'Обычно редактируют',
        items: [
          { key: 'slug', description: 'Технический ключ отрасли.' },
          { key: 'name', description: 'Название отрасли.' },
          { key: 'description', description: 'Короткое описание.' },
          { key: 'pain', description: 'Боль клиента в этой отрасли.' },
          { key: 'solution', description: 'Как продукт помогает.' },
        ],
      },
    ],
  },
  'api::integration.integration': {
    title: 'Справочник: Integration',
    intro: 'Это справочник интеграций, например amoCRM, Bitrix24, YClients. Страницы используют его как контекст.',
    sections: [
      {
        title: 'Обычно редактируют',
        items: [
          { key: 'slug', description: 'Технический ключ интеграции.' },
          { key: 'name', description: 'Название интеграции.' },
          { key: 'category', description: 'Категория интеграции.' },
          { key: 'description', description: 'Короткое описание.' },
        ],
      },
    ],
  },
  'api::solution.solution': {
    title: 'Справочник: Solution',
    intro: 'Это справочник сценариев/решений. Он помогает AI и редактору писать тексты точнее.',
    sections: [
      {
        title: 'Обычно редактируют',
        items: [
          { key: 'slug', description: 'Технический ключ сценария.' },
          { key: 'name', description: 'Название решения.' },
          { key: 'description', description: 'Короткое описание.' },
          { key: 'pain', description: 'Какая проблема решается.' },
          { key: 'solution', description: 'Как именно решается.' },
        ],
      },
    ],
  },
  'api::feature.feature': {
    title: 'Справочник: Feature',
    intro: 'Это справочник функций продукта: ответы AI, API, аналитика и прочее.',
    sections: [
      {
        title: 'Обычно редактируют',
        items: [
          { key: 'slug', description: 'Технический ключ функции.' },
          { key: 'name', description: 'Название функции.' },
          { key: 'description', description: 'Короткое описание.' },
        ],
      },
    ],
  },
  'api::business-type.business-type': {
    title: 'Справочник: Business Type',
    intro: 'Это справочник типов бизнеса. Он нужен как контекст для страниц и AI.',
    sections: [
      {
        title: 'Обычно редактируют',
        items: [
          { key: 'slug', description: 'Технический ключ типа бизнеса.' },
          { key: 'name', description: 'Название типа бизнеса.' },
          { key: 'description', description: 'Короткое описание.' },
        ],
      },
    ],
  },
  'api::competitor.competitor': {
    title: 'Справочник: Competitor',
    intro: 'Это справочник конкурентов. Он нужен для сравнений и контекста страницы.',
    sections: [
      {
        title: 'Обычно редактируют',
        items: [
          { key: 'slug', description: 'Технический ключ конкурента.' },
          { key: 'name', description: 'Название конкурента.' },
          { key: 'price', description: 'Базовый ориентир по цене.' },
          { key: 'our_price', description: 'Наш ориентир по цене.' },
        ],
      },
    ],
  },
};

const LEAD_REQUEST_GUIDE: GuideConfig = {
  title: 'Как читать заявку',
  intro:
    'Здесь сохраняются заявки с публичной формы сайта. Поля формы настраиваются в Site Settings, а эта запись нужна для обработки лида и проверки источника.',
  sections: [
    {
      title: 'Контакт',
      items: [
        { key: 'status', description: 'Статус обработки: new, in_progress, done или spam.' },
        { key: 'name', description: 'Имя посетителя из формы.' },
        { key: 'phone', description: 'Телефон посетителя из формы.' },
        { key: 'email', description: 'Почта посетителя из формы.' },
        { key: 'payload', description: 'Все отправленные поля формы целиком, включая нестандартные поля.' },
      ],
    },
    {
      title: 'Источник',
      items: [
        { key: 'source_path', description: 'Страница сайта, с которой отправили заявку.' },
        { key: 'source_url', description: 'Полный URL страницы вместе с query string.' },
        { key: 'source_query', description: 'Query string на момент отправки.' },
        { key: 'referrer', description: 'Откуда пришел посетитель, если браузер передал referrer.' },
        { key: 'utm', description: 'Рекламные метки: utm_*, gclid, yclid.' },
      ],
    },
  ],
};

function getGuideConfig(model: string): GuideConfig | null {
  if (model === 'api::generation-job.generation-job') {
    return GENERATION_JOB_GUIDE;
  }

  if (model === 'api::landing-page.landing-page') {
    return LANDING_PAGE_GUIDE;
  }

  if (model === 'api::page-v2.page-v2') {
    return PAGE_GUIDE;
  }

  if (model === 'api::page-blueprint.page-blueprint') {
    return PAGE_BLUEPRINT_GUIDE;
  }

  if (model === 'api::page-version.page-version') {
    return PAGE_VERSION_GUIDE;
  }

  if (model === 'api::site-setting.site-setting') {
    return SITE_SETTINGS_GUIDE;
  }

  if (model === 'api::tenders-page.tenders-page') {
    return TENDERS_PAGE_GUIDE;
  }

  if (model === 'api::business-types-page.business-types-page') {
    return BUSINESS_TYPES_PAGE_GUIDE;
  }

  if (model === 'api::lead-request.lead-request') {
    return LEAD_REQUEST_GUIDE;
  }

  if (REFERENCE_MODELS.has(model)) {
    return REFERENCE_GUIDES[model] ?? null;
  }

  return null;
}

const SyncStatusPanel: PanelComponent = ({ document, model }: PanelComponentProps) => {
  if (!CMS_MODELS.has(String(model))) {
    return null as never;
  }

  const record = readDocument(document);
  const manualOverrides = Array.isArray(record.manual_override_fields) ? record.manual_override_fields : [];
  const syncStrategy = typeof record.sync_strategy === 'string' ? record.sync_strategy : 'merge';
  const importedAt = typeof record.last_imported_at === 'string' ? record.last_imported_at : '';
  const isImported = record.record_mode === 'imported' || record.content_origin === 'generated';
  const generationMode = typeof record.generation_mode === 'string' ? record.generation_mode : '';
  const editorialStatus = typeof record.editorial_status === 'string' ? record.editorial_status : '';

  return {
    title: 'Content Mode',
    content: (
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <strong>{pickLabel(record)}</strong>
        </div>

        <p style={{ margin: 0 }}>
          {isImported
            ? 'Эта запись пришла через importer. Ручные правки сохраняются, а следующий sync обновляет только системные поля.'
            : 'Эта запись управляется напрямую через Strapi и не должна перезаписываться importer-ом.'}
        </p>

        <div>
          <strong>Sync strategy:</strong> {syncStrategy}
        </div>

        {generationMode && (
          <div>
            <strong>Generation mode:</strong> {generationMode}
          </div>
        )}

        {editorialStatus && (
          <div>
            <strong>Editorial status:</strong> {editorialStatus}
          </div>
        )}

        <div>
          <strong>Ручные правки:</strong> {manualOverrides.length > 0 ? manualOverrides.join(', ') : 'не зафиксированы'}
        </div>

        <div>
          <strong>Последний import:</strong> {importedAt || 'ещё не выполнялся'}
        </div>
      </div>
    ),
  };
};

const ModelGuidePanel: PanelComponent = ({ model }: PanelComponentProps) => {
  const guide = getGuideConfig(String(model));

  if (!guide) {
    return null as never;
  }

  return {
    title: guide.title,
    content: (
      <div style={{ display: 'grid', gap: 12 }}>
        <p style={{ margin: 0 }}>{guide.intro}</p>

        {guide.sections.map((section) => (
          <div key={section.title} style={{ display: 'grid', gap: 6 }}>
            <strong>{section.title}</strong>
            <div style={{ display: 'grid', gap: 8 }}>
              {section.items.map((item) => (
                <div key={item.key} style={{ display: 'grid', gap: 2 }}>
                  <strong>{item.key}</strong>
                  <span>{item.description}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    ),
  };
};

function adminEditUrl(model: string, documentId: string) {
  return `/admin/content-manager/collection-types/${model}/${encodeURIComponent(documentId)}`;
}

function buildCopyDefaults(routePath: string, title: string) {
  const basePath = routePath && routePath !== '/' ? routePath : '/page';
  const cleanPath = `/${basePath.replace(/^\/+/, '').replace(/\/+$/, '')}`;
  const copyPath = `${cleanPath}-copy`;

  return {
    routePath: copyPath,
    slug: copyPath.replace(/^\/+/, '').replace(/[^\w-]+/g, '-').replace(/-+/g, '-').toLowerCase(),
    title: title ? `${title} copy` : 'Page copy',
  };
}

const PageDuplicatePanelContent = ({
  document,
  model,
}: PanelComponentProps) => {
  if (String(model) !== 'api::page-v2.page-v2') {
    return null;
  }

  const record = readDocument(document);
  const documentId = String(record.documentId || record.document_id || record.id || '').trim();
  const routePath = String(record.route_path || record.slug || '').trim();
  const title = String(record.title || '').trim();
  const defaults = buildCopyDefaults(routePath, title);
  const [newRoutePath, setNewRoutePath] = useState(defaults.routePath);
  const [newSlug, setNewSlug] = useState(defaults.slug);
  const [newTitle, setNewTitle] = useState(defaults.title);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const { post } = useFetchClient();

  const duplicatePage = async () => {
    if (!documentId || busy) {
      return;
    }

    setBusy(true);
    setMessage('');

    try {
      const { data: payload } = await post(
        `/admin/page-v2-ai/pages/${encodeURIComponent(documentId)}/duplicate`,
        {
          route_path: newRoutePath,
          slug: newSlug,
          title: newTitle,
        },
      );
      const pageDocumentId = String(payload?.page_document_id || '').trim();

      if (!pageDocumentId) {
        throw new Error('Page was copied, but documentId was not returned.');
      }

      window.location.assign(adminEditUrl('api::page-v2.page-v2', pageDocumentId));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ fontWeight: 700 }}>Дубликат страницы</div>
      <p style={{ margin: 0 }}>
        Создает черновик с теми же блоками и связями. Потом поменяйте контент руками или запустите AI для новой страницы.
      </p>

      <label style={fieldLabelStyle}>
        Новый URL
        <input
          value={newRoutePath}
          onChange={(event) => setNewRoutePath(event.target.value)}
          placeholder="/new-page"
          style={inputStyle}
        />
      </label>

      <label style={fieldLabelStyle}>
        Новый slug
        <input
          value={newSlug}
          onChange={(event) => setNewSlug(event.target.value)}
          placeholder="new-page"
          style={inputStyle}
        />
      </label>

      <label style={fieldLabelStyle}>
        Название
        <input
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          placeholder="Новая страница"
          style={inputStyle}
        />
      </label>

      <button
        type="button"
        onClick={duplicatePage}
        disabled={!documentId || busy}
        style={buttonStyle}
      >
        {busy ? 'Копируем...' : 'Скопировать Page'}
      </button>

      <div style={{ fontSize: 12, lineHeight: 1.5, color: '#64748b' }}>
        Копия будет draft, без показа в меню и sitemap.
      </div>

      {message && <div style={{ fontSize: 13, lineHeight: 1.5 }}>{message}</div>}
    </div>
  );
};

const PageDuplicatePanel: PanelComponent = (props: PanelComponentProps) => {
  if (String(props.model) !== 'api::page-v2.page-v2') {
    return null as never;
  }

  return {
    title: 'Copy Page',
    content: <PageDuplicatePanelContent {...props} />,
  };
};

const PageGenerationBridgePanelContent = ({
  document,
  model,
}: PanelComponentProps) => {
  if (String(model) !== 'api::page-v2.page-v2') {
    return null;
  }

  const record = readDocument(document);
  const documentId = String(record.documentId || record.document_id || record.id || '').trim();
  const routePath = String(record.route_path || record.slug || '').trim();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const { post } = useFetchClient();

  const createJob = async () => {
    if (!documentId || busy) {
      return;
    }

    setBusy(true);
    setMessage('');

    try {
      const { data: payload } = await post(
        `/admin/page-v2-ai/pages/${encodeURIComponent(documentId)}/create-generation-job`,
        {},
      );
      const jobDocumentId = String(payload?.job_document_id || '').trim();

      if (!jobDocumentId) {
        throw new Error('Generation Job was created, but documentId was not returned.');
      }

      window.location.assign(adminEditUrl('api::generation-job.generation-job', jobDocumentId));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ fontWeight: 700 }}>AI generation</div>
      <p style={{ margin: 0 }}>
        Создает связанную Generation Job для этой Page и сразу открывает ее. Страница уже будет выбрана в target_page.
      </p>

      <button
        type="button"
        onClick={createJob}
        disabled={!documentId || busy}
        style={buttonStyle}
      >
        {busy ? 'Создаем задачу...' : 'Сгенерировать через AI'}
      </button>

      <div style={{ fontSize: 12, lineHeight: 1.5, color: '#64748b' }}>
        {documentId ? `Page: ${routePath || documentId}` : 'Сначала сохраните Page.'}
      </div>

      {message && <div style={{ fontSize: 13, lineHeight: 1.5 }}>{message}</div>}
    </div>
  );
};

const PageGenerationBridgePanel: PanelComponent = (props: PanelComponentProps) => {
  if (String(props.model) !== 'api::page-v2.page-v2') {
    return null as never;
  }

  return {
    title: 'AI Generation',
    content: <PageGenerationBridgePanelContent {...props} />,
  };
};

const GenerationJobActionsPanelContent = ({
  document,
  model,
}: PanelComponentProps) => {
  if (String(model) !== 'api::generation-job.generation-job') {
    return null;
  }

  const record = readDocument(document);
  const documentId = String(record.documentId || record.document_id || record.id || '').trim();
  const hasCandidate = Boolean(record.generated_draft && typeof record.generated_draft === 'object');
  const [busyAction, setBusyAction] = useState('');
  const [message, setMessage] = useState('');
  const { get, post } = useFetchClient();

  const openTargetPage = async () => {
    if (!documentId || busyAction) {
      return;
    }

    setBusyAction('/target-page');
    setMessage('');

    try {
      const { data: payload } = await get(
        `/admin/page-v2-ai/generation-jobs/${encodeURIComponent(documentId)}/target-page`,
      );
      const pageDocumentId = String(payload?.page_document_id || '').trim();

      if (!pageDocumentId) {
        throw new Error('Linked Page was not returned.');
      }

      window.location.assign(adminEditUrl('api::page-v2.page-v2', pageDocumentId));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusyAction('');
    }
  };

  const postAction = async (actionPath: string) => {
    if (!documentId || busyAction) {
      return;
    }

    setBusyAction(actionPath);
    setMessage('');

    try {
      const url = `/admin/page-v2-ai/generation-jobs/${encodeURIComponent(documentId)}${actionPath}`;
      const { data: payload } = actionPath === '/ai-preview'
        ? await get(url)
        : await post(url, {});

      if (payload?.preview_url) {
        window.open(payload.preview_url, '_blank', 'noopener,noreferrer');
      }

      setMessage(
        actionPath === '/run-ai'
          ? 'Генерация запущена. Откройте preview кандидата или обновите запись.'
          : 'Кандидат принят в Page. Откройте preview страницы в новой вкладке.',
      );

      window.setTimeout(() => window.location.reload(), 800);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusyAction('');
    }
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ fontWeight: 700 }}>AI draft flow</div>
      <p style={{ margin: 0 }}>
        Сначала запустите генерацию кандидата, затем откройте preview и только после проверки примите результат в Page.
      </p>

      <div style={{ display: 'grid', gap: 8 }}>
        <button
          type="button"
          onClick={() => postAction('/run-ai')}
          disabled={!documentId || Boolean(busyAction)}
          style={buttonStyle}
        >
          {busyAction === '/run-ai' ? 'Генерируем…' : 'Сгенерировать AI'}
        </button>

        <button
          type="button"
          onClick={() => postAction('/ai-preview')}
          disabled={!documentId || Boolean(busyAction) || !hasCandidate}
          style={buttonStyle}
        >
          Открыть preview кандидата
        </button>

        <button
          type="button"
          onClick={() => postAction('/apply-ai-draft')}
          disabled={!documentId || Boolean(busyAction) || !hasCandidate}
          style={buttonStyle}
        >
          {busyAction === '/apply-ai-draft' ? 'Применяем…' : 'Принять в Page'}
        </button>
        <button
          type="button"
          onClick={openTargetPage}
          disabled={!documentId || Boolean(busyAction)}
          style={secondaryButtonStyle}
        >
          {busyAction === '/target-page' ? 'Открываем Page...' : 'Вернуться к Page'}
        </button>
      </div>

      <div style={{ fontSize: 12, lineHeight: 1.5, color: '#64748b' }}>
        {documentId ? `Document ID: ${documentId}` : 'Document ID не найден.'}
      </div>

      {message && <div style={{ fontSize: 13, lineHeight: 1.5 }}>{message}</div>}
    </div>
  );
};

const GenerationJobActionsPanel: PanelComponent = (props: PanelComponentProps) => {
  if (String(props.model) !== 'api::generation-job.generation-job') {
    return null as never;
  }

  return {
    title: 'AI Draft',
    content: <GenerationJobActionsPanelContent {...props} />,
  };
};

const buttonStyle: CSSProperties = {
  appearance: 'none',
  border: '1px solid rgba(99, 102, 241, 0.45)',
  background: '#4f46e5',
  color: '#fff',
  borderRadius: 8,
  padding: '10px 12px',
  fontWeight: 700,
  cursor: 'pointer',
};

const secondaryButtonStyle: CSSProperties = {
  ...buttonStyle,
  background: 'transparent',
  color: '#4f46e5',
};

const fieldLabelStyle: CSSProperties = {
  display: 'grid',
  gap: 6,
  fontSize: 12,
  fontWeight: 700,
};

const inputStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid rgba(148, 163, 184, 0.35)',
  background: 'rgba(15, 23, 42, 0.08)',
  color: 'inherit',
  borderRadius: 8,
  padding: '9px 10px',
};

export default {
  config: {
    locales: ['ru', 'uk', 'en'],
  },
  bootstrap(app: StrapiApp) {
    app.getPlugin('content-manager').apis.addEditViewSidePanel((panels) => [
      PageDuplicatePanel,
      PageGenerationBridgePanel,
      GenerationJobActionsPanel,
      ModelGuidePanel,
      SyncStatusPanel,
      ...panels,
    ]);
  },
};
