import test from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'http';

process.env.NODE_ENV = 'test';
process.env.USE_LIVE_MERCHANT_APIS = 'false';

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
