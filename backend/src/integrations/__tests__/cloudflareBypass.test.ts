import test from 'node:test';
import assert from 'node:assert/strict';

import { electroplanetIntegration } from '../electroplanet';

const createFallbackHtml = () => `
<html>
  <body>
    <ul class="products">
      <li class="product-item" data-product-id="test-123">
        <div class="product-item-info" data-product-id="test-123">
          <a class="product-item-link" href="/produit/test-123">Test Product</a>
          <div class="product-brand">TestBrand</div>
          <div class="product-category">Smartphones</div>
          <div class="price-box">
            <span class="price" data-price-currency="MAD">1 234,00 DH</span>
          </div>
          <img src="/media/test-product.jpg" />
          <div class="shipping">Livraison gratuite</div>
          <div class="stock">En stock</div>
        </div>
      </li>
    </ul>
  </body>
</html>
`;

test('electroplanetIntegration falls back to solver when Cloudflare blocks the request', async (t) => {
  const originalFetch = globalThis.fetch;
  const originalProvider = process.env.MERCHANT_SOLVER_PROVIDER;
  const originalScrapingBeeKey = process.env.SCRAPINGBEE_API_KEY;
  const originalScrapingBeeBase = process.env.SCRAPINGBEE_BASE_URL;
  const originalScrapingBeeRender = process.env.SCRAPINGBEE_RENDER_JS;

  const fallbackHtml = createFallbackHtml();
  let callCount = 0;

  const challengeResponse = new Response('<html><body><div class="cf-chl">Attention Required</div></body></html>', {
    status: 503,
    headers: { 'content-type': 'text/html' },
  });

  const fetchMock: typeof fetch = async (input) => {
    callCount += 1;
    if (callCount === 1) {
      return challengeResponse;
    }

    const url = typeof input === 'string' ? input : input.toString();
    assert.ok(url.startsWith('https://solver.example.com/'), 'expected solver endpoint to be called');
    return new Response(fallbackHtml, {
      status: 200,
      headers: { 'content-type': 'text/html' },
    });
  };

  globalThis.fetch = fetchMock;
  process.env.MERCHANT_SOLVER_PROVIDER = 'scrapingbee';
  process.env.SCRAPINGBEE_API_KEY = 'test-api-key';
  process.env.SCRAPINGBEE_BASE_URL = 'https://solver.example.com/';
  process.env.SCRAPINGBEE_RENDER_JS = 'false';

  t.after(() => {
    globalThis.fetch = originalFetch;
    if (originalProvider === undefined) {
      delete process.env.MERCHANT_SOLVER_PROVIDER;
    } else {
      process.env.MERCHANT_SOLVER_PROVIDER = originalProvider;
    }
    if (originalScrapingBeeKey === undefined) {
      delete process.env.SCRAPINGBEE_API_KEY;
    } else {
      process.env.SCRAPINGBEE_API_KEY = originalScrapingBeeKey;
    }
    if (originalScrapingBeeBase === undefined) {
      delete process.env.SCRAPINGBEE_BASE_URL;
    } else {
      process.env.SCRAPINGBEE_BASE_URL = originalScrapingBeeBase;
    }
    if (originalScrapingBeeRender === undefined) {
      delete process.env.SCRAPINGBEE_RENDER_JS;
    } else {
      process.env.SCRAPINGBEE_RENDER_JS = originalScrapingBeeRender;
    }
  });

  const results = await electroplanetIntegration.search('iphone');

  assert.equal(callCount, 2);
  assert.equal(results.length, 1);
  assert.equal(results[0].title, 'Test Product');
  assert.equal(results[0].price, 1234);
  assert.equal(results[0].merchant.id, 'electroplanet');
});
