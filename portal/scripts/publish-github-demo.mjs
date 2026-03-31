import fs from 'node:fs';
import path from 'node:path';

const portalRoot = process.cwd();
const distDir = path.join(portalRoot, 'dist');
const targetDir = path.resolve(portalRoot, '..', 'pages-preview');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function emptyDir(dir) {
  if (!fs.existsSync(dir)) return;
  fs.rmSync(dir, { recursive: true, force: true });
}

function copyDir(source, target) {
  ensureDir(target);

  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name);
    const to = path.join(target, entry.name);

    if (entry.isDirectory()) {
      copyDir(from, to);
      continue;
    }

    fs.copyFileSync(from, to);
  }
}

if (!fs.existsSync(distDir)) {
  console.error('Build output not found. Run `npm run build:github-demo` first.');
  process.exit(1);
}

emptyDir(targetDir);
copyDir(distDir, targetDir);

const cnamePath = path.join(targetDir, 'CNAME');
if (fs.existsSync(cnamePath)) {
  fs.rmSync(cnamePath, { force: true });
}

fs.writeFileSync(path.join(targetDir, '.nojekyll'), '', 'utf8');

console.log(`[github-demo] Snapshot exported to ${targetDir}`);
