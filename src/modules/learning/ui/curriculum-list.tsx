import Link from "next/link";
import { CheckCircle2, CircleDashed, CirclePlay, Clapperboard, Radio, CalendarClock, type LucideIcon } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CurriculumSession } from "../application/student-courses.queries";
import { SESSION_STATE_LABELS, type SessionState } from "../domain/curriculum";

const STATE_ICON: Record<SessionState, { icon: LucideIcon; className: string }> = {
  upcoming: { icon: CalendarClock, className: "text-muted-foreground" },
  live: { icon: Radio, className: "text-destructive" },
  awaitingRecording: { icon: Clapperboard, className: "text-muted-foreground" },
  available: { icon: CircleDashed, className: "text-muted-foreground" },
  inProgress: { icon: CirclePlay, className: "text-brand" },
  watched: { icon: CheckCircle2, className: "text-success" },
};

export function CurriculumList({ slug, sessions, activeId }: { slug: string; sessions: CurriculumSession[]; activeId: string }) {
  return (
    <nav aria-label="Müfredat">
      <ol className="flex flex-col gap-0.5">
        {sessions.map((session) => {
          const { icon: Icon, className } = STATE_ICON[session.state];
          const active = session.id === activeId;
          const query = new URLSearchParams({ session: session.id });
          if (session.state === "inProgress") query.set("t", String(session.positionSeconds));
          return (
            <li key={session.id}>
              <Link
                href={`/courses/${slug}?${query.toString()}`}
                scroll={false}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  active ? "bg-accent" : "hover:bg-accent/50",
                )}
              >
                <Icon className={cn("mt-0.5 size-4 shrink-0", className)} aria-hidden />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-sm font-medium text-pretty">
                    <span className="text-muted-foreground tabular-nums">{session.order}.</span> {session.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {SESSION_STATE_LABELS[session.state]} · {formatDateTime(session.scheduleDate)}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
