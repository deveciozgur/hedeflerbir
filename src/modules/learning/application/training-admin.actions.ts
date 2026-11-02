"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db";
import { requireRole } from "@/server/auth/guards";
import { recordAudit } from "@/server/audit";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { badgeByCode } from "@/modules/engagement/domain/badges";
import { trainingInputSchema } from "../domain/training-schemas";
import { enrollInProgram, resolveProgramCourseId } from "./program.service";

const revalidateTrainings = () => {
  revalidatePath("/admin", "layout");
  revalidatePath("/trainings", "layout");
  revalidatePath("/instructor", "layout");
  revalidatePath("/dashboard");
};

async function parseTraining(input: unknown) {
  const parsed = trainingInputSchema.safeParse(input);
  if (!parsed.success) return fail("Lütfen alanları kontrol edin.", z.flattenError(parsed.error).fieldErrors);
  const { badgeCode, scheduleDate, topics, ...data } = parsed.data;
  if (badgeCode && !badgeByCode(badgeCode)) return fail("Geçersiz rozet.", { badgeCode: ["Listeden bir rozet seçin."] });

  const instructor = await db.user.findFirst({ where: { id: data.instructorId, role: "INSTRUCTOR", isActive: true }, select: { id: true } });
  if (!instructor) return fail("Eğitmen bulunamadı.", { instructorId: ["Aktif bir eğitmen seçin."] });

  return ok({ ...data, topics: topics || null, scheduleDate: new Date(scheduleDate), badgeCode: badgeCode || null });
}

export async function createTrainingAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  await requireRole("ADMIN");
  const fields = await parseTraining(input);
  if (!fields.ok) return fields;

  const courseId = await resolveProgramCourseId(fields.data.instructorId);
  const training = await db.$transaction(async (tx) => {
    const last = await tx.courseSession.findFirst({ where: { courseId }, orderBy: { order: "desc" }, select: { order: true } });
    return tx.courseSession.create({ data: { ...fields.data, courseId, order: (last?.order ?? 0) + 1 }, select: { id: true } });
  });

  // Every participant is in the programme; they hear about new trainings right away.
  await enrollInProgram();
  const enrolled = await db.enrollment.findMany({ where: { courseId }, select: { studentId: true } });
  await db.notification.createMany({
    data: enrolled.map(({ studentId }) => ({ userId: studentId, type: "SYSTEM" as const, title: "Yeni canlı eğitim", body: fields.data.title, href: `/trainings/${training.id}` })),
  });
  revalidateTrainings();
  return ok(training);
}

export async function updateTrainingAction(sessionId: unknown, input: unknown): Promise<ActionResult> {
  await requireRole("ADMIN");
  const fields = await parseTraining(input);
  if (!fields.ok) return fields;
  const existing = await db.courseSession.findUnique({ where: { id: String(sessionId) }, select: { id: true } });
  if (!existing) return fail("Eğitim bulunamadı.");

  await db.courseSession.update({ where: { id: existing.id }, data: fields.data });
  revalidateTrainings();
  return ok(undefined);
}

export async function deleteTrainingAction(sessionId: unknown): Promise<ActionResult> {
  const admin = await requireRole("ADMIN");
  const training = await db.courseSession.findUnique({ where: { id: String(sessionId) }, select: { id: true, title: true, courseId: true } });
  if (!training) return fail("Eğitim bulunamadı.");

  // Attendance goes with it; assignments stay (unlinked) so no submission is lost.
  await db.courseSession.delete({ where: { id: training.id } });
  await recordAudit({ action: "training.deleted", actorId: admin.id, targetType: "course", targetId: training.courseId, metadata: { title: training.title } });
  revalidateTrainings();
  return ok(undefined);
}
