# Made by Algerians — E-Commerce Platform

Plateforme e-commerce pour vêtements et textiles personnalisés fabriqués en Algérie. Site vitrine avec formulaire de commande intégré et panneau d'administration complet.

## Stack

| Layer | Technologie |
|---|---|
| Frontend | React 18 · Vite · Tailwind CSS v4 · TanStack Router/Query/Form |
| State | Zustand |
| Backend | Express.js · Drizzle ORM · MySQL |
| Auth | JWT (httpOnly cookies) |
| Images | Cloudinary |
| Email | Nodemailer |
| Charts | Recharts |
| Tests | Vitest · Supertest · Playwright |
| CI/CD | GitHub Actions → SFTP |

## Démarrage rapide

```bash
git clone https://github.com/atexy4ba/MBA.git
cd MBA
npm install
cp .env.example .env  # Remplir les variables
```

### Base de données

```bash
mysql -u root -e "CREATE DATABASE mba_ecom"
npx drizzle-kit generate
npx drizzle-kit migrate
npm run seed
```

### Développement

```bash
# Terminal 1 — Serveur API (port 3000)
npm run dev:server

# Terminal 2 — Frontend (port 5173)
npm run dev
```

### Production

```bash
npm run build
node scripts/prerender.mjs
NODE_ENV=production node server.cjs
```

## Structure

```
├── src/
│   ├── client/                  # Frontend React
│   │   ├── feature/
│   │   │   ├── storefront/      # Site public
│   │   │   │   ├── pages/       # HomePage, CategoryPage, ProductPage, SearchPage...
│   │   │   │   └── components/  # Header, Footer, ProductCard, CookieBanner
│   │   │   ├── admin/           # Panneau d'administration
│   │   │   │   ├── pages/       # Dashboard, Orders, Products, Categories, Settings
│   │   │   │   └── components/  # AdminLayout
│   │   │   └── auth/            # Authentification (Zustand store)
│   │   ├── shared/              # Composants partagés, hooks, types, utils
│   │   └── router.tsx           # Routes TanStack Router
│   └── server/                  # Backend Express
│       ├── db/
│       │   ├── schema/          # Schémas Drizzle (6 fichiers)
│       │   └── seed.ts          # Données initiales
│       ├── middleware/           # errorHandler, auth, rateLimit, analytics
│       ├── routes/v1/
│       │   ├── public/          # API publique
│       │   └── admin/           # API admin
│       ├── services/            # email, cloudinary
│       └── __tests__/           # Tests API + E2E
├── scripts/
│   └── prerender.mjs            # Prerender SEO (home + categories)
├── server.cjs                   # Point d'entrée production
├── GUIDE_ADMIN.md               # Guide utilisateur admin
├── DEPLOY.md                    # Guide de déploiement
└── PRODUCT.md                   # Spécifications détaillées
```

## Pages

### Storefront (`/fr`)
- **Accueil** : Hero, catégories, nouveautés, meilleures ventes, badges de confiance
- **Catégorie** : Sidebar filtres (desktop), pills (mobile), Load More
- **Produit** : 2 colonnes, zoom image, sélecteurs variantes liés, formulaire commande inline
- **Recherche** : Dropdown instantané + page résultats
- **Confirmation** : Succès commande, liens réseaux sociaux

### Admin (`/admin`)
- **Dashboard** : Stats, commandes récentes, alertes stock
- **Commandes** : Liste filtrable, détail avec timeline statuts, changement de statut
- **Produits** : CRUD avec matrice de variants (couleur × taille), paliers de prix
- **Catégories** : Arbre hiérarchique (max 2 niveaux)
- **Paramètres** : Infos boutique, champs formulaire de commande

## Commandes

| Commande | Description |
|---|---|
| `npm run dev` | Frontend Vite (port 5173) |
| `npm run dev:server` | Serveur Express (port 3000) |
| `npm run build` | Build client + serveur |
| `npm run start` | Production |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm run test` | Tests unitaires + API |
| `npm run test:e2e` | Tests Playwright |
| `npm run db:generate` | Générer migration Drizzle |
| `npm run db:migrate` | Appliquer migration |
| `npm run seed` | Données initiales |

## Licence

Projet privé — Made by Algerians.
