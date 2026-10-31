export type AttendanceStatus = "PRESENT" | "ABSENT" | "EXCUSED";

export const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: "Katıldı",
  ABSENT: "Katılmadı",
  EXCUSED: "Mazeretli",
};

/** Excused absences are left out of the denominator. Returns null when nothing has been recorded yet. */
export function attendanceRate(statuses: readonly AttendanceStatus[]): number | null {
  const counted = statuses.filter((s) => s !== "EXCUSED");
  if (counted.length === 0) return null;
  return Math.round((counted.filter((s) => s === "PRESENT").length / counted.length) * 100);
}
