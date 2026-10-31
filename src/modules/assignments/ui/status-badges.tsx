import { AlarmClock, CheckCircle2, CircleDashed, RotateCcw, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatRelative } from "@/lib/format";
import { deadlineState, SUBMISSION_STATUS_LABELS, type SubmissionStatus } from "../domain/submission-status";

export function DeadlineBadge({ dueDate, status }: { dueDate: Date; status: SubmissionStatus | null }) {
  if (status === "SUBMITTED" || status === "GRADED") return null;
  const state = deadlineState(dueDate);
  if (state === "open") return null;
  return (
    <Badge variant={state === "overdue" ? "destructive" : "warning"}>
      <AlarmClock aria-hidden />
      {state === "overdue" ? "Süresi doldu" : formatRelative(dueDate)}
    </Badge>
  );
}

const STATUS_VARIANT = { SUBMITTED: "brand", GRADED: "success", RETURNED: "warning" } as const;
const STATUS_ICON = { SUBMITTED: Upload, GRADED: CheckCircle2, RETURNED: RotateCcw } as const;

export function SubmissionStatusBadge({ status }: { status: SubmissionStatus | null }) {
  if (!status) {
    return (
      <Badge variant="outline">
        <CircleDashed aria-hidden /> Teslim edilmedi
      </Badge>
    );
  }
  const Icon = STATUS_ICON[status];
  return (
    <Badge variant={STATUS_VARIANT[status]}>
      <Icon aria-hidden /> {SUBMISSION_STATUS_LABELS[status]}
    </Badge>
  );
}
