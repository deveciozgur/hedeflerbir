import "server-only";
import { db } from "@/server/db";

export interface AnnouncementSummary {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  publishedAt: Date;
}

export interface StudentDashboard {
  firstName: string;
  hasTeam: boolean;
  announcements: AnnouncementSummary[];
}

/** Hero greeting and announcements; trainings, badges, assignments and sessions come from their own queries. */
export async function getStudentDashboard(studentId: string): Promise<StudentDashboard> {
  const [student, announcements] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: studentId }, select: { name: true, teamId: true } }),
    db.announcement.findMany({
      // Platform-wide announcements plus those of the student's own courses.
      where: { OR: [{ courseId: null }, { course: { enrollments: { some: { studentId } } } }] },
      orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
      take: 3,
      select: { id: true, title: true, content: true, pinned: true, publishedAt: true },
    }),
  ]);

  return { firstName: student.name, hasTeam: student.teamId !== null, announcements };
}
