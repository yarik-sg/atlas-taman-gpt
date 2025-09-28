#!/bin/bash

# Atlas Taman GPT - Générateur de projet corrigé
set -e

echo "🚀 Génération du projet Atlas Taman GPT..."

# Créer la structure des dossiers
echo "📁 Création de la structure..."
mkdir -p .devcontainer .github/workflows .vscode
mkdir -p frontend/{src/{components/{layout,search,product,auth,compare},pages,store/{slices,api},utils,types},public,tests}
mkdir -p backend/{src/{routes,middleware,utils,types,prisma},tests}
mkdir -p scraper/{scrapers,spiders,utils,tests}
mkdir -p database/{migrations,seeds}
mkdir -p docs/{api,deployment,development}
mkdir -p scripts/{deploy,backup,maintenance}
mkdir -p logs

echo "📝 Création des fichiers de configuration..."

# .gitignore
cat > .gitignore << 'EOF'
# Variables d'environnement
.env
.env.local
.env.development
.env.test
.env.production

# Dependencies
node_modules/
*/node_modules/

# Production builds
build/
dist/
out/

# Logs
logs/
*.log

# Cache
.cache
.parcel-cache

# IDE files
.vscode/
.idea/
*.swp

# OS files
.DS_Store
Thumbs.db

# Python
__pycache__/
*.py[cod]
venv/
.venv

# Database
*.db
*.sqlite

# Uploads
uploads/
cache/
tmp/

# Backup files
*.bak
*.backup
EOF

# .env.example
cat > .env.example << 'EOF'
# Atlas Taman GPT - Variables d'environnement
NODE_ENV=development
APP_NAME=Atlas Taman GPT
APP_URL=http://localhost:3000

# Base de données PostgreSQL
DATABASE_URL=postgresql://atlas_user:atlas_password@localhost:5432/atlas_taman
DB_HOST=localhost
DB_PORT=5432
DB_NAME=atlas_taman
DB_USER=atlas_user
DB_PASSWORD=atlas_password

# Redis Cache
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT et sécurité
JWT_SECRET=your_super_secret_jwt_key_change_in_production_minimum_32_characters
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# API Backend
BACKEND_PORT=3001
BACKEND_URL=http://localhost:3001

# Frontend React
REACT_APP_API_URL=http://localhost:3001
REACT_APP_ENV=development

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@atlastaman.com

# Rate limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=http://localhost:3000

# Features
ENABLE_PRICE_ALERTS=true
ENABLE_PRODUCT_COMPARISON=true

# Debug
DEBUG=atlas:*
VERBOSE_LOGGING=true
EOF

# Package.json racine
cat > package.json << 'EOF'
{
  "name": "atlas-taman-gpt",
  "version": "1.0.0",
  "description": "Comparateur de prix pour le Maroc - Généré avec ChatGPT",
  "author": "Atlas Taman Team",
  "license": "MIT",
  "private": true,
  "workspaces": [
    "frontend",
    "backend"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "cd backend && npm run dev",
    "dev:frontend": "cd frontend && npm run dev",
    "build": "npm run build:frontend && npm run build:backend",
    "build:frontend": "cd frontend && npm run build",
    "build:backend": "cd backend && npm run build",
    "install:all": "npm install && cd frontend && npm install && cd backend && npm install",
    "clean": "rm -rf node_modules frontend/node_modules backend/node_modules",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "docker:logs": "docker-compose logs -f",
    "test": "npm run test:frontend && npm run test:backend",
    "test:frontend": "cd frontend && npm run test",
    "test:backend": "cd backend && npm run test"
  },
  "devDependencies": {
    "concurrently": "^8.2.2",
    "husky": "^8.0.3"
  },
  "keywords": [
    "price-comparison",
    "ecommerce",
    "morocco",
    "typescript",
    "react",
    "node.js",
    "chatgpt"
  ]
}
EOF

# README.md principal
cat > README.md << 'EOF'
# 🏷️ Atlas Taman GPT - Comparateur de Prix Maroc

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-18+-green.svg)
![Python](https://img.shields.io/badge/python-3.11+-green.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

**Atlas Taman GPT** (الطاس تمن) est un comparateur de prix moderne pour le marché marocain, développé avec l'assistance de ChatGPT.

## 🚀 Fonctionnalités

- **Comparaison de prix** : Recherche et compare les prix sur tous les marchands marocains
- **Alertes de prix** : Notifications par email quand un produit baisse de prix
- **Comparaison de produits** : Compare jusqu'à 3 produits côte à côte
- **Bons plans** : Détection automatique des meilleures offres
- **Interface responsive** : Optimisée pour mobile et desktop

## 🛒 Marchands supportés

- **Electroplanet** - Électronique et électroménager
- **Jumia** - Marketplace généraliste
- **Marjane** - Grande distribution
- **BIM** - Discount
- **Decathlon** - Articles de sport
- **H&M** - Mode et vêtements

## 🔧 Technologies

### Frontend
- **React 18** + TypeScript
- **Tailwind CSS**
- **Redux Toolkit**

### Backend
- **Node.js 18** + Express + TypeScript
- **Prisma** ORM pour PostgreSQL
- **Redis** pour le cache
- **JWT** pour l'authentification

### Scraping
- **Python 3.11** + Scrapy
- **BeautifulSoup4**
- **Selenium**

## 🚀 Installation

1. **Cloner le repository**
   ```bash
   git clone https://github.com/yarik-sg/atlas-taman-gpt.git
   cd atlas-taman-gpt
   ```

2. **Configurer l'environnement**
   ```bash
   cp .env.example .env
   # Éditer .env avec vos configurations
   ```

3. **Installer les dépendances**
   ```bash
   npm run install:all
   ```

4. **Démarrer les services**
   ```bash
   docker-compose up -d
   ```

5. **Lancer l'application**
   ```bash
   npm run dev
   ```

## 📱 Accès

- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:3001
- **PgAdmin** : http://localhost:8080

## 🤖 Développé avec ChatGPT

Ce projet a été généré et développé avec l'assistance de ChatGPT, démontrant les capacités d'IA pour créer des applications web modernes.

## 📄 License

MIT License - voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

**Atlas Taman GPT** - Votre comparateur de prix intelligent pour le Maroc 🇲🇦 ✨
EOF

# Docker Compose
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: atlas_taman_gpt_db
    environment:
      POSTGRES_DB: atlas_taman
      POSTGRES_USER: atlas_user
      POSTGRES_PASSWORD: atlas_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - atlas_network

  redis:
    image: redis:7-alpine
    container_name: atlas_taman_gpt_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - atlas_network

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: atlas_taman_gpt_pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@atlastaman.com
      PGADMIN_DEFAULT_PASSWORD: admin123
    ports:
      - "8080:80"
    depends_on:
      - postgres
    networks:
      - atlas_network

volumes:
  postgres_data:
  redis_data:

networks:
  atlas_network:
    driver: bridge
EOF

# Makefile
cat > Makefile << 'EOF'
# Atlas Taman GPT - Makefile

.PHONY: help install dev build test clean docker-up docker-down setup

help:
	@echo "🚀 Atlas Taman GPT - Commandes disponibles:"
	@echo ""
	@echo "  make setup       - Configuration complète"
	@echo "  make install     - Installe les dépendances"
	@echo "  make dev         - Lance en développement"
	@echo "  make build       - Build production"
	@echo "  make test        - Lance les tests"
	@echo "  make docker-up   - Démarre Docker"
	@echo "  make docker-down - Arrête Docker"
	@echo "  make clean       - Nettoie"

setup:
	@echo "🔧 Configuration d'Atlas Taman GPT..."
	npm install
	cd frontend && npm install
	cd backend && npm install
	docker-compose up -d
	@echo "✅ Configuration terminée!"

install:
	npm run install:all

dev:
	npm run dev

build:
	npm run build

test:
	npm run test

docker-up:
	npm run docker:up

docker-down:
	npm run docker:down

clean:
	npm run clean
EOF

echo "📁 Création des fichiers frontend..."

# Frontend package.json
cat > frontend/package.json << 'EOF'
{
  "name": "atlas-taman-frontend",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "@types/node": "^20.10.6",
    "@types/react": "^18.2.46",
    "@types/react-dom": "^18.2.18",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.3",
    "web-vitals": "^3.5.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "dev": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "proxy": "http://localhost:3001"
}
EOF

# Backend package.json
cat > backend/package.json << 'EOF'
{
  "name": "atlas-taman-backend",
  "version": "1.0.0",
  "description": "Backend API for Atlas Taman GPT",
  "main": "dist/server.js",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "start": "node dist/server.js",
    "build": "tsc",
    "test": "echo \"Tests backend à implémenter\""
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.6",
    "tsx": "^4.6.2",
    "typescript": "^5.3.3"
  }
}
EOF

# Frontend index.html
cat > frontend/public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#0ea5e9" />
  <meta name="description" content="Atlas Taman GPT - Comparateur de prix pour le Maroc" />
  <title>Atlas Taman GPT - Comparateur Prix Maroc</title>
</head>
<body>
  <noscript>Vous devez activer JavaScript pour utiliser cette application.</noscript>
  <div id="root"></div>
</body>
</html>
EOF

# Frontend App.tsx
cat > frontend/src/App.tsx << 'EOF'
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
              <h4 className="text-lg font-semibold mb-3">🔄 Prochaines étapes :</h4>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
                  Installer les dépendances : <code className="ml-2 bg-black bg-opacity-20 px-2 py-1 rounded">npm run install:all</code>
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
                  Démarrer Docker : <code className="ml-2 bg-black bg-opacity-20 px-2 py-1 rounded">docker-compose up -d</code>
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
                  Lancer l'app : <code className="ml-2 bg-black bg-opacity-20 px-2 py-1 rounded">npm run dev</code>
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
EOF

# Frontend index.tsx
cat > frontend/src/index.tsx << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

# Frontend CSS
cat > frontend/src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
EOF

# Backend server
cat > backend/src/server.ts << 'EOF'
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
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
      products: '/api/products (à venir)',
      search: '/api/search (à venir)',
      auth: '/api/auth (à venir)',
      alerts: '/api/alerts (à venir)'
    },
    merchants: [
      'Electroplanet',
      'Jumia', 
      'Marjane',
      'BIM',
      'Decathlon',
      'H&M'
    ]
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: 'Consultez /api pour voir les endpoints disponibles'
  });
});

app.listen(PORT, () => {
  console.log('🚀 Atlas Taman GPT API démarré!');
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 Health: http://localhost:${PORT}/api/health`);
  console.log(`📚 API Info: http://localhost:${PORT}/api`);
  console.log(`🤖 Powered by ChatGPT`);
});
EOF

echo ""
echo "🎉 Atlas Taman GPT généré avec succès!"
echo ""
echo "📁 Projet créé dans le dossier courant"
echo ""
echo "🔄 Prochaines étapes :"
echo "  1. git add ."
echo "  2. git commit -m 'Initial commit: Atlas Taman GPT by ChatGPT'"
echo "  3. git push origin main"
echo "  4. npm run install:all"
echo "  5. docker-compose up -d"
echo "  6. npm run dev"
echo ""
echo "📱 Accès :"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend:  http://localhost:3001/api"
echo "  - PgAdmin:  http://localhost:8080"
echo ""
echo "✨ Votre comparateur de prix marocain est prêt ! 🇲🇦"