# 🏷️ Atlas Taman GPT - Comparateur de Prix Maroc

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-18+-green.svg)
![Python](https://img.shields.io/badge/python-3.11+-green.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

**Atlas Taman GPT** (الطاس تمن) est un comparateur de prix moderne pour le marché marocain, développé avec l'assistance de ChatGPT.

## 🚀 Fonctionnalités

### Implémentées

- **Page d'accueil de démonstration** avec moteur de recherche et suggestions pré-remplies pour explorer rapidement le catalogue mocké.
- **Recherche de produits** via une API Express qui renvoie des données de démonstration (mock) selon le terme recherché.
- **Tri des résultats** par pertinence, prix croissant/décroissant ou ordre alphabétique directement depuis l'interface React.
- **Cartes produits** synthétiques présentant prix min/max, nombre d'offres et marchands fictifs.
- **Interface responsive** réalisée avec Tailwind CSS et Create React App.

### En cours de conception

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

### Actuellement utilisées

- **Frontend** : React 18, React Router DOM, TypeScript, Create React App (`react-scripts`), Tailwind CSS propulsé par PostCSS et Autoprefixer, Web Vitals.
- **Backend** : Node.js 18, Express, TypeScript compilé avec `tsc`, serveur démarré en développement avec `tsx`, configuration via `dotenv`, données produits mockées en mémoire.
- **Outils de monorepo** : NPM Workspaces, scripts `concurrently` pour lancer front et back en parallèle, Husky prêt pour automatiser les hooks Git.

### Vision cible

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

- Connecter une base de données temps réel et intégrer les premiers marchands partenaires pour remplacer les données mockées.
- Mettre en place le système d'alertes de prix (emails/notifications) et le tableau de bord utilisateur.
- Déployer le pipeline de scraping Python pour enrichir automatiquement le catalogue produits.
- Ajouter des tests end-to-end et des métriques de performance pour fiabiliser la montée en charge.

## 🤖 Développé avec ChatGPT

Ce projet a été généré et développé avec l'assistance de ChatGPT, démontrant les capacités d'IA pour créer des applications web modernes.

## 📄 License

MIT License - voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

**Atlas Taman GPT** - Votre comparateur de prix intelligent pour le Maroc 🇲🇦 ✨
