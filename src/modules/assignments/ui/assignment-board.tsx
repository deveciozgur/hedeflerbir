import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { StudentAssignmentCard } from "../application/student-assignments.queries";
import { BOARD_COLUMNS } from "../domain/submission-status";
import { DeadlineBadge, SubmissionStatusBadge } from "./status-badges";

function AssignmentCardLink({ item }: { item: StudentAssignmentCard }) {
  return (
    <Link
      href={`/assignments/${item.id}`}
      className="group flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-xs transition-[border-color,box-shadow] outline-none hover:border-foreground/20 hover:shadow-sm focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">{item.courseTitle}</span>
        <span className="text-sm font-medium text-pretty">{item.title}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {item.status === "RETURNED" ? <SubmissionStatusBadge status={item.status} /> : null}
        <DeadlineBadge dueDate={item.dueDate} status={item.status} />
        {item.status === "GRADED" && item.grade !== null ? (
          <span className="text-sm font-semibold tabular-nums">
            {item.grade}
            <span className="font-normal text-muted-foreground">/{item.maxScore}</span>
          </span>
        ) : null}
      </div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <CalendarDays className="size-3.5" aria-hidden />
        <time dateTime={item.dueDate.toISOString()}>{formatDateTime(item.dueDate)}</time>
      </p>
    </Link>
  );
}

export function AssignmentBoard({ items }: { items: StudentAssignmentCard[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {BOARD_COLUMNS.map((column) => {
        const cards = items.filter((item) => item.column === column.id);
        return (
          <section
            key={column.id}
            aria-labelledby={`column-${column.id}`}
            className="flex flex-col gap-3 rounded-xl bg-muted/50 p-3"
          >
            <h2 id={`column-${column.id}`} className="flex items-center justify-between px-1 text-sm font-medium">
              {column.label}
              <span className="rounded-md bg-background px-1.5 py-0.5 text-xs tabular-nums text-muted-foreground shadow-xs">
                {cards.length}
              </span>
            </h2>
            {cards.length === 0 ? (
              <p className={cn("rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground")}>
                {column.empty}
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {cards.map((item) => (
                  <li key={item.id}>
                    <AssignmentCardLink item={item} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
