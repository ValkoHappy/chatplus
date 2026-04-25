import assert from 'node:assert/strict';
import test from 'node:test';

import {
  extractChunks,
  normalizeRoute,
  parseArgs,
  summarize,
} from '../scripts/report-legacy-html-parity.mjs';

test('legacy html parity parseArgs reads routes and origins', () => {
  const options = parseArgs([
    '--old-origin=https://old.example.com/',
    '--routes=/tv,/pricing/',
    '--problems',
    '--json',
    '--max-routes=2',
  ]);

  assert.equal(options.oldOrigin, 'https://old.example.com');
  assert.deepEqual(options.routes, ['/tv', '/pricing']);
  assert.equal(options.problemsOnly, true);
  assert.equal(options.json, true);
  assert.equal(options.maxRoutes, 2);
});

test('legacy html parity extracts meaningful main-content chunks', () => {
  const chunks = extractChunks(`
    <header><a>Попробовать</a></header>
    <main>
      <section>
        <h2>Что мешает бизнесу эффективно работать с клиентами</h2>
        <p>Клиенты пишут в разные каналы — команда теряет заявки</p>
        <p>AI закрывает типовые запросы и передаёт горячих клиентов нужному менеджеру.</p>
      </section>
    </main>
    <footer>© 2026 Chat Plus</footer>
  `);

  assert.ok(chunks.includes('Что мешает бизнесу эффективно работать с клиентами'));
  assert.ok(chunks.includes('Клиенты пишут в разные каналы — команда теряет заявки'));
  assert.ok(!chunks.includes('Попробовать'));
});

test('legacy html parity summarize counts comparable problem rows', () => {
  const summary = summarize([
    { routePath: '/tv', localExists: true, legacyStatus: 200, missingCount: 2, coverage: 0.8 },
    { routePath: '/pricing', localExists: true, legacyStatus: 200, missingCount: 0, coverage: 1 },
    { routePath: '/missing', localExists: false, legacyStatus: 200, missingCount: 0, coverage: 0 },
  ]);

  assert.equal(summary.total, 3);
  assert.equal(summary.comparable, 2);
  assert.equal(summary.missingLocal, 1);
  assert.equal(summary.withMissingChunks, 1);
  assert.equal(summary.missingChunks, 2);
});

test('legacy html parity normalizes route slashes', () => {
  assert.equal(normalizeRoute('/tv/'), '/tv');
  assert.equal(normalizeRoute(''), '/');
});
