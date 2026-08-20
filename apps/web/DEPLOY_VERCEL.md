# Déploiement Vercel

## Projet

- Framework preset : `Next.js`
- Root directory : `apps/web`
- Build command : `pnpm build`
- Output directory : `.next`

## Variables requises

- `NEXT_PUBLIC_API_URL`

Exemple :

```env
NEXT_PUBLIC_API_URL=https://server-production-d277.up.railway.app/api
```

## Variables API minimales côté backend

```env
NODE_ENV=production
TRUST_PROXY=true
ALLOWED_ORIGINS=https://votre-app.vercel.app,https://votre-domaine.com
WEB_APP_URL=https://votre-app.vercel.app
```

Variables frontend utiles selon l’environnement :

```env
NEXT_PUBLIC_API_URL=https://votre-api.railway.app/api
```

## Points sensibles cookies / session

- Le frontend utilise désormais les cookies HttpOnly pour la session.
- Le backend doit donc répondre en HTTPS en production.
- `ALLOWED_ORIGINS` doit contenir exactement les origines Vercel utilisées.
- L’origine exacte de `WEB_APP_URL` doit aussi être présente dans `ALLOWED_ORIGINS`.
- Avec un frontend Vercel et une API Railway sur des domaines différents, les cookies sont envoyés avec `SameSite=None` et `Secure=true`.
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
