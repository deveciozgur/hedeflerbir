"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db";
import { requireRole } from "@/server/auth/guards";
import { recordAudit } from "@/server/audit";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { curriculumOrderSchema, lessonInputSchema, moduleInputSchema } from "../domain/curriculum-schemas";
import { parseResourceLines } from "../domain/resources";
import { completeLesson } from "./course-completion.service";

const revalidateCurriculum = (courseId: string) => {
  revalidatePath(`/instructor/courses/${courseId}`);
  revalidatePath("/courses", "layout");
};

const ownedCourse = (courseId: string, instructorId: string) =>
  db.course.findFirst({ where: { id: courseId, instructorId }, select: { id: true } });

// ───────────────────────────── Modules ─────────────────────────────

export async function createModuleAction(courseId: unknown, input: unknown): Promise<ActionResult<{ id: string }>> {
  const instructor = await requireRole("INSTRUCTOR");
  const parsed = moduleInputSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Geçersiz bölüm adı.");
  const course = await ownedCourse(String(courseId), instructor.id);
  if (!course) return fail("Bu eğitimi düzenleme yetkiniz yok.");

  const last = await db.courseModule.findFirst({ where: { courseId: course.id }, orderBy: { orderIndex: "desc" }, select: { orderIndex: true } });
  const created = await db.courseModule.create({
    data: { courseId: course.id, title: parsed.data.title, orderIndex: (last?.orderIndex ?? -1) + 1 },
    select: { id: true },
  });
  revalidateCurriculum(course.id);
  return ok(created);
}

export async function renameModuleAction(moduleId: unknown, input: unknown): Promise<ActionResult> {
  const instructor = await requireRole("INSTRUCTOR");
  const parsed = moduleInputSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Geçersiz bölüm adı.");
  const courseModule = await db.courseModule.findFirst({ where: { id: String(moduleId), course: { instructorId: instructor.id } }, select: { id: true, courseId: true } });
  if (!courseModule) return fail("Bölüm bulunamadı.");

  await db.courseModule.update({ where: { id: courseModule.id }, data: { title: parsed.data.title } });
  revalidateCurriculum(courseModule.courseId);
  return ok(undefined);
}

/** Deletes the module and its lessons (student progress on them goes too). Linked sessions/assignments stay. */
export async function deleteModuleAction(moduleId: unknown): Promise<ActionResult> {
  const instructor = await requireRole("INSTRUCTOR");
  const courseModule = await db.courseModule.findFirst({
    where: { id: String(moduleId), course: { instructorId: instructor.id } },
    select: { id: true, courseId: true, title: true, _count: { select: { lessons: true } } },
  });
  if (!courseModule) return fail("Bölüm bulunamadı.");

  await db.courseModule.delete({ where: { id: courseModule.id } });
  await recordAudit({
    action: "curriculum.module_deleted",
    actorId: instructor.id,
    targetType: "course",
    targetId: courseModule.courseId,
    metadata: { title: courseModule.title, lessons: courseModule._count.lessons },
  });
  revalidateCurriculum(courseModule.courseId);
  return ok(undefined);
}

/** Persists a drag-and-drop result. Every module and lesson in the payload must belong to the course. */
export async function saveCurriculumOrderAction(courseId: unknown, input: unknown): Promise<ActionResult> {
  const instructor = await requireRole("INSTRUCTOR");
  const parsed = curriculumOrderSchema.safeParse(input);
  if (!parsed.success) return fail("Geçersiz sıralama.");
  const course = await db.course.findFirst({
    where: { id: String(courseId), instructorId: instructor.id },
    select: { id: true, modules: { select: { id: true, lessons: { select: { id: true } } } } },
  });
  if (!course) return fail("Bu eğitimi düzenleme yetkiniz yok.");

  const moduleIds = new Set(course.modules.map((m) => m.id));
  const lessonIds = new Set(course.modules.flatMap((m) => m.lessons.map((l) => l.id)));
  const sentLessons = parsed.data.flatMap((m) => m.lessonIds);
  const complete =
    parsed.data.length === moduleIds.size &&
    parsed.data.every((m) => moduleIds.has(m.moduleId)) &&
    sentLessons.length === lessonIds.size &&
    new Set(sentLessons).size === lessonIds.size &&
    sentLessons.every((id) => lessonIds.has(id));
  if (!complete) return fail("Müfredat başka bir sekmede değişmiş olabilir. Sayfayı yenileyip tekrar deneyin.");

  await db.$transaction([
    ...parsed.data.map((m, orderIndex) => db.courseModule.update({ where: { id: m.moduleId }, data: { orderIndex } })),
    ...parsed.data.flatMap((m) =>
      m.lessonIds.map((lessonId, orderIndex) => db.lesson.update({ where: { id: lessonId }, data: { moduleId: m.moduleId, orderIndex } })),
    ),
  ]);
  revalidateCurriculum(course.id);
  return ok(undefined);
}

// ───────────────────────────── Lessons ─────────────────────────────

/** Students who submitted the linked assignment before the lesson existed get the lesson completed too. */
async function backfillAssignmentLesson(lessonId: string, assignmentId: string | null) {
  if (!assignmentId) return;
  const submitters = await db.submission.findMany({ where: { assignmentId }, select: { studentId: true } });
  for (const { studentId } of submitters) await completeLesson(studentId, lessonId);
}

type LessonFields = Omit<z.infer<typeof lessonInputSchema>, "resources" | "content"> & {
  content: string | null;
  resources: ReturnType<typeof parseResourceLines>["resources"];
};

/** Validates the input and checks that a linked session/assignment belongs to the same course and is free. */
async function parseLesson(input: unknown, courseId: string, lessonId: string | null): Promise<ActionResult<LessonFields>> {
  const parsed = lessonInputSchema.safeParse(input);
  if (!parsed.success) return fail("Lütfen alanları kontrol edin.", z.flattenError(parsed.error).fieldErrors);
  const { resources, invalidLines } = parseResourceLines(parsed.data.resources);
  if (invalidLines.length > 0) return fail("Bazı kaynak satırları geçersiz.", { resources: [`Satır ${invalidLines.join(", ")}: "Başlık | https://..." biçiminde yazın.`] });

  const data = parsed.data;
  const sessionId = data.type === "LIVE_SESSION" ? data.sessionId : null;
  const assignmentId = data.type === "ASSIGNMENT" ? data.assignmentId : null;
  if (sessionId) {
    const session = await db.courseSession.findFirst({ where: { id: sessionId, courseId }, select: { lesson: { select: { id: true } } } });
    if (!session) return fail("Canlı ders bu eğitime ait değil.", { sessionId: ["Listeden bir canlı ders seçin."] });
    if (session.lesson && session.lesson.id !== lessonId) return fail("Bu canlı ders başka bir derse bağlı.", { sessionId: ["Başka bir canlı ders seçin."] });
  }
  if (assignmentId) {
    const assignment = await db.assignment.findFirst({ where: { id: assignmentId, courseId }, select: { lesson: { select: { id: true } } } });
    if (!assignment) return fail("Ödev bu eğitime ait değil.", { assignmentId: ["Listeden bir ödev seçin."] });
    if (assignment.lesson && assignment.lesson.id !== lessonId) return fail("Bu ödev başka bir derse bağlı.", { assignmentId: ["Başka bir ödev seçin."] });
  }

  return ok({
    title: data.title,
    type: data.type,
    durationMinutes: data.durationMinutes,
    content: data.content.trim() || null,
    videoUrl: data.type === "VIDEO" ? data.videoUrl : null,
    resources,
    sessionId,
    assignmentId,
  });
}

export async function createLessonAction(moduleId: unknown, input: unknown): Promise<ActionResult<{ id: string }>> {
  const instructor = await requireRole("INSTRUCTOR");
  const courseModule = await db.courseModule.findFirst({ where: { id: String(moduleId), course: { instructorId: instructor.id } }, select: { id: true, courseId: true } });
  if (!courseModule) return fail("Bölüm bulunamadı.");
  const fields = await parseLesson(input, courseModule.courseId, null);
  if (!fields.ok) return fields;

  const lesson = await db.$transaction(async (tx) => {
    const last = await tx.lesson.findFirst({ where: { moduleId: courseModule.id }, orderBy: { orderIndex: "desc" }, select: { orderIndex: true } });
    const created = await tx.lesson.create({
      data: { ...fields.data, moduleId: courseModule.id, orderIndex: (last?.orderIndex ?? -1) + 1 },
      select: { id: true },
    });
    // A quiz lesson always has its quiz row; questions are added in the quiz editor.
    if (fields.data.type === "QUIZ") await tx.quiz.create({ data: { lessonId: created.id } });
    return created;
  });
  await backfillAssignmentLesson(lesson.id, fields.data.assignmentId);
  revalidateCurriculum(courseModule.courseId);
  return ok(lesson);
}

export async function updateLessonAction(lessonId: unknown, input: unknown): Promise<ActionResult> {
  const instructor = await requireRole("INSTRUCTOR");
  const lesson = await db.lesson.findFirst({
    where: { id: String(lessonId), module: { course: { instructorId: instructor.id } } },
    select: { id: true, type: true, module: { select: { courseId: true } } },
  });
  if (!lesson) return fail("Ders bulunamadı.");
  const fields = await parseLesson(input, lesson.module.courseId, lesson.id);
  if (!fields.ok) return fields;
  // Changing the type would orphan quiz attempts or completion semantics; create a new lesson instead.
  if (fields.data.type !== lesson.type) return fail("Ders türü sonradan değiştirilemez. Yeni bir ders ekleyin.");

  await db.lesson.update({ where: { id: lesson.id }, data: fields.data });
  await backfillAssignmentLesson(lesson.id, fields.data.assignmentId);
  revalidateCurriculum(lesson.module.courseId);
  return ok(undefined);
}

export async function deleteLessonAction(lessonId: unknown): Promise<ActionResult> {
  const instructor = await requireRole("INSTRUCTOR");
  const lesson = await db.lesson.findFirst({
    where: { id: String(lessonId), module: { course: { instructorId: instructor.id } } },
    select: { id: true, title: true, module: { select: { courseId: true } } },
  });
  if (!lesson) return fail("Ders bulunamadı.");

  await db.lesson.delete({ where: { id: lesson.id } });
  await recordAudit({
    action: "curriculum.lesson_deleted",
    actorId: instructor.id,
    targetType: "course",
    targetId: lesson.module.courseId,
    metadata: { title: lesson.title },
  });
  revalidateCurriculum(lesson.module.courseId);
  return ok(undefined);
}

// ───────────────────────────── Quiz results ─────────────────────────────

export interface QuizResultRow {
  id: string;
  studentName: string;
  score: number;
  isPassed: boolean;
  finishedAt: Date;
  openAnswers: Array<{ prompt: string; answer: string }>;
}

export async function getQuizResultsAction(lessonId: unknown): Promise<ActionResult<QuizResultRow[]>> {
  const instructor = await requireRole("INSTRUCTOR");
  const quiz = await db.quiz.findFirst({
    where: { lessonId: String(lessonId), lesson: { module: { course: { instructorId: instructor.id } } } },
    select: {
      questions: { where: { type: "OPEN_ENDED" }, orderBy: { orderIndex: "asc" }, select: { id: true, prompt: true } },
      attempts: {
        where: { finishedAt: { not: null } },
        orderBy: { finishedAt: "desc" },
        take: 200,
        select: { id: true, score: true, isPassed: true, finishedAt: true, answers: true, user: { select: { name: true, surname: true } } },
      },
    },
  });
  if (!quiz) return fail("Quiz bulunamadı.");

  return ok(
    quiz.attempts.map((a) => {
      const answers = (a.answers ?? {}) as Record<string, unknown>;
      return {
        id: a.id,
        studentName: `${a.user.name} ${a.user.surname}`,
        score: a.score ?? 0,
        isPassed: a.isPassed,
        finishedAt: a.finishedAt!,
        openAnswers: quiz.questions.flatMap((q) => {
          const answer = answers[q.id];
          return typeof answer === "string" && answer.trim() ? [{ prompt: q.prompt, answer }] : [];
        }),
      };
    }),
  );
}
