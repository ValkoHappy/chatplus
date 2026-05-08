import { factories } from '@strapi/strapi';

const LEAD_REQUEST_UID = 'api::lead-request.lead-request' as any;
const SITE_SETTING_UID = 'api::site-setting.site-setting' as any;

type LeadField = {
  key?: string;
  label?: string;
  type?: string;
  required?: boolean;
};

const DEFAULT_LEAD_FIELDS: LeadField[] = [
  { key: 'name', required: true },
  { key: 'phone', required: true },
  { key: 'email', required: false },
  { key: 'message', required: false },
];

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeKey(value: unknown) {
  return asString(value)
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 48);
}

function normalizeValue(value: unknown) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return value.trim().slice(0, 2000);
  return '';
}

function normalizeAttribution(value: unknown) {
  const attribution = asRecord(value);
  const rawUtm = asRecord(attribution.utm);
  const utm: Record<string, string> = {};

  for (const [rawKey, rawValue] of Object.entries(rawUtm)) {
    const key = normalizeKey(rawKey);
    if (!key) continue;
    if (!key.startsWith('utm_') && key !== 'gclid' && key !== 'yclid') continue;
    const normalizedValue = normalizeValue(rawValue);
    if (typeof normalizedValue === 'string' && normalizedValue) {
      utm[key] = normalizedValue.slice(0, 500);
    }
  }

  return {
    source_url: asString(attribution.source_url).slice(0, 2000),
    source_query: asString(attribution.source_query).slice(0, 1000),
    referrer: asString(attribution.referrer).slice(0, 2000),
    utm,
  };
}

function getClientIp(ctx: any) {
  const forwarded = asString(ctx.request?.headers?.['x-forwarded-for']);
  return forwarded.split(',')[0]?.trim() || asString(ctx.request?.ip);
}

export default factories.createCoreController(LEAD_REQUEST_UID, ({ strapi }) => ({
  async submit(ctx) {
    const body = asRecord(ctx.request?.body);
    const honeypot = asString(body.website);
    if (honeypot) {
      ctx.body = { ok: true };
      return;
    }

    const submittedFields = asRecord(body.fields);
    const settings = await strapi.documents(SITE_SETTING_UID).findFirst({
      status: 'published',
      populate: ['lead_form_fields'],
    });
    const configuredFields = Array.isArray(settings?.lead_form_fields) && settings.lead_form_fields.length > 0
      ? settings.lead_form_fields as LeadField[]
      : DEFAULT_LEAD_FIELDS;

    const allowedKeys = configuredFields
      .map((field) => normalizeKey(field.key))
      .filter(Boolean);
    const requiredFields = configuredFields
      .filter((field) => field.required)
      .map((field) => normalizeKey(field.key))
      .filter(Boolean);

    const payload: Record<string, string | boolean> = {};
    for (const [rawKey, rawValue] of Object.entries(submittedFields)) {
      const key = normalizeKey(rawKey);
      if (!key) continue;
      if (allowedKeys.length > 0 && !allowedKeys.includes(key)) continue;
      payload[key] = normalizeValue(rawValue);
    }

    const missing = requiredFields.filter((key) => {
      const value = payload[key];
      return value === undefined || value === '' || value === false;
    });
    if (missing.length > 0) {
      ctx.status = 400;
      ctx.body = { ok: false, error: 'required_fields_missing', fields: missing };
      return;
    }

    if (Object.keys(payload).length === 0) {
      ctx.status = 400;
      ctx.body = { ok: false, error: 'empty_payload' };
      return;
    }

    const email = asString(payload.email);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      ctx.status = 400;
      ctx.body = { ok: false, error: 'invalid_email', fields: ['email'] };
      return;
    }

    const requestKey = `${getClientIp(ctx)}:${asString(body.source_path)}`;
    strapi.log.info(`lead_request.submit ${requestKey}`);
    const attribution = normalizeAttribution(body.attribution);

    const lead = await strapi.documents(LEAD_REQUEST_UID).create({
      data: {
        status: 'new',
        name: asString(payload.name),
        phone: asString(payload.phone),
        email,
        company: asString(payload.company),
        message: asString(payload.message),
        source_path: asString(body.source_path).slice(0, 500),
        source_url: attribution.source_url,
        source_query: attribution.source_query,
        referrer: attribution.referrer,
        utm: attribution.utm,
        source_title: asString(body.source_title).slice(0, 500),
        form_id: asString(body.form_id).slice(0, 120) || 'global-lead-form',
        payload: {
          ...payload,
          _attribution: attribution,
        },
        submitted_at: new Date().toISOString(),
        user_agent: asString(ctx.request?.headers?.['user-agent']).slice(0, 1000),
      },
    });

    ctx.body = { ok: true, id: lead.documentId || lead.id };
  },
}));
