import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { SearchPage } from '../SearchPage';

const originalFetch = global.fetch;

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('SearchPage sorting behaviour', () => {
  const mockFetch = jest.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    (global as unknown as { fetch: typeof mockFetch }).fetch = mockFetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    window.history.replaceState({}, '', '/');
    document.body.innerHTML = '';
  });

  it('appends the selected sort to the request and updates product order', async () => {
    const initialResults = [
      {
        id: 1,
        name: 'Produit A',
        slug: 'produit-a',
        brand: 'Marque A',
        category: 'Catégorie',
        categorySlug: 'categorie',
        images: [],
        minPrice: 100,
        maxPrice: 150,
        offersCount: 2,
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 2,
        name: 'Produit B',
        slug: 'produit-b',
        brand: 'Marque B',
        category: 'Catégorie',
        categorySlug: 'categorie',
        images: [],
        minPrice: 200,
        maxPrice: 250,
        offersCount: 3,
        createdAt: '2024-01-02T00:00:00Z',
      },
    ];

    const sortedResults = [...initialResults].reverse();

    mockFetch
      .mockResolvedValueOnce({
        json: async () => ({ success: true, data: { results: initialResults } }),
      } as Response)
      .mockResolvedValueOnce({
        json: async () => ({ success: true, data: { results: sortedResults } }),
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
    expect(headings.map((heading) => heading.textContent)).toEqual([
      'Produit B',
      'Produit A',
    ]);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
