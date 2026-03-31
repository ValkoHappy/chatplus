import { spawnSync } from 'node:child_process';
import path from 'node:path';

const env = {
  ...process.env,
  PUBLIC_SITE_URL: 'https://valkohappy.github.io/chatplus',
  PUBLIC_BASE_PATH: '/chatplus',
};

const steps = [
  [process.execPath, [path.resolve('node_modules/astro/bin/astro.mjs'), 'build']],
  [process.execPath, [path.resolve('scripts/check-internal-links.mjs')]],
  [process.execPath, [path.resolve('scripts/check-encoding.mjs')]],
];

for (const [command, args] of steps) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    stdio: 'inherit',
    env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
