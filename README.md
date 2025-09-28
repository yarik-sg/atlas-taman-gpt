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
