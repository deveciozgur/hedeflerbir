import "server-only";
import { db } from "@/server/db";
import { fullName } from "@/lib/utils";
import { APPOINTMENT_STATUS_LABELS } from "@/modules/mentoring/domain/appointment-policy";
import { attendanceRate } from "@/modules/learning/domain/attendance";
import { percentage } from "../domain/analytics";
import { DATASETS, type DatasetId, type ExportFilters, type ExportTable } from "../domain/export-datasets";

type Rows = ExportTable["rows"];

const PROJECT_STATUS_LABELS = { NOT_STARTED: "Başlamadı", IN_PROGRESS: "Devam ediyor", COMPLETED: "Tamamlandı" } as const;

const average = (values: number[]) => (values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null);

const dateRange = (f: ExportFilters) =>
  f.from || f.until ? { ...(f.from ? { gte: f.from } : {}), ...(f.until ? { lt: f.until } : {}) } : undefined;

async function participantRows(f: ExportFilters): Promise<Rows> {
  const inCourse = f.courseId ? { courseId: f.courseId } : {};
  const sessionScope = f.courseId ? { session: { courseId: f.courseId } } : {};
  const assignmentScope = f.courseId ? { assignment: { courseId: f.courseId } } : {};

  const students = await db.user.findMany({
    where: { role: "STUDENT", ...(f.courseId ? { enrollments: { some: inCourse } } : {}) },
    orderBy: [{ name: "asc" }, { surname: "asc" }],
    select: {
      name: true,
      surname: true,
      email: true,
      enrollments: { where: inCourse, select: { course: { select: { title: true } } } },
      attendances: { where: sessionScope, select: { status: true } },
      lessonViews: { where: { completed: true, ...sessionScope }, select: { sessionId: true } },
      submissions: { where: assignmentScope, select: { status: true, grade: true, assignment: { select: { maxScore: true } } } },
      projectProgress: { select: { completionPercentage: true } },
      appointmentsAsStudent: { where: { status: "COMPLETED" }, select: { id: true } },
    },
  });

  return students.map((s) => ({
    name: fullName(s),
    email: s.email,
    courses: s.enrollments.map((e) => e.course.title).join(", "),
    attendanceRate: attendanceRate(s.attendances.map((a) => a.status)),
    watched: s.lessonViews.length,
    submitted: s.submissions.length,
    averageScore: average(
      s.submissions.filter((x) => x.status === "GRADED" && x.grade !== null).map((x) => ((x.grade ?? 0) / x.assignment.maxScore) * 100),
    ),
    projectProgress: average(s.projectProgress.map((p) => p.completionPercentage)),
    mentorSessions: s.appointmentsAsStudent.length,
  }));
}

async function assignmentRows(f: ExportFilters): Promise<Rows> {
  const assignments = await db.assignment.findMany({
    where: { ...(f.courseId ? { courseId: f.courseId } : {}), ...(dateRange(f) ? { dueDate: dateRange(f) } : {}) },
    orderBy: [{ course: { title: "asc" } }, { dueDate: "asc" }],
    select: {
      title: true,
      dueDate: true,
      maxScore: true,
      course: { select: { title: true, _count: { select: { enrollments: true } } } },
      submissions: { select: { status: true, grade: true } },
    },
  });

  return assignments.map((a) => {
    const graded = a.submissions.filter((s) => s.status === "GRADED" && s.grade !== null);
    return {
      course: a.course.title,
      title: a.title,
      dueDate: a.dueDate,
      enrolled: a.course._count.enrollments,
      submitted: a.submissions.length,
      submissionRate: percentage(a.submissions.length, a.course._count.enrollments),
      graded: graded.length,
      returned: a.submissions.filter((s) => s.status === "RETURNED").length,
      averageScore: average(graded.map((s) => ((s.grade ?? 0) / a.maxScore) * 100)),
    };
  });
}

async function attendanceRows(f: ExportFilters): Promise<Rows> {
  const now = new Date();
  const range = dateRange(f);
  const sessions = await db.courseSession.findMany({
    where: {
      ...(f.courseId ? { courseId: f.courseId } : {}),
      scheduleDate: { lte: now, ...(range ?? {}) },
    },
    orderBy: [{ scheduleDate: "asc" }],
    select: { title: true, scheduleDate: true, course: { select: { title: true } }, attendances: { select: { status: true } } },
  });

  return sessions.map((s) => {
    const count = (status: string) => s.attendances.filter((a) => a.status === status).length;
    return {
      course: s.course.title,
      session: s.title,
      date: s.scheduleDate,
      present: count("PRESENT"),
      absent: count("ABSENT"),
      excused: count("EXCUSED"),
      rate: attendanceRate(s.attendances.map((a) => a.status)),
    };
  });
}

async function projectRows(f: ExportFilters): Promise<Rows> {
  const rows = await db.studentProjectProgress.findMany({
    where: f.courseId ? { student: { enrollments: { some: { courseId: f.courseId } } } } : {},
    orderBy: [{ project: { title: "asc" } }, { student: { name: "asc" } }],
    select: {
      completionPercentage: true,
      status: true,
      project: { select: { title: true, endDate: true } },
      student: { select: { name: true, surname: true, email: true } },
    },
  });

  return rows.map((r) => ({
    project: r.project.title,
    name: fullName(r.student),
    email: r.student.email,
    progress: r.completionPercentage,
    status: PROJECT_STATUS_LABELS[r.status],
    endDate: r.project.endDate,
  }));
}

async function mentoringRows(f: ExportFilters): Promise<Rows> {
  const range = dateRange(f);
  const appointments = await db.appointment.findMany({
    where: {
      ...(range ? { slot: { startTime: range } } : {}),
      ...(f.courseId ? { student: { enrollments: { some: { courseId: f.courseId } } } } : {}),
    },
    orderBy: { slot: { startTime: "desc" } },
    select: {
      status: true,
      slot: { select: { startTime: true, endTime: true } },
      mentor: { select: { name: true, surname: true } },
      student: { select: { name: true, surname: true } },
    },
  });

  return appointments.map((a) => ({
    mentor: fullName(a.mentor),
    student: fullName(a.student),
    start: a.slot.startTime,
    duration: Math.round((a.slot.endTime.getTime() - a.slot.startTime.getTime()) / 60_000),
    status: APPOINTMENT_STATUS_LABELS[a.status],
  }));
}

const BUILDERS: Record<DatasetId, (f: ExportFilters) => Promise<Rows>> = {
  participants: participantRows,
  assignments: assignmentRows,
  attendance: attendanceRows,
  projects: projectRows,
  mentoring: mentoringRows,
};

const dayFormatter = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "numeric", month: "long", year: "numeric" });

export async function buildExportTable(dataset: DatasetId, filters: ExportFilters): Promise<ExportTable> {
  const definition = DATASETS[dataset];
  const [rows, course] = await Promise.all([
    BUILDERS[dataset](filters),
    filters.courseId ? db.course.findUnique({ where: { id: filters.courseId }, select: { title: true } }) : null,
  ]);

  const scope = [
    course ? `Eğitim: ${course.title}` : "Tüm eğitimler",
    definition.usesDateRange && filters.from ? `Başlangıç: ${dayFormatter.format(filters.from)}` : null,
    definition.usesDateRange && filters.until ? `Bitiş: ${dayFormatter.format(new Date(filters.until.getTime() - 1))}` : null,
    `${rows.length} kayıt`,
  ].filter(Boolean);

  return { title: definition.label, subtitle: scope.join(" · "), columns: definition.columns, rows };
}
