# Prisma Status

The Prisma schema in this folder is a mirror of the legacy PostgreSQL schema
currently used by the Nest API.

Important:
- the API still reads and writes data through raw SQL
- the historical files in `server/prisma/migrations/` do not match the real
  database used today
- do not run `prisma migrate dev` or `prisma migrate deploy` on this project in
  its current state

Allowed commands:

```bash
pnpm --filter server prisma:generate
pnpm --filter server prisma:validate
pnpm --filter server prisma:db:pull
```

Before reintroducing Prisma migrations:
1. confirm the production database shape
2. baseline that exact schema
3. archive or replace the incompatible migration history
4. only then re-enable migration commands
