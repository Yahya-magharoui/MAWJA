# 🌊 MAWJA – Application Bien-être

Bienvenue dans **MAWJA**, une application web & mobile basée sur le concept de la *fenêtre de tolérance* pour aider les patients à réguler leurs états émotionnels.

---

## 📦 Prérequis

- [Node.js](https://nodejs.org/) v18+  
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

---

## ⚙️ Backend (NestJS + Prisma)

Depuis la racine :
```bash
# Générer le client Prisma
pnpm --filter server prisma:generate

# Appliquer les migrations (crée les tables User, MoodEntry…)
pnpm --filter server prisma:migrate dev --name init

# Lancer le backend
pnpm --filter server dev
```

API dispo sur : [http://localhost:3000](http://localhost:3000)  
Healthcheck : [http://localhost:3000/health](http://localhost:3000/health)

---

## 🌐 Frontend Web (Next.js)

Depuis la racine :
```bash
# Lancer le web
pnpm --filter web dev
```

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
curl http://localhost:3000/health
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

## 📜 Licence
Projet privé – © 2025 MAWJA
