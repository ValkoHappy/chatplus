import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ACTIVE_CANONICAL_TEMPLATE_KINDS,
  ACTIVE_PUBLIC_TEMPLATE_KINDS,
  CANONICAL_TEMPLATE_KINDS,
} from '../config/template-kinds.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readFile(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
}

function extractMatches(source, pattern) {
  return [...source.matchAll(pattern)].map((match) => match[1]);
}

function toSortedList(values) {
  return [...values].sort();
}

function assertSameSet(label, actualValues, expectedValues) {
  const actual = toSortedList(new Set(actualValues));
  const expected = toSortedList(new Set(expectedValues));

  if (actual.length !== expected.length || actual.some((value, index) => value !== expected[index])) {
    throw new Error(`${label} mismatch.\nExpected: ${expected.join(', ')}\nActual: ${actual.join(', ')}`);
  }
}

function main() {
  const templateContracts = readFile('docs/template-contracts.md');
  const routeOwnershipMatrix = readFile('docs/route-ownership-matrix.md');
  const pageTemplateMap = readFile('portal/src/lib/page-template-map.ts');

  const pageMapPublicKinds = extractMatches(pageTemplateMap, /template:\s*'([^']+)'/g);
  const pageMapCanonicalKinds = extractMatches(pageTemplateMap, /canonicalTemplate:\s*'([^']+)'/g);
  const templateContractHeadings = extractMatches(templateContracts, /^##\s+\d+\.\s+`([^`]+)`/gm);
  const routeMatrixKinds = routeOwnershipMatrix
    .split('\n')
    .filter((line) => line.trim().startsWith('|'))
    .filter((line) => !line.includes('---'))
    .map((line) => line.split('|').map((cell) => cell.trim()))
    .map((cells) => cells[2]?.replace(/^`|`$/g, '') || '')
    .filter((value) => ACTIVE_PUBLIC_TEMPLATE_KINDS.includes(value));
  const canonicalKindsInDocs = extractMatches(templateContracts, /template_kind = ([a-z_]+)/g);

  assertSameSet('page-template-map public templates', pageMapPublicKinds, ACTIVE_PUBLIC_TEMPLATE_KINDS);
  assertSameSet('page-template-map canonical templates', pageMapCanonicalKinds, ACTIVE_CANONICAL_TEMPLATE_KINDS);
  assertSameSet('template-contract headings', templateContractHeadings, ACTIVE_PUBLIC_TEMPLATE_KINDS);
  assertSameSet('route-ownership-matrix templates', routeMatrixKinds, ACTIVE_PUBLIC_TEMPLATE_KINDS);

  const invalidCanonicalKinds = canonicalKindsInDocs.filter((value) => !CANONICAL_TEMPLATE_KINDS.includes(value));
  if (invalidCanonicalKinds.length > 0) {
    throw new Error(`docs/template-contracts.md references unknown canonical template kinds: ${invalidCanonicalKinds.join(', ')}`);
  }

  console.log('docs-consistency OK');
}

main();
