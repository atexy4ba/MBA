# Guide de déploiement — Made by Algerians

## Prérequis

- Node.js 22+
- MySQL 8.0+
- Compte GitHub avec accès au repo `atexy4ba/MBA`
- Hébergement Octenium avec support Node.js
- Compte Cloudinary (gratuit)

---

## 1. Configuration locale

```bash
git clone https://github.com/atexy4ba/MBA.git
cd MBA
npm install
```

Copier `.env.example` vers `.env` et remplir les variables :

```bash
cp .env.example .env
```

Variables essentielles :
- `DB_*` : connexion MySQL
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` : générer avec `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- `ADMIN_PASSWORD` : mot de passe admin initial
- `CLOUDINARY_*` : credentials Cloudinary
- `SMTP_*` : serveur SMTP

---

## 2. Base de données

```bash
# Créer la base
mysql -u root -e "CREATE DATABASE mba_ecom"

# Générer et appliquer les migrations
npx drizzle-kit generate
npx drizzle-kit migrate

# Peupler avec les données initiales
npm run seed
```

---

## 3. Développement

```bash
# Lancer le serveur API
npm run dev:server

# Lancer le frontend (dans un autre terminal)
npm run dev
```

Le site est accessible sur `http://localhost:5173`.

---

## 4. Tests

```bash
# Tests unitaires + API
npm test

# Tests E2E (nécessite le serveur de dev)
npm run test:e2e

# Vérification TypeScript
npm run typecheck

# Lint
npm run lint
```

---

## 5. Build production

```bash
# Build client + serveur
npm run build

# Prerender les pages statiques (SEO)
node scripts/prerender.mjs

# Démarrer en production
NODE_ENV=production node server.cjs
```

---

## 6. Déploiement Octenium

### 6.1 Configuration GitHub Actions

Ajouter les secrets suivants dans GitHub → Settings → Secrets and variables → Actions :

| Secret | Description |
|---|---|
| `OCENIUM_SFTP_HOST` | Adresse FTP/SFTP Octenium |
| `OCENIUM_SFTP_PORT` | Port (généralement 21 ou 22) |
| `OCENIUM_SFTP_USER` | Identifiant FTP |
| `OCENIUM_SFTP_PASSWORD` | Mot de passe FTP |
| `DB_HOST` | Hôte MySQL |
| `DB_PORT` | Port MySQL |
| `DB_USER` | Utilisateur MySQL |
| `DB_PASSWORD` | Mot de passe MySQL |
| `DB_NAME` | Nom de la base |

### 6.2 Premier déploiement manuel

1. Build en local : `npm run build`
2. Uploader via FTP/SFTP vers Octenium :
   - `dist/` (build Vite)
   - `dist-server/` (build serveur)
   - `server.cjs`
   - `package.json`
   - `package-lock.json`
   - `public/`
3. Sur Octenium, installer les dépendances : `npm ci --omit=dev`
4. Créer le fichier `.env` avec les credentials production
5. Pointer le gestionnaire Node.js d'Octenium vers `server.cjs`
6. Redémarrer l'application Node

### 6.3 Déploiement automatique

Une fois les secrets GitHub configurés, chaque push sur `master` déclenche :
1. Lint + TypeScript + Tests unitaires
2. Tests E2E Playwright
3. Build client + serveur
4. Prerender SEO
5. Upload SFTP vers Octenium

---

## 7. Maintenance

### Mise à jour des dépendances
```bash
npm outdated
npm update
```

### Sauvegarde de la base de données
```bash
mysqldump -u root mba_ecom > backup_$(date +%Y%m%d).sql
```

### Logs serveur
Sur Octenium, les logs sont accessibles via le panneau de contrôle → Logs.
