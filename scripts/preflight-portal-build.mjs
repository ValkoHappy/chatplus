const STRAPI_URL = (process.env.STRAPI_URL || '').replace(/\/+$/, '');
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || '';

if (!STRAPI_URL) {
  console.error('[preflight] STRAPI_URL is not set.');
  process.exit(1);
}

if (!STRAPI_TOKEN) {
  console.error('[preflight] STRAPI_TOKEN is not set.');
  process.exit(1);
}

async function fetchJson(path) {
  let response;

  try {
    response = await fetch(`${STRAPI_URL}/api${path}`, {
      headers: { Authorization: `Bearer ${STRAPI_TOKEN}` },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      status: 0,
      text: '',
      json: null,
      transportError: message,
    };
  }

  const text = await response.text();
  let json = null;

  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }

  return {
    status: response.status,
    text,
    json,
    transportError: null,
  };
}

function describeFailure(message, suggestion) {
  console.error(`[preflight] ${message}`);
  if (suggestion) {
    console.error(`[preflight] ${suggestion}`);
  }
}

const checks = [
  {
    label: 'site-setting',
    path: '/site-setting?populate=*',
    validate(result) {
      if (result.transportError) {
        describeFailure(
          `Could not reach Strapi while fetching site-setting: ${result.transportError}.`,
          'Check that the strapi container is healthy and STRAPI_URL points to the internal CMS URL.',
        );
        return false;
      }

      if (result.status === 401 || result.status === 403) {
        describeFailure(
          'Strapi rejected STRAPI_API_TOKEN while fetching site-setting.',
          'Create a fresh full-access API token in Strapi and write it to deploy/.env as STRAPI_API_TOKEN=...',
        );
        return false;
      }

      if (result.status === 404) {
        describeFailure(
          'site-setting does not exist in Strapi yet.',
          'Run ./deploy/scripts/finalize-first-launch.sh or at least ./deploy/scripts/seed-content.sh before building the portal.',
        );
        return false;
      }

      if (result.status !== 200 || !result.json?.data) {
        describeFailure(
          `Unexpected response for site-setting: HTTP ${result.status}.`,
          'Check Strapi logs and verify that singleton content exists.',
        );
        return false;
      }

      return true;
    },
  },
  {
    label: 'channels',
    path: '/channels?pagination%5BpageSize%5D=1&populate=*',
    validate(result) {
      if (result.transportError) {
        describeFailure(
          `Could not reach Strapi while fetching channels: ${result.transportError}.`,
          'Check that the strapi container is healthy and STRAPI_URL points to the internal CMS URL.',
        );
        return false;
      }

      if (result.status === 401 || result.status === 403) {
        describeFailure(
          'Strapi rejected STRAPI_API_TOKEN while fetching channels.',
          'Create a fresh full-access API token in Strapi and write it to deploy/.env as STRAPI_API_TOKEN=...',
        );
        return false;
      }

      if (result.status !== 200 || !Array.isArray(result.json?.data)) {
        describeFailure(
          `Unexpected response for channels: HTTP ${result.status}.`,
          'Check Strapi API availability and token permissions.',
        );
        return false;
      }

      if (result.json.data.length === 0) {
        describeFailure(
          'channels collection is empty, so Astro cannot build the public site.',
          'Run ./deploy/scripts/finalize-first-launch.sh or seed the content before building.',
        );
        return false;
      }

      return true;
    },
  },
  {
    label: 'industries',
    path: '/industries?pagination%5BpageSize%5D=1&populate=*',
    validate(result) {
      if (result.transportError) {
        describeFailure(
          `Could not reach Strapi while fetching industries: ${result.transportError}.`,
          'Check that the strapi container is healthy and STRAPI_URL points to the internal CMS URL.',
        );
        return false;
      }

      if (result.status === 401 || result.status === 403) {
        describeFailure(
          'Strapi rejected STRAPI_API_TOKEN while fetching industries.',
          'Create a fresh full-access API token in Strapi and write it to deploy/.env as STRAPI_API_TOKEN=...',
        );
        return false;
      }

      if (result.status !== 200 || !Array.isArray(result.json?.data)) {
        describeFailure(
          `Unexpected response for industries: HTTP ${result.status}.`,
          'Check Strapi API availability and token permissions.',
        );
        return false;
      }

      if (result.json.data.length === 0) {
        describeFailure(
          'industries collection is empty, so Astro cannot build the public site.',
          'Run ./deploy/scripts/finalize-first-launch.sh or seed the content before building.',
        );
        return false;
      }

      return true;
    },
  },
  {
    label: 'landing-page home',
    path: '/landing-pages?filters[slug][$eq]=home&pagination%5BpageSize%5D=1&populate=*',
    validate(result) {
      if (result.transportError) {
        describeFailure(
          `Could not reach Strapi while fetching landing-page/home: ${result.transportError}.`,
          'Check that the strapi container is healthy and STRAPI_URL points to the internal CMS URL.',
        );
        return false;
      }

      if (result.status === 401 || result.status === 403) {
        describeFailure(
          'Strapi rejected STRAPI_API_TOKEN while fetching landing-page/home.',
          'Create a fresh full-access API token in Strapi and write it to deploy/.env as STRAPI_API_TOKEN=...',
        );
        return false;
      }

      if (result.status !== 200 || !Array.isArray(result.json?.data)) {
        describeFailure(
          `Unexpected response for landing-page/home: HTTP ${result.status}.`,
          'Check Strapi logs and verify that landing pages are available through the API.',
        );
        return false;
      }

      if (result.json.data.length === 0) {
        describeFailure(
          'landing-page/home is missing, so the Astro home route cannot be built.',
          'Run ./deploy/scripts/finalize-first-launch.sh or seed the landing pages before building.',
        );
        return false;
      }

      return true;
    },
  },
  {
    label: 'tenders-page',
    path: '/tenders-page?populate=*',
    validate(result) {
      if (result.transportError) {
        describeFailure(
          `Could not reach Strapi while fetching tenders-page: ${result.transportError}.`,
          'Check that the strapi container is healthy and STRAPI_URL points to the internal CMS URL.',
        );
        return false;
      }

      if (result.status === 401 || result.status === 403) {
        describeFailure(
          'Strapi rejected STRAPI_API_TOKEN while fetching tenders-page.',
          'Create a fresh full-access API token in Strapi and write it to deploy/.env as STRAPI_API_TOKEN=...',
        );
        return false;
      }

      if (result.status === 404) {
        describeFailure(
          'tenders-page does not exist in Strapi yet.',
          'Run ./deploy/scripts/finalize-first-launch.sh or seed the singleton content before building the portal.',
        );
        return false;
      }

      if (result.status !== 200 || !result.json?.data) {
        describeFailure(
          `Unexpected response for tenders-page: HTTP ${result.status}.`,
          'Check Strapi logs and verify that singleton content exists.',
        );
        return false;
      }

      return true;
    },
  },
];

let ok = true;

for (const check of checks) {
  const result = await fetchJson(check.path);
  ok = check.validate(result) && ok;
}

if (!ok) {
  process.exit(1);
}

console.log('[preflight] Strapi content and token checks passed.');
