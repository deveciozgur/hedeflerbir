import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { PrismaClient, Role, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEMO_ACCOUNTS, demoPassword } from "../src/modules/identity/domain/demo-accounts";

/**
 * Idempotent demo seed: run it any number of times (`npx prisma db seed`).
 * Users are upserted by e-mail, everything else by its natural key, so re-runs update
 * instead of duplicating. Demo passwords are (re)set to SEED_PASSWORD on every run,
 * which is why the script refuses to run in production unless explicitly allowed.
 */

const prisma = new PrismaClient();

const DAY = 24 * 60 * 60 * 1000;
/** Local wall-clock time `days` from today, e.g. at(2, 14) = the day after tomorrow 14:00. */
const at = (days: number, hour: number, minute = 0) => {
  const date = new Date(Date.now() + days * DAY);
  date.setHours(hour, minute, 0, 0);
  return date;
};

const ACCOUNT = Object.fromEntries(DEMO_ACCOUNTS.map((a) => [a.role, a])) as Record<Role, (typeof DEMO_ACCOUNTS)[number]>;

interface DemoUser {
  role: Role;
  name: string;
  surname: string;
  profile: { title: string; bio?: string; expertiseArea?: string; goals?: string; meetingUrl?: string; socialLinks?: Prisma.InputJsonValue };
}

const USERS: DemoUser[] = [
  {
    role: Role.ADMIN,
    name: "Sistem",
    surname: "Yöneticisi",
    profile: { title: "Platform Yöneticisi", bio: "HedeflerBir LMS sistem yöneticisi ve operasyon lideri." },
  },
  {
    role: Role.INSTRUCTOR,
    name: "Ahmet",
    surname: "Yılmaz",
    profile: {
      title: "Kıdemli Full-Stack Eğitmeni",
      expertiseArea: "Next.js 15 · TypeScript · Modern Web Mimarileri",
      bio: "10 yılı aşkın yazılım geliştirme ve eğitmenlik tecrübesi.",
      socialLinks: { linkedin: "https://www.linkedin.com", github: "https://github.com" },
    },
  },
  {
    role: Role.MENTOR,
    name: "Burak",
    surname: "Demir",
    profile: {
      title: "Engineering Manager & Kariyer Mentoru",
      expertiseArea: "Kariyer Planlama · Sistem Tasarımı · Kod İnceleme",
      bio: "Global teknoloji şirketlerinde mühendislik liderliği ve kariyer danışmanlığı.",
      meetingUrl: "https://meet.google.com/hed-demo-001",
      socialLinks: { linkedin: "https://www.linkedin.com" },
    },
  },
  {
    role: Role.STUDENT,
    name: "Can",
    surname: "Öztürk",
    profile: {
      title: "Yazılım Geliştirici Adayı",
      goals: "Next.js ile production seviyesinde bir proje yayınlamak ve ilk yazılım işimi bulmak.",
    },
  },
];

function assertSafeEnvironment() {
  if (process.env.NODE_ENV === "production" && process.env.SEED_ALLOW_PRODUCTION !== "true") {
    throw new Error(
      "Seed production ortamında çalıştırılmadı: demo hesapların şifrelerini sıfırlar. " +
        "Boş bir production veritabanında bilerek çalıştırmak için SEED_ALLOW_PRODUCTION=true verin.",
    );
  }
}

async function upsertUsers(passwordHash: string) {
  const byRole = {} as Record<Role, { id: string }>;
  for (const user of USERS) {
    const { email } = ACCOUNT[user.role];
    const profile = { ...user.profile, socialLinks: user.profile.socialLinks ?? {} };
    byRole[user.role] = await prisma.user.upsert({
      where: { email },
      create: { email, name: user.name, surname: user.surname, role: user.role, passwordHash, profile: { create: profile } },
      update: {
        name: user.name,
        surname: user.surname,
        role: user.role,
        passwordHash,
        isActive: true,
        // A password reset bumps sessionVersion; keep it so old sessions stay revoked.
        profile: { upsert: { create: profile, update: profile } },
      },
      select: { id: true },
    });
  }
  return byRole;
}

async function seedCourse(instructorId: string, studentId: string) {
  const slug = "nextjs-15-ileri-seviye";
  const course = await prisma.course.upsert({
    where: { slug },
    create: {
      slug,
      title: "Next.js 15 ile Sıfırdan İleri Seviye Web Geliştirme",
      description: "App Router, Server Components, Server Actions ve production deployment ile uçtan uca modern web geliştirme.",
      instructorId,
    },
    update: { instructorId },
    select: { id: true, slug: true },
  });

  const sessions = [
    {
      order: 1,
      title: "App Router ve Server Components",
      scheduleDate: at(-6, 19),
      recordingUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
      resources: [
        { title: "Next.js App Router dokümantasyonu", url: "https://nextjs.org/docs/app", type: "link" },
        { title: "Ders notları (PDF)", url: "https://nextjs.org/docs/app/getting-started", type: "pdf" },
      ],
    },
    { order: 2, title: "Server Actions ve veri mutasyonları", scheduleDate: at(2, 19), recordingUrl: null, resources: [] },
  ];
  for (const s of sessions) {
    await prisma.courseSession.upsert({
      where: { courseId_order: { courseId: course.id, order: s.order } },
      create: { courseId: course.id, ...s, meetingUrl: "https://meet.google.com/hed-ders-001" },
      update: { title: s.title, scheduleDate: s.scheduleDate, recordingUrl: s.recordingUrl, resources: s.resources },
    });
  }

  await prisma.enrollment.upsert({
    where: { studentId_courseId: { studentId, courseId: course.id } },
    create: { studentId, courseId: course.id },
    update: {},
  });

  // Assignments have no natural unique key; (course, title) identifies the demo one.
  const title = "Proje Mimarisi ve API Entegrasyonu";
  const assignmentData = {
    description: "Projenin klasör yapısını, veri modelini ve en az bir harici API entegrasyonunu içeren mimari dokümanını teslim edin.",
    dueDate: at(4, 23, 59),
    maxScore: 100,
  };
  const existing = await prisma.assignment.findFirst({ where: { courseId: course.id, title }, select: { id: true } });
  const assignment = existing
    ? await prisma.assignment.update({ where: { id: existing.id }, data: assignmentData, select: { id: true } })
    : await prisma.assignment.create({ data: { courseId: course.id, title, ...assignmentData }, select: { id: true } });

  return { course, assignmentId: assignment.id };
}

/** Writes the demo submission file to local disk storage so its download link works (skipped when S3/R2 is used). */
async function writeDemoSubmissionFile(key: string) {
  if (process.env.S3_BUCKET && !["", "disabled"].includes(process.env.S3_BUCKET.trim().toLowerCase())) return;
  const target = resolve(process.cwd(), process.env.UPLOADS_DIR?.trim() || ".uploads", key);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, "%PDF-1.4\n% HedeflerBir demo teslimi: Proje Mimarisi ve API Entegrasyonu\n");
}

async function seedSubmission(assignmentId: string, studentId: string) {
  const key = join("submissions", assignmentId, studentId, "demo-proje-mimarisi.pdf").replaceAll("\\", "/");
  await writeDemoSubmissionFile(key);
  const fields = {
    fileUrl: key,
    fileName: "Proje Mimarisi - Can Öztürk.pdf",
    note: "Mimari diyagram ve API sözleşmesi dokümanın son sayfasında.",
    status: "SUBMITTED" as const,
    grade: null,
    feedback: null,
    gradedAt: null,
  };
  await prisma.submission.upsert({
    where: { assignmentId_studentId: { assignmentId, studentId } },
    create: { assignmentId, studentId, ...fields },
    update: fields,
  });
}

async function seedProject(studentId: string) {
  const title = "Dönem Projesi: Full-Stack LMS Uygulaması";
  const data = { description: "Next.js 15 ve PostgreSQL ile yayına hazır bir öğrenme yönetim sistemi.", startDate: at(-30, 9), endDate: at(45, 23) };
  const existing = await prisma.project.findFirst({ where: { title }, select: { id: true } });
  const project = existing
    ? await prisma.project.update({ where: { id: existing.id }, data, select: { id: true } })
    : await prisma.project.create({ data: { title, ...data }, select: { id: true } });

  await prisma.studentProjectProgress.upsert({
    where: { studentId_projectId: { studentId, projectId: project.id } },
    create: { studentId, projectId: project.id, completionPercentage: 70, status: "IN_PROGRESS" },
    update: { completionPercentage: 70, status: "IN_PROGRESS" },
  });
}

/** 5 open slots across the next 7 days plus one booked slot with a confirmed appointment. */
async function seedMentoring(mentorId: string, studentId: string) {
  const open = [at(1, 10), at(2, 14), at(3, 16), at(5, 11), at(6, 15)];
  for (const startTime of open) {
    await prisma.mentorSlot.upsert({
      where: { mentorId_startTime: { mentorId, startTime } },
      create: { mentorId, startTime, endTime: new Date(startTime.getTime() + 45 * 60_000) },
      update: {}, // never flip a slot someone booked since the last run back to open
    });
  }

  const bookedStart = at(2, 11);
  const slot = await prisma.mentorSlot.upsert({
    where: { mentorId_startTime: { mentorId, startTime: bookedStart } },
    create: { mentorId, startTime: bookedStart, endTime: new Date(bookedStart.getTime() + 45 * 60_000), isBooked: true },
    update: { isBooked: true },
    select: { id: true },
  });

  const appointment = await prisma.appointment.findFirst({ where: { slotId: slot.id, status: "CONFIRMED" }, select: { id: true } });
  if (!appointment) {
    await prisma.appointment.create({
      data: {
        slotId: slot.id,
        studentId,
        mentorId,
        meetingLink: "https://meet.google.com/hed-demo-001",
        notes: "Sistem tasarımı mülakatına hazırlık ve portfolyo incelemesi.",
      },
    });
  }
}

async function seedAnnouncement(authorId: string) {
  const title = "HedeflerBir LMS demo ortamına hoş geldiniz";
  if (await prisma.announcement.findFirst({ where: { title }, select: { id: true } })) return;
  await prisma.announcement.create({
    data: { authorId, title, content: "Demo hesaplarla tüm rolleri deneyebilirsiniz. Veriler yalnızca test amaçlıdır.", pinned: true },
  });
}

async function main() {
  assertSafeEnvironment();
  const password = demoPassword();
  const users = await upsertUsers(await bcrypt.hash(password, 12));

  const { assignmentId } = await seedCourse(users.INSTRUCTOR.id, users.STUDENT.id);
  await seedSubmission(assignmentId, users.STUDENT.id);
  await seedProject(users.STUDENT.id);
  await seedMentoring(users.MENTOR.id, users.STUDENT.id);
  await seedAnnouncement(users.ADMIN.id);

  console.info("\nHedeflerBir demo hesapları hazır:");
  console.table(
    DEMO_ACCOUNTS.map((a) => {
      const user = USERS.find((u) => u.role === a.role)!;
      return {
        Rol: a.role,
        "Ad Soyad": `${user.name} ${user.surname}`,
        "E-posta": a.email,
        Şifre: password,
        "Giriş sayfası": a.portal === "expert" ? "/expert-login" : "/login",
      };
    }),
  );
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
