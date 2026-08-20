#!/usr/bin/env node

const message = `
Legacy Prisma migrations are intentionally disabled.

Why:
- the runtime API currently uses a legacy PostgreSQL schema via raw SQL
- the old Prisma migrations in server/prisma/migrations target a different schema
- running prisma migrate on this project can corrupt or desynchronize the real database

Use instead:
- pnpm --filter server prisma:generate
- pnpm --filter server prisma:validate

If you need a new migration strategy, baseline the current production schema first
and introduce a fresh migration history from that exact state.
`.trim();

console.error(message);
process.exit(1);
