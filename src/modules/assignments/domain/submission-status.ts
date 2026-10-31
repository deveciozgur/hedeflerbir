/**
 * Assignment lifecycle rules. Framework-free — mirrors Prisma's SubmissionStatus as a string union.
 *
 *   (none) ──submit──▶ SUBMITTED ──grade──▶ GRADED
 *                         ▲   └──return──▶ RETURNED ──resubmit──┘
 */

export type SubmissionStatus = "SUBMITTED" | "GRADED" | "RETURNED";

export type BoardColumn = "pending" | "submitted" | "graded";

export const BOARD_COLUMNS: ReadonlyArray<{ id: BoardColumn; label: string; empty: string }> = [
  { id: "pending", label: "Bekleyenler", empty: "Teslim bekleyen ödevin yok." },
  { id: "submitted", label: "Teslim Edilenler", empty: "Değerlendirme bekleyen teslimin yok." },
  { id: "graded", label: "Değerlendirilenler", empty: "Henüz değerlendirilen ödevin yok." },
];

/** A returned submission needs the student's action again, so it lives in "pending". */
export function boardColumnOf(status: SubmissionStatus | null): BoardColumn {
  if (status === "GRADED") return "graded";
  if (status === "SUBMITTED") return "submitted";
  return "pending";
}

export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  SUBMITTED: "Teslim edildi",
  GRADED: "Değerlendirildi",
  RETURNED: "Revizyon istendi",
};

export type DeadlineState = "overdue" | "dueSoon" | "open";

const DUE_SOON_MS = 48 * 60 * 60 * 1000;

export function deadlineState(dueDate: Date, now: Date = new Date()): DeadlineState {
  const remaining = dueDate.getTime() - now.getTime();
  if (remaining < 0) return "overdue";
  if (remaining <= DUE_SOON_MS) return "dueSoon";
  return "open";
}

export type SubmitEligibility = { allowed: true } | { allowed: false; reason: string };

export function canSubmit(
  assignment: { dueDate: Date },
  status: SubmissionStatus | null,
  now: Date = new Date(),
): SubmitEligibility {
  if (status === "GRADED") return { allowed: false, reason: "Değerlendirilmiş bir ödev yeniden teslim edilemez." };
  // A revision request reopens the assignment regardless of the original deadline.
  if (status === "RETURNED") return { allowed: true };
  if (deadlineState(assignment.dueDate, now) === "overdue") return { allowed: false, reason: "Teslim süresi doldu." };
  return { allowed: true };
}

/** Instructors may grade fresh submissions and re-grade graded ones; returned work awaits the student. */
export const canGrade = (status: SubmissionStatus): boolean => status !== "RETURNED";

export const scorePercentage = (grade: number, maxScore: number): number =>
  maxScore > 0 ? Math.round((grade / maxScore) * 100) : 0;
