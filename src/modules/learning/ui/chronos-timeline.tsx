import Link from "next/link";
import { CalendarCheck, CalendarClock, ClipboardCheck, Radio, type LucideIcon } from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { dayKey, formatTime, formatTimeRange, relativeDayLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  AGENDA_KIND_LABELS,
  AGENDA_STATUS_LABELS,
  agendaStatus,
  groupAgendaByDay,
  type AgendaItem,
  type AgendaKind,
  type AgendaStatus,
} from "../domain/agenda";

const KIND_ICONS: Record<AgendaKind, LucideIcon> = {
  session: Radio,
  assignment: ClipboardCheck,
  appointment: CalendarClock,
};

/** One color per meaning: indigo = live now, amber = deadline pressure, emerald = confirmed. */
const STATUS_BADGE: Record<AgendaStatus, BadgeProps["variant"]> = {
  live: "brand",
  scheduled: "outline",
  dueSoon: "warning",
  due: "outline",
  confirmed: "success",
};

function timeOf(item: AgendaItem) {
  if (item.kind === "assignment") return `Son ${formatTime(item.date)}`;
  return item.endsAt ? formatTimeRange(item.date, item.endsAt) : formatTime(item.date);
}

/** "Chronos": live sessions, deadlines and mentor sessions on one vertical, day-grouped timeline. */
export function ChronosTimeline({ items }: { items: AgendaItem[] }) {
  const now = new Date();
  const days = groupAgendaByDay(items, dayKey);

  return (
    <Card className="h-full">
      <CardHeader>
        <div>
          <CardTitle>Zaman akışı</CardTitle>
          <CardDescription>Önümüzdeki 14 gün</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {days.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="Takvimin boş"
            description="Yaklaşan ders, teslim veya mentor seansın bulunmuyor."
            className="py-8"
          />
        ) : (
          <div className="flex flex-col gap-6">
            {days.map((day) => (
              <section key={day.key} aria-labelledby={`chronos-${day.key}`} className="flex flex-col gap-2">
                <h3 id={`chronos-${day.key}`} className="text-xs font-medium text-subtle">
                  {relativeDayLabel(day.date, now)}
                </h3>
                <ol className="relative flex flex-col">
                  {day.items.map((item, index) => {
                    const Icon = KIND_ICONS[item.kind];
                    const status = agendaStatus(item, now);
                    const last = index === day.items.length - 1;
                    return (
                      <li key={`${item.kind}-${item.id}`} className="relative grid grid-cols-[32px_1fr] gap-3">
                        {/* Rail: node + connector to the next entry of the same day */}
                        <div className="relative flex justify-center" aria-hidden>
                          {!last ? <span className="absolute top-9 bottom-0 w-px bg-border" /> : null}
                          <span
                            className={cn(
                              "relative mt-2 grid size-8 place-items-center rounded-full border bg-zinc-950",
                              status === "live" && "border-brand/50 text-brand-soft",
                              status === "dueSoon" && "border-amber-500/40 text-amber-400",
                              status === "confirmed" && "border-emerald-500/40 text-emerald-400",
                              (status === "scheduled" || status === "due") && "border-border-strong text-muted-foreground",
                            )}
                          >
                            <Icon className="size-4" />
                          </span>
                        </div>
                        <Link
                          href={item.href}
                          className="group -mr-2 mb-2 flex min-w-0 flex-col gap-2 rounded-lg px-2 py-2 transition-colors duration-150 outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        >
                          <span className="flex min-w-0 flex-col gap-1">
                            <span className="line-clamp-2 text-sm font-medium text-pretty">{item.title}</span>
                            <span className="truncate text-xs text-muted-foreground">
                              {AGENDA_KIND_LABELS[item.kind]}, {item.context}
                            </span>
                          </span>
                          <span className="flex flex-wrap items-center gap-2">
                            <time dateTime={item.date.toISOString()} className="font-mono text-xs text-subtle tabular-nums">
                              {timeOf(item)}
                            </time>
                            <Badge variant={STATUS_BADGE[status]}>{AGENDA_STATUS_LABELS[status]}</Badge>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </section>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
