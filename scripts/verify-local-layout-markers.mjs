import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { runBulkCutover } from './bulk-local-page-v2-cutover.mjs';

const DEFAULT_CASES = Object.freeze([
  { route: '/', marker: 'hero-dots' },
  { route: '/promo', marker: 'campaign-hero' },
  { route: '/pricing', marker: 'hero-panel' },
  { route: '/docs', marker: 'hub-hero' },
  { route: '/media', marker: 'brand-hero' },
  { route: '/channels', marker: 'dir-hero' },
  { route: '/channels/email/amocrm', marker: 'hero-section' },
  { route: '/compare', marker: 'compare-hero' },
  { route: '/compare/intercom', marker: 'compare-hero' },
  { route: '/vs/intercom', marker: 'compare-hero' },
  { route: '/solutions/tenders', marker: 'hero-window' },
  { route: '/site-map', marker: 'site-map-hero' },
  { route: '/features/ai-calendar', marker: 'mockup-card' },
]);

export function parseArgs(argv = []) {
  const options = {
    routes: DEFAULT_CASES.map((item) => item.route),
    keepApproved: false,
    json: false,
    skipBuild: false,
  };

  for (const arg of argv) {
    if (arg === '--keep-approved') {
      options.keepApproved = true;
      continue;
    }

    if (arg === '--json') {
      options.json = true;
      continue;
    }

    if (arg === '--skip-build') {
      options.skipBuild = true;
      continue;
    }

    if (arg.startsWith('--routes=')) {
      const value = arg.split('=')[1] || '';
      const routes = value.split(',').map((item) => item.trim()).filter(Boolean);
      if (routes.length > 0) {
        options.routes = routes;
      }
    }
  }

  return options;
}

export function routeToDistFile(route) {
  if (route === '/') {
    return path.join('portal', 'dist', 'index.html');
  }

  const clean = `${route || ''}`.replace(/^\/+/, '').replace(/\/+$/, '');
  return path.join('portal', 'dist', clean, 'index.html');
}

function runCommand(command, args, cwd = process.cwd()) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: 'pipe',
  });

  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || `${command} ${args.join(' ')} failed`).trim());
  }

  return (result.stdout || '').trim();
}

function runNpm(args) {
  if (process.platform === 'win32') {
    return runCommand('cmd.exe', ['/d', '/s', '/c', ['npm.cmd', ...args].join(' ')]);
  }

  return runCommand('npm', args);
}

export async function runLayoutMarkerSmoke(options = {}) {
  const selectedRoutes = new Set(options.routes?.length ? options.routes : DEFAULT_CASES.map((item) => item.route));
  const cases = DEFAULT_CASES.filter((item) => selectedRoutes.has(item.route));
  const routes = cases.map((item) => item.route);
  const results = [];
  let didPrepareCutover = false;

  if (options.skipBuild && !existsSync(routeToDistFile('/'))) {
    throw new Error('portal/dist is missing. Run npm.cmd --prefix portal run build before --skip-build.');
  }

  try {
    if (!options.skipBuild) {
      await runBulkCutover({
        activateAllSafe: true,
        routes,
      });
      didPrepareCutover = true;

      runNpm(['--prefix', 'portal', 'run', 'build']);
    }

    for (const item of cases) {
      const filePath = routeToDistFile(item.route);
      if (!existsSync(filePath)) {
        results.push({ route: item.route, ok: false, reason: `Missing built file: ${filePath}` });
        continue;
      }

      const html = readFileSync(filePath, 'utf8');
      const hasMarker = html.includes(item.marker);
      const hasGenericShell = html.includes('pagev2-shell');

      results.push({
        route: item.route,
        marker: item.marker,
        ok: hasMarker && !hasGenericShell,
        hasMarker,
        hasGenericShell,
        filePath,
      });
    }
  } finally {
    if (didPrepareCutover && !options.keepApproved) {
      await runBulkCutover({
        rollbackAll: true,
        routes,
      }).catch(() => null);
    }
  }

  return {
    ok: results.every((item) => item.ok),
    routes: results,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = await runLayoutMarkerSmoke(options);
  console.log(JSON.stringify(result, null, 2));
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
