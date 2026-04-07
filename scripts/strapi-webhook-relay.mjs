import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';

function nowMs() {
  return Date.now();
}

function normalizeAllowedModels(value) {
  return new Set(
    (value || 'landing-page,tenders-page,business-types-page,site-setting,competitor,solution,channel,industry,integration,feature,business-type')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

export function buildRelayConfig(env = process.env) {
  const localCommand = (env.RELAY_LOCAL_COMMAND || '').trim();
  const dispatchTarget = env.RELAY_DISPATCH_TARGET || (localCommand ? 'local' : 'github');

  return {
    port: Number(env.RELAY_PORT || 8787),
    relayToken: env.WEBHOOK_TOKEN || '',
    dispatchTarget,
    localCommand,
    githubToken: env.GITHUB_ACTIONS_TOKEN || env.GITHUB_TOKEN || '',
    githubRepo: env.GITHUB_REPOSITORY || 'ValkoHappy/chatplus',
    dispatchEvent: env.GITHUB_DISPATCH_EVENT || 'strapi-content-publish',
    allowedModels: normalizeAllowedModels(env.RELAY_ALLOWED_MODELS),
    duplicateWindowMs: Number(env.RELAY_DUPLICATE_WINDOW_MS || 60_000),
  };
}

export function buildDispatchPayload(payload, headers, dispatchEvent, fingerprint) {
  return {
    event_type: dispatchEvent,
    client_payload: {
      source: 'strapi-webhook-relay',
      fingerprint,
      strapi_event: headers['x-strapi-event'] || payload.event || 'unknown',
      model: payload.model || 'unknown',
      entry: payload.entry || null,
    },
  };
}

export function createEventFingerprint(payload, headers) {
  const raw = JSON.stringify({
    event: headers['x-strapi-event'] || payload.event || 'unknown',
    model: payload.model || 'unknown',
    entryId: payload.entry?.id ?? null,
    documentId: payload.entry?.documentId ?? null,
    slug: payload.entry?.slug ?? null,
  });

  return createHash('sha256').update(raw).digest('hex');
}

export function createDeduper(ttlMs) {
  const seen = new Map();

  return {
    has(fingerprint) {
      const expiresAt = seen.get(fingerprint);
      if (!expiresAt) {
        return false;
      }

      if (expiresAt <= nowMs()) {
        seen.delete(fingerprint);
        return false;
      }

      return true;
    },
    remember(fingerprint) {
      seen.set(fingerprint, nowMs() + ttlMs);
    },
    prune() {
      const current = nowMs();
      for (const [fingerprint, expiresAt] of seen.entries()) {
        if (expiresAt <= current) {
          seen.delete(fingerprint);
        }
      }
    },
  };
}

export async function defaultDispatchFn({ githubToken, githubRepo, body }) {
  const response = await fetch(`https://api.github.com/repos/${githubRepo}/dispatches`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'chatplus-strapi-relay',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub dispatch failed: ${response.status} ${errorText}`);
  }
}

function trimLogOutput(value, limit = 4000) {
  if (!value) {
    return '';
  }

  return value.length > limit ? value.slice(-limit) : value;
}

export async function defaultLocalDispatchFn({ localCommand }) {
  await new Promise((resolve, reject) => {
    const child = spawn('/bin/sh', ['-lc', localCommand], {
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      const details = trimLogOutput(stderr || stdout);
      reject(new Error(`Local deploy command failed (${code}): ${details || 'no output'}`));
    });
  });
}

function createDispatchQueue(dispatchFn) {
  let tail = Promise.resolve();

  return async (payload) => {
    const run = () => dispatchFn(payload);
    const current = tail.then(run, run);
    tail = current.catch(() => {});
    return current;
  };
}

function isDispatchConfigured(config) {
  if (!config.relayToken) {
    return false;
  }

  if (config.dispatchTarget === 'local') {
    return Boolean(config.localCommand);
  }

  return Boolean(config.githubToken);
}

function createDefaultDispatchFn(config) {
  if (config.dispatchTarget === 'local') {
    return async (payload) => defaultLocalDispatchFn({
      localCommand: config.localCommand,
      ...payload,
    });
  }

  return async (payload) => defaultDispatchFn({
    githubToken: config.githubToken,
    githubRepo: config.githubRepo,
    ...payload,
  });
}

function logRelay(level, message, details = {}) {
  const line = JSON.stringify({
    level,
    message,
    ...details,
  });

  if (level === 'error') {
    console.error(line);
    return;
  }

  console.log(line);
}

async function readJsonBody(req) {
  let rawBody = '';

  await new Promise((resolve, reject) => {
    req.on('data', (chunk) => {
      rawBody += chunk.toString();
    });
    req.on('end', resolve);
    req.on('error', reject);
  });

  if (!rawBody) {
    return {};
  }

  try {
    return JSON.parse(rawBody);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid JSON payload: ${message}`);
  }
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

export function createRelayServer(options = {}) {
  const config = {
    ...buildRelayConfig(),
    ...options,
  };
  const deduper = config.deduper || createDeduper(config.duplicateWindowMs);
  const dispatchFn = config.dispatchFn || createDefaultDispatchFn(config);
  const queuedDispatchFn = config.queuedDispatchFn || createDispatchQueue(dispatchFn);

  return createServer(async (req, res) => {
    if (req.method !== 'POST' || req.url !== '/strapi/publish') {
      sendJson(res, 404, { ok: false, error: 'Not found' });
      return;
    }

    if (!isDispatchConfigured(config)) {
      logRelay('error', 'relay.misconfigured', {
        hasRelayToken: Boolean(config.relayToken),
        dispatchTarget: config.dispatchTarget,
        hasLocalCommand: Boolean(config.localCommand),
        hasGithubToken: Boolean(config.githubToken),
      });
      sendJson(res, 500, { ok: false, error: 'Relay is missing required secrets' });
      return;
    }

    const authHeader = req.headers.authorization || '';
    if (authHeader !== `Bearer ${config.relayToken}`) {
      logRelay('warn', 'relay.unauthorized', {
        remoteAddress: req.socket.remoteAddress || 'unknown',
      });
      sendJson(res, 401, { ok: false, error: 'Unauthorized' });
      return;
    }

    try {
      deduper.prune();
      const payload = await readJsonBody(req);
      const model = String(payload.model || '');
      const event = String(payload.event || req.headers['x-strapi-event'] || 'unknown');
      const fingerprint = createEventFingerprint(payload, req.headers);

      if (!config.allowedModels.has(model)) {
        logRelay('info', 'relay.skipped.untracked_model', { model, event, fingerprint });
        sendJson(res, 202, { ok: true, skipped: true, reason: 'Model not tracked', model, event });
        return;
      }

      if (deduper.has(fingerprint)) {
        logRelay('info', 'relay.skipped.duplicate', { model, event, fingerprint });
        sendJson(res, 202, { ok: true, skipped: true, reason: 'Duplicate event', model, event, fingerprint });
        return;
      }

      const body = buildDispatchPayload(payload, req.headers, config.dispatchEvent, fingerprint);
      await queuedDispatchFn({
        body,
        dispatchTarget: config.dispatchTarget,
        githubToken: config.githubToken,
        githubRepo: config.githubRepo,
        localCommand: config.localCommand,
        payload,
        headers: req.headers,
      });

      deduper.remember(fingerprint);
      logRelay('info', 'relay.dispatched', {
        model,
        event,
        fingerprint,
        dispatchTarget: config.dispatchTarget,
        dispatchEvent: config.dispatchEvent,
        githubRepo: config.githubRepo,
      });
      sendJson(res, 202, { ok: true, dispatched: true, model, event, fingerprint });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const status = message.startsWith('GitHub dispatch failed:') ? 502 : 500;
      logRelay('error', 'relay.failed', { error: message, status });
      sendJson(res, status, { ok: false, error: message });
    }
  });
}

export function startRelayServer(config = buildRelayConfig()) {
  const server = createRelayServer(config);
  server.listen(config.port, '0.0.0.0', () => {
    logRelay('info', 'relay.started', {
      port: config.port,
      allowedModels: [...config.allowedModels],
      dispatchTarget: config.dispatchTarget,
      githubRepo: config.githubRepo,
      dispatchEvent: config.dispatchEvent,
    });
  });
  return server;
}

const isMainModule = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  startRelayServer();
}
