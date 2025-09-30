import test from 'node:test';
import assert from 'node:assert/strict';
import { ProductAggregator } from '../productAggregator';
import type { MerchantIntegration, MerchantOffer, MerchantProfile } from '../../integrations';
import { electroplanetIntegration } from '../../integrations/electroplanet';
import { jumiaIntegration } from '../../integrations/jumia';

const createOffer = (overrides: Partial<MerchantOffer> = {}): MerchantOffer => {
  const merchant: MerchantProfile = overrides.merchant ?? {
    id: 'merchant-a',
    name: 'Merchant A',
    url: 'https://merchant-a.example',
  };

  return {
    offerId: `${merchant.id}-${overrides.productId ?? 'product-1'}`,
    merchant,
    productId: overrides.productId ?? 'product-1',
    slug: overrides.slug ?? 'product-1',
    title: overrides.title ?? 'Produit Test',
    brand: overrides.brand ?? 'TestBrand',
    category: overrides.category ?? 'Catégorie Test',
    image: overrides.image ?? 'https://example.com/image.jpg',
    price: overrides.price ?? 1000,
    currency: overrides.currency ?? 'MAD',
    shippingFee: overrides.shippingFee,
    availability: overrides.availability ?? 'in_stock',
    url: overrides.url ?? 'https://merchant-a.example/product-1',
    scrapedAt: overrides.scrapedAt ?? new Date().toISOString(),
  };
};

const createIntegration = (
  id: string,
  offers: MerchantOffer[] | (() => Promise<MerchantOffer[]>)
): MerchantIntegration => ({
  id,
  label: id,
  profile: {
    id,
    name: id,
    url: `https://${id}.example`,
  },
  async search() {
    if (typeof offers === 'function') {
      return offers();
    }
    return offers;
  },
});

const now = new Date().toISOString();

test('normalises offers from multiple merchants', async () => {
  const integrationA = createIntegration('merchant-a', [
    createOffer({
      productId: 'iphone-15-pro',
      slug: 'iphone-15-pro',
      title: 'Apple iPhone 15 Pro',
      brand: 'Apple',
      category: 'Smartphones',
      price: 12345,
      shippingFee: 0,
      scrapedAt: now,
    }),
  ]);

  const integrationB = createIntegration('merchant-b', [
    createOffer({
      merchant: { id: 'merchant-b', name: 'Merchant B', url: 'https://merchant-b.example' },
      productId: 'iphone-15-pro-256',
      slug: 'iphone-15-pro',
      title: 'Apple iPhone 15 Pro 256GB',
      brand: 'Apple',
      category: 'Smartphones',
      price: 12999,
      shippingFee: 199,
      scrapedAt: now,
      url: 'https://merchant-b.example/iphone-15-pro',
    }),
  ]);

  const aggregator = new ProductAggregator({
    integrations: [integrationA, integrationB],
    cacheTtlMs: 1000,
    rateLimitMs: 0,
  });

  const { products, errors, metadata } = await aggregator.search('iphone');

  assert.equal(errors.length, 0);
  assert.equal(metadata.fromCache, false);
  assert.equal(products.length, 1);

  const product = products[0];
  assert.equal(product.slug, 'iphone-15-pro');
  assert.equal(product.minPrice, 12345);
  assert.equal(product.maxPrice, 12999);
  assert.equal(product.minTotalPrice, 12345);
  assert.equal(product.offersCount, 2);
  assert.equal(product.offers[0].merchant.name, 'Merchant A');
  assert.equal(product.offers[1].totalPrice, 12999 + 199);
});

test('returns cached data on subsequent calls', async () => {
  let calls = 0;
  const integration = createIntegration('merchant-cache', async () => {
    calls += 1;
    return [createOffer({ title: 'Produit Cache' })];
  });

  const aggregator = new ProductAggregator({
    integrations: [integration],
    cacheTtlMs: 10_000,
    rateLimitMs: 0,
  });

  const first = await aggregator.search('cache test');
  assert.equal(first.metadata.fromCache, false);
  assert.equal(calls, 1);

  const second = await aggregator.search('cache test');
  assert.equal(second.metadata.fromCache, true);
  assert.equal(calls, 1);
});

test('captures integration errors without stopping other connectors', async () => {
  const failingIntegration: MerchantIntegration = {
    id: 'failing',
    label: 'Failing',
    profile: { id: 'failing', name: 'Failing', url: 'https://failing.example' },
    async search() {
      throw new Error('Timeout');
    },
  };

  const healthyIntegration = createIntegration('healthy', [
    createOffer({
      merchant: { id: 'healthy', name: 'Healthy', url: 'https://healthy.example' },
      productId: 'ps5-slim',
      slug: 'playstation-5-slim',
      title: 'PlayStation 5 Slim',
      category: 'Gaming',
      price: 5999,
      scrapedAt: now,
    }),
  ]);

  const aggregator = new ProductAggregator({
    integrations: [failingIntegration, healthyIntegration],
    cacheTtlMs: 1000,
    rateLimitMs: 0,
  });

  const { products, errors, metadata } = await aggregator.search('ps5');

  assert.equal(metadata.integrations.length, 2);
  assert.equal(errors.length, 1);
  assert.equal(errors[0].merchantId, 'failing');
  assert.equal(products.length, 1);
  assert.equal(products[0].slug, 'playstation-5-slim');
});

test('fetches offers from HTTP integrations using mocks', async (t) => {
  const electroplanetHtml = `
    <section class="catalog">
      <article class="product-card"
        data-product-id="iphone-ep"
        data-product-slug="iphone-15-pro"
        data-product-url="/iphone-15-pro"
        data-price="13349"
        data-currency="MAD"
        data-shipping-fee="0"
        data-availability="in_stock">
        <h3 class="product-title">Apple iPhone 15 Pro</h3>
        <span class="product-brand">Apple</span>
        <span class="product-category">Smartphones</span>
        <img src="/images/iphone-15-pro.jpg" alt="Apple iPhone 15 Pro" />
      </article>
    </section>
  `;

  const jumiaHtml = `
    <section class="catalog">
      <article class="product-card"
        data-product-id="iphone-jumia"
        data-product-slug="iphone-15-pro"
        data-product-url="https://www.jumia.ma/iphone-15-pro"
        data-price="13599"
        data-currency="MAD"
        data-shipping-fee="49"
        data-availability="in_stock">
        <h3 class="product-title">Apple iPhone 15 Pro 256GB</h3>
        <span class="product-brand">Apple</span>
        <span class="product-category">Smartphones</span>
        <img src="https://www.jumia.ma/images/iphone-15-pro.jpg" alt="Apple iPhone 15 Pro" />
      </article>
    </section>
  `;

  const responses = new Map<string, string>();
  const registerResponse = (baseUrl: string, queryParam: string, queryValue: string, body: string) => {
    const url = new URL(baseUrl);
    url.searchParams.set(queryParam, queryValue);
    responses.set(url.toString(), body);
  };

  registerResponse('https://electroplanet.test/catalog', 'q', 'iphone 15', electroplanetHtml);
  registerResponse('https://jumia.test/search', 'q', 'iphone 15', jumiaHtml);

  const originalFetch = globalThis.fetch;
  const fetchMock = async (input: string | URL | Request) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url);
    const key = url.toString();
    const body = responses.get(key);
    if (!body) {
      throw new Error(`Unexpected fetch call: ${key}`);
    }
    return new Response(body, {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
  };

  globalThis.fetch = fetchMock as typeof globalThis.fetch;

  const previousElectroUrl = process.env.ELECTROPLANET_SEARCH_URL;
  const previousJumiaUrl = process.env.JUMIA_SEARCH_URL;

  process.env.ELECTROPLANET_SEARCH_URL = 'https://electroplanet.test/catalog';
  process.env.JUMIA_SEARCH_URL = 'https://jumia.test/search';

  t.after(() => {
    if (typeof previousElectroUrl === 'undefined') {
      delete process.env.ELECTROPLANET_SEARCH_URL;
    } else {
      process.env.ELECTROPLANET_SEARCH_URL = previousElectroUrl;
    }
    if (typeof previousJumiaUrl === 'undefined') {
      delete process.env.JUMIA_SEARCH_URL;
    } else {
      process.env.JUMIA_SEARCH_URL = previousJumiaUrl;
    }
    globalThis.fetch = originalFetch;
  });

  const aggregator = new ProductAggregator({
    integrations: [electroplanetIntegration, jumiaIntegration],
    cacheTtlMs: 0,
    rateLimitMs: 0,
  });

  const { products, errors } = await aggregator.search('iphone 15');

  assert.equal(errors.length, 0);
  assert.equal(products.length, 1);

  const [product] = products;
  assert.equal(product.slug, 'iphone-15-pro');
  assert.equal(product.offersCount, 2);
  assert.equal(product.minPrice, 13349);
  assert.equal(product.maxPrice, 13599);
  assert.equal(product.offers[0].merchant.name, 'Electroplanet');
  assert.equal(product.offers[1].merchant.name, 'Jumia');
  assert.equal(product.offers[1].totalPrice, 13599 + 49);
});
