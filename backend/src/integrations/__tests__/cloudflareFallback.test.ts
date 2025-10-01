import test from 'node:test';
import assert from 'node:assert/strict';

import { fetchWithConfig } from '../utils';
import { electroplanetIntegration } from '../electroplanet';

const CLOUDFLARE_HTML = `<!doctype html>
<html>
  <head><title>Attention Required! | Cloudflare</title></head>
  <body>
    <div id="cf-error-details">
      <span class="cf-error-title">Please enable cookies.</span>
    </div>
  </body>
</html>`;

test('fetchWithConfig utilise le fallback Cloudflare en cas de blocage', async () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = {
    url: process.env.CLOUDFLARE_FALLBACK_URL,
    apiKey: process.env.CLOUDFLARE_FALLBACK_API_KEY,
    timeout: process.env.CLOUDFLARE_FALLBACK_TIMEOUT_MS,
  };

  const requests: Array<{
    input: Parameters<typeof fetch>[0];
    init?: Parameters<typeof fetch>[1];
  }> = [];

  process.env.CLOUDFLARE_FALLBACK_URL = 'https://solver.local/solve';
  process.env.CLOUDFLARE_FALLBACK_API_KEY = 'fallback-key';
  process.env.CLOUDFLARE_FALLBACK_TIMEOUT_MS = '2000';

  globalThis.fetch = (async (
    input: Parameters<typeof fetch>[0],
    init?: Parameters<typeof fetch>[1]
  ) => {
    requests.push({ input, init });

    if (typeof input === 'string' && input.startsWith('https://example.com')) {
      return new Response(CLOUDFLARE_HTML, {
        status: 503,
        headers: { 'content-type': 'text/html' },
      });
    }

    if (input === 'https://solver.local/solve') {
      return new Response(JSON.stringify({ html: '<html>ok</html>' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    throw new Error(`Unexpected request to ${String(input)}`);
  }) as typeof fetch;

  try {
    const result = await fetchWithConfig('https://example.com/products', {});
    assert.equal(result.wasBlocked, true);

    const body = await result.response.text();
    assert.equal(body, '<html>ok</html>');

    assert.equal(requests.length, 2);
    const fallbackHeaders = new Headers(requests[1]?.init?.headers);
    assert.equal(fallbackHeaders.get('x-api-key'), 'fallback-key');
    assert.equal(fallbackHeaders.get('content-type'), 'application/json');
  } finally {
    globalThis.fetch = originalFetch;
    process.env.CLOUDFLARE_FALLBACK_URL = originalEnv.url;
    process.env.CLOUDFLARE_FALLBACK_API_KEY = originalEnv.apiKey;
    process.env.CLOUDFLARE_FALLBACK_TIMEOUT_MS = originalEnv.timeout;
  }
});

test('electroplanetIntegration récupère le HTML du fallback Cloudflare', async () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = {
    url: process.env.CLOUDFLARE_FALLBACK_URL,
    apiKey: process.env.CLOUDFLARE_FALLBACK_API_KEY,
    timeout: process.env.CLOUDFLARE_FALLBACK_TIMEOUT_MS,
  };

  const fallbackHtml = `
  <ul>
    <li class="product-item" data-product-id="abc123">
      <div class="product-item-info">
        <a class="product-item-link" href="/produit/abc123">Laptop Pro</a>
        <span class="price-box">
          <span class="price" data-price-currency="MAD">1 299,00</span>
        </span>
      </div>
    </li>
  </ul>`;

  const requests: Array<{
    input: Parameters<typeof fetch>[0];
    init?: Parameters<typeof fetch>[1];
  }> = [];

  process.env.CLOUDFLARE_FALLBACK_URL = 'https://solver.local/solve';
  process.env.CLOUDFLARE_FALLBACK_API_KEY = undefined;
  process.env.CLOUDFLARE_FALLBACK_TIMEOUT_MS = undefined;

  globalThis.fetch = (async (
    input: Parameters<typeof fetch>[0],
    init?: Parameters<typeof fetch>[1]
  ) => {
    requests.push({ input, init });

    if (typeof input === 'string' && input.includes('catalogsearch/result')) {
      return new Response(CLOUDFLARE_HTML, {
        status: 503,
        headers: { 'content-type': 'text/html' },
      });
    }

    if (input === 'https://solver.local/solve') {
      return new Response(JSON.stringify({ html: fallbackHtml }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    throw new Error(`Unexpected request to ${String(input)}`);
  }) as typeof fetch;

  try {
    const offers = await electroplanetIntegration.search('Laptop');
    assert.equal(offers.length, 1);
    assert.equal(offers[0]?.title, 'Laptop Pro');
    assert.equal(offers[0]?.price, 1299);
    assert.equal(requests.length, 2);
    assert.equal(new Headers(requests[1]?.init?.headers).get('x-api-key'), null);
  } finally {
    globalThis.fetch = originalFetch;
    process.env.CLOUDFLARE_FALLBACK_URL = originalEnv.url;
    process.env.CLOUDFLARE_FALLBACK_API_KEY = originalEnv.apiKey;
    process.env.CLOUDFLARE_FALLBACK_TIMEOUT_MS = originalEnv.timeout;
  }
});
