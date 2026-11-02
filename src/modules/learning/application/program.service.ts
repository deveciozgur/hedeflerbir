import "server-only";
import { db } from "@/server/db";

/**
 * The bootcamp runs as one programme. Admins no longer pick a "Program": new trainings go into this
 * course (created on first use) and every active participant is enrolled in it, so trainings,
 * training assignments and attendance keep working through the existing Enrollment model.
 */
export const PROGRAM_SLUG = "hedeflerbir-2026";

export async function resolveProgramCourseId(instructorId: string): Promise<string> {
  const course = await db.course.upsert({
    where: { slug: PROGRAM_SLUG },
    create: {
      slug: PROGRAM_SLUG,
      title: "HedeflerBir Programı",
      description: "Canlı eğitimler ve mentorluk programı.",
      instructorId,
      status: "PUBLISHED",
    },
    update: {},
    select: { id: true },
  });
  return course.id;
}

/** Enrolls the given participants (default: every active one) in the programme, if it exists yet. */
export async function enrollInProgram(studentIds?: string[]): Promise<void> {
  const program = await db.course.findUnique({ where: { slug: PROGRAM_SLUG }, select: { id: true } });
  if (!program) return;
  const students = await db.user.findMany({
    where: { role: "STUDENT", isActive: true, ...(studentIds ? { id: { in: studentIds } } : {}) },
    select: { id: true },
  });
  if (students.length === 0) return;
  await db.enrollment.createMany({ data: students.map((s) => ({ studentId: s.id, courseId: program.id })), skipDuplicates: true });
}
