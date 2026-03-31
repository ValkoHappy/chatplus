import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(process.cwd(), '..');

const scanTargets = [
  path.join(repoRoot, 'portal', 'src'),
  path.join(repoRoot, 'portal', 'public'),
  path.join(repoRoot, '.github', 'workflows'),
  path.join(repoRoot, 'scripts', 'seed-runtime-content.mjs'),
  path.join(repoRoot, 'cms', 'seed', 'generated'),
];

const textExtensions = new Set([
  '.astro',
  '.css',
  '.js',
  '.json',
  '.md',
  '.mjs',
  '.svg',
  '.ts',
  '.txt',
  '.yml',
  '.yaml',
]);

const suspectPatterns = [
  /РџР/g,
  /РЎР/g,
  /РђР/g,
  /РќР/g,
  /РўР/g,
  /РёР/g,
  /Р°Р/g,
  /СЃС/g,
  /С‚Р/g,
  /вЂ/g,
  /â€"/g,
  /â€”/g,
  /â€“/g,
  /â€¦/g,
  /�/g,
];

function walk(target, files = []) {
  if (!fs.existsSync(target)) {
    return files;
  }

  const stats = fs.statSync(target);
  if (stats.isFile()) {
    files.push(target);
    return files;
  }

  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    const fullPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
      continue;
    }

    if (entry.isFile() && textExtensions.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

function findSuspectLines(file) {
  const content = fs.readFileSync(file, 'utf8');
  const findings = [];
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    const matched = suspectPatterns.some((pattern) => pattern.test(line));
    if (!matched) {
      return;
    }

    findings.push({
      line: index + 1,
      preview: line.trim().slice(0, 160),
    });
  });

  return findings;
}

const files = scanTargets.flatMap((target) => walk(target));
const issues = [];

for (const file of files) {
  const findings = findSuspectLines(file);
  if (findings.length === 0) {
    continue;
  }

  issues.push({
    file: path.relative(repoRoot, file).replace(/\\/g, '/'),
    findings: findings.slice(0, 8),
  });
}

if (issues.length > 0) {
  console.error(`[encoding-check] suspect mojibake found in ${issues.length} file(s).`);
  for (const issue of issues) {
    console.error(`\n${issue.file}`);
    for (const finding of issue.findings) {
      console.error(`  L${finding.line}: ${finding.preview}`);
    }
  }
  process.exit(1);
}

console.log('[encoding-check] OK: no mojibake markers found in checked source files.');
