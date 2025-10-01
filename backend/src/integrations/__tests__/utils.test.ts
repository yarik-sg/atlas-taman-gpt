import test, { mock } from 'node:test';
import assert from 'node:assert/strict';

import { fetchWithConfig, parseAvailability } from '../utils';

test('parseAvailability handles negative availability phrases', () => {
  const phrases = ['Indisponible', 'Produit non disponible', 'Article hors stock'];
  for (const phrase of phrases) {
    assert.equal(parseAvailability(phrase), 'out_of_stock');
  }
});

test('parseAvailability handles positive availability phrases', () => {
  const phrases = [
    'Disponible en boutique',
    'Produit disponible en magasin',
    'Retrait magasin disponible',
  ];
  for (const phrase of phrases) {
    assert.equal(parseAvailability(phrase), 'in_stock');
  }
});

test('fetchWithConfig instancie un ProxyAgent lorsqu\'un proxy est défini', async () => {
  const ProxyAgentMock = class ProxyAgent {
    constructor(public proxyUrl: string) {}
  };

  mock.module('undici', {
    cache: true,
    defaultExport: { ProxyAgent: ProxyAgentMock },
    namedExports: { ProxyAgent: ProxyAgentMock },
  });

  const originalFetch = globalThis.fetch;
  const dispatched: Array<{ dispatcher?: unknown }> = [];

  globalThis.fetch = (async (
    _input: Parameters<typeof fetch>[0],
    init?: Parameters<typeof fetch>[1] & { dispatcher?: unknown }
  ) => {
    dispatched.push({ dispatcher: init?.dispatcher });
    const response = {
      ok: true,
      text: async () => '',
    } as unknown as Response;
    return response;
  }) as typeof fetch;

  try {
    await fetchWithConfig('https://example.com', {
      proxyUrl: 'http://proxy.local:8080',
    });
  } finally {
    globalThis.fetch = originalFetch;
    mock.restoreAll();
  }

  assert.equal(dispatched.length, 1);
  assert.ok(dispatched[0]?.dispatcher instanceof ProxyAgentMock);
  assert.equal((dispatched[0]?.dispatcher as { proxyUrl: string }).proxyUrl, 'http://proxy.local:8080');
});
