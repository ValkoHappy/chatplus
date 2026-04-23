import { pathToFileURL } from 'node:url';

function getConfig(env = process.env) {
  return {
    strapiUrl: (env.STRAPI_URL || '').replace(/\/+$/, ''),
    strapiToken: env.STRAPI_TOKEN || '',
  };
}

export function parseArgs(argv = []) {
  const options = {
    json: false,
    timeoutMs: 15000,
  };

  for (const arg of argv) {
    if (arg === '--json') {
      options.json = true;
    } else if (arg.startsWith('--timeout-ms=')) {
      const value = Number(arg.split('=')[1]);
      if (Number.isFinite(value) && value > 0) {
        options.timeoutMs = value;
      }
    }
  }

  return options;
}

export function classifyCheck(check) {
  if (check.ok) {
    return 'ok';
  }

  return check.required ? 'failed' : 'warning';
}

function summarizeChecks(checks) {
  const counts = {
    ok: 0,
    warning: 0,
    failed: 0,
  };

  for (const check of checks) {
    counts[classifyCheck(check)] += 1;
  }

  return counts;
}

function formatCheckLine(check) {
  const status = classifyCheck(check);
  const marker = status === 'ok' ? '[ok]' : status === 'warning' ? '[warn]' : '[fail]';
  const detail = check.detail ? ` - ${check.detail}` : '';
  return `${marker} ${check.name}${detail}`;
}

async function request(url, init = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function runChecks(options, env = process.env) {
  const { strapiUrl, strapiToken } = getConfig(env);

  if (!strapiUrl) {
    throw new Error('STRAPI_URL is required. Example: https://strapi.example.com');
  }

  const checks = [];

  try {
    const response = await request(`${strapiUrl}/admin`, {}, options.timeoutMs);
    checks.push({
      name: 'Live Strapi admin endpoint',
      ok: response.ok,
      required: true,
      detail: `GET /admin -> ${response.status}`,
    });
  } catch (error) {
    checks.push({
      name: 'Live Strapi admin endpoint',
      ok: false,
      required: true,
      detail: error instanceof Error ? error.message : String(error),
    });
  }

  if (!strapiToken) {
    checks.push({
      name: 'STRAPI_TOKEN configured',
      ok: false,
      required: true,
      detail: 'Token is missing, so readiness cannot confirm page_v2 and generation_job API availability.',
    });

    return checks;
  }

  checks.push({
    name: 'STRAPI_TOKEN configured',
    ok: true,
    required: true,
    detail: 'Token is present, API checks enabled.',
  });

  const apiChecks = [
    {
      name: 'page_v2 collection endpoint',
      path: '/api/page-v2s?pagination[pageSize]=1&fields[0]=route_path',
      required: true,
    },
    {
      name: 'generation_job collection endpoint',
      path: '/api/generation-jobs?pagination[pageSize]=1&fields[0]=job_type',
      required: true,
    },
  ];

  for (const apiCheck of apiChecks) {
    try {
      const response = await request(`${strapiUrl}${apiCheck.path}`, {
        headers: {
          Authorization: `Bearer ${strapiToken}`,
        },
      }, options.timeoutMs);

      const body = await response.text().catch(() => '');
      let detail = `GET ${apiCheck.path} -> ${response.status}`;

      if (!response.ok && body) {
        detail += ` ${body.slice(0, 180)}`;
      }

      checks.push({
        name: apiCheck.name,
        ok: response.ok,
        required: apiCheck.required,
        detail,
      });
    } catch (error) {
      checks.push({
        name: apiCheck.name,
        ok: false,
        required: apiCheck.required,
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return checks;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const { strapiUrl } = getConfig();
  const checks = await runChecks(options);
  const summary = summarizeChecks(checks);
  const result = {
    ok: summary.failed === 0,
    strapiUrl,
    checks,
    summary,
  };

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('Проверка готовности live Strapi к manual-first migration:');
    for (const check of checks) {
      console.log(formatCheckLine(check));
    }
    console.log(JSON.stringify(summary, null, 2));
  }

  if (!result.ok) {
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
