import test from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'http';

process.env.NODE_ENV = 'test';

const merchantMocks = [
  { id: 'electroplanet', env: 'ELECTROPLANET_SEARCH_URL', url: 'https://electroplanet.test/catalog', queryKey: 'q', price: 13349, shipping: 0 },
  { id: 'jumia', env: 'JUMIA_SEARCH_URL', url: 'https://jumia.test/search', queryKey: 'q', price: 13599, shipping: 49 },
  { id: 'marjane', env: 'MARJANE_SEARCH_URL', url: 'https://marjane.test/search', queryKey: 'q', price: 13499, shipping: 0 },
  { id: 'bim', env: 'BIM_SEARCH_URL', url: 'https://bim.test/recherche', queryKey: 'query', price: 13649, shipping: 0 },
  { id: 'decathlon', env: 'DECATHLON_SEARCH_URL', url: 'https://decathlon.test/search', queryKey: 'q', price: 13999, shipping: 0 },
  { id: 'hm', env: 'HM_SEARCH_URL', url: 'https://hm.test/search-results.html', queryKey: 'q', price: 379, shipping: 19 },
];

const previousEnvValues = merchantMocks.map(({ env }) => [env, process.env[env]] as const);

const responses = new Map<string, string>();

const buildHtml = (merchantId: string, price: number, shippingFee: number) => `
  <section class="catalog">
    <article class="product-card"
      data-product-id="${merchantId}-iphone"
      data-product-slug="iphone-15-pro"
      data-product-url="/${merchantId}/iphone-15-pro"
      data-price="${price}"
      data-currency="MAD"
      data-shipping-fee="${shippingFee}"
      data-availability="in_stock">
      <h3 class="product-title">Apple iPhone 15 Pro</h3>
      <span class="product-brand">Apple</span>
      <span class="product-category">Smartphones</span>
      <img src="https://static.${merchantId}.test/iphone.jpg" alt="Apple iPhone 15 Pro" />
    </article>
  </section>
`;

for (const merchant of merchantMocks) {
  process.env[merchant.env] = merchant.url;
  const targetUrl = new URL(merchant.url);
  targetUrl.searchParams.set(merchant.queryKey, 'iphone');
  responses.set(targetUrl.toString(), buildHtml(merchant.id, merchant.price, merchant.shipping));
}

const originalFetch = globalThis.fetch;
globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
  const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url);
  if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') {
    return originalFetch(input as any, init);
  }

  const body = responses.get(url.toString());
  if (!body) {
    throw new Error(`Unexpected fetch call: ${url.toString()}`);
  }
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  });
}) as typeof globalThis.fetch;

test.after(async () => {
  for (const [env, value] of previousEnvValues) {
    if (typeof value === 'undefined') {
      delete process.env[env];
    } else {
      process.env[env] = value;
    }
  }
  globalThis.fetch = originalFetch;
});

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { app } = require('../server');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { productAggregator } = require('../services/productAggregator');

const startServer = async (): Promise<{ server: Server; url: string }> => {
  return new Promise((resolve) => {
    const instance = app.listen(0, () => {
      const address = instance.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      resolve({ server: instance, url: `http://127.0.0.1:${port}` });
    });
  });
};

test('returns aggregated products on /api/search', async () => {
  const { server, url } = await startServer();
  try {
    const response = await fetch(`${url}/api/search?q=iphone`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data.results));
    assert.equal(body.data.pagination.total, body.data.results.length);
    assert.ok(Array.isArray(body.data.metadata.integrations));
  } finally {
    server.close();
  }
});

test('returns aggregated catalogue on /api/products', async () => {
  const { server, url } = await startServer();
  try {
    const response = await fetch(`${url}/api/products`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data.products));
    assert.ok(Array.isArray(body.data.metadata.integrations));
  } finally {
    server.close();
  }
});

test('handles aggregator failures gracefully', async () => {
  const originalSearch = productAggregator.search;
  (productAggregator as { search: typeof originalSearch }).search = async () => {
    throw new Error('boom');
  };

  const { server, url } = await startServer();
  try {
    const response = await fetch(`${url}/api/search?q=error`);
    assert.equal(response.status, 500);
    const body = await response.json();
    assert.equal(body.success, false);
  } finally {
    (productAggregator as { search: typeof originalSearch }).search = originalSearch;
    server.close();
  }
});
