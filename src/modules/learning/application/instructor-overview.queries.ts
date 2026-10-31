import "server-only";
import { db } from "@/server/db";
import { getInstructorCourseSummaries, type InstructorCourseSummary } from "./instructor-courses.queries";

export interface InstructorOverview {
  courses: InstructorCourseSummary[];
  studentCount: number;
  awaitingReview: Array<{ id: string; assignmentId: string; assignmentTitle: string; studentName: string; submittedAt: Date }>;
  awaitingReviewTotal: number;
  upcomingSessions: Array<{ id: string; courseId: string; courseTitle: string; title: string; scheduleDate: Date }>;
}

export async function getInstructorOverview(instructorId: string): Promise<InstructorOverview> {
  const owned = { course: { instructorId } };
  const [courses, students, awaiting, awaitingTotal, sessions] = await Promise.all([
    getInstructorCourseSummaries(instructorId),
    db.enrollment.findMany({ where: owned, distinct: ["studentId"], select: { studentId: true } }),
    db.submission.findMany({
      where: { status: "SUBMITTED", assignment: owned },
      orderBy: { submittedAt: "asc" },
      take: 5,
      select: {
        id: true,
        submittedAt: true,
        assignment: { select: { id: true, title: true } },
        student: { select: { name: true, surname: true } },
      },
    }),
    db.submission.count({ where: { status: "SUBMITTED", assignment: owned } }),
    db.courseSession.findMany({
      where: { ...owned, scheduleDate: { gt: new Date() } },
      orderBy: { scheduleDate: "asc" },
      take: 3,
      select: { id: true, title: true, scheduleDate: true, course: { select: { id: true, title: true } } },
    }),
  ]);

  return {
    courses,
    studentCount: students.length,
    awaitingReviewTotal: awaitingTotal,
    awaitingReview: awaiting.map((s) => ({
      id: s.id,
      assignmentId: s.assignment.id,
      assignmentTitle: s.assignment.title,
      studentName: `${s.student.name} ${s.student.surname}`,
      submittedAt: s.submittedAt,
    })),
    upcomingSessions: sessions.map((s) => ({ id: s.id, courseId: s.course.id, courseTitle: s.course.title, title: s.title, scheduleDate: s.scheduleDate })),
  };
}
