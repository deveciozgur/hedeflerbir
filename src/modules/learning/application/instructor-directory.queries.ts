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

export async function listInstructorsForStudents(): Promise<InstructorCardModel[]> {
  const instructors = await db.user.findMany({
    where: { role: "INSTRUCTOR", isActive: true },
    orderBy: [{ name: "asc" }, { surname: "asc" }],
    select: {
      id: true,
      name: true,
      surname: true,
      avatarUrl: true,
      profile: { select: { title: true, expertiseArea: true } },
      _count: { select: { taughtCourses: true } },
    },
  });
  return instructors.map((i) => ({
    id: i.id,
    name: i.name,
    surname: i.surname,
    avatarUrl: i.avatarUrl,
    title: i.profile?.title ?? null,
    expertiseArea: i.profile?.expertiseArea ?? null,
    courseCount: i._count.taughtCourses,
  }));
}

export interface InstructorDetail extends InstructorCardModel {
  email: string;
  bio: string | null;
  socialLinks: ReturnType<typeof parseSocialLinks>;
  courses: Array<{ id: string; slug: string; title: string; description: string; sessionCount: number; enrolled: boolean }>;
}

/** `enrolled` tells the UI whether the viewing student can open the course page. */
export async function getInstructorForStudent(instructorId: string, studentId: string): Promise<InstructorDetail> {
  const instructor = await db.user.findFirst({
    where: { id: instructorId, role: "INSTRUCTOR", isActive: true },
    select: {
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
    },
  });
  if (!instructor) notFound();

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
