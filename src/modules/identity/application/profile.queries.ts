import "server-only";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { getBadgeShowcase } from "@/modules/engagement/application/badges.service";
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
  department: string;
  city: string;
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
      profile: { select: { bio: true, goals: true, department: true, city: true, title: true, expertiseArea: true, meetingUrl: true, socialLinks: true } },
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
    department: profile?.department ?? "",
    city: profile?.city ?? "",
    title: profile?.title ?? "",
    expertiseArea: profile?.expertiseArea ?? "",
    meetingUrl: profile?.meetingUrl ?? "",
    socialLinks: links,
  };
}

export type StudentProfileOverview = Awaited<ReturnType<typeof getBadgeShowcase>>;

/** Profile page: the 9 programme badges plus attendance stats from live-training roll calls. */
export const getStudentProfileOverview = (studentId: string): Promise<StudentProfileOverview> => getBadgeShowcase(studentId);
