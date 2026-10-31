import "server-only";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { parseSocialLinks } from "@/modules/identity/domain/profile";

export interface InstructorCardModel {
  id: string;
  name: string;
  surname: string;
  avatarUrl: string | null;
  title: string | null;
  expertiseArea: string | null;
  courseCount: number;
}

/** Directory payload: the full profile per instructor, so a card opens its modal without a round-trip. */
export async function listInstructorsForStudents(studentId: string): Promise<InstructorDetail[]> {
  const instructors = await db.user.findMany({
    where: { role: "INSTRUCTOR", isActive: true },
    orderBy: [{ name: "asc" }, { surname: "asc" }],
    select: instructorSelect(studentId),
  });
  return instructors.map(toDetail);
}

export interface InstructorDetail extends InstructorCardModel {
  email: string;
  bio: string | null;
  socialLinks: ReturnType<typeof parseSocialLinks>;
  courses: Array<{ id: string; slug: string; title: string; description: string; sessionCount: number; enrolled: boolean }>;
}

const instructorSelect = (studentId: string) =>
  ({
    id: true,
    name: true,
    surname: true,
    email: true,
    avatarUrl: true,
    profile: { select: { title: true, expertiseArea: true, bio: true, socialLinks: true } },
    taughtCourses: {
      orderBy: { title: "asc" },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        _count: { select: { sessions: true } },
        enrollments: { where: { studentId }, select: { studentId: true } },
      },
    },
  }) as const;

type InstructorRow = {
  id: string;
  name: string;
  surname: string;
  email: string;
  avatarUrl: string | null;
  profile: { title: string | null; expertiseArea: string | null; bio: string | null; socialLinks: unknown } | null;
  taughtCourses: Array<{
    id: string;
    slug: string;
    title: string;
    description: string;
    _count: { sessions: number };
    enrollments: Array<{ studentId: string }>;
  }>;
};

function toDetail(instructor: InstructorRow): InstructorDetail {
  return {
    id: instructor.id,
    name: instructor.name,
    surname: instructor.surname,
    email: instructor.email,
    avatarUrl: instructor.avatarUrl,
    title: instructor.profile?.title ?? null,
    expertiseArea: instructor.profile?.expertiseArea ?? null,
    bio: instructor.profile?.bio ?? null,
    socialLinks: parseSocialLinks(instructor.profile?.socialLinks),
    courseCount: instructor.taughtCourses.length,
    courses: instructor.taughtCourses.map((c) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      description: c.description,
      sessionCount: c._count.sessions,
      enrolled: c.enrollments.length > 0,
    })),
  };
}

/** `enrolled` tells the UI whether the viewing student can open the course page. */
export async function getInstructorForStudent(instructorId: string, studentId: string): Promise<InstructorDetail> {
  const instructor = await db.user.findFirst({
    where: { id: instructorId, role: "INSTRUCTOR", isActive: true },
    select: instructorSelect(studentId),
  });
  if (!instructor) notFound();
  return toDetail(instructor);
}
