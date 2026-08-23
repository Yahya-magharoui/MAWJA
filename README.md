# 🌊 MAWJA – Application Bien-être

Bienvenue dans **MAWJA**, une application web & mobile basée sur le concept de la *fenêtre de tolérance* pour aider les utilisateurs à mieux comprendre et réguler leurs états émotionnels.

---

## 📦 Prérequis

- [Node.js](https://nodejs.org/) v22
- [pnpm](https://pnpm.io/) v9+  
- [PostgreSQL 16](https://www.postgresql.org/) (via Homebrew ou Docker)  
- (optionnel) [Expo Go](https://expo.dev/client) sur mobile ou émulateur iOS/Android  

---

## 🔧 Installation

1. **Cloner le repo et installer les dépendances**
```bash
git clone <ton-repo>
cd galini-monorepo

# Installer les dépendances
pnpm install
```

2. **Configurer le workspace**
Vérifie que le fichier `pnpm-workspace.yaml` existe à la racine :
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'server'
```

3. **Configurer la base Postgres**
- Avec **Homebrew** :
```bash
brew install postgresql@16
brew services start postgresql@16
createuser -s galini
psql -d postgres -c "ALTER USER galini WITH PASSWORD 'galini';"
createdb -U galini galini
```

- OU avec **Docker** :
```bash
docker compose -f infra/docker-compose.yml up -d
```

4. **Configurer les variables d’environnement**
```bash
cp server/.env.example server/.env
cp apps/web/.env.example apps/web/.env
```

Variables minimales :
- `apps/web/.env` : `NEXT_PUBLIC_API_URL`
- `server/.env` : `DATABASE_URL`, `AUTH_TOKEN_SECRET`, `PORT`, `ALLOWED_ORIGINS`

Exemple production backend :
```env
AUTH_TOKEN_SECRET=une-cle-longue-et-aleatoire
ALLOWED_ORIGINS=https://mawja.app,https://www.mawja.app
```

---

## ⚙️ Backend (NestJS + Prisma)

Depuis la racine :
```bash
# Générer le client Prisma
pnpm --filter server prisma:generate

# Valider le schéma Prisma miroir
pnpm --filter server prisma:validate

# Lancer le backend
pnpm --filter server dev
```

Important :
- les migrations Prisma historiques de `server/prisma/migrations/` ne doivent plus être exécutées ;
- l’API Nest utilise encore une base PostgreSQL legacy via SQL brut ;
- pour resynchroniser Prisma avec la base réelle, utilise `pnpm --filter server prisma:db:pull`.
- en production, limite toujours le CORS avec `ALLOWED_ORIGINS=https://ton-web.vercel.app` ;
- l’API applique une limitation simple des requêtes via `API_RATE_LIMIT_*` et `AUTH_RATE_LIMIT_*`.

API dispo sur : [http://localhost:3000](http://localhost:3000)  
Healthcheck : [http://localhost:3000/api/health](http://localhost:3000/api/health)

---

## 🌐 Frontend Web (Next.js)

Depuis la racine :
```bash
# Lancer le web
pnpm --filter web dev
```

Important :
- en local, le frontend utilise `http://localhost:3000/api` par défaut si `NEXT_PUBLIC_API_URL` n’est pas défini ;
- en preview ou en production, `NEXT_PUBLIC_API_URL` est obligatoire ;
- ne laisse jamais une URL d’API de production en fallback dans le code.

Frontend dispo sur : [http://localhost:3001](http://localhost:3001)  
(assure-toi que le backend est bien lancé en parallèle)

---

## 📱 Mobile (Expo React Native)

Depuis la racine :
```bash
# Lancer Metro bundler
pnpm --filter mobile start
```

- Tape `i` pour lancer sur simulateur iOS  
- Tape `a` pour lancer sur émulateur Android  
- Ou scanne le QR avec l’app **Expo Go** (iPhone/Android)

---

## 🧪 Vérifications rapides

- API :
```bash
curl http://localhost:3000/api/health
# → {"ok":true}
```

- Web :  
Ouvre [http://localhost:3001](http://localhost:3001) → écran d’accueil “Bienvenue dans MAWJA”.

- Mobile :  
Lance l’émulateur → écran d’accueil avec logo et “Bonjour dans l’application MAWJA”.

---

## 🗂 Structure du repo
```
apps/
  web/        # Frontend web (Next.js 14)
  mobile/     # Frontend mobile (Expo / React Native)
packages/
  ui/         # UI partagée (boutons, thèmes…)
server/       # Backend API (NestJS + Prisma + PostgreSQL)
infra/        # Docker compose (Postgres)
```

---

## 🚀 Déploiement web/API

### Frontend web

- cible recommandée : Vercel ;
- root directory : `apps/web` ;
- variable requise :
  - `NEXT_PUBLIC_API_URL=https://ton-api.example.com/api`

### Backend API

- cible recommandée : Railway ;
- build command : `pnpm --filter server build`
- start command : `pnpm --filter server start:railway`
- healthcheck : `/api/health`

Variables minimales de production :

```env
DATABASE_URL=postgresql://...
PORT=3000
AUTH_TOKEN_SECRET=une-cle-longue-et-aleatoire
TRUST_PROXY=true
ALLOWED_ORIGINS=https://ton-web.vercel.app,https://ton-domaine.com
WEB_APP_URL=https://ton-web.vercel.app
```

Notes session/cookies :

- le frontend web fonctionne avec une session par cookie HttpOnly ;
- en production, l’API doit être servie en HTTPS ;
- en production, le web et l’API utilisent deux sous-domaines du même site afin d’émettre le cookie en `HttpOnly` + `Secure` + `SameSite=Lax` ;
- `ALLOWED_ORIGINS` et `WEB_APP_URL` doivent être strictement alignés avec le domaine public du frontend.

Si tu actives la confirmation d’e-mail ou le reset mot de passe par mail :

```env
EMAIL_VERIFICATION_ENABLED=true
PASSWORD_RESET_EMAIL_ENABLED=true
RESEND_API_KEY=...
RESEND_FROM_EMAIL=...
```

---

## 📜 Licence
Projet privé – © 2025 MAWJA
