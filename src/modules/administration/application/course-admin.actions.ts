"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db";
import { requireRole } from "@/server/auth/guards";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { courseInputSchema, enrollmentSchema } from "../domain/course-admin";

const revalidateCourses = (courseId?: string) => {
  revalidatePath("/admin/courses");
  if (courseId) revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath("/instructor", "layout");
  revalidatePath("/courses", "layout");
};

async function validateCourse(input: unknown, currentId?: string): Promise<ActionResult<z.infer<typeof courseInputSchema>>> {
  const parsed = courseInputSchema.safeParse(input);
  if (!parsed.success) return fail("Lütfen alanları kontrol edin.", z.flattenError(parsed.error).fieldErrors);

  const instructor = await db.user.findFirst({
    where: { id: parsed.data.instructorId, role: "INSTRUCTOR", isActive: true },
    select: { id: true },
  });
  if (!instructor) return fail("Seçilen kullanıcı aktif bir eğitmen değil.", { instructorId: ["Geçerli bir eğitmen seçin."] });

  const clash = await db.course.findFirst({ where: { slug: parsed.data.slug, id: { not: currentId } }, select: { id: true } });
  if (clash) return fail("Bu adres başka bir eğitimde kullanılıyor.", { slug: ["Bu adres kullanımda."] });

  return ok(parsed.data);
}

export async function createCourseAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  await requireRole("ADMIN");
  const valid = await validateCourse(input);
  if (!valid.ok) return valid;

  const course = await db.course.create({ data: valid.data, select: { id: true } });
  revalidateCourses();
  return ok({ id: course.id });
}

export async function updateCourseAction(courseId: unknown, input: unknown): Promise<ActionResult> {
  await requireRole("ADMIN");
  const id = z.string().min(1).safeParse(courseId);
  if (!id.success) return fail("Geçersiz eğitim.");

  const valid = await validateCourse(input, id.data);
  if (!valid.ok) return valid;

  await db.course.update({ where: { id: id.data }, data: valid.data });
  revalidateCourses(id.data);
  return ok(undefined);
}

export async function enrollStudentsAction(input: unknown): Promise<ActionResult<{ added: number }>> {
  await requireRole("ADMIN");
  const parsed = enrollmentSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Geçersiz istek.");

  const course = await db.course.findUnique({ where: { id: parsed.data.courseId }, select: { id: true, slug: true, title: true } });
  if (!course) return fail("Eğitim bulunamadı.");

  // Only active students who aren't enrolled yet — so nobody gets a duplicate notification.
  const students = await db.user.findMany({
    where: {
      id: { in: parsed.data.studentIds },
      role: "STUDENT",
      isActive: true,
      enrollments: { none: { courseId: course.id } },
    },
    select: { id: true },
  });
  if (students.length === 0) return fail("Seçilen katılımcılar zaten kayıtlı ya da aktif değil.");

  const { count } = await db.$transaction(async (tx) => {
    const created = await tx.enrollment.createMany({
      data: students.map((s) => ({ studentId: s.id, courseId: course.id })),
      skipDuplicates: true,
    });
    await tx.notification.createMany({
      data: students.map((s) => ({
        userId: s.id,
        type: "SYSTEM" as const,
        title: "Yeni eğitime kaydedildin",
        body: course.title,
        href: `/courses/${course.slug}`,
      })),
    });
    return created;
  });

  revalidateCourses(course.id);
  return ok({ added: count });
}

export async function unenrollStudentAction(courseId: unknown, studentId: unknown): Promise<ActionResult> {
  await requireRole("ADMIN");
  const ids = z.object({ courseId: z.string().min(1), studentId: z.string().min(1) }).safeParse({ courseId, studentId });
  if (!ids.success) return fail("Geçersiz istek.");

  // Submissions, attendance and watch history are kept for reporting.
  const { count } = await db.enrollment.deleteMany({ where: ids.data });
  if (count === 0) return fail("Kayıt bulunamadı.");

  revalidateCourses(ids.data.courseId);
  return ok(undefined);
}
