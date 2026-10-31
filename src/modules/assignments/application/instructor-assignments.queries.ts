import "server-only";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import type { SubmissionStatus } from "../domain/submission-status";

export interface InstructorCourseOption {
  id: string;
  title: string;
}

export function getInstructorCourses(instructorId: string): Promise<InstructorCourseOption[]> {
  return db.course.findMany({ where: { instructorId }, select: { id: true, title: true }, orderBy: { title: "asc" } });
}

export interface InstructorAssignmentRow {
  id: string;
  title: string;
  courseTitle: string;
  dueDate: Date;
  maxScore: number;
  enrolled: number;
  submitted: number;
  awaitingReview: number;
  graded: number;
}

export async function getInstructorAssignments(instructorId: string): Promise<InstructorAssignmentRow[]> {
  const ownedBy = { course: { instructorId } };
  const [assignments, counts] = await Promise.all([
    db.assignment.findMany({
      where: ownedBy,
      orderBy: { dueDate: "desc" },
      select: {
        id: true,
        title: true,
        dueDate: true,
        maxScore: true,
        course: { select: { title: true, _count: { select: { enrollments: true } } } },
      },
    }),
    db.submission.groupBy({ by: ["assignmentId", "status"], where: { assignment: ownedBy }, _count: { _all: true } }),
  ]);

  const countOf = (assignmentId: string, status: SubmissionStatus) =>
    counts.find((c) => c.assignmentId === assignmentId && c.status === status)?._count._all ?? 0;

  return assignments.map((a) => {
    const awaitingReview = countOf(a.id, "SUBMITTED");
    const graded = countOf(a.id, "GRADED");
    return {
      id: a.id,
      title: a.title,
      courseTitle: a.course.title,
      dueDate: a.dueDate,
      maxScore: a.maxScore,
      enrolled: a.course._count.enrollments,
      submitted: awaitingReview + graded + countOf(a.id, "RETURNED"),
      awaitingReview,
      graded,
    };
  });
}

export interface RosterEntry {
  student: { id: string; name: string; surname: string; avatarUrl: string | null };
  submission: {
    id: string;
    status: SubmissionStatus;
    fileName: string | null;
    note: string | null;
    grade: number | null;
    feedback: string | null;
    submittedAt: Date;
  } | null;
}

export interface GradingWorkspace {
  id: string;
  title: string;
  description: string;
  courseTitle: string;
  dueDate: Date;
  maxScore: number;
  roster: RosterEntry[];
}

/** Review queue order: awaiting review → returned → graded → not submitted. */
const REVIEW_PRIORITY: Record<SubmissionStatus | "NONE", number> = { SUBMITTED: 0, RETURNED: 1, GRADED: 2, NONE: 3 };

export async function getGradingWorkspace(instructorId: string, assignmentId: string): Promise<GradingWorkspace> {
  const row = await db.assignment.findFirst({
    where: { id: assignmentId, course: { instructorId } },
    select: {
      id: true,
      title: true,
      description: true,
      dueDate: true,
      maxScore: true,
      course: {
        select: {
          title: true,
          enrollments: {
            select: { student: { select: { id: true, name: true, surname: true, avatarUrl: true } } },
          },
        },
      },
      submissions: {
        select: {
          id: true,
          studentId: true,
          status: true,
          fileName: true,
          note: true,
          grade: true,
          feedback: true,
          submittedAt: true,
        },
      },
    },
  });
  if (!row) notFound();

  const byStudent = new Map(row.submissions.map(({ studentId, ...submission }) => [studentId, submission]));
  const roster = row.course.enrollments
    .map(({ student }) => ({ student, submission: byStudent.get(student.id) ?? null }))
    .sort(
      (a, b) =>
        REVIEW_PRIORITY[a.submission?.status ?? "NONE"] - REVIEW_PRIORITY[b.submission?.status ?? "NONE"] ||
        a.student.name.localeCompare(b.student.name, "tr"),
    );

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    courseTitle: row.course.title,
    dueDate: row.dueDate,
    maxScore: row.maxScore,
    roster,
  };
}
