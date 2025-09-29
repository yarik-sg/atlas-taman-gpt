#!/bin/bash

# Atlas Taman GPT - Script complet de génération
set -e

echo "🚀 Génération complète d'Atlas Taman GPT..."

# ============================================
# TYPES TYPESCRIPT
# ============================================
echo "📝 Création des types TypeScript..."
mkdir -p frontend/src/types
cat > frontend/src/types/index.ts << 'EOF'
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

export interface SearchFilters {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'name' | 'newest';
}
EOF

# ============================================
# COMPOSANT PRODUCT CARD
# ============================================
echo "🎨 Création du composant ProductCard..."
mkdir -p frontend/src/components/product
cat > frontend/src/components/product/ProductCard.tsx << 'EOF'
import React from 'react';
import { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  showDiscount?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, showDiscount = false }) => {
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
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group">
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
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{product.brand}</p>
        )}
        <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 h-10">{product.name}</h3>
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-bold text-blue-600">{formatPrice(product.minPrice)}</span>
          {product.maxPrice > product.minPrice && (
            <span className="text-sm text-gray-400 line-through">{formatPrice(product.maxPrice)}</span>
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span>🏪 {product.offersCount} {product.offersCount > 1 ? 'offres' : 'offre'}</span>
        </div>
        <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
          Voir les offres
        </button>
      </div>
    </div>
  );
};
EOF

# ============================================
# PAGE DE RECHERCHE
# ============================================
echo "🔍 Création de la page de recherche..."
mkdir -p frontend/src/pages
cat > frontend/src/pages/SearchPage.tsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { ProductCard } from '../components/product/ProductCard';
import { Product } from '../types';

export const SearchPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('relevance');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q') || '';
    setSearchQuery(query);
    if (query) searchProducts(query);
  }, []);

  const searchProducts = async (query: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&sortBy=${sortBy}`);
      const data = await response.json();
      if (data.success) setProducts(data.data.results || []);
    } catch (error) {
      console.error('Erreur de recherche:', error);
    } finally {
      setLoading(false);
    }
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
        <div className="max-w-7xl mx-auto py-4 px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Résultats pour "{searchQuery}"</h1>
              <p className="text-sm text-gray-600 mt-1">{products.length} produits trouvés</p>
            </div>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); searchProducts(searchQuery); }}
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

      <div className="max-w-7xl mx-auto py-6 px-4">
        {products.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun produit trouvé</h3>
            <button
              onClick={() => window.location.href = '/'}
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
EOF

# ============================================
# APP.TSX
# ============================================
echo "⚛️ Création de App.tsx..."
cat > frontend/src/App.tsx << 'EOF'
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <Link to="/" className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">AT</span>
            </div>
            <h1 className="ml-4 text-3xl font-bold text-gray-900">🏷️ Atlas Taman GPT</h1>
          </Link>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Trouvez les <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">meilleurs prix</span> au Maroc
          </h2>
          <p className="text-xl text-gray-600 mb-8">Comparez les prix de milliers de produits</p>

          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-6">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un produit (ex: iPhone 15, Samsung Galaxy...)"
                className="w-full px-6 py-4 pr-32 text-lg border-2 border-gray-300 rounded-full focus:outline-none focus:border-blue-500 shadow-lg"
              />
              <button type="submit" className="absolute right-2 top-2 bottom-2 px-8 bg-blue-600 text-white rounded-full hover:bg-blue-700 font-medium">
                🔍 Chercher
              </button>
            </div>
          </form>

          <div className="flex gap-2 justify-center">
            {['iPhone 15', 'Samsung Galaxy', 'MacBook Pro', 'PlayStation 5'].map(term => (
              <button
                key={term}
                onClick={() => window.location.href = `/search?q=${encodeURIComponent(term)}`}
                className="text-sm bg-white/50 hover:bg-white px-3 py-1 rounded-full border"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-4 gap-8">
          {[
            { icon: '📊', label: 'Prix comparés', value: '50K+' },
            { icon: '👥', label: 'Utilisateurs', value: '10K+' },
            { icon: '🏪', label: 'Marchands', value: '25+' },
            { icon: '⚡', label: 'Alertes', value: '100K+' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-4xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-gray-900 text-white mt-20 py-8">
        <div className="text-center">
          <p className="text-sm text-gray-400">© 2025 Atlas Taman GPT - Comparateur de prix pour le Maroc</p>
          <p className="text-xs text-gray-500 mt-2">🤖 Développé avec ChatGPT</p>
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
EOF

# ============================================
# BACKEND
# ============================================
echo "📦 Création des données mockées..."
cat > backend/src/mockData.ts << 'EOF'
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
    specifications: { 'Écran': '6.1 pouces', 'RAM': '8 GB' },
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Samsung Galaxy S24 Ultra 256GB',
    slug: 'samsung-galaxy-s24-ultra',
    brand: 'Samsung',
    category: 'Smartphones',
    categorySlug: 'smartphones',
    images: ['https://via.placeholder.com/300x300/6366f1/ffffff?text=Galaxy+S24'],
    minPrice: 15299,
    maxPrice: 16999,
    offersCount: 4,
    specifications: { 'Écran': '6.8 pouces', 'RAM': '12 GB' },
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'MacBook Air M3 13"',
    slug: 'macbook-air-m3',
    brand: 'Apple',
    category: 'Ordinateurs',
    categorySlug: 'ordinateurs',
    images: ['https://via.placeholder.com/300x300/10b981/ffffff?text=MacBook+Air'],
    minPrice: 17499,
    maxPrice: 18999,
    offersCount: 2,
    specifications: { 'Écran': '13.6 pouces', 'Processeur': 'M3' },
    createdAt: new Date().toISOString(),
  },
  {
    id: 4,
    name: 'PlayStation 5 Slim',
    slug: 'playstation-5-slim',
    brand: 'Sony',
    category: 'Gaming',
    categorySlug: 'gaming',
    images: ['https://via.placeholder.com/300x300/8b5cf6/ffffff?text=PS5'],
    minPrice: 5499,
    maxPrice: 5999,
    offersCount: 5,
    specifications: { 'Stockage': '1 TB', 'Résolution': '4K' },
    createdAt: new Date().toISOString(),
  },
];
EOF

echo "⚙️ Création du serveur backend..."
cat > backend/src/server.ts << 'EOF'
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
  res.json({ status: 'OK', message: 'Atlas Taman GPT API 🚀' });
});

app.get('/api/search', (req, res) => {
  const { q, sortBy = 'relevance' } = req.query;
  let results = [...mockProducts];
  
  if (q) {
    const query = (q as string).toLowerCase();
    results = results.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.brand.toLowerCase().includes(query)
    );
  }
  
  if (sortBy === 'price_asc') results.sort((a, b) => a.minPrice - b.minPrice);
  if (sortBy === 'price_desc') results.sort((a, b) => b.minPrice - a.minPrice);
  if (sortBy === 'name') results.sort((a, b) => a.name.localeCompare(b.name));
  
  res.json({
    success: true,
    data: { results, pagination: { total: results.length } }
  });
});

app.get('/api/products', (req, res) => {
  res.json({ success: true, data: { products: mockProducts } });
});

app.listen(PORT, () => {
  console.log(`🚀 API Atlas Taman GPT sur le port ${PORT}`);
  console.log(`🔍 Search: http://localhost:${PORT}/api/search?q=iphone`);
});
EOF

# ============================================
# INSTALLATION
# ============================================
echo ""
echo "📦 Installation de react-router-dom..."
cd frontend
npm install react-router-dom @types/react-router-dom --silent 2>/dev/null || true
cd ..

echo ""
echo "✅ Configuration terminée!"
echo ""
echo "🔄 Prochaines étapes:"
echo "  1. Arrêtez le serveur (Ctrl+C)"
echo "  2. npm run dev"
echo "  3. http://localhost:3000"
echo ""
echo "🧪 Tests:"
echo "  curl http://localhost:3001/api/search?q=iphone"
echo ""
echo "✨ Atlas Taman GPT prêt! 🇲🇦"
