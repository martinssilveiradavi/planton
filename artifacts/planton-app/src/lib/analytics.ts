// The public project token is configured at build time, never a personal API key.
type AnalyticsClient = {
  init: (key: string, options: Record<string, unknown>) => void;
  capture: (event: string, properties: Record<string, unknown>) => void;
};

type QueuedAnalyticsClient = AnalyticsClient &
  Array<unknown> & {
    _i: Array<[string, Record<string, unknown>, string]>;
    __SV: number;
  };

declare global {
  interface Window {
    posthog?: AnalyticsClient;
  }
}

let loading: Promise<AnalyticsClient | null> | undefined;

function client(): Promise<AnalyticsClient | null> {
  if (loading) return loading;

  const key = import.meta.env.VITE_POSTHOG_KEY;
  const host = import.meta.env.VITE_POSTHOG_HOST;
  if (!import.meta.env.PROD || !key || !host) {
    return Promise.resolve(null);
  }

  if (!['https://us.i.posthog.com', 'https://eu.i.posthog.com'].includes(host)) {
    console.warn('PostHog: configure a supported ingestion host.');
    return Promise.resolve(null);
  }

  loading = new Promise((resolve) => {
    const queuedClient = [] as unknown as QueuedAnalyticsClient;
    queuedClient._i = [];
    queuedClient.__SV = 1;
    queuedClient.capture = (...args) => {
      queuedClient.push(['capture', ...args]);
    };
    queuedClient.init = (projectKey, options) => {
      queuedClient._i.push([projectKey, options, 'posthog']);
    };
    window.posthog = queuedClient;

    const script = document.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src =
      host.replace('.i.posthog.com', '-assets.i.posthog.com') +
      '/static/array.js';
    script.onerror = () => resolve(null);
    script.onload = () => resolve(window.posthog ?? null);

    queuedClient.init(key, {
      api_host: host,
      capture_pageview: false,
      capture_pageleave: false,
      autocapture: false,
      disable_session_recording: true,
      person_profiles: 'never',
      persistence: 'memory',
      loaded: (sdk: AnalyticsClient) => resolve(sdk),
    });
    document.head.appendChild(script);
  });

  return loading;
}

export async function trackPage(path: string) {
  const sdk = await client();
  const safePath = path
    .split(/[?#]/)[0]
    .replace(/\/shifts\/[^/]+/, '/shifts/:id')
    .replace(/\/candidates\/[^/]+/, '/candidates/:id');

  sdk?.capture('$pageview', {
    $current_url: window.location.origin + safePath,
    $pathname: safePath,
    $referrer: '',
    $referring_domain: '',
  });
}