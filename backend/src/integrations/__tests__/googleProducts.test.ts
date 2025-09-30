import test from 'node:test';
import assert from 'node:assert/strict';
import { createGoogleProductsIntegration, isGoogleProductsIntegrationEnabled } from '../googleProducts';
import type { MerchantIntegration } from '../types';
import { ProductAggregator } from '../../services/productAggregator';

const setEnv = (t: test.TestContext, key: string, value: string | undefined) => {
  const previous = process.env[key];
  if (typeof value === 'undefined') {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }

  t.after(() => {
    if (typeof previous === 'undefined') {
      delete process.env[key];
    } else {
      process.env[key] = previous;
    }
  });
};

const configureGoogleEnv = (t: test.TestContext) => {
  setEnv(t, 'GOOGLE_PRODUCTS_API_URL', 'https://shopping.example/customsearch');
  setEnv(t, 'GOOGLE_PRODUCTS_API_KEY', 'secret-key');
  setEnv(t, 'GOOGLE_PRODUCTS_API_KEY_PARAM', 'api_key');
  setEnv(t, 'GOOGLE_PRODUCTS_API_KEY_HEADER', 'X-Api-Key');
  setEnv(t, 'GOOGLE_PRODUCTS_SEARCH_ENGINE_ID', 'engine-123');
  setEnv(t, 'GOOGLE_PRODUCTS_COUNTRY', 'ma');
  setEnv(t, 'GOOGLE_PRODUCTS_LANGUAGE', 'fr');
  setEnv(t, 'GOOGLE_PRODUCTS_RESULTS_LIMIT', '10');
  setEnv(t, 'GOOGLE_PRODUCTS_TIMEOUT_MS', '5000');
  setEnv(t, 'GOOGLE_PRODUCTS_DEFAULT_CURRENCY', 'mad');
  setEnv(t, 'GOOGLE_PRODUCTS_MERCHANT_URL', 'https://www.google.com/shopping');
};

test('creates offers sorted by total price using Google Products API', async (t) => {
  configureGoogleEnv(t);

  const apiResponse = {
    items: [
      {
        productId: 'sku-001',
        slug: 'iphone-15-pro',
        title: 'Apple iPhone 15 Pro',
        link: 'https://merchant-one.example/iphone-15-pro',
        image: 'https://merchant-one.example/iphone-15-pro.jpg',
        price: { value: 11999, currency: 'MAD' },
        shipping: { value: 49 },
        availability: 'In stock',
        brand: 'Apple',
        category: 'Smartphones',
        merchant: {
          id: 'merchant-one',
          name: 'Merchant One',
          url: 'https://merchant-one.example',
        },
      },
      {
        productId: 'sku-002',
        slug: 'iphone-15-pro',
        title: 'Apple iPhone 15 Pro (512GB)',
        link: 'https://merchant-two.example/iphone-15-pro',
        price: '12 499 MAD',
        shipping: 'Livraison 29 MAD',
        availability: 'Disponible',
        brand: 'Apple',
        category: 'Smartphones',
        merchant: {
          name: 'Merchant Two',
        },
      },
    ],
  };

  const fetchCalls: Array<{ url: string; init: RequestInit | undefined }> = [];
  const originalFetch = globalThis.fetch;
  const fetchMock: typeof fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    fetchCalls.push({ url, init });
    return new Response(JSON.stringify(apiResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  globalThis.fetch = fetchMock;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  assert.equal(isGoogleProductsIntegrationEnabled(), true);
  const integration = createGoogleProductsIntegration();
  const offers = await integration.search('iPhone 15 Pro');

  assert.equal(offers.length, 2);
  const [firstOffer, secondOffer] = offers;

  assert.equal(firstOffer.merchant.name, 'Merchant One');
  assert.equal(firstOffer.price, 11999);
  assert.equal(firstOffer.shippingFee, 49);
  assert.equal(firstOffer.currency, 'MAD');
  assert.equal(firstOffer.slug, 'iphone-15-pro');

  const firstTotal = firstOffer.price + (firstOffer.shippingFee ?? 0);
  const secondTotal = secondOffer.price + (secondOffer.shippingFee ?? 0);
  assert.ok(firstTotal <= secondTotal, 'offers should be sorted by total price');

  assert.equal(secondOffer.merchant.name, 'Merchant Two');
  assert.equal(secondOffer.currency, 'MAD');
  assert.equal(secondOffer.availability, 'in_stock');

  assert.equal(fetchCalls.length, 1);
  const [{ url, init }] = fetchCalls;
  const requestUrl = new URL(url);
  assert.equal(requestUrl.searchParams.get('api_key'), 'secret-key');
  assert.equal(requestUrl.searchParams.get('q'), 'iPhone 15 Pro');
  assert.equal(requestUrl.searchParams.get('cx'), 'engine-123');
  assert.equal(requestUrl.searchParams.get('gl'), 'ma');
  assert.equal(requestUrl.searchParams.get('hl'), 'fr');
  assert.equal(requestUrl.searchParams.get('num'), '10');

  assert.ok(init?.headers, 'expected headers to be set');
  const rawHeaders = init?.headers;
  const headers = rawHeaders instanceof Headers
    ? Object.fromEntries(rawHeaders.entries())
    : Array.isArray(rawHeaders)
    ? Object.fromEntries(rawHeaders)
    : { ...((rawHeaders as Record<string, string>) ?? {}) };

  const normalizedHeaders = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value])
  );
  assert.equal(normalizedHeaders['x-api-key'], 'secret-key');
});

test('throws a descriptive error when the Google Products API fails', async (t) => {
  configureGoogleEnv(t);

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response('quota exceeded', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  const integration = createGoogleProductsIntegration();
  await assert.rejects(() => integration.search('iphone 15'), /status 500: quota exceeded/);
});

test('product aggregator falls back to Google Products when scrapers fail', async (t) => {
  configureGoogleEnv(t);

  const apiResponse = {
    items: [
      {
        productId: 'sku-101',
        slug: 'iphone-15-pro',
        title: 'Apple iPhone 15 Pro',
        link: 'https://merchant-one.example/iphone-15-pro',
        price: { value: 12499, currency: 'MAD' },
        shipping: { value: 0 },
        availability: 'In Stock',
        merchant: {
          id: 'merchant-one',
          name: 'Merchant One',
          url: 'https://merchant-one.example',
        },
      },
      {
        productId: 'sku-102',
        slug: 'iphone-15-pro',
        title: 'Apple iPhone 15 Pro (256GB)',
        link: 'https://merchant-two.example/iphone-15-pro',
        price: { value: 12999, currency: 'MAD' },
        shipping: { value: 99 },
        availability: 'Disponible',
        merchant: {
          name: 'Merchant Two',
        },
      },
    ],
  };

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(JSON.stringify(apiResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  const failingIntegration: MerchantIntegration = {
    id: 'failing-scraper',
    label: 'Failing Scraper',
    profile: {
      id: 'failing-scraper',
      name: 'Failing Scraper',
      url: 'https://failing.example',
    },
    async search() {
      throw new Error('Scraper timeout');
    },
  };

  const googleIntegration = createGoogleProductsIntegration();
  const aggregator = new ProductAggregator({
    integrations: [failingIntegration, googleIntegration],
    cacheTtlMs: 0,
    rateLimitMs: 0,
  });

  const { products, errors, metadata } = await aggregator.search('iphone 15 pro');

  assert.equal(errors.length, 1);
  assert.equal(errors[0].merchantId, 'failing-scraper');
  assert.equal(products.length, 1);

  const [product] = products;
  assert.equal(product.slug, 'iphone-15-pro');
  assert.equal(product.offersCount, 2);
  assert.equal(product.offers[0].merchant.name, 'Merchant One');
  assert.equal(product.offers[1].merchant.name, 'Merchant Two');
  assert.equal(product.minTotalPrice, product.offers[0].totalPrice);

  const googleMetric = metadata.integrations.find((metric) => metric.id === 'google-products');
  assert.ok(googleMetric, 'expected Google Products integration metric');
  assert.equal(googleMetric?.offers, 2);
});
