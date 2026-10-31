"use server";

import { db } from "@/server/db";
import { requireRole } from "@/server/auth/guards";
import { fullName } from "@/lib/utils";

export type SearchGroup = "Eğitimler" | "Dersler" | "Ödevler" | "Mentorlar" | "Eğitmenler" | "Kullanıcılar";

export interface SearchResult {
  id: string;
  group: SearchGroup;
  title: string;
  subtitle: string | null;
  href: string;
}

const PER_GROUP = 5;
const like = (q: string) => ({ contains: q, mode: "insensitive" as const });

/** Command-palette search, scoped to what the signed-in role may open. */
export async function searchAction(rawQuery: unknown): Promise<SearchResult[]> {
  const user = await requireRole("STUDENT", "INSTRUCTOR", "MENTOR", "ADMIN");
  const q = typeof rawQuery === "string" ? rawQuery.trim().slice(0, 80) : "";
  if (q.length < 2) return [];

  switch (user.role) {
    case "STUDENT": {
      const enrolled = { enrollments: { some: { studentId: user.id } }, status: { not: "DRAFT" as const } };
      const [trainings, assignments, mentors, instructors] = await Promise.all([
        db.courseSession.findMany({
          where: { course: enrolled, OR: [{ title: like(q) }, { topics: like(q) }] },
          orderBy: { scheduleDate: "asc" },
          take: PER_GROUP,
          select: { id: true, title: true, course: { select: { title: true } } },
        }),
        db.assignment.findMany({
          where: { title: like(q), course: enrolled },
          take: PER_GROUP,
          select: { id: true, title: true, sessionId: true, session: { select: { title: true } }, course: { select: { title: true } } },
        }),
        db.user.findMany({
          where: { role: "MENTOR", isActive: true, OR: [{ name: like(q) }, { surname: like(q) }, { profile: { expertiseArea: like(q) } }] },
          take: PER_GROUP,
          select: { id: true, name: true, surname: true, profile: { select: { title: true } } },
        }),
        db.user.findMany({
          where: { role: "INSTRUCTOR", isActive: true, OR: [{ name: like(q) }, { surname: like(q) }] },
          take: PER_GROUP,
          select: { id: true, name: true, surname: true, profile: { select: { title: true } } },
        }),
      ]);
      return [
        ...trainings.map((t) => ({ id: t.id, group: "Eğitimler" as const, title: t.title, subtitle: t.course.title, href: `/trainings/${t.id}` })),
        ...assignments.map((a) => ({
          id: a.id,
          group: "Ödevler" as const,
          title: a.title,
          subtitle: a.session?.title ?? a.course.title,
          href: a.sessionId ? `/trainings/${a.sessionId}` : `/assignments/${a.id}`,
        })),
        ...mentors.map((m) => ({ id: m.id, group: "Mentorlar" as const, title: fullName(m), subtitle: m.profile?.title ?? null, href: `/mentors/${m.id}` })),
        ...instructors.map((i) => ({ id: i.id, group: "Eğitmenler" as const, title: fullName(i), subtitle: i.profile?.title ?? null, href: `/instructors/${i.id}` })),
      ];
    }
    case "INSTRUCTOR": {
      const own = { instructorId: user.id };
      const [courses, lessons, assignments] = await Promise.all([
        db.course.findMany({ where: { ...own, title: like(q) }, take: PER_GROUP, select: { id: true, title: true } }),
        db.lesson.findMany({
          where: { title: like(q), module: { course: own } },
          take: PER_GROUP,
          select: { id: true, title: true, module: { select: { course: { select: { id: true, title: true } } } } },
        }),
        db.assignment.findMany({ where: { title: like(q), course: own }, take: PER_GROUP, select: { id: true, title: true, course: { select: { title: true } } } }),
      ]);
      return [
        ...courses.map((c) => ({ id: c.id, group: "Eğitimler" as const, title: c.title, subtitle: null, href: `/instructor/courses/${c.id}` })),
        ...lessons.map((l) => ({ id: l.id, group: "Dersler" as const, title: l.title, subtitle: l.module.course.title, href: `/instructor/courses/${l.module.course.id}` })),
        ...assignments.map((a) => ({ id: a.id, group: "Ödevler" as const, title: a.title, subtitle: a.course.title, href: `/instructor/assignments/${a.id}` })),
      ];
    }
    case "ADMIN": {
      const [users, courses] = await Promise.all([
        db.user.findMany({
          where: { OR: [{ name: like(q) }, { surname: like(q) }, { email: like(q) }] },
          take: PER_GROUP,
          select: { id: true, name: true, surname: true, email: true },
        }),
        db.course.findMany({ where: { title: like(q) }, take: PER_GROUP, select: { id: true, title: true } }),
      ]);
      return [
        ...users.map((u) => ({ id: u.id, group: "Kullanıcılar" as const, title: fullName(u), subtitle: u.email, href: `/admin/users?q=${encodeURIComponent(u.email)}` })),
        ...courses.map((c) => ({ id: c.id, group: "Eğitimler" as const, title: c.title, subtitle: null, href: `/admin/courses/${c.id}` })),
      ];
    }
    default:
      return [];
  }
}
