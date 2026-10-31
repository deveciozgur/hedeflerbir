---
description: Release check before commit or deploy (schema, types, lint, build, migration drift)
allowed-tools: Bash(npm run preflight:*), Bash(npx prisma migrate diff:*), Bash(npx prisma migrate status:*), Bash(npm run db:status:prod:*), Bash(git status:*)
---

Run the release preflight for HedeflerBir LMS and report the result as a short checklist.

1. Stop any running dev server first (Windows locks the Prisma engine DLL during `prisma generate`).
2. `npm run preflight` (prisma validate → tsc → eslint → next build). Lint must end with zero warnings.
3. Local schema drift: `npx prisma migrate diff --from-url "$DIRECT_URL" --to-schema-datamodel prisma/schema.prisma --exit-code` (read `DIRECT_URL` from `.env`). Exit code 2 means `schema.prisma` has changes without a migration: say so and suggest `/db-sync`.
4. Production migration state: `npm run db:status:prod`. Report pending migrations; never apply them here.
5. `git status --short`: list uncommitted files.

On a failure, show the first error with file and line, propose the fix, and stop. Do not commit, push or deploy.
