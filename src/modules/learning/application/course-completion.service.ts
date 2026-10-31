import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { dayKey } from "@/lib/format";
import { generateVerificationCode } from "../domain/certificate";

/** Upper bound for one progress tick, so a skipped-ahead or replayed video can't inflate watch time. */
const MAX_WATCH_DELTA_SECONDS = 60;

/** Adds watched seconds to today's (Europe/Istanbul) activity row. */
export async function recordWatchTime(userId: string, deltaSeconds: number): Promise<void> {
  const seconds = Math.min(MAX_WATCH_DELTA_SECONDS, Math.max(0, Math.floor(deltaSeconds)));
  if (seconds === 0) return;
  const day = new Date(`${dayKey(new Date())}T00:00:00.000Z`);
  await db.learningActivity.upsert({
    where: { userId_day: { userId, day } },
    create: { userId, day, seconds },
    update: { seconds: { increment: seconds } },
  });
}

export interface CompletionResult {
  newlyCompleted: boolean;
  /** Set when this lesson finished the whole course and a certificate was issued. */
  certificateCode: string | null;
}

/** Marks a lesson done (idempotent) and, if it was the last one, completes the enrollment and issues the certificate. */
export async function completeLesson(userId: string, lessonId: string): Promise<CompletionResult> {
  const existing = await db.lessonProgress.findUnique({ where: { userId_lessonId: { userId, lessonId } }, select: { isCompleted: true } });
  if (existing?.isCompleted) return { newlyCompleted: false, certificateCode: null };

  const now = new Date();
  await db.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    create: { userId, lessonId, isCompleted: true, completedAt: now },
    update: { isCompleted: true, completedAt: now },
  });

  const lesson = await db.lesson.findUnique({ where: { id: lessonId }, select: { module: { select: { courseId: true } } } });
  const certificateCode = lesson ? await completeCourseIfDone(userId, lesson.module.courseId) : null;
  return { newlyCompleted: true, certificateCode };
}

/** Assignment lessons complete when the linked assignment is submitted. */
export async function completeAssignmentLesson(userId: string, assignmentId: string): Promise<void> {
  const lesson = await db.lesson.findUnique({ where: { assignmentId }, select: { id: true } });
  if (lesson) await completeLesson(userId, lesson.id);
}

async function completeCourseIfDone(userId: string, courseId: string): Promise<string | null> {
  const [total, done, enrollment] = await Promise.all([
    db.lesson.count({ where: { module: { courseId } } }),
    db.lessonProgress.count({ where: { userId, isCompleted: true, lesson: { module: { courseId } } } }),
    db.enrollment.findUnique({ where: { studentId_courseId: { studentId: userId, courseId } }, select: { status: true } }),
  ]);
  if (!enrollment || total === 0 || done < total || enrollment.status === "COMPLETED") return null;

  const course = await db.course.findUniqueOrThrow({ where: { id: courseId }, select: { slug: true, title: true } });
  const certificate = await issueCertificate(userId, courseId);
  await db.$transaction([
    db.enrollment.update({
      where: { studentId_courseId: { studentId: userId, courseId } },
      data: { status: "COMPLETED", completedAt: new Date() },
    }),
    db.notification.create({
      data: {
        userId,
        type: "CERTIFICATE_ISSUED",
        title: "Tebrikler, eğitimi tamamladın",
        body: `${course.title} sertifikan hazır.`,
        href: `/courses/${course.slug}`,
      },
    }),
  ]);
  return certificate.verificationCode;
}

/** One certificate per (student, course); retries on the astronomically unlikely code collision. */
async function issueCertificate(userId: string, courseId: string) {
  const existing = await db.certificate.findUnique({ where: { userId_courseId: { userId, courseId } } });
  if (existing) return existing;
  for (let attempt = 0; ; attempt++) {
    try {
      return await db.certificate.create({ data: { userId, courseId, verificationCode: generateVerificationCode() } });
    } catch (error) {
      const duplicateCode =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        String(error.meta?.target ?? "").includes("verificationCode");
      if (!duplicateCode || attempt >= 3) throw error;
    }
  }
}
