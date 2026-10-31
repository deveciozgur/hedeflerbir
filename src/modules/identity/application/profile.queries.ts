import "server-only";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { BADGES, type BadgeIcon, type StudentStats } from "@/modules/engagement/domain/badges";
import { computeStudentStats } from "@/modules/engagement/application/badges.service";
import { overallCompletion } from "@/modules/learning/domain/progress";
import { parseSocialLinks, SOCIAL_NETWORKS, type SocialNetwork } from "../domain/profile";
import type { Role } from "../domain/role";

export interface OwnProfile {
  id: string;
  name: string;
  surname: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
  createdAt: Date;
  bio: string;
  goals: string;
  title: string;
  expertiseArea: string;
  meetingUrl: string;
  socialLinks: Record<SocialNetwork, string>;
}

export async function getOwnProfile(userId: string): Promise<OwnProfile> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      surname: true,
      email: true,
      role: true,
      avatarUrl: true,
      createdAt: true,
      profile: { select: { bio: true, goals: true, title: true, expertiseArea: true, meetingUrl: true, socialLinks: true } },
    },
  });
  if (!user) notFound();

  const links = Object.fromEntries(SOCIAL_NETWORKS.map((n) => [n, ""])) as Record<SocialNetwork, string>;
  for (const link of parseSocialLinks(user.profile?.socialLinks)) links[link.network] = link.url;

  const { profile, ...rest } = user;
  return {
    ...rest,
    bio: profile?.bio ?? "",
    goals: profile?.goals ?? "",
    title: profile?.title ?? "",
    expertiseArea: profile?.expertiseArea ?? "",
    meetingUrl: profile?.meetingUrl ?? "",
    socialLinks: links,
  };
}

export interface BadgeView {
  code: string;
  name: string;
  description: string;
  icon: BadgeIcon;
  awardedAt: Date | null;
  progress: number;
}

export interface StudentProfileOverview {
  overall: number;
  projects: Array<{ id: string; title: string; description: string; completionPercentage: number; status: string; startDate: Date; endDate: Date }>;
  badges: BadgeView[];
  stats: StudentStats;
}

export async function getStudentProfileOverview(studentId: string): Promise<StudentProfileOverview> {
  const [progress, awarded, stats] = await Promise.all([
    db.studentProjectProgress.findMany({
      where: { studentId },
      orderBy: { project: { endDate: "asc" } },
      select: {
        completionPercentage: true,
        status: true,
        project: { select: { id: true, title: true, description: true, startDate: true, endDate: true } },
      },
    }),
    db.userBadge.findMany({ where: { userId: studentId }, select: { awardedAt: true, badge: { select: { code: true } } } }),
    computeStudentStats(studentId),
  ]);

  const awardedAt = new Map(awarded.map((b) => [b.badge.code, b.awardedAt]));
  const projects = progress.map((p) => ({ ...p.project, completionPercentage: p.completionPercentage, status: p.status }));

  return {
    overall: overallCompletion(projects.map((p) => ({ projectId: p.id, title: p.title, endDate: p.endDate, completionPercentage: p.completionPercentage }))),
    projects,
    // Earned first (newest first), then locked by closest-to-earning.
    badges: BADGES.map((b) => ({
      code: b.code,
      name: b.name,
      description: b.description,
      icon: b.icon,
      awardedAt: awardedAt.get(b.code) ?? null,
      progress: awardedAt.has(b.code) ? 1 : b.progress(stats),
    })).sort((a, b) =>
      a.awardedAt && b.awardedAt
        ? b.awardedAt.getTime() - a.awardedAt.getTime()
        : a.awardedAt
          ? -1
          : b.awardedAt
            ? 1
            : b.progress - a.progress,
    ),
    stats,
  };
}
