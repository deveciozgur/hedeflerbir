import "server-only";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { fullName } from "@/lib/utils";
import { boardColumnOf, type BoardColumn, type SubmissionStatus } from "../domain/submission-status";

export interface StudentAssignmentCard {
  id: string;
  title: string;
  courseTitle: string;
  dueDate: Date;
  maxScore: number;
  status: SubmissionStatus | null;
  grade: number | null;
  column: BoardColumn;
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
      submissions: { where: { studentId }, select: { status: true, grade: true }, take: 1 },
    },
  });

  return rows.map(({ submissions, course, ...assignment }) => {
    const submission = submissions[0] ?? null;
    return {
      ...assignment,
      courseTitle: course.title,
      status: submission?.status ?? null,
      grade: submission?.grade ?? null,
      column: boardColumnOf(submission?.status ?? null),
    };
  });
}

export interface StudentAssignmentDetail {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  maxScore: number;
  courseTitle: string;
  instructorName: string;
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
      title: true,
      description: true,
      dueDate: true,
      maxScore: true,
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
        },
      },
    },
  });
  if (!row) notFound();

  const { course, submissions, ...assignment } = row;
  return {
    ...assignment,
    courseTitle: course.title,
    instructorName: fullName(course.instructor),
    submission: submissions[0] ?? null,
  };
}
