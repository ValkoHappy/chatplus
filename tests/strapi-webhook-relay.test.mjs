import assert from 'node:assert/strict';
import test from 'node:test';

import { createRelayServer } from '../scripts/strapi-webhook-relay.mjs';

async function startRelay(overrides = {}) {
  const dispatchCalls = [];
  const server = createRelayServer({
    relayToken: 'relay-token',
    dispatchTarget: 'github',
    githubToken: 'github-token',
    githubRepo: 'ValkoHappy/chatplus',
    dispatchEvent: 'strapi-content-publish',
    allowedModels: new Set(['landing-page', 'competitor']),
    duplicateWindowMs: 10_000,
    dispatchFn: async (payload) => {
      dispatchCalls.push(payload);
    },
    ...overrides,
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;

  return {
    server,
    dispatchCalls,
    url: `http://127.0.0.1:${port}/strapi/publish`,
    async close() {
      await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    },
  };
}

test('relay rejects unauthorized requests', async () => {
  const relay = await startRelay();

  try {
    const response = await fetch(relay.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: 'landing-page', event: 'entry.publish', entry: { id: 1 } }),
    });

    assert.equal(response.status, 401);
    assert.deepEqual(relay.dispatchCalls, []);
  } finally {
    await relay.close();
  }
});

test('relay skips models that are not tracked', async () => {
  const relay = await startRelay();

  try {
    const response = await fetch(relay.url, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer relay-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: 'untracked-model', event: 'entry.publish', entry: { id: 1 } }),
    });

    const body = await response.json();
    assert.equal(response.status, 202);
    assert.equal(body.skipped, true);
    assert.equal(body.reason, 'Model not tracked');
    assert.deepEqual(relay.dispatchCalls, []);
  } finally {
    await relay.close();
  }
});

test('relay dispatches a tracked publish event once', async () => {
  const relay = await startRelay();

  try {
    const response = await fetch(relay.url, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer relay-token',
        'Content-Type': 'application/json',
        'X-Strapi-Event': 'entry.publish',
      },
      body: JSON.stringify({ model: 'landing-page', event: 'entry.publish', entry: { id: 17 } }),
    });

    const body = await response.json();
    assert.equal(response.status, 202);
    assert.equal(body.dispatched, true);
    assert.equal(relay.dispatchCalls.length, 1);
    assert.equal(relay.dispatchCalls[0].body.event_type, 'strapi-content-publish');
    assert.equal(relay.dispatchCalls[0].body.client_payload.model, 'landing-page');
    assert.equal(relay.dispatchCalls[0].body.client_payload.entry.id, 17);
  } finally {
    await relay.close();
  }
});

test('relay skips duplicate deliveries inside dedupe window', async () => {
  const relay = await startRelay();

  try {
    const requestInit = {
      method: 'POST',
      headers: {
        Authorization: 'Bearer relay-token',
        'Content-Type': 'application/json',
        'X-Strapi-Event': 'entry.publish',
      },
      body: JSON.stringify({ model: 'competitor', event: 'entry.publish', entry: { id: 44 } }),
    };

    const first = await fetch(relay.url, requestInit);
    const firstBody = await first.json();
    const second = await fetch(relay.url, requestInit);
    const secondBody = await second.json();

    assert.equal(first.status, 202);
    assert.equal(firstBody.dispatched, true);
    assert.equal(second.status, 202);
    assert.equal(secondBody.skipped, true);
    assert.equal(secondBody.reason, 'Duplicate event');
    assert.equal(relay.dispatchCalls.length, 1);
  } finally {
    await relay.close();
  }
});

test('relay reports upstream dispatch failures separately', async () => {
  const relay = await startRelay({
    dispatchFn: async () => {
      throw new Error('GitHub dispatch failed: 500 boom');
    },
  });

  try {
    const response = await fetch(relay.url, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer relay-token',
        'Content-Type': 'application/json',
        'X-Strapi-Event': 'entry.publish',
      },
      body: JSON.stringify({ model: 'landing-page', event: 'entry.publish', entry: { id: 88 } }),
    });

    const body = await response.json();
    assert.equal(response.status, 502);
    assert.equal(body.ok, false);
    assert.match(body.error, /GitHub dispatch failed/);
  } finally {
    await relay.close();
  }
});

test('relay supports local dispatch mode without github token', async () => {
  const relay = await startRelay({
    dispatchTarget: 'local',
    localCommand: 'bash /srv/chatplus/deploy/scripts/build-portal.sh',
    githubToken: '',
  });

  try {
    const response = await fetch(relay.url, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer relay-token',
        'Content-Type': 'application/json',
        'X-Strapi-Event': 'entry.publish',
      },
      body: JSON.stringify({ model: 'landing-page', event: 'entry.publish', entry: { id: 91 } }),
    });

    const body = await response.json();
    assert.equal(response.status, 202);
    assert.equal(body.dispatched, true);
    assert.equal(relay.dispatchCalls.length, 1);
    assert.equal(relay.dispatchCalls[0].localCommand, 'bash /srv/chatplus/deploy/scripts/build-portal.sh');
    assert.equal(relay.dispatchCalls[0].dispatchTarget, 'local');
  } finally {
    await relay.close();
  }
});
