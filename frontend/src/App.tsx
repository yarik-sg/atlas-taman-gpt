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
