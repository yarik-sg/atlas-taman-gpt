import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { SearchPage } from '../SearchPage';

const originalFetch = global.fetch;

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

const baseMetadata = {
  query: 'ordinateur',
  fromCache: false,
  tookMs: 120,
  generatedAt: '2024-01-01T00:00:00Z',
  integrations: [],
};

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

interface TestOffer {
  id: string;
  price: number;
  totalPrice: number;
  currency: string;
  shippingFee: number;
  isAvailable: boolean;
  url: string;
  merchant: { id: string; name: string; url: string };
  createdAt: string;
  updatedAt: string;
}

interface TestProduct {
  id: string;
  name: string;
  slug: string;
  brand?: string;
  category: string;
  categorySlug: string;
  images: string[];
  minPrice: number;
  maxPrice: number;
  minTotalPrice: number;
  offersCount: number;
  offers: TestOffer[];
  specifications: Record<string, never>;
  createdAt: string;
}

function createProduct(overrides: Partial<TestProduct> = {}): TestProduct {
  const baseOffer: TestOffer = {
    id: `${overrides.id ?? 'produit-a'}-offer`,
    price: overrides.minPrice ?? 100,
    totalPrice: overrides.minTotalPrice ?? 110,
    currency: 'MAD',
    shippingFee: (overrides.minTotalPrice ?? 110) - (overrides.minPrice ?? 100),
    isAvailable: true,
    url: `https://example.com/${overrides.slug ?? 'produit-a'}`,
    merchant: { id: 'merchant-a', name: 'Marchand A', url: 'https://example.com' },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const offers = overrides.offers ?? [baseOffer];

  return {
    id: 'produit-a',
    name: 'Produit A',
    slug: 'produit-a',
    brand: 'Marque A',
    category: 'Catégorie',
    categorySlug: 'categorie',
    images: [],
    minPrice: 100,
    maxPrice: 150,
    minTotalPrice: 110,
    offersCount: offers.length,
    offers,
    specifications: {},
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
    offers,
    offersCount: offers.length,
  };
}

describe('SearchPage data flow', () => {
  const mockFetch = jest.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    (global as unknown as { fetch: typeof mockFetch }).fetch = mockFetch;
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    global.fetch = originalFetch;
    document.body.innerHTML = '';
  });

  it('appends the selected sort to the request and updates product order', async () => {
    const initialResults = [
      createProduct({ id: 'produit-a', name: 'Produit A', slug: 'produit-a', minPrice: 100, minTotalPrice: 110 }),
      createProduct({ id: 'produit-b', name: 'Produit B', slug: 'produit-b', minPrice: 200, minTotalPrice: 210 }),
    ];

    const sortedResults = [...initialResults].reverse();

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { results: initialResults, pagination: { total: 2 }, errors: [], metadata: baseMetadata } }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { results: sortedResults, pagination: { total: 2 }, errors: [], metadata: baseMetadata } }),
      } as Response);

    window.history.pushState({}, '', '/search?q=ordinateur');

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<SearchPage />);
    });

    await act(async () => {
      await flushPromises();
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toContain('sortBy=relevance');

    const select = container.querySelector('select') as HTMLSelectElement;
    expect(select).not.toBeNull();

    await act(async () => {
      select.value = 'price_desc';
      select.dispatchEvent(new Event('change', { bubbles: true }));
      await flushPromises();
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls[1][0]).toContain('sortBy=price_desc');

    const headings = Array.from(container.querySelectorAll('h3'));
    expect(headings.map((heading) => heading.textContent)).toEqual(['Produit B', 'Produit A']);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('displays integration errors returned by the API', async () => {
    const responsePayload = {
      success: true,
      data: {
        results: [createProduct()],
        pagination: { total: 1 },
        errors: [{ merchantId: 'jumia', merchantName: 'Jumia', message: 'Timeout' }],
        metadata: baseMetadata,
      },
    };

    mockFetch.mockResolvedValue({ ok: true, json: async () => responsePayload } as Response);

    window.history.pushState({}, '', '/search?q=ordinateur');

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<SearchPage />);
      await flushPromises();
    });

    const warning = container.querySelector('.bg-amber-50');
    expect(warning?.textContent).toContain("Jumia");

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('shows an error banner when the request fails', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    window.history.pushState({}, '', '/search?q=ordinateur');

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<SearchPage />);
      await flushPromises();
    });

    const alert = container.querySelector('.bg-red-50');
    expect(alert?.textContent).toContain('Veuillez réessayer');

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
