# Deploy Railway

## Variables requises

- `DATABASE_URL`
- `AUTH_TOKEN_SECRET`
- `PORT`

## Commandes

- Build command: `pnpm --filter server build`
- Start command: `pnpm --filter server start:railway`

## Notes

- L'API expose désormais un préfixe global `/api`.
- Le healthcheck est disponible sur `/api/health`.
- Le frontend web doit pointer vers l'URL Railway complète avec le suffixe `/api`.
