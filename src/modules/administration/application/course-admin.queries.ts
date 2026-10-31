import "server-only";
import { notFound } from "next/navigation";
import { db } from "@/server/db";

export interface PersonOption {
  id: string;
  name: string;
  surname: string;
  email: string;
  avatarUrl: string | null;
}

const personSelect = { id: true, name: true, surname: true, email: true, avatarUrl: true } as const;

export function listInstructors(): Promise<PersonOption[]> {
  return db.user.findMany({ where: { role: "INSTRUCTOR", isActive: true }, orderBy: { name: "asc" }, select: personSelect });
}

export interface AdminCourseRow {
  id: string;
  slug: string;
  title: string;
  instructor: PersonOption;
  enrolled: number;
  sessions: number;
  assignments: number;
}

export async function listCoursesForAdmin(): Promise<AdminCourseRow[]> {
  const courses = await db.course.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      instructor: { select: personSelect },
      _count: { select: { enrollments: true, sessions: true, assignments: true } },
    },
  });
  return courses.map(({ _count, ...c }) => ({ ...c, enrolled: _count.enrollments, sessions: _count.sessions, assignments: _count.assignments }));
}

export interface AdminCourseDetail {
  id: string;
  slug: string;
  title: string;
  description: string;
  instructorId: string;
  enrolled: Array<PersonOption & { enrolledAt: Date }>;
  candidates: PersonOption[];
  instructors: PersonOption[];
}

export async function getCourseForAdmin(courseId: string): Promise<AdminCourseDetail> {
  const [course, instructors] = await Promise.all([
    db.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        instructorId: true,
        enrollments: { orderBy: { student: { name: "asc" } }, select: { enrolledAt: true, student: { select: personSelect } } },
      },
    }),
    listInstructors(),
  ]);
  if (!course) notFound();

  const candidates = await db.user.findMany({
    where: { role: "STUDENT", isActive: true, enrollments: { none: { courseId } } },
    orderBy: { name: "asc" },
    take: 500,
    select: personSelect,
  });

  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description,
    instructorId: course.instructorId,
    enrolled: course.enrollments.map((e) => ({ ...e.student, enrolledAt: e.enrolledAt })),
    candidates,
    instructors,
  };
}
