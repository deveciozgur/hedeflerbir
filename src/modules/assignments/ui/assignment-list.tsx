import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import type { StudentAssignmentCard } from "../application/student-assignments.queries";
import { DeadlineBadge, SubmissionStatusBadge } from "./status-badges";

export function AssignmentList({ items }: { items: StudentAssignmentCard[] }) {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <ul className="divide-y divide-border">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="group flex items-center gap-4 px-6 py-4 transition-colors duration-150 outline-none hover:bg-accent/70 focus-visible:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate text-sm font-medium">{item.title}</span>
                <span className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                  <span className="truncate">{item.courseTitle}</span>
                  <time dateTime={item.dueDate.toISOString()} className="shrink-0 font-mono text-subtle tabular-nums">
                    {formatDateTime(item.dueDate)}
                  </time>
                </span>
              </div>
              <div className="hidden shrink-0 items-center gap-2 sm:flex">
                <DeadlineBadge dueDate={item.dueDate} status={item.status} />
                <SubmissionStatusBadge status={item.status} />
              </div>
              {item.status === "GRADED" && item.grade !== null ? (
                <span className="w-16 shrink-0 text-right font-mono text-sm font-semibold tabular-nums">
                  {item.grade}
                  <span className="font-normal text-subtle">/{item.maxScore}</span>
                </span>
              ) : null}
              <ChevronRight
                className="size-4 shrink-0 text-subtle transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-foreground"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
