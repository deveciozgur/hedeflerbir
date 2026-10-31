import { clamp } from "@/lib/utils";

export interface ProjectProgressSnapshot {
  projectId: string;
  title: string;
  completionPercentage: number;
  endDate: Date;
}

/** Unweighted mean across all projects a student participates in. */
export function overallCompletion(projects: readonly ProjectProgressSnapshot[]): number {
  if (projects.length === 0) return 0;
  const total = projects.reduce((sum, p) => sum + clamp(p.completionPercentage), 0);
  return Math.round(total / projects.length);
}

export type ProgressTone = "starting" | "onTrack" | "almostThere" | "done";

export function progressTone(percentage: number): ProgressTone {
  if (percentage >= 100) return "done";
  if (percentage >= 75) return "almostThere";
  if (percentage >= 25) return "onTrack";
  return "starting";
}

export const PROGRESS_MESSAGES: Record<ProgressTone, string> = {
  starting: "Harika bir başlangıç. İlk adımlar en değerlileri.",
  onTrack: "İstikrarlı ilerliyorsun, böyle devam.",
  almostThere: "Bitiş çizgisi görünüyor!",
  done: "Tebrikler, tüm projelerini tamamladın.",
};
