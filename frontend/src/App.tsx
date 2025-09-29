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
