---
description: Turn schema.prisma changes into a migration (with RLS), apply it locally, then optionally to Supabase
argument-hint: <migration_name> [--prod]
disable-model-invocation: true
---

Create and apply a Prisma migration named `$ARGUMENTS` for HedeflerBir LMS. Follow CLAUDE.md "Database".

1. `npx prisma validate`. Check the local DB answers (`echo 'select 1' | npx prisma db execute --stdin --schema prisma/schema.prisma`); if not, restart it with `npx prisma dev stop hedeflerbir` and `npx prisma dev --name hedeflerbir --detach`.
2. Do NOT use `prisma migrate dev` (it fails against the local PGlite shadow DB). Create `prisma/migrations/<YYYYMMDDHHMMSS>_<name>/migration.sql` with:
   `npx prisma migrate diff --from-url "$DIRECT_URL" --to-schema-datamodel prisma/schema.prisma --script`
   (`DIRECT_URL` from `.env`).
3. Read the SQL. Stop and ask before continuing if it contains `DROP TABLE`, `DROP COLUMN`, a type change or `ALTER ... SET NOT NULL` on existing data.
4. For every `CREATE TABLE "X"` append `ALTER TABLE "X" ENABLE ROW LEVEL SECURITY;`.
5. Apply locally: `npx prisma migrate deploy`, then `npx prisma generate` (dev server stopped). Confirm no drift with `migrate diff ... --exit-code` (exit 0).
6. Only if `--prod` was passed AND the user confirms in chat: `npm run db:status:prod`, then `npm run db:deploy:prod`. Never print values from `.env.hostinger.local`; mask connection strings in any output.
7. Summarize: migration folder, tables/columns added, local and production state.
