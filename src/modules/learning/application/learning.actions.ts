"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db";
import { requireRole } from "@/server/auth/guards";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { awardBadgesSafely } from "@/modules/engagement/application/badges.service";
import { isWatched } from "../domain/recording";
import { parseResourceLines } from "../domain/resources";
import { attendanceInputSchema, sessionInputSchema, watchProgressSchema } from "../domain/schemas";

// ───────────────────────────── Student: watch progress ─────────────────────────────

export async function saveWatchProgressAction(input: unknown): Promise<ActionResult<{ completed: boolean }>> {
  const student = await requireRole("STUDENT");
  const parsed = watchProgressSchema.safeParse(input);
  if (!parsed.success) return fail("Geçersiz ilerleme verisi.");
  const { sessionId, positionSeconds, durationSeconds } = parsed.data;

  const session = await db.courseSession.findFirst({
    where: { id: sessionId, recordingUrl: { not: null }, course: { enrollments: { some: { studentId: student.id } } } },
    select: { id: true, lessonViews: { where: { userId: student.id }, select: { completed: true } } },
  });
  if (!session) return fail("Ders kaydı bulunamadı.");

  // Completion is sticky — re-watching the intro must not un-finish a lesson.
  const wasCompleted = session.lessonViews[0]?.completed ?? false;
  const completed = wasCompleted || isWatched(positionSeconds, durationSeconds);
  const position = Math.floor(positionSeconds);

  await db.lessonView.upsert({
    where: { userId_sessionId: { userId: student.id, sessionId } },
    create: { userId: student.id, sessionId, positionSeconds: position, completed },
    update: { positionSeconds: position, completed },
  });
  if (completed && !wasCompleted) after(() => awardBadgesSafely([student.id]));
  // Intentionally no revalidatePath: refreshing the RSC tree every 15 s would disturb playback.
  return ok({ completed });
}

// ───────────────────────────── Instructor: sessions ─────────────────────────────

type SessionFields = {
  title: string;
  description: string | null;
  scheduleDate: Date;
  durationMinutes: number;
  meetingUrl: string | null;
  recordingUrl: string | null;
  resources: ReturnType<typeof parseResourceLines>["resources"];
};

function parseSessionInput(input: unknown): ActionResult<SessionFields> {
  const parsed = sessionInputSchema.safeParse(input);
  if (!parsed.success) return fail("Lütfen alanları kontrol edin.", z.flattenError(parsed.error).fieldErrors);

  const { resources, invalidLines } = parseResourceLines(parsed.data.resources);
  if (invalidLines.length > 0) {
    return fail("Bazı kaynak satırları geçersiz.", {
      resources: [`Satır ${invalidLines.join(", ")}: "Başlık | https://…" biçiminde yazın.`],
    });
  }

  return ok({
    title: parsed.data.title,
    description: parsed.data.description || null,
    scheduleDate: new Date(parsed.data.scheduleDate),
    durationMinutes: parsed.data.durationMinutes,
    meetingUrl: parsed.data.meetingUrl,
    recordingUrl: parsed.data.recordingUrl,
    resources,
  });
}

const revalidateCourse = (courseId: string) => {
  revalidatePath(`/instructor/courses/${courseId}`);
  revalidatePath("/instructor/courses");
  revalidatePath("/courses", "layout");
  revalidatePath("/dashboard");
};

async function notifyRecordingPublished(courseId: string, slug: string, sessionTitle: string) {
  const enrollments = await db.enrollment.findMany({ where: { courseId }, select: { studentId: true } });
  await db.notification.createMany({
    data: enrollments.map(({ studentId }) => ({
      userId: studentId,
      type: "SYSTEM" as const,
      title: "Ders kaydı yayında",
      body: sessionTitle,
      href: `/courses/${slug}`,
    })),
  });
}

export async function createSessionAction(courseId: unknown, input: unknown): Promise<ActionResult<{ id: string }>> {
  const instructor = await requireRole("INSTRUCTOR");
  const fields = parseSessionInput(input);
  if (!fields.ok) return fields;

  const course = await db.course.findFirst({
    where: { id: String(courseId), instructorId: instructor.id },
    select: { id: true, slug: true },
  });
  if (!course) return fail("Bu eğitimi düzenleme yetkiniz yok.");

  const session = await db.$transaction(async (tx) => {
    const last = await tx.courseSession.findFirst({
      where: { courseId: course.id },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    return tx.courseSession.create({
      data: { courseId: course.id, order: (last?.order ?? 0) + 1, ...fields.data },
      select: { id: true },
    });
  });

  if (fields.data.recordingUrl) await notifyRecordingPublished(course.id, course.slug, fields.data.title);
  revalidateCourse(course.id);
  return ok({ id: session.id });
}

export async function updateSessionAction(sessionId: unknown, input: unknown): Promise<ActionResult> {
  const instructor = await requireRole("INSTRUCTOR");
  const fields = parseSessionInput(input);
  if (!fields.ok) return fields;

  const existing = await db.courseSession.findFirst({
    where: { id: String(sessionId), course: { instructorId: instructor.id } },
    select: { id: true, recordingUrl: true, course: { select: { id: true, slug: true } } },
  });
  if (!existing) return fail("Oturum bulunamadı.");

  await db.courseSession.update({ where: { id: existing.id }, data: fields.data });

  if (!existing.recordingUrl && fields.data.recordingUrl) {
    await notifyRecordingPublished(existing.course.id, existing.course.slug, fields.data.title);
  }
  revalidateCourse(existing.course.id);
  return ok(undefined);
}

// ───────────────────────────── Instructor: attendance ─────────────────────────────

export async function saveAttendanceAction(input: unknown): Promise<ActionResult<{ saved: number }>> {
  const instructor = await requireRole("INSTRUCTOR");
  const parsed = attendanceInputSchema.safeParse(input);
  if (!parsed.success) return fail("Geçersiz yoklama verisi.");

  const session = await db.courseSession.findFirst({
    where: { id: parsed.data.sessionId, course: { instructorId: instructor.id } },
    select: { id: true, scheduleDate: true, course: { select: { id: true, enrollments: { select: { studentId: true } } } } },
  });
  if (!session) return fail("Oturum bulunamadı.");
  if (session.scheduleDate > new Date()) return fail("Yoklama ders başladıktan sonra alınabilir.");

  const enrolled = new Set(session.course.enrollments.map((e) => e.studentId));
  const records = parsed.data.records.filter((r) => enrolled.has(r.studentId));

  await db.$transaction(
    records.map(({ studentId, status }) =>
      db.sessionAttendance.upsert({
        where: { sessionId_studentId: { sessionId: session.id, studentId } },
        create: { sessionId: session.id, studentId, status },
        update: { status },
      }),
    ),
  );

  after(() => awardBadgesSafely(records.filter((r) => r.status === "PRESENT").map((r) => r.studentId)));
  revalidatePath(`/instructor/courses/${session.course.id}`);
  return ok({ saved: records.length });
}
