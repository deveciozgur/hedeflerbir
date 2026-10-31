import "server-only";
import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { fullName } from "@/lib/utils";
import { badgeByCode } from "@/modules/engagement/domain/badges";
import type { SubmissionStatus } from "@/modules/assignments/domain/submission-status";
import { parseResources, type SessionResource } from "../domain/resources";
import { parseTopics, trainingCompletion } from "../domain/trainings";

const trainingSelect = {
  id: true,
  title: true,
  description: true,
  topics: true,
  scheduleDate: true,
  durationMinutes: true,
  meetingUrl: true,
  recordingUrl: true,
  badgeCode: true,
  instructor: { select: { id: true, name: true, surname: true, avatarUrl: true } },
  course: { select: { title: true, instructor: { select: { id: true, name: true, surname: true, avatarUrl: true } } } },
} satisfies Prisma.CourseSessionSelect;

type TrainingRow = Prisma.CourseSessionGetPayload<{ select: typeof trainingSelect }>;

export interface TrainingCard {
  id: string;
  title: string;
  programTitle: string;
  topics: string[];
  scheduleDate: Date;
  durationMinutes: number;
  meetingUrl: string | null;
  instructor: { id: string; name: string; surname: string; avatarUrl: string | null };
  badge: { code: string; name: string } | null;
}

const toCard = (row: TrainingRow): TrainingCard => {
  const badge = badgeByCode(row.badgeCode);
  return {
    id: row.id,
    title: row.title,
    programTitle: row.course.title,
    topics: parseTopics(row.topics),
    scheduleDate: row.scheduleDate,
    durationMinutes: row.durationMinutes,
    meetingUrl: row.meetingUrl,
    instructor: row.instructor ?? row.course.instructor,
    badge: badge && { code: badge.code, name: badge.name },
  };
};

/** Trainings of the participant's (non-draft) programmes. */
const enrolledSessions = (studentId: string): Prisma.CourseSessionWhereInput => ({
  course: { status: { not: "DRAFT" }, enrollments: { some: { studentId } } },
});

export interface StudentTrainingCard extends TrainingCard {
  completed: boolean;
  openAssignments: number;
}

export async function getStudentTrainings(studentId: string): Promise<StudentTrainingCard[]> {
  const rows = await db.courseSession.findMany({
    where: enrolledSessions(studentId),
    orderBy: { scheduleDate: "asc" },
    select: {
      ...trainingSelect,
      attendances: { where: { studentId }, select: { status: true } },
      assignments: { select: { submissions: { where: { studentId }, select: { status: true } } } },
    },
  });
  return rows.map(({ attendances, assignments, ...row }) => ({
    ...toCard(row),
    completed: attendances[0]?.status === "PRESENT",
    openAssignments: assignments.filter((a) => !a.submissions[0] || a.submissions[0].status === "RETURNED").length,
  }));
}

/** Dashboard/progress: attended trainings over all programme trainings. */
export async function getTrainingProgress(studentId: string): Promise<{ completed: number; total: number; percent: number }> {
  const [total, completed] = await Promise.all([
    db.courseSession.count({ where: enrolledSessions(studentId) }),
    db.sessionAttendance.count({ where: { studentId, status: "PRESENT", session: enrolledSessions(studentId) } }),
  ]);
  return { completed, total, percent: trainingCompletion(completed, total) };
}

export interface TrainingAssignment {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  maxScore: number;
  acceptedFileTypes: string[];
  submission: { id: string; status: SubmissionStatus; fileName: string | null; submittedAt: Date; grade: number | null; feedback: string | null; gradedAt: Date | null } | null;
}

export interface StudentTrainingDetail extends StudentTrainingCard {
  description: string | null;
  recordingUrl: string | null;
  resources: SessionResource[];
  instructorName: string;
  assignments: TrainingAssignment[];
}

export async function getStudentTraining(studentId: string, sessionId: string): Promise<StudentTrainingDetail> {
  const row = await db.courseSession.findFirst({
    where: { id: sessionId, ...enrolledSessions(studentId) },
    select: {
      ...trainingSelect,
      resources: true,
      attendances: { where: { studentId }, select: { status: true } },
      assignments: {
        orderBy: { dueDate: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          dueDate: true,
          maxScore: true,
          acceptedFileTypes: true,
          submissions: {
            where: { studentId },
            select: { id: true, status: true, fileName: true, submittedAt: true, grade: true, feedback: true, gradedAt: true },
          },
        },
      },
    },
  });
  if (!row) notFound();

  const { attendances, assignments, resources, ...training } = row;
  const card = toCard(training);
  return {
    ...card,
    description: training.description,
    recordingUrl: training.recordingUrl,
    resources: parseResources(resources),
    instructorName: fullName(card.instructor),
    completed: attendances[0]?.status === "PRESENT",
    openAssignments: assignments.filter((a) => !a.submissions[0] || a.submissions[0].status === "RETURNED").length,
    assignments: assignments.map(({ submissions, ...a }) => ({ ...a, submission: submissions[0] ?? null })),
  };
}

/** Admin "Eğitimler": every training across programmes, with attendance counts. */
export interface AdminTrainingCard extends TrainingCard {
  courseId: string;
  instructorId: string | null;
  topicsText: string;
  badgeCode: string | null;
  enrolled: number;
  present: number;
  rollTaken: boolean;
  attendance: Array<{ studentId: string; status: "PRESENT" | "ABSENT" | "EXCUSED" }>;
  roster: Array<{ id: string; name: string; surname: string; avatarUrl: string | null }>;
}

export async function getAdminTrainings(): Promise<AdminTrainingCard[]> {
  const rows = await db.courseSession.findMany({
    where: { course: { status: { not: "DRAFT" } } },
    orderBy: { scheduleDate: "asc" },
    select: {
      ...trainingSelect,
      courseId: true,
      instructorId: true,
      course: {
        select: {
          title: true,
          instructor: { select: { id: true, name: true, surname: true, avatarUrl: true } },
          _count: { select: { enrollments: true } },
          enrollments: {
            where: { student: { isActive: true } },
            orderBy: { student: { name: "asc" } },
            select: { student: { select: { id: true, name: true, surname: true, avatarUrl: true } } },
          },
        },
      },
      attendances: { select: { studentId: true, status: true } },
    },
  });
  return rows.map(({ attendances, courseId, instructorId, ...row }) => ({
    ...toCard(row),
    courseId,
    instructorId,
    topicsText: row.topics ?? "",
    badgeCode: row.badgeCode,
    enrolled: row.course._count.enrollments,
    present: attendances.filter((a) => a.status === "PRESENT").length,
    rollTaken: attendances.length > 0,
    attendance: attendances,
    roster: row.course.enrollments.map((e) => e.student),
  }));
}

/** Programmes a new training can be added to. */
export const listProgramOptions = () =>
  db.course.findMany({ where: { status: { not: "ARCHIVED" } }, orderBy: { title: "asc" }, select: { id: true, title: true } });
