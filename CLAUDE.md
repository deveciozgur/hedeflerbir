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

Project skill: `.claude/skills/ui-ux-pro-max/` (UI UX Pro Max v2.15.0, only that skill from its repo; the repo's other skills are not installed). Its search scripts run with `python .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain <ux|style|color|...>`; on this machine `python3` is the Windows Store stub, so SKILL.md uses `python`. Treat its output as suggestions: this file's conventions (tokens, brand palette, `components/ui` primitives, lucide icons, Turkish copy) win over its defaults. Re-apply the `python` edit if the skill is ever updated.

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
| `identity` | login portals (+ KVKK notice), RBAC (`domain/access-policy.ts`), profiles, password reset, invites, demo accounts |
| `learning` | courses/programmes, live trainings (`trainings.queries.ts`, `training-admin.actions.ts`), attendance, module/lesson curriculum, course player, certificates |
| `people` | person cards + detail modal (`PersonCardGrid`), participant/instructor listings, teams (`Team`), team assignment, manual badge award |
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

### Where things already are (extend these; don't create parallel models or routes)

Feature briefs often use generic names. They map to existing pieces:

| Brief says | Actually is |
| --- | --- |
| `CourseEnrollment` | `Enrollment` (+ `status`, `completedAt`) |
| `AssignmentSubmission` (PENDING/REVIEWED/REJECTED) | `Submission` (SUBMITTED/GRADED/RETURNED) + `AssignmentFeedback` history |
| `MentorshipSession` | `Appointment` on a `MentorSlot` (auto-confirmed, no PENDING state), booked by an admin for a team (`Appointment.teamId`) |
| `MentorProfile` | `Profile` (`title`, `expertiseArea`, `socialLinks`) + `MentorAvailability` (meeting link is per appointment, not on the profile) |
| `LiveTraining` / `Training` | `CourseSession` (+ `instructorId`, `topics` one per line, `badgeCode`) in a published course (programme) |
| `TrainingAttendance` | `SessionAttendance` (PRESENT = training completed) |
| `TrainingAssignment` | `Assignment` with `sessionId` (uploaded on `/trainings/[sessionId]`) |
| `isSuspended` | `User.isActive = false` (blocks login; `sessionVersion` revokes sessions) |
| `about` / `Hakkımda` | `Profile.bio`; `department` and `city` live on `Profile` |
| `db push` | a migration file (`/db-sync`) |
| `/student/courses/[slug]/player` | `/courses/[slug]?lesson=<id>` |
| `/expert/grading` | `/instructor/assignments/[assignmentId]` (grading desk) |
| `/mentors/booking` | `/mentors` (modal) and `/mentors/[mentorId]`, `slot-picker.tsx` |
| course builder | `/instructor/courses/[courseId]` "Müfredat" tab (`curriculum-builder.tsx`) |
| `src/actions/...` | `src/modules/<context>/application/*.actions.ts` |
| `updateLessonProgress` | `saveLessonProgressAction` / `markLessonCompleteAction` → `completeLesson()`; % via `lessonCompletion()` |

Routes by role:

- **Student**: `/dashboard` (training progress + badge showcase), `/trainings` (live-training calendar, Tamamlandı/Tamamlanmadı) and `/trainings/[sessionId]` (topics, link, assignment upload), `/assignments` (to-do list linking to the training), `/team` (Ekibim), `/mentors` (read-only availability + team sessions), `/profile` (attendance, 9 badges).
- **Instructor**: `/instructor/students` is person cards; roll calls via `attendance-dialog.tsx`.
- **Mentor**: appointment cards show the team brief; no join button, no booking.
- **Admin**: `/admin` (training progress + weekly calendar), `/admin/users` (single create + CSV import, suspension), `/admin/participants` (cards, team select, badge toggles, team manager), `/admin/trainings` (training cards + Eğitmenler cards), `/admin/mentors` (session calendar, team booking via `slot-picker.tsx`), `/admin/courses` ("Programlar"), `/admin/reports` (demographics, attendance, mentoring, expertise, export; `/admin/exports` redirects here), `/admin/audit`.
- Also: `/mentor/availability` (weekly planner), Cmd/Ctrl+K palette in every shell (`components/layout/command-palette.tsx`).

### Key flows

- **Live-training programme**: the student experience is live trainings; progress = PRESENT attendances / trainings in enrolled, non-DRAFT courses (`trainingCompletion`). Every training query filters `course.status != DRAFT`; the self-paced Next.js demo course is seeded as DRAFT and hidden. Creating a training notifies enrolled students.
- **Badges** (`engagement/domain/badges.ts`, 9 total): 6 training badges earned by attending the training with that `badgeCode`, 3 mentoring badges for the 1st/2nd/3rd completed team session, plus admin manual award/revoke (`setBadgeAction`). `awardBadgesSafely` runs after attendance and session completion (whole team).
- **Teams**: `User.teamId`; admins manage teams and book mentor sessions for a team (`bookForTeamAction`; mentor + all members notified). Students may message only teammates (`contact-policy.ts`).
- **Lesson completion** always goes through `completeLesson()`; it upserts `LessonProgress`, and when the last lesson is done it marks the enrollment `COMPLETED`, issues the `Certificate` and notifies. Videos complete at 90% watched, quizzes when passed, assignment lessons on submission (plus backfill when a lesson is linked to an already-submitted assignment), articles/live sessions/embedded videos via the manual button.
- **Course page** `/courses/[slug]`: lesson-based courses render the player and redirect to a canonical `?lesson=<id>` (otherwise completing a lesson re-renders and jumps to the next one). Courses with no lessons fall back to the legacy session view.
- **Certificates**: `/api/certificates/[code]` (PDF, public by code) and `/verify/[code]` (public, outside every RBAC area).
- **Mentor availability**: weekly `MentorAvailability` ranges generate `MentorSlot`s (`generated: true`) on a rolling 28-day window; `topUpTemplateSlots()` runs when students browse mentors. Never delete slots that have appointments (cancelled ones are history).
- **Audit**: add new event names to `modules/administration/domain/audit.ts` and call `recordAudit` after the mutation.
- **CSV user import** (`importUsersAction`, parser in `administration/domain/user-import.ts`): loose TR/EN headers, optional `rol` and `sifre` columns, max 500 rows, written in chunks of 50 with per-row error isolation. Rows with a password are bcrypt-hashed (cost 12); rows without get a 72-hour set-password invite (reuses the reset-token flow), e-mailed or, without Resend, returned as links for the admin. Template: `public/templates/kullanici_yukleme_sablonu.csv`. Existing e-mails are skipped, never overwritten.

## Database

- Schema: `prisma/schema.prisma`; `DATABASE_URL` for queries, `DIRECT_URL` for migrations.
- **Creating migrations**: `prisma migrate dev` fails against the local PGlite DB (shadow DB error `type "Role" already exists`). Generate the SQL by diffing instead:
  ```bash
  npx prisma migrate diff --from-url "$DIRECT_URL" --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/<timestamp>_<name>/migration.sql
  npx prisma migrate deploy
  ```
- **Every new table needs** `ALTER TABLE "X" ENABLE ROW LEVEL SECURITY;` appended to its migration. Supabase exposes `public` via its REST API; the app connects as the table owner, so RLS without policies only locks out anon access. All current tables have RLS on.
- Production migrations are applied from a local machine with `npm run db:deploy:prod` (check first with `db:status:prod`); the Hostinger build does not run them.
- Local DB: `npx prisma dev --name hedeflerbir --detach` (PGlite on localhost:51214). `DATABASE_URL` needs `&connection_limit=1&pgbouncer=true`. If it stops answering: `npx prisma dev stop hedeflerbir`, then start again (a stale lock file is common).
- Windows: stop the dev server (and orphan node processes) before `prisma generate` / `npm install`, or the engine DLL rename fails with EPERM.

## Seed

`prisma/seed.ts` is idempotent (upserts by natural keys; quiz questions are only created when the quiz has none). `seedProgram` adds Takım Atlas/Nova, two passwordless demo teammates, the `hedeflerbir-2026` programme with 6 badge trainings, roll calls, a training assignment, a completed team mentoring session and earned badges. It also resets the four demo accounts' passwords to `SEED_PASSWORD` (default `HedeflerBir2026!`) on every run. It refuses `NODE_ENV=production` unless `SEED_ALLOW_PRODUCTION=true`. Demo accounts are defined once in `src/modules/identity/domain/demo-accounts.ts`; the login pages show "Demo ... Doldur" buttons only outside production (or with `DEMO_LOGIN_ENABLED=true`). The production `SEED_PASSWORD` lives in the git-ignored `.env.hostinger.local`; never copy it into tracked files. The seed table prints the password only when it is the default; a custom one shows as `SEED_PASSWORD`.

## Deployment (Hostinger Node.js app)

- Deploys are triggered manually in hPanel from `main`; env vars are set in hPanel.
- `next.config.ts` builds with `experimental.cpus: 1` and no webpack build worker: the shared host's process limit otherwise kills static generation with `spawn EAGAIN`. Don't remove it.
- Every route that renders a PDF must list its fonts/assets in `outputFileTracingIncludes`.
- A failed build keeps the previous version live; confirm a deploy by hitting a route that only exists in the new code.
- Each deploy publishes into a fresh version folder. Until `S3_*` (R2) or an absolute `UPLOADS_DIR` outside the app folder is set in hPanel, uploaded files (submissions, avatars) are lost on the next deploy. `RESEND_API_KEY` is not set yet either: e-mails are skipped (invites fall back to links).

## Conventions

- Turkish UI copy; no em/en dashes in UI text; time ranges as `14:00 - 15:00`. Dates/times only via `src/lib/format.ts` (Europe/Istanbul, fixed UTC+3); `formatFullDate` when the year matters.
- Design tokens only (`bg-surface-raised`, `text-subtle`, `border-border-strong`, `bg-brand/10`, ...), light default + `.dark`. Brand palette in `globals.css`: primary `--brand` `#008374` (teal), accents `magenta` `#b41c83`, `cyan` `#01bbbe`, `amber` `#ffa200` (`bg-magenta`, `text-cyan`, ...) for badges, charts and status, not for primary actions. Emails/PDFs hardcode `#008374`.
- People are shown as cards (`PersonCardGrid`: photo or initials avatar, modal with department, about, team, message form), not tables.
- Server pages pass actions to client components as server-action references (`action.bind(null, id)`), never inline closures (Next.js throws "Functions cannot be passed directly to Client Components"). Focus ring: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background`. Icons: lucide-react.
- Reuse `components/ui` primitives (Button, Card/`surfaceClass`, Dialog, FormField, Badge, EmptyState, ConfirmActionButton, SegmentedLinks, Markdown, AddToCalendar). Render user Markdown only through `components/ui/markdown.tsx` (no raw HTML).
- Client components stay small leaves; pass Lucide icons to client components as elements, not component references.
- Hydration: give `DndContext` a stable `id` (`useId`); header widgets that render Radix dialogs mount after hydration (see `command-palette.tsx`).
- ESLint (`@next/next`) rejects variables named `module`; use `courseModule`.
- Git: there is no global identity on this machine; commit with `git -c user.name="HedeflerBir" -c user.email="info@gamedev.ist" commit ...`.
- Editing on Windows: prefer the Edit/Write tools. Python run from a Git Bash heredoc can mangle `\uXXXX` escapes and backslashes in the text it writes; put multi-line edit scripts in a file instead.
