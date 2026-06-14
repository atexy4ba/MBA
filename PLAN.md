# Implementation Plan — Phase par Phase

## Phase 1 — Fondations (Project Setup + Database)

**Objectif** : Mettre en place l'infrastructure de base du projet.

### 1.1 Initialisation du projet
- Initialiser le projet Node.js (`npm init`)
- Installer les dépendances :
  - **Production** : `express`, `drizzle-orm`, `mysql2`, `jsonwebtoken`, `bcryptjs`, `helmet`, `cors`, `express-rate-limit`, `nodemailer`, `cloudinary`, `dotenv`, `zod`, `cookie-parser`
  - **Développement** : `typescript`, `vite`, `@vitejs/plugin-react`, `tailwindcss`, `postcss`, `autoprefixer`, `drizzle-kit`, `vitest`, `supertest`, `playwright`, `eslint`, `@types/*`, `tsx`
- Configurer TypeScript (`tsconfig.json`)
- Configurer Vite avec `@vitejs/plugin-react`
- Configurer Tailwind CSS (palette minimal industrielle : noir, blanc, charcoal, `#D32F2F`)
- Configurer ESLint + Prettier
- Créer la structure de dossiers (`src/client/`, `src/server/`, `src/shared/`)
- Créer le `server.js` racine (4 lignes)
- Créer le `.env.example` documentant toutes les variables

### 1.2 Configuration base de données
- Installer et configurer MySQL localement (ou Docker)
- Configurer Drizzle (`drizzle.config.ts` — connexion MySQL)
- Créer les schémas Drizzle par domaine :
  - `db/schema/products.ts` — `products` + `variants`
  - `db/schema/categories.ts` — `categories` (self-ref `parent_id`)
  - `db/schema/orders.ts` — `orders` + `order_items` + `order_status_history`
  - `db/schema/auth.ts` — `users` + `refresh_tokens`
  - `db/schema/analytics.ts` — `analytics_events`
  - `db/schema/settings.ts` — `store_settings` + `order_form_fields`
- Générer et appliquer la première migration (`drizzle-kit generate:mysql` + `drizzle-kit migrate`)
- Créer le client Drizzle exporté (`src/server/db/index.ts`)

### 1.3 Configuration CI/CD
- Créer le workflow GitHub Actions (`.github/workflows/deploy.yml`)
- Configurer les secrets GitHub Actions (MySQL, Cloudinary, JWT, SMTP)
- Configurer le déploiement SFTP vers Octenium
- Faire un premier déploiement test (build vide)

**Livrable** : Projet qui compile, DB migrée, CI/CD fonctionnel.

---

## Phase 2 — API Backend Core

**Objectif** : Construire l'API Express complète (publique + admin).

### 2.1 Middleware
- `errorHandler.ts` — enveloppe d'erreur JSON standardisée `{ error: { code, message } }`
- `auth.ts` — vérification JWT + garde de rôle (`requireAdmin`)
- `rateLimit.ts` — 100 req/min global, 5 tentatives/min sur `/admin/login`
- `analytics.ts` — log middleware (page views, events → `analytics_events`)
- Configuration Helmet + CORS + JSON parser + cookie parser

### 2.2 Routes publiques (`/api/v1/`)
- `GET /products` — liste paginée + filtres (catégorie, prix min/max, tri)
- `GET /products/:slug` — produit unique + variants
- `GET /categories` — arbre de catégories
- `GET /categories/:slug` — produits d'une catégorie
- `GET /search` — recherche FULLTEXT MySQL (avec `q`, `category`, `minPrice`, `maxPrice`)
- `POST /orders` — soumettre une commande (validée par Zod)

### 2.3 Services Backend
- `email.ts` — envoi email admin via Nodemailer (nouvelle commande)
- `cloudinary.ts` — configuration Cloudinary SDK (signature, dossier)

### 2.4 Seed de données
- Script de seed : catégories initiales, admin user (email + password hashé)
- Produits d'exemple avec variants pour le développement

### 2.5 Routes admin (`/api/v1/admin/`)
- `POST /admin/login` — authentification admin (JWT access + refresh)
- `POST /admin/refresh` — rafraîchir le token
- CRUD `GET/POST/PUT/DELETE /admin/products` — gestion produits + variants
- CRUD `GET/POST/PUT/DELETE /admin/categories`
- `GET /admin/orders` — liste des commandes (filtrable par statut, date, client)
- `GET /admin/orders/:id` — détail commande + historique statuts
- `PUT /admin/orders/:id/status` — changer le statut (décrémente stock si `confirmed`)
- `GET /admin/analytics` — stats dashboard (commandes/jour, top produits, stock alerts)
- `GET/PUT /admin/settings` — paramètres boutique + champs formulaire

### 2.6 Tests API
- Tests Supertest pour chaque route publique
- Tests Supertest pour chaque route admin (avec JWT mock)
- Test du flux de commande complet (soumettre → notifier → confirmer → stock décrémenté)
- Test d'erreurs (validation, auth, rate limiting, not found)

**Livrable** : API Express complète, testée, documentée par le schéma de routes.

---

## Phase 3 — Frontend Storefront

**Objectif** : Construire le site public client en React (français uniquement).

### 3.1 Setup React
- Configurer TanStack Router avec préfixe de locale `/fr/`
- Configurer TanStack Query (client, `QueryClientProvider`)
- Configurer Zustand (auth store uniquement)
- Créer les composants partagés : `Button`, `Input`, `Modal`, `PriceTag`, `Badge`
- Mettre en place le layout storefront (header, footer, cookie consent banner)

### 3.2 Page d'accueil (`/fr/`)
- Hero banner avec message de marque + CTA
- Section "Catégories" avec images
- Section "Nouveautés" (grille ProductCard)
- Section "Meilleures ventes" (grille ProductCard)
- Section "Pourquoi nous choisir" (badges de confiance)
- Footer avec liens sociaux + politique de confidentialité

### 3.3 Page catégorie (`/fr/categories/:slug`)
- Sidebar filtres (desktop) : catégories enfants, prix, couleur
- Barre de filtres en pills (mobile) → slide-out panel
- Grille de produits avec Load More (TanStack Query `useInfiniteQuery`)
- Breadcrumb catégorie

### 3.4 Page produit (`/fr/products/:slug`)
- Layout 2 colonnes (desktop), empilé (mobile)
- Colonne gauche : image principale avec zoom (`react-medium-image-zoom`) + thumbnails
- Colonne droite : nom, prix, description, sélecteurs de variantes liés (couleur ↔ taille)
- Sélecteur de quantité
- Formulaire de commande inline (nom, email, téléphone, adresse, ville, code postal, pays, notes)
- Validation TanStack Form + Zod

### 3.5 Recherche (`/fr/search`)
- Barre de recherche avec dropdown instantané (top 5 résultats)
- Soumission → page de résultats complète avec filtres + pagination

### 3.6 Page de confirmation (`/fr/confirmation/:orderId`)
- Message de succès avec numéro de commande
- Liens réseaux sociaux
- Bouton "Retour à l'accueil"

### 3.7 RGPD
- Bannière de consentement cookies (accept/reject) en bas de page
- Page politique de confidentialité (route statique)

### 3.8 Analytics frontend
- Log des pages vues via middleware analytics
- Log des événements (view_product, search, add_to_cart → start_order_form, submit_order)

**Livrable** : Storefront complet, responsive, prêt à recevoir du trafic.

---

## Phase 4 — Frontend Admin

**Objectif** : Construire le panneau d'administration (`/admin`).

### 4.1 Setup Admin
- Layout admin avec sidebar (menu : Dashboard, Commandes, Produits, Catégories, Paramètres)
- Route guard TanStack Router → redirige vers `/admin/login` si non authentifié
- Page de login admin (email + mot de passe)

### 4.2 Dashboard (`/admin`)
- Cartes statistiques (commandes du jour, en attente, chiffre d'affaires estimé)
- Graphique Recharts (commandes/revenus par jour — 30 derniers jours)
- Top 5 produits
- Alertes stock (< 5 unités)
- Dernières commandes (tableau compact)

### 4.3 Commandes (`/admin/commandes`)
- Tableau filtrable (statut, date, recherche client)
- Page détail commande (`/admin/commandes/:id`)
  - Infos client + produits commandés
  - Timeline des statuts (historique)
  - Dropdown pour changer le statut
- Changement de statut avec confirmation + raison optionnelle

### 4.4 Produits (`/admin/produits`)
- Liste paginée avec recherche + filtre catégorie
- Formulaire création/édition produit
  - Infos générales (nom, description, catégorie, images Cloudinary Upload Widget)
  - Toggle prix plat / prix par quantité
  - Générateur de matrice de variants (sélectionner couleurs + tailles → grille auto-générée → ajuster prix/stock/SKU → supprimer combos invalides)
- Suppression produit (soft delete : `status = 'archived'`)

### 4.5 Catégories (`/admin/categories`)
- Arbre hiérarchique visuel (max 2 niveaux)
- CRUD via modale : nom, slug, image, ordre, catégorie parente
- Suppression avec vérification (produits existants dans la catégorie)

### 4.6 Paramètres (`/admin/parametres`)
- Infos boutique : nom, logo, email contact, devise (DZD), liens réseaux sociaux
- Champs formulaire de commande : ajouter/supprimer/réorganiser des champs (label, type, obligatoire, options)
- Configuration SMTP : host, port, user, password

**Livrable** : Panneau admin complet, fonctionnel, prêt pour la gestion quotidienne.

---

## Phase 5 — SEO & Optimisations

**Objectif** : Référencement, performance, et finitions.

### 5.1 SEO statique
- Script CI de pré-rendu : génération HTML statique pour page d'accueil + pages catégories
- Utilisation d'EJS pour les templates statiques
- Open Graph + Twitter Card meta tags sur toutes les pages
- Sitemap XML dynamique (généré par Express)
- Fichier `robots.txt`

### 5.2 Optimisations de performance
- Code splitting React avec `React.lazy()` (admin panel chargé à la demande)
- Optimisation des images Cloudinary (redimensionnement automatique, format WebP)
- Mise en cache TanStack Query (staleTime, gcTime)
- Compression Brotli/Gzip via Express middleware

### 5.3 E2E Testing
- Playwright : parcours storefront complet (accueil → catégorie → produit → commander)
- Playwright : parcours admin complet (login → créer produit → voir commande → changer statut)
- Playwright : test responsive mobile (viewport 375px)

### 5.4 Finitions
- Page 404 personnalisée
- États de chargement partout (skeletons Tailwind)
- États d'erreur partout (messages + bouton réessayer)
- États vides (catégorie sans produits, recherche sans résultats)
- Transitions et animations subtiles (hover cartes, fade-in pages)
- Favicon + PWA manifest basique

**Livrable** : Site prêt pour la mise en production.

---

## Phase 6 — Production & Monitoring

**Objectif** : Mise en production sur Octenium et vérification.

### 6.1 Déploiement final
- Dernière migration DB sur la base Octenium
- Build Vite production + compilation TypeScript serveur
- Upload SFTP complet vers Octenium
- Configuration du gestionnaire Node.js Octenium (pointer vers `server.js`)
- Vérification HTTPS (si certificat Octenium)

### 6.2 Vérification post-déploiement
- Test de toutes les pages storefront
- Test de toutes les fonctionnalités admin
- Test d'envoi d'email (commande → notification admin)
- Test de soumission de commande complète
- Vérification RGPD (bannière cookies, page confidentialité)

### 6.3 Documentation
- Guide d'utilisation admin (comment créer un produit, gérer les commandes)
- Guide de déploiement (comment mettre à jour le site)
- Documentation technique (architecture, stack, variables d'environnement)

**Livrable** : Site en production, documenté, opérationnel.

---

## Résumé des Phases

| Phase | Nom | Effort estimé |
|---|---|---|
| 1 | Fondations (Setup + DB) | ~2 jours |
| 2 | API Backend Core | ~4 jours |
| 3 | Frontend Storefront | ~5 jours |
| 4 | Frontend Admin | ~5 jours |
| 5 | SEO & Optimisations | ~3 jours |
| 6 | Production & Monitoring | ~2 jours |
| **Total** | | **~21 jours** |
