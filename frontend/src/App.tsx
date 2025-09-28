import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">AT</span>
              </div>
            </div>
            <div className="ml-4">
              <h1 className="text-3xl font-bold text-gray-900">
                🏷️ Atlas Taman GPT
              </h1>
              <p className="text-gray-600">
                Comparateur de prix intelligent pour le Maroc
              </p>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              🚀 Projet généré avec ChatGPT
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-r from-green-400 to-green-600 rounded-lg p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">✅ Frontend React</h3>
                <p className="text-green-100">Interface moderne avec TypeScript</p>
              </div>
              
              <div className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">⚙️ Backend Node.js</h3>
                <p className="text-blue-100">API REST avec Express</p>
              </div>
              
              <div className="bg-gradient-to-r from-purple-400 to-purple-600 rounded-lg p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">🕷️ Scrapers Python</h3>
                <p className="text-purple-100">Collecte automatique des prix</p>
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-400">
              <h4 className="text-lg font-semibold text-blue-800 mb-4">
                🛒 Marchands supportés
              </h4>
              <div className="flex flex-wrap gap-3">
                {['Electroplanet', 'Jumia', 'Marjane', 'BIM', 'Decathlon', 'H&M'].map((merchant) => (
                  <span
                    key={merchant}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {merchant}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="mt-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
              <h4 className="text-lg font-semibold mb-3">✅ Status du projet :</h4>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                  Backend API : <strong className="ml-2">🚀 RUNNING</strong>
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                  Frontend React : <strong className="ml-2">🎨 READY</strong>
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                  PostgreSQL : <strong className="ml-2">💾 CONNECTED</strong>
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                  Redis Cache : <strong className="ml-2">⚡ ACTIVE</strong>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;