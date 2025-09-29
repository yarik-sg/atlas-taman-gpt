#!/bin/bash

# Atlas Taman GPT - Script complet de génération
# Ce script crée TOUS les fichiers nécessaires pour l'application

set -e

echo "🚀 Génération complète d'Atlas Taman GPT..."
echo "📁 Création de la structure complète des fichiers..."

# ============================================
# TYPES TYPESCRIPT
# ============================================

echo "📝 Création des types TypeScript..."
mkdir -p frontend/src/types
cat > frontend/src/types/index.ts << 'TYPESCRIPT_TYPES'
// Types pour Atlas Taman GPT

export interface Product {
  id: number;
  name: string;
  slug: string;
  brand: string;
  model?: string;
  category: string;
  categorySlug: string;
  images: string[];
  minPrice: number;
  maxPrice: number;
  offersCount: number;
  specifications?: Record<string, any>;
  createdAt: string;
}

export interface PriceOffer {
  id: number;
  merchantName: string;
  merchantDomain: string;
  merchantLogo?: string;
  price: number;
  originalPrice?: number;
  currency: string;
  shippingCost: number;
  availability: 'in_stock' | 'out_of_stock' | 'limited' | 'unknown';
  stockQuantity?: number;
  condition: 'new' | 'used' | 'refurbished';
  url: string;
  lastUpdated: string;
}

export interface Merchant {
  id: number;
  name: string;
  domain: string;
  logoUrl?: string;
  description?: string;
  websiteUrl: string;
  isActive: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parentId?: number;
  productsCount?: number;
}

export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface PriceAlert {
  id: number;
  productId: number;
  productName: string;
  targetPrice: number;
  currentMinPrice: number;
  isActive: boolean;
  createdAt: string;
}

export interface SearchFilters {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  merchants?: string[];
  availability?: 'in_stock' | 'all';
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'name' | 'newest';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  results: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
TYPESCRIPT_TYPES

# ============================================
# COMPOSANT PRODUCT CARD
# ============================================

echo "🎨 Création du composant ProductCard..."
mkdir -p frontend/src/components/product
cat > frontend/src/components/product/ProductCard.tsx << 'PRODUCT_CARD'
import React from 'react';
import { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  onCompare?: (product: Product) => void;
  showDiscount?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onCompare,
  showDiscount = false 
}) => {
  const handleCardClick = () => {
    window.location.href = `/product/${product.slug}`;
  };

  const handleCompareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCompare) {
      onCompare(product);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const discount = showDiscount && product.maxPrice > product.minPrice
    ? Math.round(((product.maxPrice - product.minPrice) / product.maxPrice) * 100)
    : 0;

  return (
    <div 
      onClick={handleCardClick}
      className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group"
    >
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-400 text-4xl">📦</span>
          </div>
        )}
        
        {showDiscount && discount > 0 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-bold">
            -{discount}%
          </div>
        )}

        <div className="absolute bottom-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-md text-xs">
          {product.category}
        </div>
      </div>

      <div className="p-4">
        {product.brand && (
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            {product.brand}
          </p>
        )}

        <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 h-10">
          {product.name}
        </h3>

        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-bold text-blue-600">
            {formatPrice(product.minPrice)}
          </span>
          {product.maxPrice > product.minPrice && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(product.maxPrice)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span className="flex items-center">
            🏪 {product.offersCount} {product.offersCount > 1 ? 'offres' : 'offre'}
          </span>
          {product.offersCount > 1 && (
            <span className="text-green-600 font-medium">
              Comparer
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCardClick}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Voir les offres
          </button>
          {onCompare && (
            <button
              onClick={handleCompareClick}
              className="bg-gray-100 text-gray-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
              title="Ajouter à la comparaison"
            >
              ⚖️
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
PRODUCT_CARD

# ============================================
# PAGE DE RECHERCHE
# ============================================

echo "🔍 Création de la page de recherche..."
mkdir -p frontend/src/pages
cat > frontend/src/pages/SearchPage.tsx << 'SEARCH_PAGE'
import React, { useState, useEffect } from 'react';
import { ProductCard } from '../components/product/ProductCard';
import { Product, SearchFilters } from '../types';

export const SearchPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SearchFilters>({
    sortBy: 'relevance',
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q') || '';
    setSearchQuery(query);
    
    if (query) {
      searchProducts(query);
    }
  }, []);

  const searchProducts = async (query: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&sortBy=${filters.sortBy}`
      );
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.data.results || []);
      }
    } catch (error) {
      console.error('Erreur de recherche:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (sortBy: string) => {
    setFilters({ ...filters, sortBy: sortBy as any });
    searchProducts(searchQuery);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Recherche en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Résultats pour "{searchQuery}"
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {products.length} {products.length > 1 ? 'produits trouvés' : 'produit trouvé'}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Trier par:</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="relevance">Pertinence</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
                <option value="name">Nom A-Z</option>
                <option value="newest">Plus récents</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {products.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Aucun produit trouvé
            </h3>
            <p className="text-gray-600 mb-6">
              Essayez avec d'autres mots-clés ou parcourez nos catégories
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              Retour à l'accueil
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                showDiscount
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
SEARCH_PAGE

# ============================================
# APP.TSX AVEC ROUTING
# ============================================

echo "⚛️ Création de App.tsx avec routing..."
cat > frontend/src/App.tsx << 'APP_TSX'
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { SearchPage } from './pages/SearchPage';

const HomePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const popularSearches = [
    'iPhone 15',
    'Samsung Galaxy S24',
    'MacBook Pro',
    'PlayStation 5',
    'AirPods Pro',
  ];

  const categories = [
    { name: 'Électronique', icon: '📱', slug: 'electronique', count: '2,543' },
    { name: 'Électroménager', icon: '🏠', slug: 'electromenager', count: '1,892' },
    { name: 'Mode', icon: '👕', slug: 'mode', count: '5,432' },
    { name: 'Beauté', icon: '💄', slug: 'beaute', count: '987' },
    { name: 'Sport', icon: '⚽', slug: 'sport', count: '1,234' },
    { name: 'Maison', icon: '🏡', slug: 'maison', count: '2,156' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">AT</span>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  🏷️ Atlas Taman GPT
                </h1>
              </div>
            </Link>
            
            <div className="hidden md:flex items-center gap-4">
              <Link to="/" className="text-gray-600 hover:text-blue-600">Accueil</Link>
              <Link to="/categories" className="text-gray-600 hover:text-blue-600">Catégories</Link>
              <Link to="/deals" className="text-gray-600 hover:text-blue-600">Bons plans</Link>
            </div>
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 py-12 sm:py-16 lg:py-20">
        <div className="text-center">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Trouvez les{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              meilleurs prix
            </span>
            {' '}au Maroc
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Comparez les prix de milliers de produits sur tous les sites marchands marocains en un seul clic
          </p>

          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-6">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un produit (ex: iPhone 15, Samsung Galaxy...)"
                className="w-full px-6 py-4 pr-32 text-lg border-2 border-gray-300 rounded-full focus:outline-none focus:border-blue-500 shadow-lg"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 bottom-2 px-8 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors font-medium"
              >
                🔍 Chercher
              </button>
            </div>
          </form>

          <div className="flex flex-wrap justify-center gap-2 mb-4">
            <span className="text-sm text-gray-500">Populaire:</span>
            {popularSearches.map((term, index) => (
              <button
                key={index}
                onClick={() => {
                  setSearchQuery(term);
                  window.location.href = `/search?q=${encodeURIComponent(term)}`;
                }}
                className="text-sm bg-white/50 hover:bg-white px-3 py-1 rounded-full transition-colors border border-gray-200"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
          {[
            { icon: '📊', label: 'Prix comparés', value: '50K+' },
            { icon: '👥', label: 'Utilisateurs', value: '10K+' },
            { icon: '🏪', label: 'Marchands', value: '25+' },
            { icon: '⚡', label: 'Alertes', value: '100K+' },
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-4xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12">
        <h3 className="text-3xl font-bold text-gray-900 text-center mb-8">
          Explorez par catégorie
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category, index) => (
            <Link
              key={index}
              to={`/search?category=${category.slug}`}
              className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <div className="text-4xl mb-3">{category.icon}</div>
              <h4 className="font-semibold text-gray-900 mb-1">{category.name}</h4>
              <p className="text-xs text-gray-500">{category.count} produits</p>
            </Link>
          ))}
        </div>
      </section>

      <footer className="bg-gray-900 text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-sm text-gray-400">
              © 2025 Atlas Taman GPT - Comparateur de prix intelligent pour le Maroc
            </p>
            <p className="text-xs text-gray-500 mt-2">
              🤖 Développé avec l'assistance de ChatGPT
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </Router>
  );
}

export default App;
APP_TSX

# ============================================
# DONNÉES MOCKÉES BACKEND
# ============================================

echo "📦 Création des données mockées backend..."
cat > backend/src/mockData.ts << 'MOCK_DATA'
export const mockProducts = [
  {
    id: 1,
    name: 'iPhone 15 Pro 128GB',
    slug: 'iphone-15-pro-128gb',
    brand: 'Apple',
    category: 'Smartphones',
    categorySlug: 'smartphones',
    images: ['https://via.placeholder.com/300x300/0ea5e9/ffffff?text=iPhone+15+Pro'],
    minPrice: 12999,
    maxPrice: 14500,
    offersCount: 3,
    specifications: {
      'Écran': '6.1 pouces',
      'Processeur': 'A17 Pro',
      'RAM': '8 GB',
      'Stockage': '128 GB',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Samsung Galaxy S24 Ultra 256GB',
    slug: 'samsung-galaxy-s24-ultra-256gb',
    brand: 'Samsung',
    category: 'Smartphones',
    categorySlug: 'smartphones',
    images: ['https://via.placeholder.com/300x300/6366f1/ffffff?text=Galaxy+S24'],
    minPrice: 15299,
    maxPrice: 16999,
    offersCount: 4,
    specifications: {
      'Écran': '6.8 pouces',
      'Processeur': 'Snapdragon 8 Gen 3',
      'RAM': '12 GB',
      'Stockage': '256 GB',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'MacBook Air M3 13" 256GB',
    slug: 'macbook-air-m3-13-256gb',
    brand: 'Apple',
    category: 'Ordinateurs',
    categorySlug: 'ordinateurs',
    images: ['https://via.placeholder.com/300x300/10b981/ffffff?text=MacBook+Air+M3'],
    minPrice: 17499,
    maxPrice: 18999,
    offersCount: 2,
    specifications: {
      'Écran': '13.6 pouces',
      'Processeur': 'Apple M3',
      'RAM': '8 GB',
      'Stockage': '256 GB SSD',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 4,
    name: 'PlayStation 5 Slim',
    slug: 'playstation-5-slim',
    brand: 'Sony',
    category: 'Gaming',
    categorySlug: 'gaming',
    images: ['https://via.placeholder.com/300x300/8b5cf6/ffffff?text=PS5+Slim'],
    minPrice: 5499,
    maxPrice: 5999,
    offersCount: 5,
    specifications: {
      'Stockage': '1 TB',
      'Lecteur': 'Avec lecteur',
      'Résolution': '4K',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 5,
    name: 'AirPods Pro 2ème génération',
    slug: 'airpods-pro-2',
    brand: 'Apple',
    category: 'Audio',
    categorySlug: 'audio',
    images: ['https://via.placeholder.com/300x300/ec4899/ffffff?text=AirPods+Pro'],
    minPrice: 2599,
    maxPrice: 2999,
    offersCount: 3,
    specifications: {
      'Type': 'Sans fil',
      'Réduction de bruit': 'Oui',
      'Autonomie': '6 heures',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 6,
    name: 'Dell XPS 15 Intel i7',
    slug: 'dell-xps-15-i7',
    brand: 'Dell',
    category: 'Ordinateurs',
    categorySlug: 'ordinateurs',
    images: ['https://via.placeholder.com/300x300/f59e0b/ffffff?text=Dell+XPS+15'],
    minPrice: 16999,
    maxPrice: 18499,
    offersCount: 2,
    specifications: {
      'Écran': '15.6 pouces',
      'Processeur': 'Intel i7',
      'RAM': '16 GB',
      'Stockage': '512 GB SSD',
    },
    createdAt: new Date().toISOString(),
  },
];
MOCK_DATA

# ============================================
# SERVEUR BACKEND COMPLET
# ============================================

echo "⚙️ Création du serveur backend complet..."
cat > backend/src/server.ts << 'BACKEND_SERVER'
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { mockProducts } from './mockData';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Atlas Taman GPT API is running! 🚀',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api', (req, res) => {
  res.json({
    name: 'Atlas Taman GPT API',
    description: 'Comparateur de prix intelligent pour le Maroc',
    version: '1.0.0',
    powered_by: 'ChatGPT',
    endpoints: {
      health: '/api/health',
      search: '/api/search?q=query',
      products: '/api/products',
      productById: '/api/products/:id',
      suggestions: '/api/search/suggestions?q=query'
    },
    merchants: ['Electroplanet', 'Jumia', 'Marjane', 'BIM', 'Decathlon', 'H&M']
  });
});

app.get('/api/search', (req, res) => {
  const { q, category, sortBy = 'relevance' } = req.query;
  
  let results = [...mockProducts];
  
  if (q) {
    const query = (q as string).toLowerCase();
    results = results.filter(product => 
      product.name.toLowerCase().includes(query) ||
      product.brand.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    );
  }
  
  if (category) {
    results = results.filter(product => product.categorySlug === category);
  }
  
  switch (sortBy) {
    case 'price_asc':
      results.sort((a, b) => a.minPrice - b.minPrice);
      break;
    case 'price_desc':
      results.sort((a, b) => b.minPrice - a.minPrice);
      break;
    case 'name':
      results.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'newest':
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
  }
  
  res.json({
    success: true,
    data: {
      results,
      pagination: {
        page: 1,
        limit: 20,
        total: results.length,
        pages: Math.ceil(results.length / 20)
      },
      filters: { query: q, category, sortBy }
    },
    message: `${results.length} produits trouvés`
  });
});

app.get('/api/products', (req, res) => {
  res.json({
    success: true,
    data: { products: mockProducts, total: mockProducts.length }
  });
});

app.get('/api/products/:id', (req, res) => {
  const productId = parseInt(req.params.id);
  const product = mockProducts.find(p => p.id === productId);
  
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Produit non trouvé'
    });
  }
  
  res.json({ success: true, data: { product } });
});

app.get('/api/search/suggestions', (req, res) => {
  const { q } = req.query;
  
  if (!q || (q as string).length < 2) {
    return res.json({
      success: true,
      data: { suggestions: { products: [], brands: [], categories: [] } }
    });
  }
  
  const query = (q as string).toLowerCase();
  const matchingProducts =