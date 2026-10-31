"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db";
import { requireRole } from "@/server/auth/guards";
import { getStorage } from "@/server/storage";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { awardBadgesSafely } from "@/modules/engagement/application/badges.service";
import { completeAssignmentLesson } from "@/modules/learning/application/course-completion.service";
import { sanitizeFileName, validateSubmissionFile } from "../domain/file-policy";
import { assignmentInputSchema, gradeInputSchema, submissionNoteSchema } from "../domain/schemas";
import { canGrade, canSubmit, type SubmissionStatus } from "../domain/submission-status";

// ───────────────────────────── Student ─────────────────────────────

export async function submitAssignmentAction(formData: FormData): Promise<ActionResult<{ status: SubmissionStatus }>> {
  const student = await requireRole("STUDENT");

  const assignmentId = formData.get("assignmentId");
  const file = formData.get("file");
  const note = submissionNoteSchema.safeParse(formData.get("note") ?? "");
  if (typeof assignmentId !== "string" || !(file instanceof File)) return fail("Lütfen bir dosya seçin.");
  if (!note.success) return fail(note.error.issues[0]?.message ?? "Not geçersiz.");

  const assignment = await db.assignment.findFirst({
    where: { id: assignmentId, course: { enrollments: { some: { studentId: student.id } } } },
    select: {
      id: true,
      dueDate: true,
      acceptedFileTypes: true,
      submissions: { where: { studentId: student.id }, select: { status: true, fileUrl: true }, take: 1 },
    },
  });
  if (!assignment) return fail("Ödev bulunamadı.");

  const fileError = validateSubmissionFile(file, assignment.acceptedFileTypes);
  if (fileError) return fail(fileError);

  const previous = assignment.submissions[0] ?? null;
  const eligibility = canSubmit(assignment, previous?.status ?? null);
  if (!eligibility.allowed) return fail(eligibility.reason);

  const storage = getStorage();
  const key = `submissions/${assignment.id}/${student.id}/${Date.now()}-${sanitizeFileName(file.name)}`;
  await storage.put(key, new Uint8Array(await file.arrayBuffer()), file.type || "application/octet-stream");

  const fields = {
    fileUrl: key,
    fileName: file.name,
    note: note.data || null,
    status: "SUBMITTED" as const,
    grade: null,
    feedback: null,
    gradedAt: null,
    submittedAt: new Date(),
  };
  await db.submission.upsert({
    where: { assignmentId_studentId: { assignmentId: assignment.id, studentId: student.id } },
    create: { assignmentId: assignment.id, studentId: student.id, ...fields },
    update: fields,
  });

  if (previous && previous.fileUrl !== key) {
    await storage.delete(previous.fileUrl).catch((error: unknown) => console.warn("Old submission cleanup failed", error));
  }

  after(() => awardBadgesSafely([student.id]));
  // An ASSIGNMENT lesson linked to this assignment completes on submission.
  await completeAssignmentLesson(student.id, assignment.id);
  revalidatePath("/assignments", "layout");
  revalidatePath("/courses", "layout");
  revalidatePath("/dashboard");
  return ok({ status: "SUBMITTED" });
}

// ──────────────────────────── Instructor ───────────────────────────

export async function createAssignmentAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const instructor = await requireRole("INSTRUCTOR");

  const parsed = assignmentInputSchema.safeParse(input);
  if (!parsed.success) return fail("Lütfen alanları kontrol edin.", z.flattenError(parsed.error).fieldErrors);

  const dueDate = new Date(parsed.data.dueDate);
  if (dueDate.getTime() <= Date.now()) return fail("Teslim tarihi gelecekte olmalı.", { dueDate: ["Gelecek bir tarih seçin."] });

  const course = await db.course.findFirst({
    where: { id: parsed.data.courseId, instructorId: instructor.id },
    select: { id: true, enrollments: { select: { studentId: true } } },
  });
  if (!course) return fail("Bu eğitim için ödev tanımlama yetkiniz yok.");

  const assignment = await db.$transaction(async (tx) => {
    const created = await tx.assignment.create({
      data: {
        courseId: course.id,
        title: parsed.data.title,
        description: parsed.data.description,
        dueDate,
        maxScore: parsed.data.maxScore,
        acceptedFileTypes: parsed.data.acceptedFileTypes,
      },
      select: { id: true, title: true },
    });
    await tx.notification.createMany({
      data: course.enrollments.map(({ studentId }) => ({
        userId: studentId,
        type: "ASSIGNMENT_CREATED" as const,
        title: "Yeni ödev",
        body: created.title,
        href: `/assignments/${created.id}`,
      })),
    });
    return created;
  });

  revalidatePath("/instructor/assignments");
  return ok({ id: assignment.id });
}

export async function gradeSubmissionAction(input: unknown): Promise<ActionResult<{ status: SubmissionStatus }>> {
  const instructor = await requireRole("INSTRUCTOR");

  const parsed = gradeInputSchema.safeParse(input);
  if (!parsed.success) return fail("Lütfen alanları kontrol edin.", z.flattenError(parsed.error).fieldErrors);
  const { submissionId, decision, grade, feedback } = parsed.data;

  const submission = await db.submission.findFirst({
    where: { id: submissionId, assignment: { course: { instructorId: instructor.id } } },
    select: { id: true, status: true, studentId: true, assignment: { select: { id: true, title: true, maxScore: true } } },
  });
  if (!submission) return fail("Teslim bulunamadı.");
  if (!canGrade(submission.status)) return fail("Bu teslim için revizyon bekleniyor; öğrenci yeniden yükleyince puanlayabilirsiniz.");
  if (decision === "GRADED" && grade !== null && grade > submission.assignment.maxScore) {
    return fail("Puan, ödevin maksimum puanını aşamaz.", { grade: [`En fazla ${submission.assignment.maxScore}.`] });
  }

  const score = decision === "GRADED" ? grade : null;
  await db.$transaction([
    db.submission.update({
      where: { id: submission.id },
      data: { status: decision, grade: score, feedback, gradedAt: new Date() },
    }),
    // Kept per round so the student sees the whole review history, not just the latest note.
    db.assignmentFeedback.create({
      data: { submissionId: submission.id, reviewerId: instructor.id, decision, score, comment: feedback },
    }),
    db.notification.create({
      data: {
        userId: submission.studentId,
        type: "SUBMISSION_GRADED",
        title: decision === "GRADED" ? "Ödevin değerlendirildi" : "Ödevin için revizyon istendi",
        body: submission.assignment.title,
        href: `/assignments/${submission.assignment.id}`,
      },
    }),
  ]);

  if (decision === "GRADED") after(() => awardBadgesSafely([submission.studentId]));
  revalidatePath(`/instructor/assignments/${submission.assignment.id}`);
  revalidatePath("/instructor/assignments");
  return ok({ status: decision });
}
