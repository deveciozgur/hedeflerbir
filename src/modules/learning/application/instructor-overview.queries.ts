import "server-only";
import { db } from "@/server/db";
import { attendanceRate } from "../domain/attendance";
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

export interface InstructorStudentRow {
  id: string;
  name: string;
  surname: string;
  email: string;
  avatarUrl: string | null;
  goals: string | null;
  courses: string[];
  attendanceRate: number | null;
  watched: number;
  submitted: number;
  averageScore: number | null;
  projectProgress: number | null;
}

/** Every student enrolled in one of the instructor's courses, with metrics scoped to those courses. */
export async function getInstructorStudents(instructorId: string): Promise<InstructorStudentRow[]> {
  const inMyCourses = { course: { instructorId } };
  const students = await db.user.findMany({
    where: { role: "STUDENT", enrollments: { some: inMyCourses } },
    orderBy: [{ name: "asc" }, { surname: "asc" }],
    select: {
      id: true,
      name: true,
      surname: true,
      email: true,
      avatarUrl: true,
      profile: { select: { goals: true } },
      enrollments: { where: inMyCourses, select: { course: { select: { title: true } } } },
      attendances: { where: { session: inMyCourses }, select: { status: true } },
      lessonViews: { where: { completed: true, session: inMyCourses }, select: { sessionId: true } },
      submissions: {
        where: { assignment: inMyCourses },
        select: { status: true, grade: true, assignment: { select: { maxScore: true } } },
      },
      projectProgress: { select: { completionPercentage: true } },
    },
  });

  const average = (values: number[]) => (values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null);

  return students.map((s) => ({
    id: s.id,
    name: s.name,
    surname: s.surname,
    email: s.email,
    avatarUrl: s.avatarUrl,
    goals: s.profile?.goals ?? null,
    courses: s.enrollments.map((e) => e.course.title),
    attendanceRate: attendanceRate(s.attendances.map((a) => a.status)),
    watched: s.lessonViews.length,
    submitted: s.submissions.length,
    averageScore: average(
      s.submissions.filter((x) => x.status === "GRADED" && x.grade !== null).map((x) => ((x.grade ?? 0) / x.assignment.maxScore) * 100),
    ),
    projectProgress: average(s.projectProgress.map((p) => p.completionPercentage)),
  }));
}
