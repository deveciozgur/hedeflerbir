import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import type { StudentAssignmentCard } from "../application/student-assignments.queries";
import { DeadlineBadge, SubmissionStatusBadge } from "./status-badges";

export function AssignmentList({ items }: { items: StudentAssignmentCard[] }) {
  return (
    <Card className="gap-0 py-0">
      <ul className="divide-y">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={`/assignments/${item.id}`}
              className="flex items-center gap-4 px-5 py-4 transition-colors outline-none hover:bg-accent/60 focus-visible:bg-accent"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate text-sm font-medium">{item.title}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {item.courseTitle} · <time dateTime={item.dueDate.toISOString()}>{formatDateTime(item.dueDate)}</time>
                </span>
              </div>
              <div className="hidden shrink-0 items-center gap-2 sm:flex">
                <DeadlineBadge dueDate={item.dueDate} status={item.status} />
                <SubmissionStatusBadge status={item.status} />
              </div>
              {item.status === "GRADED" && item.grade !== null ? (
                <span className="w-16 shrink-0 text-right text-sm font-semibold tabular-nums">
                  {item.grade}
                  <span className="font-normal text-muted-foreground">/{item.maxScore}</span>
                </span>
              ) : null}
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
