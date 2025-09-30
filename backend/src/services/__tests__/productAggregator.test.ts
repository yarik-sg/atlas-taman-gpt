import test from 'node:test';
import assert from 'node:assert/strict';
import { ProductAggregator } from '../productAggregator';
import type { MerchantIntegration, MerchantOffer, MerchantProfile } from '../../integrations';

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
