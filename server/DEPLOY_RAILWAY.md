# Deploy Railway

## Variables à saisir dans Railway

Remplacer `WEB_PUBLIC_URL` par l’URL HTTPS publique de Vercel ou par le domaine web définitif.

```env
NODE_ENV=production
DATABASE_URL=COLLER_URL_SUPABASE_TRANSACTION_POOLER
AUTH_TOKEN_SECRET=GENERER_UN_SECRET_LONG_ET_ALEATOIRE
AUTH_TOKEN_TTL_SECONDS=604800
REDIS_URL=${{Redis.REDIS_URL}}
TRUST_PROXY=true
ALLOWED_ORIGINS=WEB_PUBLIC_URL
WEB_APP_URL=WEB_PUBLIC_URL

API_RATE_LIMIT_WINDOW_MS=60000
API_RATE_LIMIT_MAX=120
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX=30

EMAIL_VERIFICATION_ENABLED=true
EMAIL_VERIFICATION_EXPIRY_HOURS=24
PASSWORD_RESET_EMAIL_ENABLED=true
PASSWORD_RESET_EXPIRY_HOURS=2

TEMP_DATA_CLEANUP_INTERVAL_MS=21600000
CONSUMED_TOKEN_RETENTION_HOURS=24

RESEND_API_KEY=COLLER_LA_CLE_RESEND_DANS_RAILWAY
RESEND_FROM_EMAIL=no-reply@mail.kalymap.com
```

À ne pas saisir manuellement :

- `PORT` est injecté automatiquement par Railway ;
- `DIRECT_URL` n’est pas utilisée au runtime actuel ;
- `JWT_SECRET` est seulement un ancien alias de compatibilité, utiliser `AUTH_TOKEN_SECRET`.
- `REDIS_URL` peut être ajoutée automatiquement comme référence après avoir créé un service Redis dans le même projet Railway.

Si plusieurs domaines web doivent être autorisés, les séparer par des virgules dans `ALLOWED_ORIGINS`. `WEB_APP_URL` doit rester l’unique URL canonique utilisée dans les liens envoyés par e-mail.

Générer `AUTH_TOKEN_SECRET` localement avec `openssl rand -base64 48`, puis coller uniquement le résultat dans Railway. Ne jamais le committer.

## Commandes

- Node.js: `22.x` (déclaré à la racine et dans `server/package.json`)
- Build command: `pnpm --filter server build`
- Start command: `pnpm --filter server start:railway`
- Healthcheck path: `/api/health`

## Notes

- L'API expose désormais un préfixe global `/api`.
- Le healthcheck est disponible sur `/api/health`.
- Le frontend web doit pointer vers l'URL Railway complète avec le suffixe `/api`.
- En production, `AUTH_TOKEN_SECRET` ne peut pas utiliser la valeur par défaut de développement.
- En production, le cookie de session est émis en `HttpOnly` + `Secure` + `SameSite=Lax` avec un nom préfixé `__Secure-`.
- Le serveur crée automatiquement la table isolée `AuthSession` avec `CREATE TABLE IF NOT EXISTS`; aucune migration Prisma legacy ne doit être lancée.
- Le serveur crée aussi automatiquement la table isolée `SafePlace`, utilisée pour synchroniser les lieux sûrs des comptes connectés.
- Une déconnexion révoque la session courante et une réinitialisation du mot de passe révoque toutes les sessions du compte.
- Avec `REDIS_URL`, les compteurs de limitation sont partagés entre les instances ; sans Redis, le serveur conserve un repli local en mémoire.
- `ALLOWED_ORIGINS` et `WEB_APP_URL` doivent être des URL HTTPS valides.
- L’origine de `WEB_APP_URL` doit aussi être présente dans `ALLOWED_ORIGINS`.
- `TRUST_PROXY=true` est requis derrière Railway pour refléter correctement le contexte HTTPS côté Express.
- Si `EMAIL_VERIFICATION_ENABLED=true` ou `PASSWORD_RESET_EMAIL_ENABLED=true`, il faut aussi définir :
  - `WEB_APP_URL`
  - `RESEND_API_KEY`
  - `RESEND_FROM_EMAIL`
  - le domaine d'envoi doit être vérifié dans Resend et `RESEND_FROM_EMAIL` doit utiliser ce domaine, par exemple `no-reply@mail.kalymap.com`
- Nettoyage automatique des demandes temporaires :
  - `TEMP_DATA_CLEANUP_INTERVAL_MS` est optionnel (`21600000` par défaut, soit 6 heures)
  - `CONSUMED_TOKEN_RETENTION_HOURS` est optionnel (`24` par défaut)
- Exemple d'URL d'API publique utilisée par le web :
  - `https://your-api-domain.example.com/api`
