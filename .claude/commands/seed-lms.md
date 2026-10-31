---
description: Run the idempotent demo seed locally (or on Supabase with --prod) and verify the LMS sample data
argument-hint: [--prod]
disable-model-invocation: true
---

Seed HedeflerBir LMS demo data and verify it. Arguments: `$ARGUMENTS`.

The seed (`prisma/seed.ts`) is idempotent: demo users, the Next.js course with 2 modules and 5 lessons (video, article, quiz, assignment, live session), a 3-question quiz, mentor slots plus a weekly availability template, announcements. It resets the four demo accounts' passwords to `SEED_PASSWORD` every run.

**Local (default)**
1. `npx prisma db seed`
2. Verify with a short `npx tsx` script (delete it afterwards) that counts: 4 demo users, `courseModule` 2, `lesson` 5, `quizQuestion` 3, `mentorAvailability` ≥ 1, future `mentorSlot` with `generated: true` > 0.

**Production (`--prod`)**: only after the user confirms in chat that demo passwords on the live site may be reset.
1. `npm run db:status:prod`: stop if migrations are pending (run `/db-sync <name> --prod` first).
2. `npm run db:seed:prod` (reads `.env.hostinger.local` through dotenv-cli, sets `SEED_ALLOW_PRODUCTION=true`).
3. Never print, echo or paste `SEED_PASSWORD` or connection strings; the seed table already masks custom passwords.

Report the counts and which database was seeded.
