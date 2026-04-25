import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const DEFAULT_ROUTES = Object.freeze(['/promo', '/pricing', '/compare', '/channels/email/amocrm']);

export function parseArgs(argv = []) {
  const options = {
    baseUrl: 'http://127.0.0.1:4321',
    routes: [...DEFAULT_ROUTES],
    json: false,
  };

  for (const arg of argv) {
    if (arg === '--json') {
      options.json = true;
      continue;
    }

    if (arg.startsWith('--base-url=')) {
      const value = arg.split('=')[1] || '';
      if (value) {
        options.baseUrl = value.replace(/\/+$/, '');
      }
      continue;
    }

    if (arg.startsWith('--routes=')) {
      const value = arg.split('=')[1] || '';
      const routes = value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      if (routes.length > 0) {
        options.routes = routes;
      }
    }
  }

  return options;
}

export function buildMaterializeArgs(route, action) {
  const base = ['run', 'page-v2:materialize', '--', `--route=${route}`];
  if (action === 'publish') {
    return [...base, '--publish'];
  }
  if (action === 'approve') {
    return [...base, '--approve'];
  }
  if (action === 'mark-not-ready') {
    return [...base, '--mark-not-ready'];
  }
  if (action === 'unpublish') {
    return [...base, '--unpublish'];
  }
  throw new Error(`Unsupported action: ${action}`);
}

function runNpmCommand(args) {
  const result = process.platform === 'win32'
    ? spawnSync('cmd.exe', ['/d', '/s', '/c', ['npm.cmd', ...args].join(' ')], {
        cwd: process.cwd(),
        encoding: 'utf8',
        stdio: 'pipe',
      })
    : spawnSync('npm', args, {
        cwd: process.cwd(),
        encoding: 'utf8',
        stdio: 'pipe',
      });

  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || `Command failed: npm ${args.join(' ')}`).trim());
  }

  return (result.stdout || '').trim();
}

async function requestStatus(url) {
  const response = await fetch(url, { redirect: 'manual' });
  return response.status;
}

export async function runCutoverSmoke(options = {}) {
  const results = [];

  for (const route of options.routes || DEFAULT_ROUTES) {
    const routeUrl = `${(options.baseUrl || 'http://127.0.0.1:4321').replace(/\/+$/, '')}${route}`;
    const item = {
      route,
      checks: [],
    };

    try {
      runNpmCommand(buildMaterializeArgs(route, 'publish'));
      item.checks.push({ step: 'publish', ok: true });

      runNpmCommand(buildMaterializeArgs(route, 'approve'));
      item.checks.push({ step: 'approve', ok: true });

      const visibleStatus = await requestStatus(routeUrl);
      item.checks.push({ step: 'visible_status', ok: visibleStatus === 200, status: visibleStatus });

      runNpmCommand(buildMaterializeArgs(route, 'mark-not-ready'));
      item.checks.push({ step: 'mark_not_ready', ok: true });

      const fallbackStatus = await requestStatus(routeUrl);
      item.checks.push({ step: 'fallback_status', ok: fallbackStatus === 200, status: fallbackStatus });

      runNpmCommand(buildMaterializeArgs(route, 'unpublish'));
      item.checks.push({ step: 'unpublish', ok: true });
    } catch (error) {
      item.error = error instanceof Error ? error.message : String(error);
    }

    results.push(item);
  }

  return {
    ok: results.every((item) => !item.error && item.checks.every((check) => check.ok)),
    baseUrl: options.baseUrl || 'http://127.0.0.1:4321',
    routes: results,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = await runCutoverSmoke(options);

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(JSON.stringify(result, null, 2));
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
