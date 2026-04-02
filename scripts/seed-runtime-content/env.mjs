import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

export function loadEnv() {
  try {
    const env = readFileSync(resolve('.env'), 'utf-8');
    return Object.fromEntries(
      env
        .split(/\r?\n/)
        .filter(Boolean)
        .filter(line => !line.trim().startsWith('#'))
        .map(line => {
          const index = line.indexOf('=');
          return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
        })
    );
  } catch {
    return {};
  }
}

export function loadArrayFromJson(relativePath) {
  const generatedPath = relativePath.replace('cms/seed/', 'cms/seed/generated/');
  if (existsSync(resolve(generatedPath))) {
    console.log(`\n→ Используем generated JSON: ${generatedPath}`);
    return JSON.parse(readFileSync(resolve(generatedPath), 'utf-8'));
  }
  return JSON.parse(readFileSync(resolve(relativePath), 'utf-8'));
}

export function loadJsonIfExists(relativePath) {
  if (!existsSync(resolve(relativePath))) {
    return null;
  }

  console.log(`\n→ Используем managed JSON: ${relativePath}`);
  return JSON.parse(readFileSync(resolve(relativePath), 'utf-8'));
}
