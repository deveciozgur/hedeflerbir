import "server-only";
import { db } from "@/server/db";
import { fullName } from "@/lib/utils";
import { attendanceRate } from "@/modules/learning/domain/attendance";
import {
  activeUsersPerWeek,
  mentoringCompletionRate,
  percentage,
  retentionRate,
  scoreDistribution,
  sumPerWeek,
  trailingWeeks,
  type ActivityEvent,
} from "../domain/analytics";

const WEEKS = 8;
const RETENTION_WINDOW_DAYS = 14;
const DAY = 86_400_000;

const weekLabel = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "numeric", month: "short" });

export interface AdminAnalytics {
  totals: { students: number; instructors: number; mentors: number; courses: number };
  retention: number | null;
  attendance: number | null;
  submissionRate: number | null;
  averageScore: number | null;
  mentoringCompletion: number | null;
  /** Enrollments in lesson-based courses that reached 100% (certificate issued). */
  courseCompletion: number | null;
  watchHoursThisWeek: number;
  weeklyActive: Array<{ label: string; value: number }>;
  /** Hours of video watched per week (LearningActivity). */
  weeklyWatchHours: Array<{ label: string; value: number }>;
  scoreBands: Array<{ label: string; value: number }>;
  mentors: Array<{ id: string; name: string; completed: number; cancelled: number; upcoming: number; completion: number | null }>;
  courses: Array<{
    id: string;
    title: string;
    enrolled: number;
    /** Average lesson completion across enrolled students (lesson-based courses only). */
    lessonCompletion: number | null;
    attendance: number | null;
    submissionRate: number | null;
    averageScore: number | null;
  }>;
}

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  const now = new Date();
  const since = new Date(now.getTime() - WEEKS * 7 * DAY);
  const buckets = trailingWeeks(now, WEEKS);

  const [roleCounts, courseCount, views, submissions, appointments, attendances, mentors, courses, activity, lessonEvents, quizEvents] = await Promise.all([
    db.user.groupBy({ by: ["role"], where: { isActive: true }, _count: { _all: true } }),
    db.course.count(),
    db.lessonView.findMany({ where: { updatedAt: { gt: since }, user: { role: "STUDENT" } }, select: { userId: true, updatedAt: true } }),
    db.submission.findMany({
      select: { studentId: true, submittedAt: true, status: true, grade: true, assignment: { select: { maxScore: true } } },
    }),
    db.appointment.findMany({ where: { createdAt: { gt: since } }, select: { studentId: true, createdAt: true } }),
    db.sessionAttendance.findMany({ select: { studentId: true, status: true, session: { select: { scheduleDate: true } } } }),
    db.user.findMany({
      where: { role: "MENTOR" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        surname: true,
        appointmentsAsMentor: { select: { status: true, slot: { select: { startTime: true, endTime: true } } } },
      },
    }),
    db.course.findMany({
      orderBy: { title: "asc" },
      select: {
        id: true,
        title: true,
        _count: { select: { enrollments: true } },
        enrollments: { select: { status: true } },
        modules: { select: { lessons: { select: { _count: { select: { progress: { where: { isCompleted: true, user: { role: "STUDENT" } } } } } } } } },
        sessions: { select: { attendances: { select: { status: true } } } },
        assignments: {
          select: { dueDate: true, maxScore: true, submissions: { select: { status: true, grade: true } } },
        },
      },
    }),
    db.learningActivity.findMany({ where: { day: { gt: since } }, select: { userId: true, day: true, seconds: true } }),
    db.lessonProgress.findMany({ where: { updatedAt: { gt: since }, user: { role: "STUDENT" } }, select: { userId: true, updatedAt: true } }),
    db.quizAttempt.findMany({ where: { finishedAt: { gt: since } }, select: { userId: true, finishedAt: true } }),
  ]);

  const countOf = (role: string) => roleCounts.find((r) => r.role === role)?._count._all ?? 0;
  const students = countOf("STUDENT");

  const events: ActivityEvent[] = [
    ...views.map((v) => ({ userId: v.userId, at: v.updatedAt })),
    ...submissions.filter((s) => s.submittedAt > since).map((s) => ({ userId: s.studentId, at: s.submittedAt })),
    ...appointments.map((a) => ({ userId: a.studentId, at: a.createdAt })),
    ...attendances
      .filter((a) => a.status === "PRESENT" && a.session.scheduleDate > since)
      .map((a) => ({ userId: a.studentId, at: a.session.scheduleDate })),
    ...activity.map((a) => ({ userId: a.userId, at: a.day })),
    ...lessonEvents.map((l) => ({ userId: l.userId, at: l.updatedAt })),
    ...quizEvents.flatMap((q) => (q.finishedAt ? [{ userId: q.userId, at: q.finishedAt }] : [])),
  ];
  // Activity rows are per calendar day (midnight); shift to noon so a day never falls between two buckets' edges.
  const watchPoints = activity.map((a) => ({ at: new Date(a.day.getTime() + 12 * 3_600_000), value: a.seconds }));
  const weeklyWatchHours = sumPerWeek(watchPoints, buckets).map((seconds) => Math.round((seconds / 3600) * 10) / 10);
  const lessonCourses = courses.filter((c) => c.modules.some((m) => m.lessons.length > 0));
  const lessonEnrollments = lessonCourses.flatMap((c) => c.enrollments);

  const graded = submissions.filter((s) => s.status === "GRADED" && s.grade !== null);
  const gradedPercentages = graded.map((s) => ((s.grade ?? 0) / s.assignment.maxScore) * 100);

  // Submission rate only counts assignments whose deadline has passed.
  const dueSlots = courses.reduce(
    (acc, c) => {
      for (const a of c.assignments) {
        if (a.dueDate > now) continue;
        acc.expected += c._count.enrollments;
        acc.submitted += a.submissions.length;
      }
      return acc;
    },
    { expected: 0, submitted: 0 },
  );

  const mentorRows = mentors.map((m) => {
    const tally = { completed: 0, cancelled: 0, unmarked: 0 };
    let upcoming = 0;
    for (const a of m.appointmentsAsMentor) {
      if (a.status === "COMPLETED") tally.completed++;
      else if (a.status === "CANCELLED") tally.cancelled++;
      else if (a.slot.endTime <= now) tally.unmarked++;
      else upcoming++;
    }
    return { id: m.id, name: fullName(m), ...tally, upcoming, completion: mentoringCompletionRate(tally) };
  });
  const mentoringTotals = mentorRows.reduce(
    (acc, m) => ({ completed: acc.completed + m.completed, cancelled: acc.cancelled + m.cancelled, unmarked: acc.unmarked + m.unmarked }),
    { completed: 0, cancelled: 0, unmarked: 0 },
  );

  const average = (values: number[]) => (values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null);

  return {
    totals: { students, instructors: countOf("INSTRUCTOR"), mentors: countOf("MENTOR"), courses: courseCount },
    retention: retentionRate(events, students, new Date(now.getTime() - RETENTION_WINDOW_DAYS * DAY)),
    attendance: attendanceRate(attendances.map((a) => a.status)),
    submissionRate: percentage(dueSlots.submitted, dueSlots.expected),
    averageScore: average(gradedPercentages),
    mentoringCompletion: mentoringCompletionRate(mentoringTotals),
    courseCompletion: percentage(lessonEnrollments.filter((e) => e.status === "COMPLETED").length, lessonEnrollments.length),
    watchHoursThisWeek: weeklyWatchHours.at(-1) ?? 0,
    weeklyWatchHours: weeklyWatchHours.map((value, i) => ({ label: weekLabel.format(buckets[i]!.end), value })),
    weeklyActive: activeUsersPerWeek(events, buckets).map((value, i) => ({ label: weekLabel.format(buckets[i]!.end), value })),
    scoreBands: scoreDistribution(gradedPercentages),
    mentors: mentorRows.map((m) => ({
      id: m.id,
      name: m.name,
      completed: m.completed,
      cancelled: m.cancelled,
      upcoming: m.upcoming,
      completion: m.completion,
    })),
    courses: courses.map((c) => {
      const pastAssignments = c.assignments.filter((a) => a.dueDate <= now);
      const submittedCount = pastAssignments.reduce((sum, a) => sum + a.submissions.length, 0);
      const courseGraded = c.assignments.flatMap((a) =>
        a.submissions.filter((s) => s.status === "GRADED" && s.grade !== null).map((s) => ((s.grade ?? 0) / a.maxScore) * 100),
      );
      const lessons = c.modules.flatMap((m) => m.lessons);
      const completedLessons = lessons.reduce((sum, l) => sum + l._count.progress, 0);
      return {
        id: c.id,
        title: c.title,
        enrolled: c._count.enrollments,
        lessonCompletion: percentage(completedLessons, lessons.length * c._count.enrollments),
        attendance: attendanceRate(c.sessions.flatMap((s) => s.attendances.map((a) => a.status))),
        submissionRate: percentage(submittedCount, pastAssignments.length * c._count.enrollments),
        averageScore: average(courseGraded),
      };
    }),
  };
}
