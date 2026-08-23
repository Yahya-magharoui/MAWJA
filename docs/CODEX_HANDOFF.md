# CODEX Handoff - MAWJA / Kalymap

Derniere mise a jour: 2026-08-23

Ce document resume l'etat du projet pour une reprise dans une nouvelle conversation. Il ne contient aucun secret.

## Objectif actuel du projet

MAWJA / Kalymap est une application web de regulation emotionnelle et d'exercices de stabilisation. L'objectif actuel est de stabiliser la partie web pour une mise en ligne beta puis production, avec authentification, historique utilisateur, favoris/routine, emails d'activation et reset de mot de passe, et premiers blocs de conformite RGPD.

La partie mobile existe dans le monorepo, mais le chantier mobile est temporairement mis de cote. Un collegue doit pouvoir reprendre la partie mobile separement.

## Architecture importante du repo

- `apps/web`: application Next.js web, port local principal `3001`.
- `apps/mobile`: application Expo / React Native, chantier mobile pause.
- `server`: API NestJS, Prisma, PostgreSQL Supabase, port local principal `3000`.
- `packages/ui`: package UI partage.
- `docs`: documentation projet et handoffs.
- `codemagic.yaml`: configuration CI mobile Codemagic.
- `pnpm-workspace.yaml`: monorepo pnpm.

Backend et base:

- Backend cible actuel: Railway.
- Base de donnees: Supabase PostgreSQL.
- ORM: Prisma, mais une partie du schema reflete des tables existantes legacy. Faire attention avant de relancer des migrations.

## Fichiers modifies dans l'etat actuel

Etat courant releve via `git status --short` avant ce handoff:

- `apps/web/app/app/page.tsx`
- `apps/web/app/exercice/breathing/Coherence/page.tsx`
- `apps/web/app/exercice/breathing/abdominal/page.tsx`
- `apps/web/app/exercice/sba/auditives/page.tsx`
- `apps/web/app/exercice/sba/page.tsx`
- `apps/web/app/page.tsx`
- `apps/web/app/privacy/page.tsx`
- `apps/web/app/reset-password/ResetPasswordClient.tsx`
- `apps/web/app/signup/page.tsx`
- `apps/web/app/terms/page.tsx`
- `apps/web/app/tolerance/historique/page.tsx`
- `apps/web/components/ExerciseCompletionPrompt.tsx`
- `apps/web/components/StateCheckinPrompt.tsx`
- `apps/web/lib/exerciseCatalog.ts`
- `apps/web/public/icons/lieusur.svg`
- `apps/web/public/icons/sba.svg`
- `apps/web/public/icons/trousse.svg`
- `server/.env.example`
- `server/DEPLOY_RAILWAY.md`
- `server/src/auth.controller.ts`

Attention: cette liste correspond aux modifications non commitees au moment du handoff. Des commits precedents existent deja pour mobile, Codemagic, web et serveur.

Commits recents importants:

- `873c968 Prepare web and server deployment`
- `5826ed8 Prepare mobile handoff and dev-client docs`
- `e865d8d Add Codemagic Android development client workflow`
- `02a7bfe Stabilize mobile Expo build pipeline`
- `a426fc1 Fix Codemagic Android React paths`
- `ec66b62 Force explicit Android entry file in Codemagic`
- `035b5a7 Harden Codemagic Android Gradle preprocessing`
- `0c36aeb Fix Codemagic Android Gradle plugin resolution`

## Fonctionnalites deja terminees

- Authentification web reconnectee au backend.
- Creation de compte fonctionnelle localement apres correction.
- Verification d'email branchee cote backend via Resend.
- Reset de mot de passe branche cote backend via Resend.
- Domaine Resend `mail.kalymap.com` verifie.
- Adresse d'envoi prevue: `no-reply@mail.kalymap.com`.
- Validation mot de passe renforcee:
  - minimum 8 caracteres;
  - au moins une majuscule;
  - au moins un chiffre;
  - au moins un caractere special;
  - blocage de mots de passe trop simples.
- Page signup avec confirmation de mot de passe.
- Pages legales mises a jour:
  - `Yasmine Bendani`;
  - `contact@kalymap.fr`;
  - references d'urgence: numero d'urgences, SOS Amitiés, 3114.
- Favoris / routine branchee avec etoile sur les exercices.
- Etoile favoris visuellement active/inactive.
- Historique utilisateur branche avec backend, mais a reverifier fonctionnellement.
- Popups d'etat / gradient deja presentes apres certains parcours.
- Plusieurs corrections responsive deja appliquees.
- Corrections d'exercices web deja appliquees:
  - coherence cardiaque;
  - respiration abdominale;
  - SBA auditives;
  - safe place;
  - roue des emotions;
  - fin d'exercice avec gradient.
- Codemagic mobile configure et un build Android debug a fini par passer.
- Railway server a deja deploye correctement apres correction Prisma generate.

## Bugs et sujets encore ouverts

- Conformite RGPD non terminee:
  - suppression definitive de compte a implementer;
  - export des donnees utilisateur a implementer;
  - nettoyage automatique des donnees temporaires a implementer;
  - textes legaux a synchroniser avec le comportement reel.
- Historique a stabiliser:
  - l'utilisateur veut garder uniquement les evenements issus de la popup apres connexion, popup avant deconnexion, et gradient de fin d'exercice;
  - enlever ou ignorer les autres sources d'historique.
- Verifier que l'historique affiche bien les donnees du compte connecte.
- Verifier que les favoris sont strictement isoles par utilisateur.
- Icones d'exercices: sujet instable. L'utilisateur a demande plusieurs essais puis a demande de revenir aux anciennes icones. Ne pas changer sans validation visuelle explicite.
- Splash screen web: tentative temporisee. L'utilisateur voyait encore les trois points au centre. Ne pas reprendre sans clarifier.
- Responsive: une passe a ete commencee, mais il faut tester toutes les pages critiques desktop, tablette et mobile.
- Mobile: chantier pause. Ne pas continuer sauf demande explicite.
- `apps/web/public/icons/lieusur.svg`, `sba.svg`, `trousse.svg` ont connu plusieurs aller-retours. Faire tres attention avant d'y toucher.

## Decisions techniques prises

- Web en Next.js 14.2.x.
- API en NestJS.
- Prisma reste dans le backend, mais le schema doit rester aligne avec la base Supabase existante.
- Les migrations Prisma classiques sont bloquees par script dans ce repo. Ne pas lancer de migration sans decision explicite.
- Supabase reste la base principale.
- Railway reste l'hebergement backend actuel.
- Vercel est vise pour la partie web.
- Resend est choisi pour les emails transactionnels.
- Email sender cible: `no-reply@mail.kalymap.com`.
- Domaine Resend dedie: `mail.kalymap.com`.
- Frontend appelle l'API via `NEXT_PUBLIC_API_URL`.
- Le backend limite CORS via `ALLOWED_ORIGINS`.
- Les tokens email ne doivent pas etre stockes en clair: backend utilise des hash de token pour pending signup/reset.
- Le mot de passe doit etre valide cote front et cote back.
- Ne pas dupliquer les secrets dans le code ou les commits.

## Commandes importantes

Installation:

```bash
pnpm install
```

Lancer le web local:

```bash
pnpm --filter web dev
```

Lancer le serveur local:

```bash
pnpm --filter server dev
```

Build web:

```bash
pnpm --filter web build
```

Build serveur:

```bash
pnpm --filter server build
```

Lint web:

```bash
pnpm --filter web lint
```

Tests E2E web:

```bash
pnpm --filter web test:e2e
```

Prisma:

```bash
pnpm --filter server prisma:generate
pnpm --filter server prisma:validate
pnpm --filter server prisma:db:pull
```

Git utile:

```bash
git status --short
git diff --stat
git log --oneline -8
```

Ports habituels:

- Web: `http://localhost:3001`
- API: `http://localhost:3000/api`

Si plusieurs instances tournent, arreter les anciens process avant de relancer pour eviter les confusions `3001` / `3002`.

## Variables et configurations importantes

Ne pas exposer les valeurs secretes. Les variables suivantes doivent etre configurees selon l'environnement.

Web:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

Serveur:

```bash
DATABASE_URL=...
PORT=3000
AUTH_TOKEN_SECRET=...
AUTH_TOKEN_TTL_SECONDS=604800
TRUST_PROXY=false
ALLOWED_ORIGINS=http://localhost:3001
API_RATE_LIMIT_WINDOW_MS=60000
API_RATE_LIMIT_MAX=120
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX=30
WEB_APP_URL=http://localhost:3001
EMAIL_VERIFICATION_ENABLED=false
EMAIL_VERIFICATION_EXPIRY_HOURS=24
PASSWORD_RESET_EMAIL_ENABLED=false
PASSWORD_RESET_EXPIRY_HOURS=2
RESEND_API_KEY=...
RESEND_FROM_EMAIL=no-reply@mail.kalymap.com
```

Production attendue:

- `WEB_APP_URL` doit pointer vers le domaine web public.
- `ALLOWED_ORIGINS` doit inclure le domaine web public.
- `NEXT_PUBLIC_API_URL` doit pointer vers l'API Railway publique avec `/api`.
- `EMAIL_VERIFICATION_ENABLED=true` si activation email obligatoire.
- `PASSWORD_RESET_EMAIL_ENABLED=true` pour reset par email.
- `RESEND_API_KEY` doit etre configure dans Railway, pas dans le code.
- `RESEND_FROM_EMAIL=no-reply@mail.kalymap.com`.

Base Supabase:

- Runtime: utiliser le pooler transaction mode.
- Operations schema/db pull: utiliser la connexion session/direct si necessaire.
- Ne jamais commit le mot de passe DB.

## Ce qu'il reste exactement a faire

1. Implementer la suppression definitive de compte.
   - Ajouter une route backend protegee.
   - Supprimer ou anonymiser toutes les donnees liees au patient/docteur/utilisateur.
   - Supprimer favoris, notes, objectifs, historiques, logs, pending tokens.
   - Ajouter une confirmation explicite cote UI.

2. Implementer l'export des donnees utilisateur.
   - Ajouter une route backend protegee.
   - Exporter JSON ou archive simple.
   - Inclure historique, notes, objectifs, favoris, profil.
   - Ajouter un bouton cote web.

3. Implementer le nettoyage automatique des donnees temporaires.
   - Pending signup expire.
   - Pending reset expire.
   - Eventuellement logs temporaires.
   - Prevoir script ou endpoint admin/cron selon hebergement.

4. Mettre a jour les textes legaux.
   - Expliquer suppression compte.
   - Expliquer export.
   - Expliquer durees de conservation.
   - Expliquer emails transactionnels.
   - Mentionner Resend, Supabase, Railway, Vercel si necessaire.

5. Repasser l'historique.
   - Conserver uniquement:
     - popup apres connexion;
     - popup avant deconnexion;
     - gradient de fin d'exercice.
   - Verifier l'heure exacte affichee.
   - Verifier isolation par utilisateur.

6. Repasser les favoris/routine.
   - Verifier compte A puis compte B.
   - Verifier ajout et retrait.
   - Verifier etoile noire/active uniquement pour les favoris du compte connecte.

7. Repasser les emails.
   - Signup avec verification active.
   - Reset password.
   - Mauvais token.
   - Token expire.
   - Token deja consomme.

8. Repasser le responsive complet.
   - `/app`
   - `/hyperactivation`
   - `/hypoactivation`
   - `/tolerance`
   - `/tolerance/historique`
   - pages exercices principales
   - `/login`
   - `/signup`
   - `/reset-password`
   - `/privacy`
   - `/terms`

9. Faire une passe securite avant prod.
   - Cookies secure en production.
   - CORS strict.
   - Rate limit auth.
   - Secrets uniquement dans les plateformes.
   - Pas de logs sensibles.
   - Messages d'erreur pas trop verbeux.

10. Deployer web et serveur.
    - Railway pour API.
    - Vercel pour web.
    - Mettre a jour les variables d'environnement des deux cotes.

## Points d'attention pour le prochain agent

- Ne pas modifier les icones sans validation explicite de l'utilisateur. Ce sujet a beaucoup bouge.
- Ne pas relancer de migrations Prisma sans accord. Le schema est sensible.
- Ne pas supprimer les modifications utilisateur non commitees.
- Ne pas reveler les secrets presents dans `.env`.
- Toujours verifier `git status --short` avant edit.
- Le user prefere avancer par blocs courts et visibles.
- Eviter les longues attentes silencieuses: donner une mise a jour courte toutes les 30 secondes si une commande prend du temps.
- Le user teste souvent localement sur `localhost:3001`; si le port change, le dire explicitement.
- Les erreurs Next du type `Cannot find module './xxxx.js'` ont deja ete observees. Solution probable: arreter les process Next et nettoyer `.next`, puis relancer.
- Les emails Resend marchent seulement si le domaine est verifie et la cle configuree dans `server/.env` ou Railway.
- Pour la conformite RGPD, implementer d'abord le backend puis l'UI, et tester avec un compte de test.

## Verification actuelle

Ce handoff a ete cree sans relancer les tests ni les builds. La demande etait de ne plus modifier de fichiers applicatifs. Avant production, relancer au minimum:

```bash
pnpm --filter server build
pnpm --filter web build
pnpm --filter web lint
pnpm --filter web test:e2e
```

