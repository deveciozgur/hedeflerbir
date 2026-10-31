/**
 * Badge catalog — the single source of truth. DB Badge rows are synced from it on demand
 * (they exist only so UserBadge has a foreign key).
 */

export interface StudentStats {
  submitted: number;
  earlySubmissions: number;
  gradedPercentages: number[];
  attendance: { present: number; counted: number };
  watchedRecordings: number;
  completedMentorSessions: number;
  completedProjects: number;
}

export type BadgeIcon = "upload" | "trophy" | "star" | "calendar" | "play" | "compass" | "flag" | "sunrise";

export interface BadgeDefinition {
  code: string;
  name: string;
  description: string;
  icon: BadgeIcon;
  earned: (s: StudentStats) => boolean;
  /** 0–1, for the locked-badge progress hint. */
  progress: (s: StudentStats) => number;
}

const ratio = (value: number, target: number) => Math.min(1, value / target);
const average = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0);

export const EARLY_SUBMISSION_HOURS = 24;

export const BADGES: readonly BadgeDefinition[] = [
  {
    code: "first_submission",
    name: "İlk Teslim",
    description: "İlk ödevini teslim et.",
    icon: "upload",
    earned: (s) => s.submitted >= 1,
    progress: (s) => ratio(s.submitted, 1),
  },
  {
    code: "early_bird",
    name: "Erkenci",
    description: `3 ödevi teslim tarihinden en az ${EARLY_SUBMISSION_HOURS} saat önce teslim et.`,
    icon: "sunrise",
    earned: (s) => s.earlySubmissions >= 3,
    progress: (s) => ratio(s.earlySubmissions, 3),
  },
  {
    code: "perfect_score",
    name: "Tam Puan",
    description: "Bir ödevden tam puan al.",
    icon: "trophy",
    earned: (s) => s.gradedPercentages.some((p) => p >= 100),
    progress: (s) => ratio(Math.max(0, ...s.gradedPercentages), 100),
  },
  {
    code: "high_achiever",
    name: "Yüksek Başarı",
    description: "En az 3 değerlendirilmiş ödevde %85 ve üzeri ortalama yakala.",
    icon: "star",
    earned: (s) => s.gradedPercentages.length >= 3 && average(s.gradedPercentages) >= 85,
    progress: (s) => Math.min(ratio(s.gradedPercentages.length, 3), ratio(average(s.gradedPercentages), 85)),
  },
  {
    code: "attendance_star",
    name: "Devam Yıldızı",
    description: "En az 4 canlı derste %90 ve üzeri devam oranına ulaş.",
    icon: "calendar",
    earned: (s) => s.attendance.counted >= 4 && s.attendance.present / s.attendance.counted >= 0.9,
    progress: (s) =>
      s.attendance.counted === 0 ? 0 : Math.min(ratio(s.attendance.counted, 4), ratio(s.attendance.present / s.attendance.counted, 0.9)),
  },
  {
    code: "binge_learner",
    name: "Kayıt Kurdu",
    description: "5 ders kaydını sonuna kadar izle.",
    icon: "play",
    earned: (s) => s.watchedRecordings >= 5,
    progress: (s) => ratio(s.watchedRecordings, 5),
  },
  {
    code: "mentored",
    name: "Mentorluk Yolcusu",
    description: "İlk mentorluk seansını tamamla.",
    icon: "compass",
    earned: (s) => s.completedMentorSessions >= 1,
    progress: (s) => ratio(s.completedMentorSessions, 1),
  },
  {
    code: "project_finisher",
    name: "Proje Tamamlayan",
    description: "Bir projeyi %100 tamamla.",
    icon: "flag",
    earned: (s) => s.completedProjects >= 1,
    progress: (s) => ratio(s.completedProjects, 1),
  },
];

export const earnedBadgeCodes = (stats: StudentStats): string[] => BADGES.filter((b) => b.earned(stats)).map((b) => b.code);
