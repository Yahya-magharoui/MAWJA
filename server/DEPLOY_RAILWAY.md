# Deploy Railway

## Variables requises

- `DATABASE_URL`
- `AUTH_TOKEN_SECRET`
- `PORT`
- `ALLOWED_ORIGINS`
- `WEB_APP_URL`

## Commandes

- Build command: `pnpm --filter server build`
- Start command: `pnpm --filter server start:railway`

## Notes

- L'API expose désormais un préfixe global `/api`.
- Le healthcheck est disponible sur `/api/health`.
- Le frontend web doit pointer vers l'URL Railway complète avec le suffixe `/api`.
- En production, `AUTH_TOKEN_SECRET` ne peut pas utiliser la valeur par défaut de développement.
- En production, le cookie de session est émis en `Secure` + `SameSite=None` avec un nom préfixé `__Secure-`.
- `ALLOWED_ORIGINS` et `WEB_APP_URL` doivent être des URL HTTPS valides.
- L’origine de `WEB_APP_URL` doit aussi être présente dans `ALLOWED_ORIGINS`.
- `TRUST_PROXY=true` reste recommandé derrière Railway pour refléter correctement le contexte HTTPS côté Express.
- Si `EMAIL_VERIFICATION_ENABLED=true` ou `PASSWORD_RESET_EMAIL_ENABLED=true`, il faut aussi définir :
  - `WEB_APP_URL`
  - `RESEND_API_KEY`
  - `RESEND_FROM_EMAIL`
- Exemple d'URL d'API publique utilisée par le web :
  - `https://server-production-d277.up.railway.app/api`
