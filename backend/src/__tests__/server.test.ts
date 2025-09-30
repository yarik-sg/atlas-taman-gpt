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

const buildHtml = (merchantId: string, price: number, shippingFee: number) => {
  const shippingText = shippingFee > 0 ? `Livraison ${shippingFee} MAD` : 'Livraison gratuite';

  switch (merchantId) {
    case 'electroplanet':
      return `
        <ul class="products list items">
          <li class="item product product-item" data-product-id="${merchantId}-iphone" data-sku="iphone-15-pro" data-product-url="/${merchantId}/iphone-15-pro.html">
            <div class="product-item-info" data-product-id="${merchantId}-iphone">
              <a class="product-item-link" href="/${merchantId}/iphone-15-pro.html">
                <span class="product name product-item-name">Apple iPhone 15 Pro</span>
              </a>
              <div class="product-brand">Apple</div>
              <div class="product-category">Smartphones</div>
              <div class="price-box">
                <span class="price" data-price-currency="MAD">${price} DH</span>
              </div>
              <div class="shipping">${shippingText}</div>
              <div class="stock available">Disponible</div>
              <img class="product-image-photo" data-src="https://static.${merchantId}.test/iphone.jpg" />
            </div>
          </li>
        </ul>
      `;
    case 'jumia':
      return `
        <section class="products">
          <article class="prd _fb col c-prd" data-sku="${merchantId}-iphone" data-url="https://${merchantId}.test/iphone-15-pro" data-brand="Apple" data-category="Smartphones">
            <a class="core" href="/${merchantId}/iphone-15-pro">
              <div class="name">Apple iPhone 15 Pro 256GB</div>
            </a>
            <div class="prc">${price} DH</div>
            <div class="shp">${shippingText}</div>
            <div class="stk _available">En stock</div>
            <img data-src="https://static.${merchantId}.test/iphone.jpg" />
          </article>
        </section>
      `;
    case 'marjane':
      return `
        <div class="product-list">
          <div class="product-card" data-product-id="${merchantId}-iphone" data-sku="iphone-15-pro">
            <a class="product-link" href="/${merchantId}/iphone-15-pro">
              <h2 class="product-title">Apple iPhone 15 Pro</h2>
            </a>
            <div class="product-brand">Apple</div>
            <div class="product-category">Smartphones</div>
            <div class="price-amount">${price} MAD</div>
            <div class="product-shipping">${shippingText}</div>
            <div class="product-stock">Disponible</div>
            <img data-src="https://static.${merchantId}.test/iphone.jpg" />
          </div>
        </div>
      `;
    case 'bim':
      return `
        <ul class="product-list">
          <li class="product-item" data-sku="${merchantId}-iphone" data-url="/${merchantId}/iphone-15-pro">
            <a class="product-item__title" href="/${merchantId}/iphone-15-pro">Apple iPhone 15 Pro</a>
            <div class="product-item__brand">Apple</div>
            <div class="product-item__category">Smartphones</div>
            <div class="product-item__price">${price} DH</div>
            <div class="product-item__shipping">${shippingText}</div>
            <div class="product-item__availability">Disponible</div>
            <img data-src="https://static.${merchantId}.test/iphone.jpg" />
          </li>
        </ul>
      `;
    case 'decathlon':
      return `
        <section class="plp-product-list">
          <article class="plp-product" data-product-sku="${merchantId}-iphone" data-url="/${merchantId}/iphone-15-pro">
            <a class="plp-product__main-link" href="/${merchantId}/iphone-15-pro">
              <span class="plp-product__title">Apple iPhone 15 Pro</span>
            </a>
            <span class="plp-product__brand">Apple</span>
            <span class="plp-product__sport">Smartphones</span>
            <span class="plp-product-price__current">${price} DH</span>
            <span class="plp-product__delivery">${shippingText}</span>
            <span class="plp-product__availability">En stock</span>
            <img data-src="https://static.${merchantId}.test/iphone.jpg" />
          </article>
        </section>
      `;
    case 'hm':
      return `
        <ul class="products-listing">
          <li class="product-item" data-articlecode="${merchantId}-iphone" data-url="/${merchantId}/iphone-15-pro">
            <a class="item-link" href="/${merchantId}/iphone-15-pro">
              <h3 class="item-heading">Chemise en Lin Homme</h3>
            </a>
            <div class="item-brand">H&M</div>
            <div class="item-category">Mode</div>
            <div class="item-price">${price} MAD</div>
            <div class="item-delivery">${shippingText}</div>
            <div class="item-availability">En stock</div>
            <img data-src="https://static.${merchantId}.test/chemise.jpg" />
          </li>
        </ul>
      `;
    default:
      return '';
  }
};

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
