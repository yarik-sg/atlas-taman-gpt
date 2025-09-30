import React, { useState, useEffect } from 'react';
import { ProductCard } from '../components/product/ProductCard';
import { Product, IntegrationError, SearchMetadata } from '../types';

export const SearchPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [integrationErrors, setIntegrationErrors] = useState<IntegrationError[]>([]);
  const [metadata, setMetadata] = useState<SearchMetadata | null>(null);
  const [slowResponse, setSlowResponse] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q') || '';
    setSearchQuery(query);
    if (query) {
      searchProducts(query);
    }
  }, []);

  const searchProducts = async (query: string, sortParam = sortBy) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setProducts([]);
      setLoading(false);
      setIntegrationErrors([]);
      setMetadata(null);
      setErrorMessage(null);
      return;
    }

    setLoading(true);
    setSlowResponse(false);
    setErrorMessage(null);
    setIntegrationErrors([]);
    setMetadata(null);
    const slowTimer = window.setTimeout(() => setSlowResponse(true), 1200);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(trimmedQuery)}&sortBy=${sortParam}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setProducts(data.data.results || []);
        setIntegrationErrors(data.data.errors || []);
        setMetadata(data.data.metadata || null);
      } else {
        setProducts([]);
        setErrorMessage(data.error || 'La recherche a échoué.');
      }
    } catch (error) {
      console.error('Erreur de recherche:', error);
      setProducts([]);
      setErrorMessage("Nous n'avons pas pu contacter les marchands. Veuillez réessayer plus tard.");
    } finally {
      window.clearTimeout(slowTimer);
      setSlowResponse(false);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Recherche en cours...</p>
          {slowResponse && (
            <p className="text-xs text-gray-500 mt-2">Certains marchands prennent un peu plus de temps à répondre…</p>
          )}
        </div>
      </div>
    );
  }

  const successfulIntegrations = metadata?.integrations.filter((item) => item.status === 'fulfilled').length ?? 0;
  const totalIntegrations = metadata?.integrations.length ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Résultats pour "{searchQuery}"</h1>
              <p className="text-sm text-gray-600 mt-1">{products.length} produits trouvés</p>
              {metadata && (
                <p className="text-xs text-gray-500 mt-1">
                  {metadata.fromCache ? 'Résultats servis depuis le cache' : 'Résultats actualisés'} •
                  {` ${successfulIntegrations}/${totalIntegrations} marchands`} •
                  {` ${Math.round(metadata.tookMs)} ms`}
                </p>
              )}
            </div>
            <select
              value={sortBy}
              onChange={(e) => {
                const newSort = e.target.value;
                setSortBy(newSort);
                searchProducts(searchQuery, newSort);
              }}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="relevance">Pertinence</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix décroissant</option>
              <option value="name">Nom A-Z</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 px-4 space-y-4">
        {errorMessage && (
          <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-md">
            {errorMessage}
          </div>
        )}

        {!errorMessage && integrationErrors.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 px-4 py-3 rounded-md text-amber-800 text-sm">
            Certaines intégrations n'ont pas répondu : {integrationErrors.map((error) => error.merchantName).join(', ')}.
          </div>
        )}

        {products.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun produit trouvé</h3>
            <button
              onClick={() => (window.location.href = '/')}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 mt-4"
            >
              Retour à l'accueil
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} showDiscount />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
