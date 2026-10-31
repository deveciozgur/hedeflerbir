import "server-only";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { fullName } from "@/lib/utils";
import { boardColumnOf, type BoardColumn, type SubmissionStatus } from "../domain/submission-status";

export interface StudentAssignmentCard {
  id: string;
  title: string;
  /** The live training the assignment belongs to, or the programme title for standalone ones. */
  courseTitle: string;
  dueDate: Date;
  maxScore: number;
  status: SubmissionStatus | null;
  grade: number | null;
  column: BoardColumn;
  /** Training assignments are submitted on the training page; the to-do list only links there. */
  href: string;
}

const enrolledBy = (studentId: string) => ({ course: { enrollments: { some: { studentId } } } });

export async function getStudentAssignments(studentId: string): Promise<StudentAssignmentCard[]> {
  const rows = await db.assignment.findMany({
    where: enrolledBy(studentId),
    orderBy: { dueDate: "asc" },
    select: {
      id: true,
      title: true,
      dueDate: true,
      maxScore: true,
      course: { select: { title: true } },
      session: { select: { id: true, title: true } },
      submissions: { where: { studentId }, select: { status: true, grade: true }, take: 1 },
    },
  });

  return rows.map(({ submissions, course, session, ...assignment }) => {
    const submission = submissions[0] ?? null;
    return {
      ...assignment,
      courseTitle: session?.title ?? course.title,
      href: session ? `/trainings/${session.id}` : `/assignments/${assignment.id}`,
      status: submission?.status ?? null,
      grade: submission?.grade ?? null,
      column: boardColumnOf(submission?.status ?? null),
    };
  });
}

export interface StudentAssignmentDetail {
  id: string;
  sessionId: string | null;
  title: string;
  description: string;
  dueDate: Date;
  maxScore: number;
  acceptedFileTypes: string[];
  courseTitle: string;
  instructorName: string;
  /** Every review round, newest first (Submission.feedback mirrors the latest). */
  reviews: Array<{ id: string; decision: "GRADED" | "RETURNED"; score: number | null; comment: string; reviewerName: string | null; createdAt: Date }>;
  submission: {
    id: string;
    status: SubmissionStatus;
    fileName: string | null;
    note: string | null;
    grade: number | null;
    feedback: string | null;
    submittedAt: Date;
    gradedAt: Date | null;
  } | null;
}

export async function getStudentAssignmentDetail(studentId: string, assignmentId: string): Promise<StudentAssignmentDetail> {
  const row = await db.assignment.findFirst({
    where: { id: assignmentId, ...enrolledBy(studentId) },
    select: {
      id: true,
      sessionId: true,
      title: true,
      description: true,
      dueDate: true,
      maxScore: true,
      acceptedFileTypes: true,
      course: { select: { title: true, instructor: { select: { name: true, surname: true } } } },
      submissions: {
        where: { studentId },
        take: 1,
        select: {
          id: true,
          status: true,
          fileName: true,
          note: true,
          grade: true,
          feedback: true,
          submittedAt: true,
          gradedAt: true,
          reviews: {
            orderBy: { createdAt: "desc" },
            select: { id: true, decision: true, score: true, comment: true, createdAt: true, reviewer: { select: { name: true, surname: true } } },
          },
        },
      },
    },
  });
  if (!row) notFound();

  const { course, submissions, ...assignment } = row;
  const latest = submissions[0] ?? null;
  return {
    ...assignment,
    courseTitle: course.title,
    instructorName: fullName(course.instructor),
    reviews: (latest?.reviews ?? []).map(({ reviewer, decision, ...review }) => ({
      ...review,
      decision: decision === "RETURNED" ? ("RETURNED" as const) : ("GRADED" as const),
      reviewerName: reviewer ? fullName(reviewer) : null,
    })),
    submission: latest && {
      id: latest.id,
      status: latest.status,
      fileName: latest.fileName,
      note: latest.note,
      grade: latest.grade,
      feedback: latest.feedback,
      submittedAt: latest.submittedAt,
      gradedAt: latest.gradedAt,
    },
  };
}
