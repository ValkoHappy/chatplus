import type { StrapiApp } from '@strapi/strapi/admin';
import type { PanelComponent, PanelComponentProps } from '@strapi/content-manager/strapi-admin';

const CMS_MODELS = new Set([
  'api::landing-page.landing-page',
  'api::page-v2.page-v2',
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
          <strong>Последний import:</strong> {importedAt || 'еще не выполнялся'}
        </div>
      </div>
    ),
  };
};

export default {
  config: {
    locales: ['ru', 'uk', 'en'],
  },
  bootstrap(app: StrapiApp) {
    app.getPlugin('content-manager').apis.addEditViewSidePanel((panels) => [SyncStatusPanel, ...panels]);
  },
};
