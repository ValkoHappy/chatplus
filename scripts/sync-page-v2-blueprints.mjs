import { PAGE_V2_BLUEPRINTS } from '../config/page-v2-blueprints.mjs';

const STRAPI_URL = (process.env.STRAPI_URL || '').replace(/\/+$/, '');
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || '';

function parseArgs(argv = []) {
  const options = {
    apply: false,
    report: false,
  };

  for (const arg of argv) {
    if (arg === '--apply') options.apply = true;
    else if (arg === '--report') options.report = true;
  }

  return options;
}

function requireEnv() {
  if (!STRAPI_URL || !STRAPI_TOKEN) {
    throw new Error('STRAPI_URL and STRAPI_TOKEN are required to sync page blueprints.');
  }
}

async function request(path, init = {}) {
  const response = await fetch(`${STRAPI_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${STRAPI_TOKEN}`,
      ...(init.headers || {}),
    },
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${init.method || 'GET'} ${path} failed: ${response.status} ${JSON.stringify(json)}`);
  }

  return json;
}

function defaultSectionForBlock(blockType) {
  const base = {
    __component: `page-blocks.${blockType}`,
    title: '',
    intro: '',
  };

  if (blockType === 'hero') {
    return {
      __component: 'page-blocks.hero',
      eyebrow: '',
      title: '',
      subtitle: '',
      primary_label: '',
      primary_url: '',
    };
  }

  if (blockType === 'final-cta') {
    return {
      __component: 'page-blocks.final-cta',
      title: '',
      text: '',
      primary_label: '',
      primary_url: '',
    };
  }

  if (blockType === 'rich-text') {
    return {
      __component: 'page-blocks.rich-text',
      title: '',
      body: '',
    };
  }

  if (['cards-grid', 'feature-list', 'proof-stats', 'steps', 'faq', 'related-links', 'internal-links'].includes(blockType)) {
    return {
      ...base,
      items: [],
      links: blockType.includes('links') ? [] : undefined,
    };
  }

  return base;
}

function toBlueprintPayload(blueprint) {
  return {
    blueprint_id: blueprint.id,
    page_kind: blueprint.pageKind,
    template_variant: blueprint.templateVariant,
    required_blocks: blueprint.requiredBlocks,
    allowed_blocks: blueprint.allowedBlocks,
    default_sections: blueprint.requiredBlocks.map((blockType) => defaultSectionForBlock(blockType)),
    description: `Blueprint ${blueprint.id} for ${blueprint.pageKind} pages.`,
    is_active: true,
  };
}

async function fetchBlueprint(blueprintId) {
  const result = await request(`/api/page-blueprints?filters[blueprint_id][$eq]=${encodeURIComponent(blueprintId)}`);
  return result?.data?.[0] || null;
}

async function upsertBlueprint(payload) {
  const existing = await fetchBlueprint(payload.blueprint_id);
  if (!existing) {
    const created = await request('/api/page-blueprints', {
      method: 'POST',
      body: JSON.stringify({ data: payload }),
    });

    return {
      action: 'created',
      blueprint_id: payload.blueprint_id,
      documentId: created?.data?.documentId || created?.data?.id || null,
    };
  }

  const key = existing.documentId || existing.id;
  await request(`/api/page-blueprints/${key}`, {
    method: 'PUT',
    body: JSON.stringify({ data: payload }),
  });

  return {
    action: 'updated',
    blueprint_id: payload.blueprint_id,
    documentId: key,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const payloads = Object.values(PAGE_V2_BLUEPRINTS).map((blueprint) => toBlueprintPayload(blueprint));

  if (options.report || !options.apply) {
    console.log(JSON.stringify({
      apply: options.apply,
      blueprints: payloads.map((payload) => ({
        blueprint_id: payload.blueprint_id,
        page_kind: payload.page_kind,
        template_variant: payload.template_variant,
        required_blocks: payload.required_blocks,
        allowed_blocks: payload.allowed_blocks,
      })),
    }, null, 2));
  }

  if (!options.apply) {
    return;
  }

  requireEnv();
  const results = [];
  for (const payload of payloads) {
    results.push(await upsertBlueprint(payload));
  }

  console.log(JSON.stringify({ ok: true, results }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
