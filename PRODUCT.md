# Made by Algerians — E-Commerce Platform

## Unified Implementation Plan

---

### 1. Stack Summary

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Routing | TanStack Router (URL-prefix i18n: `/fr/`, `/ar/`, `/en/`) |
| State | Zustand (auth store only, no cart) |
| Data fetching | TanStack Query |
| Forms | TanStack Form + Zod |
| Charts | Recharts |
| Backend | Express.js (root `server.js` + `dist-server/`) |
| ORM | Drizzle (domain-split schema) |
| Database | MySQL (FULLTEXT search) |
| Images | Cloudinary Upload Widget |
| Email | Nodemailer via Octenium SMTP |
| Auth | JWT in httpOnly cookies (access 15min + refresh 7d in DB) |
| Icons | Lucide React |
| Toasts | Sonner |
| Image Zoom | react-medium-image-zoom |
| CI/CD | GitHub Actions → SFTP to Octenium mutualized |
| Testing | Vitest (unit/hooks) + Supertest (API) + Playwright (E2E) |
| SEO | Static HTML prerender for homepage + category pages |
| Cookie compliance | RGPD consent banner + privacy policy page |

### 2. Frontend Architecture

```
src/client/
├── feature/
│   ├── storefront/
│   │   ├── pages/           # Homepage, Category, Product, Search
│   │   ├── components/      # ProductCard, CategoryPill, FilterSidebar, etc.
│   │   └── hooks/           # useSearch, useFilters
│   ├── admin/
│   │   ├── pages/           # Dashboard, Orders, Products, Categories, Settings
│   │   ├── components/      # OrderTimeline, StatusBadge, VariantMatrix
│   │   └── hooks/
│   └── auth/
│       ├── pages/           # AdminLogin
│       └── stores.ts        # Zustand auth store
├── shared/
│   ├── components/          # Button, Input, Modal, StarRating
│   ├── lib/                 # api.ts (TanStack Query client), utils
│   └── types/
├── router.tsx               # TanStack Router config + route guards
├── main.tsx                 # Vite entry
└── index.css                # Tailwind directives
```

### 3. Backend Architecture

```
src/server/
├── index.ts                 # Express app creation + export
├── db/
│   ├── schema/
│   │   ├── index.ts         # Re-exports all
│   │   ├── products.ts      # products, variants
│   │   ├── categories.ts    # categories (self-ref parent_id)
│   │   ├── orders.ts        # orders, order_items, order_status_history
│   │   ├── auth.ts          # users, refresh_tokens
│   │   ├── analytics.ts     # analytics_events
│   │   └── settings.ts      # store_settings, order_form_fields
│   └── index.ts             # Drizzle client init
├── routes/
│   ├── v1/
│   │   ├── public/          # products, categories, search, orders (submit), track
│   │   └── admin/           # protected CRUD for all entities
│   └── index.ts
├── middleware/
│   ├── auth.ts              # JWT verify + role guard
│   ├── analytics.ts         # Log page views/events
│   ├── errorHandler.ts      # Standardized JSON error envelope
│   └── rateLimit.ts         # express-rate-limit
└── services/
    ├── email.ts             # Nodemailer (admin notification)
    ├── cloudinary.ts        # Cloudinary SDK
    └── analytics.ts         # IP→geo (GeoLite2), funnel computation
```

Root `server.js` (4 lines):
```js
const { app } = require('./dist-server/index');
const PORT = process.env.PORT || 3000;
app.listen(PORT);
```

### 4. Database Schema (Drizzle — Domain-Split)

**products.ts**: `products(id, name, description, categoryId, isQuantityPricing, metadata[json], status, createdAt, updatedAt)`, `variants(id, productId, color, size, price, stock, sku, imageUrl)` — linked combos only.

**categories.ts**: `categories(id, name, slug, parentId, imageUrl, sortOrder)` — self-referencing, 2 levels enforced at app.

**orders.ts**: `orders(id, customerName, email, phone, address, city, zip, country, notes, status, createdAt, updatedAt)`, `order_items(id, orderId, variantId, productId, quantity, unitPrice)`, `order_status_history(id, orderId, status, note, changedBy, createdAt)`.

**auth.ts**: `users(id, email, passwordHash, role)`, `refresh_tokens(id, userId, token, expiresAt)`.

**analytics.ts**: `analytics_events(id, eventType, userId, sessionId, productId, pageUrl, referrer, ip, userAgent, createdAt)`.

**settings.ts**: `store_settings(id, key, value)` + `order_form_fields(id, label, type, required, sortOrder, options[json])`.

### 5. Routes Map

| Method | Path | Scope |
|---|---|---|
| `GET` | `/api/v1/products` | Public — list with pagination, filters, search |
| `GET` | `/api/v1/products/:slug` | Public — single product + variants |
| `GET` | `/api/v1/categories` | Public — tree |
| `GET` | `/api/v1/categories/:slug` | Public — products in category |
| `GET` | `/api/v1/search?q=&category=&minPrice=&maxPrice=` | Public — search + filter |
| `POST` | `/api/v1/orders` | Public — submit order |
| `GET` | `/api/v1/admin/*` | Admin CRUD for products, orders, categories, settings, analytics |
| `POST` | `/api/v1/admin/login` | Auth — obtain JWT |
| `POST` | `/api/v1/admin/refresh` | Auth — refresh token |

### 6. Storefront Pages

- `/fr/` — Homepage (hero, featured categories, new arrivals, best sellers, trust badges)
- `/fr/categories/:slug` — Category page (sidebar filters on desktop, pills on mobile)
- `/fr/products/:slug` — Product detail (2-col: image zoom left, info + order form right)
- `/fr/search?q=...` — Search results (instant dropdown + full page)
- `/fr/confirmation/:orderId` — Post-order success

### 7. Admin Panel Pages

- `/admin` → Dashboard (stats, chart, recent orders, stock alerts)
- `/admin/commandes` → Orders list (filterable table)
- `/admin/commandes/:id` → Order detail (status timeline + change status)
- `/admin/produits` → Products list
- `/admin/produits/new` + `/:id/edit` → Product form (matrix grid variant builder)
- `/admin/categories` → Nested tree CRUD
- `/admin/parametres` → Store info, order form fields, SMTP config

### 8. Order Status Pipeline

```
pending → confirmed → shipped → delivered
               ↘ cancelled (anytime before shipped)
```

- Status `confirmed` auto-decrements variant stock
- Status history logged per order
- Admin notification email on `pending`

### 9. Styling

- **Palette**: Black, white, charcoal (#1a1a1a, #333, #f5f5f5), primary accent `#D32F2F` (Algerian red)
- **Fonts**: Playfair Display (headings), Poppins (body/UI)
- **Design**: Minimal industrial, product card with color swatches + hover overlay
- **Responsive**: Storefront mobile-first, admin desktop-first

### 10. CI/CD Pipeline (GitHub Actions)

```
push to main →
  ├─ parallel: lint (ESLint) + typecheck (tsc) + test (vitest + supertest)
  ├─ tsc (server → dist-server/) + vite build (client → dist/)
  ├─ drizzle-kit generate (if schema changes) + drizzle-kit migrate
  ├─ static prerender (homepage + category pages via EJS)
  └─ SFTP upload to Octenium (dist/, dist-server/, server.js, package.json, .env)
```

### 11. Testing Strategy

- **Vitest**: Utility functions, Zustand stores, hooks
- **Supertest**: Express API routes against test MySQL DB (CRUD, auth, stock logic)
- **Playwright**: E2E — browse homepage → category → product → submit order; admin login → create product → view order

### 12. i18n Timeline

- **v1**: French (`/fr/`) — full storefront + admin
- **v2**: Arabic (`/ar/`) + RTL layout
- **v3**: English (`/en/`)

### 13. What Is NOT in v1

- User accounts (single admin only)
- Cart (per-product order form instead)
- Payment integration
- Carrier tracking API
- Full BI dashboard (analytics_events collects data; dashboard ships v2)
- Arabic / English storefront
- Newsletter system
- Multi-admin roles
- Wishlist / favorites
- Product reviews/ratings
- Public order tracking page (admin-only)
