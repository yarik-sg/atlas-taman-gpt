# 🏷️ Atlas Taman GPT - Comparateur de Prix Maroc

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-18+-green.svg)
![Python](https://img.shields.io/badge/python-3.11+-green.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

**Atlas Taman GPT** (الطاس تمن) est un comparateur de prix moderne pour le marché marocain, développé avec l'assistance de ChatGPT.

## 🚀 Fonctionnalités

### Déjà disponibles

- **Page d'accueil interactive** avec suggestions de recherches populaires et mise en avant du projet.
- **Recherche de produits** sur une API Express alimentée par des données de démonstration.
- **Tri des résultats** (pertinence, prix croissant/décroissant, ordre alphabétique) directement depuis l'interface.
- **Cartes produits détaillées** affichant prix minimum/maximum, nombre d'offres et visuels.
- **Interface responsive** construite avec Tailwind CSS.

### Planifiées

- **Comparaison multi-marchands en temps réel** sur l'ensemble des enseignes marocaines.
- **Alertes de prix personnalisées** envoyées par email ou notifications.
- **Comparaison avancée de produits** (jusqu'à 3 produits côte à côte).
- **Détection automatisée des bons plans** et des promotions saisonnières.
- **Tableau de bord utilisateurs** avec authentification et suivi des alertes.

## 🛒 Marchands supportés

- **Electroplanet** - Électronique et électroménager
- **Jumia** - Marketplace généraliste
- **Marjane** - Grande distribution
- **BIM** - Discount
- **Decathlon** - Articles de sport
- **H&M** - Mode et vêtements

## 🔧 Technologies

### Stack actuelle

- **Frontend** : React 18, React Router DOM, TypeScript, Create React App, Tailwind CSS.
- **Backend** : Node.js 18, Express, TypeScript (compilé avec `tsc`), gestion de la config via `dotenv`, données mockées en mémoire.
- **Outils** : TSX pour le rechargement à chaud côté serveur, PostCSS & Autoprefixer pour le pipeline CSS.

### Stack envisagée

- **Base de données relationnelle** orchestrée via Prisma et PostgreSQL.
- **Cache distribué** (Redis) pour accélérer les recherches.
- **Authentification sécurisée** basée sur JWT et rôles utilisateurs.
- **Pipeline de collecte** : Scraping Python (Scrapy, BeautifulSoup, Selenium) pour agréger les offres en temps réel.

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

## 🗺️ Prochaines étapes

- Finaliser l'intégration avec les premiers marchands partenaires et connecter une base de données temps réel.
- Mettre en place le système d'alertes de prix (emails/notifications) et le tableau de bord utilisateur.
- Déployer le pipeline de scraping Python pour enrichir automatiquement le catalogue produits.
- Ajouter des tests end-to-end et des métriques de performance pour fiabiliser la montée en charge.

## 🤖 Développé avec ChatGPT

Ce projet a été généré et développé avec l'assistance de ChatGPT, démontrant les capacités d'IA pour créer des applications web modernes.

## 📄 License

MIT License - voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

**Atlas Taman GPT** - Votre comparateur de prix intelligent pour le Maroc 🇲🇦 ✨
