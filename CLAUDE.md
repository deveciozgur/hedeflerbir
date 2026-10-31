# HedeflerBir LMS (app.hedeflerbir.com)

Next.js 15 (App Router, RSC, Server Actions) · strict TypeScript · Prisma 6 + PostgreSQL (Supabase in production) · Auth.js v5 (JWT, credentials) · Tailwind v4 · Radix · Motion · RHF + Zod. UI copy is Turkish. Setup and deployment steps for humans live in README.md; this file is the working knowledge for changing the code.

## Commands

```bash
npm run dev          # next dev --turbopack on :3000 (.claude/launch.json "web")
npm run lint         # eslint . (must stay at 0 warnings)
npm run typecheck    # tsc --noEmit
npm run build        # prisma generate && next build
npx prisma db seed   # idempotent demo seed (see Seed)
npm run preflight    # prisma validate + typecheck + lint + build: run before every commit

# Production (Supabase), reading .env.hostinger.local through dotenv-cli (--no-expand)
npm run db:status:prod
npm run db:deploy:prod
npm run db:seed:prod   # resets the live demo passwords; only on explicit request
```

No test suite: verify with `npm run preflight`, then exercise the flow in the browser with the demo accounts.

Slash commands in `.claude/commands/`: `/preflight` (release checklist), `/db-sync <name> [--prod]` (schema change → migration with RLS → local → optional Supabase), `/seed-lms [--prod]`.

## Guardrails

- **Secrets**: `.env.hostinger.local` holds production credentials (Supabase password, `AUTH_SECRET`, `SEED_PASSWORD`). Never read, print, grep, copy or edit it; a PreToolUse hook (`.claude/hooks/protect-secrets.mjs`) and permission deny rules block it. Use the `:prod` npm scripts, which load it without echoing. Mask connection strings (`//user:***@host`) in any output. `.env`, `.env.*.local` stay git-ignored; never commit env values or paste them into code, docs or chat.
- **Production database**: no destructive SQL (`DROP`, `TRUNCATE`, mass `DELETE`) and no `prisma db push` / `migrate reset` against Supabase. Schema changes go through a migration file (`/db-sync`). `db:deploy:prod` and `db:seed:prod` only after the user confirms in chat.
- **Live site**: never type production passwords into app.hedeflerbir.com; verify live with unauthenticated probes and leave logged-in checks to the user.
- **Deploys** are the user's action in hPanel; never push to `main` without being asked.
- **Auth**: keep `requireRole` + ownership checks in every action, the `sessionVersion` revocation in `guards.ts`, and the portal split (`/login` for STUDENT/ADMIN, `/expert-login` for INSTRUCTOR/MENTOR). Never log passwords or tokens; login diagnostics log reasons only.

## Architecture

DDD bounded contexts in `src/modules/<context>/{domain,application,ui}`:

| Context | Owns |
| --- | --- |
| `identity` | login portals, RBAC (`domain/access-policy.ts`), profiles, password reset, invites, demo accounts |
| `learning` | courses, live sessions, module/lesson curriculum, lesson progress, course player, certificates |
| `assessment` | quizzes (scoring in `domain/quiz.ts`), quiz runner/editor |
| `assignments` | assignments, submissions, grading desk, feedback history, file policy |
| `mentoring` | mentor slots, weekly availability template, appointments |
| `messaging`, `notifications`, `engagement` | threads, bell popover, badges, announcements |
| `administration` | users, CSV import, analytics, exports, audit log, support |
| `search` | command palette search action |

- `domain/`: pure TypeScript, no framework or Prisma imports (Zod is fine). Business rules and labels live here.
- `application/*.queries.ts`: `import "server-only"`, read models. `*.actions.ts`: `"use server"`, return `ActionResult` (`ok`/`fail` from `src/lib/action-result.ts`) and never throw for user errors. `*.service.ts`: server-only helpers shared by actions (e.g. `course-completion.service.ts`).
- Every action starts with `requireRole(...)` (`src/server/auth/guards.ts`) and re-checks ownership in the Prisma `where` (instructor owns the course, student is enrolled). Middleware RBAC is not enough.
- `src/app/**` pages stay thin: fetch via queries, render module UI. Page files may not export non-page constants.
- Infrastructure ports in `src/server/`: `db.ts`, `storage/` (local disk or S3/R2), `email/` (Resend; dev prints to console; `emailDeliveryConfigured()`), `audit.ts` (`recordAudit`, never throws), `export/` (CSV/XLSX/PDF, fonts in `pdf-fonts.ts`).

### Key flows

- **Lesson completion** always goes through `completeLesson()`; it upserts `LessonProgress`, and when the last lesson is done it marks the enrollment `COMPLETED`, issues the `Certificate` and notifies. Videos complete at 90% watched, quizzes when passed, assignment lessons on submission (plus backfill when a lesson is linked to an already-submitted assignment), articles/live sessions/embedded videos via the manual button.
- **Course page** `/courses/[slug]`: lesson-based courses render the player and redirect to a canonical `?lesson=<id>` (otherwise completing a lesson re-renders and jumps to the next one). Courses with no lessons fall back to the legacy session view.
- **Certificates**: `/api/certificates/[code]` (PDF, public by code) and `/verify/[code]` (public, outside every RBAC area).
- **Mentor availability**: weekly `MentorAvailability` ranges generate `MentorSlot`s (`generated: true`) on a rolling 28-day window; `topUpTemplateSlots()` runs when students browse mentors. Never delete slots that have appointments (cancelled ones are history).
- **Audit**: add new event names to `modules/administration/domain/audit.ts` and call `recordAudit` after the mutation.

## Database

- Schema: `prisma/schema.prisma`; `DATABASE_URL` for queries, `DIRECT_URL` for migrations.
- **Creating migrations**: `prisma migrate dev` fails against the local PGlite DB (shadow DB error `type "Role" already exists`). Generate the SQL by diffing instead:
  ```bash
  npx prisma migrate diff --from-url "$DIRECT_URL" --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/<timestamp>_<name>/migration.sql
  npx prisma migrate deploy
  ```
- **Every new table needs** `ALTER TABLE "X" ENABLE ROW LEVEL SECURITY;` appended to its migration. Supabase exposes `public` via its REST API; the app connects as the table owner, so RLS without policies only locks out anon access. All current tables have RLS on.
- Production migrations are applied from a local machine (`prisma migrate deploy` with the Supabase URLs); the Hostinger build does not run them.
- Local DB: `npx prisma dev --name hedeflerbir --detach` (PGlite on localhost:51214). `DATABASE_URL` needs `&connection_limit=1&pgbouncer=true`. If it stops answering: `npx prisma dev stop hedeflerbir`, then start again (a stale lock file is common).
- Windows: stop the dev server (and orphan node processes) before `prisma generate` / `npm install`, or the engine DLL rename fails with EPERM.

## Seed

`prisma/seed.ts` is idempotent (upserts by natural keys) and resets the four demo accounts' passwords to `SEED_PASSWORD` (default `HedeflerBir2026!`) on every run. It refuses `NODE_ENV=production` unless `SEED_ALLOW_PRODUCTION=true`. Demo accounts are defined once in `src/modules/identity/domain/demo-accounts.ts`; the login pages show "Demo ... Doldur" buttons only outside production (or with `DEMO_LOGIN_ENABLED=true`). The production `SEED_PASSWORD` lives in the git-ignored `.env.hostinger.local`; never copy it into tracked files.

## Deployment (Hostinger Node.js app)

- Deploys are triggered manually in hPanel from `main`; env vars are set in hPanel.
- `next.config.ts` builds with `experimental.cpus: 1` and no webpack build worker: the shared host's process limit otherwise kills static generation with `spawn EAGAIN`. Don't remove it.
- Every route that renders a PDF must list its fonts/assets in `outputFileTracingIncludes`.
- A failed build keeps the previous version live; confirm a deploy by hitting a route that only exists in the new code.

## Conventions

- Turkish UI copy; no em/en dashes in UI text; time ranges as `14:00 - 15:00`. Dates/times only via `src/lib/format.ts` (Europe/Istanbul, fixed UTC+3); `formatFullDate` when the year matters.
- Design tokens only (`bg-surface-raised`, `text-subtle`, `border-border-strong`, `bg-brand/10`, ...), one indigo accent, light default + `.dark`. Focus ring: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background`. Icons: lucide-react.
- Reuse `components/ui` primitives (Button, Card/`surfaceClass`, Dialog, FormField, Badge, EmptyState, ConfirmActionButton, SegmentedLinks, Markdown, AddToCalendar). Render user Markdown only through `components/ui/markdown.tsx` (no raw HTML).
- Client components stay small leaves; pass Lucide icons to client components as elements, not component references.
- Hydration: give `DndContext` a stable `id` (`useId`); header widgets that render Radix dialogs mount after hydration (see `command-palette.tsx`).
- ESLint (`@next/next`) rejects variables named `module`; use `courseModule`.
- Git: there is no global identity on this machine; commit with `git -c user.name="HedeflerBir" -c user.email="info@gamedev.ist" commit ...`.
