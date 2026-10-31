/**
 * HedeflerBir programme badges: the single source of truth. DB Badge rows are synced from it on demand
 * (they exist only so UserBadge has a foreign key).
 *
 * Earning ("karma" model):
 *  - training badges: marked PRESENT at a live training whose `badgeCode` grants it;
 *  - mentoring badges: the 1st / 2nd / 3rd completed mentoring session (own or the team's);
 *  - an admin can also award any badge by hand.
 */

export interface StudentStats {
  /** Badge codes of live trainings the student attended (PRESENT). */
  attendedBadgeCodes: string[];
  /** Completed mentoring sessions booked for the student or their team. */
  completedMentorSessions: number;
  attendance: { present: number; counted: number };
}

export type BadgeIcon = "globe" | "lightbulb" | "chart" | "sparkles" | "rocket" | "presentation" | "compass";

export interface BadgeDefinition {
  code: string;
  name: string;
  description: string;
  icon: BadgeIcon;
  kind: "training" | "mentoring";
  /** Mentoring badges: completed sessions needed. */
  sessions?: number;
}

export const BADGES: readonly BadgeDefinition[] = [
  { code: "dunyaya_karsi_sorumluluk", name: "Dünyaya Karşı Sorumluluk", description: "Dünyaya Karşı Sorumluluk eğitimine katıl.", icon: "globe", kind: "training" },
  { code: "sosyal_inovasyon", name: "Sosyal İnovasyon", description: "Sosyal İnovasyon eğitimine katıl.", icon: "lightbulb", kind: "training" },
  { code: "sosyal_etki_olcumu", name: "Sosyal Etki Ölçümü", description: "Sosyal Etki Ölçümü eğitimine katıl.", icon: "chart", kind: "training" },
  { code: "uretken_yapay_zeka", name: "Üretken Yapay Zeka", description: "Üretken Yapay Zeka eğitimine katıl.", icon: "sparkles", kind: "training" },
  { code: "girisimcilik", name: "Girişimcilik", description: "Girişimcilik eğitimine katıl.", icon: "rocket", kind: "training" },
  { code: "sunum_teknikleri", name: "Sunum Teknikleri", description: "Sunum Teknikleri eğitimine katıl.", icon: "presentation", kind: "training" },
  { code: "mentorluk_seansi_1", name: "1. Mentorluk Seansı", description: "İlk mentorluk seansını tamamla.", icon: "compass", kind: "mentoring", sessions: 1 },
  { code: "mentorluk_seansi_2", name: "2. Mentorluk Seansı", description: "İkinci mentorluk seansını tamamla.", icon: "compass", kind: "mentoring", sessions: 2 },
  { code: "mentorluk_seansi_3", name: "3. Mentorluk Seansı", description: "Üçüncü mentorluk seansını tamamla.", icon: "compass", kind: "mentoring", sessions: 3 },
];

export const TRAINING_BADGES = BADGES.filter((b) => b.kind === "training");

export const badgeByCode = (code: string | null | undefined) => BADGES.find((b) => b.code === code) ?? null;

export const isBadgeEarned = (badge: BadgeDefinition, stats: StudentStats): boolean =>
  badge.kind === "training" ? stats.attendedBadgeCodes.includes(badge.code) : stats.completedMentorSessions >= (badge.sessions ?? 1);

/** 0-1 for the locked-badge hint (mentoring badges fill per session; training badges are all-or-nothing). */
export const badgeProgress = (badge: BadgeDefinition, stats: StudentStats): number =>
  badge.kind === "training"
    ? Number(stats.attendedBadgeCodes.includes(badge.code))
    : Math.min(1, stats.completedMentorSessions / (badge.sessions ?? 1));

export const earnedBadgeCodes = (stats: StudentStats): string[] => BADGES.filter((b) => isBadgeEarned(b, stats)).map((b) => b.code);

/** Attendance rate from live-training roll calls; excused absences don't count. null before the first roll call. */
export const attendanceRate = (a: StudentStats["attendance"]): number | null => (a.counted ? Math.round((a.present / a.counted) * 100) : null);
