import Link from "next/link";
import { CalendarDays, Compass, Radio } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dayKey, formatDayNumber, formatTimeRange, formatWeekday } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { WeekDay } from "../application/program-overview.queries";

/** Monday-Sunday columns with the week's live trainings (teal) and mentoring sessions (magenta). */
export function WeekCalendar({ week }: { week: WeekDay[] }) {
  const today = dayKey(new Date());
  const empty = week.every((d) => d.items.length === 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="size-4 text-muted-foreground" aria-hidden /> Bu hafta
        </CardTitle>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-brand" aria-hidden /> Canlı eğitim
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-magenta" aria-hidden /> Mentorluk
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {empty ? <p className="mb-4 text-sm text-muted-foreground">Bu hafta planlanmış eğitim veya seans yok.</p> : null}
        <ol className="grid gap-2 sm:grid-cols-7">
          {week.map((day) => {
            const isToday = day.key === today;
            return (
              <li key={day.key} className={cn("flex min-h-28 flex-col gap-2 rounded-lg border p-2", isToday ? "border-brand/50 bg-brand/5" : "border-border")}>
                <p className="flex items-baseline gap-1.5">
                  <span className="text-xs text-muted-foreground">{formatWeekday(day.date)}</span>
                  <span className={cn("font-mono text-sm font-semibold tabular-nums", isToday && "text-brand-soft")}>{formatDayNumber(day.date)}</span>
                </p>
                <ul className="flex flex-col gap-1.5">
                  {day.items.map((item) => {
                    const Icon = item.kind === "training" ? Radio : Compass;
                    return (
                      <li key={`${item.kind}-${item.id}`}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex flex-col gap-0.5 rounded-md border-l-2 px-2 py-1.5 text-xs outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
                            item.kind === "training" ? "border-brand bg-brand/5" : "border-magenta bg-magenta/5",
                          )}
                        >
                          <span className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground tabular-nums">
                            <Icon className="size-3" aria-hidden /> {formatTimeRange(item.start, item.end)}
                          </span>
                          <span className="line-clamp-2 font-medium text-pretty">{item.title}</span>
                          <span className="truncate text-muted-foreground">{item.subtitle}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
