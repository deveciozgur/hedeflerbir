"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db";
import { requireRole } from "@/server/auth/guards";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { announcementInputSchema } from "../domain/announcements";

/**
 * Admins post platform-wide or course announcements; instructors only for their own courses.
 * Course announcements (and high-priority platform ones) also notify the affected students.
 */
export async function createAnnouncementAction(input: unknown): Promise<ActionResult> {
  const user = await requireRole("ADMIN", "INSTRUCTOR");
  const parsed = announcementInputSchema.safeParse(input);
  if (!parsed.success) return fail("Lütfen alanları kontrol edin.", z.flattenError(parsed.error).fieldErrors);
  const { courseId, ...data } = parsed.data;

  if (user.role === "INSTRUCTOR" && !courseId) return fail("Eğitmenler yalnızca kendi eğitimleri için duyuru yayınlayabilir.");
  const course = courseId
    ? await db.course.findFirst({
        where: { id: courseId, ...(user.role === "INSTRUCTOR" ? { instructorId: user.id } : {}) },
        select: { id: true, slug: true, enrollments: { select: { studentId: true } } },
      })
    : null;
  if (courseId && !course) return fail("Bu eğitim için duyuru yetkiniz yok.");

  const recipients = course
    ? course.enrollments.map((e) => e.studentId)
    : data.priority === "HIGH"
      ? (await db.user.findMany({ where: { role: "STUDENT", isActive: true }, select: { id: true } })).map((u) => u.id)
      : [];

  await db.$transaction([
    db.announcement.create({ data: { ...data, courseId: course?.id ?? null, authorId: user.id } }),
    db.notification.createMany({
      data: recipients.map((userId) => ({
        userId,
        type: "SYSTEM" as const,
        title: data.priority === "HIGH" ? `Önemli duyuru: ${data.title}` : `Yeni duyuru: ${data.title}`,
        body: data.content.slice(0, 140),
        href: course ? `/courses/${course.slug}` : "/dashboard",
      })),
    }),
  ]);

  revalidatePath("/dashboard");
  revalidatePath("/courses", "layout");
  return ok(undefined);
}
