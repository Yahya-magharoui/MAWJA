# Déploiement Vercel

## Projet

- Framework preset : `Next.js`
- Root directory : `apps/web`
- Build command : `pnpm build`
- Output directory : `.next`
- Node.js : `22.x` (déclaré dans `apps/web/package.json`)

## Variable à saisir dans Vercel

Remplacer `API_PUBLIC_URL` par l’URL HTTPS publique Railway, en conservant obligatoirement le suffixe `/api`.

```env
NEXT_PUBLIC_API_URL=API_PUBLIC_URL/api
```

Ajouter cette variable aux environnements Vercel utilisés :

- `Production` avec l’URL publique définitive de Railway ;
- `Preview` avec la même API uniquement si les previews Vercel sont ajoutées explicitement à `ALLOWED_ORIGINS` côté Railway ;
- `Development` n’est pas nécessaire pour le développement local, qui utilise `apps/web/.env`.

Ne pas ajouter dans Vercel les secrets du serveur (`DATABASE_URL`, `AUTH_TOKEN_SECRET`, `RESEND_API_KEY`) : ils appartiennent uniquement à Railway.

## Valeurs correspondantes dans Railway

```env
NODE_ENV=production
TRUST_PROXY=true
ALLOWED_ORIGINS=https://votre-app.vercel.app
WEB_APP_URL=https://votre-app.vercel.app
```

## Points sensibles cookies / session

- Le frontend utilise désormais les cookies HttpOnly pour la session.
- Le backend doit donc répondre en HTTPS en production.
- `ALLOWED_ORIGINS` doit contenir exactement les origines Vercel utilisées.
- L’origine exacte de `WEB_APP_URL` doit aussi être présente dans `ALLOWED_ORIGINS`.
- En production, utiliser deux sous-domaines du même site (`www.kalymap.com` et `api.kalymap.com`) afin que la session reste limitée à un cookie `HttpOnly`, `Secure` et `SameSite=Lax`.
- En production, le cookie d’auth est émis avec un nom `__Secure-...`.
- Si `TRUST_PROXY` n’est pas activé derrière Railway ou un proxy HTTPS, l’API peut mal évaluer le contexte sécurisé et casser la session.

## Vérifications avant mise en ligne

1. Le backend Railway répond sur `/api/health`.
2. `ALLOWED_ORIGINS` côté API contient bien le domaine Vercel.
3. `WEB_APP_URL` côté API pointe exactement vers le domaine public du frontend.
4. Les flows sensibles fonctionnent en preview :
   - inscription ;
   - connexion ;
   - mot de passe oublié ;
   - historique ;
   - favoris ;
   - objectifs ;
   - notes.

## Notes

- La page `/health` du frontend est forcée en runtime pour refléter l’état réel de l’API.
- `NEXT_PUBLIC_API_URL` n’a pas de fallback en production : si elle manque, le build ou le runtime doivent échouer explicitement.
