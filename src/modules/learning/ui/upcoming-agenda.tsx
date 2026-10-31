import Link from "next/link";
import { CalendarCheck, CalendarClock, ClipboardCheck, Radio, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AGENDA_KIND_LABELS, isUrgent, type AgendaItem, type AgendaKind } from "../domain/agenda";

const KIND_ICONS: Record<AgendaKind, LucideIcon> = {
  session: Radio,
  assignment: ClipboardCheck,
  appointment: CalendarClock,
};

export function UpcomingAgenda({ items }: { items: AgendaItem[] }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Yaklaşan takvim</CardTitle>
          <CardDescription>Önümüzdeki 14 gün</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="Takvimin boş"
            description="Yaklaşan ders, teslim veya mentor seansın bulunmuyor."
            className="py-8"
          />
        ) : (
          <ol className="-mx-2 flex flex-col">
            {items.map((item) => {
              const Icon = KIND_ICONS[item.kind];
              const urgent = isUrgent(item);
              return (
                <li key={`${item.kind}-${item.id}`}>
                  <Link
                    href={item.href}
                    className="flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <span
                      className={cn(
                        "mt-0.5 grid size-8 shrink-0 place-items-center rounded-md border bg-background",
                        urgent && "border-warning/40 text-warning",
                      )}
                      aria-hidden
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-sm font-medium">{item.title}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {AGENDA_KIND_LABELS[item.kind]} · {item.context}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <time dateTime={item.date.toISOString()} className="text-xs tabular-nums text-muted-foreground">
                        {formatDateTime(item.date)}
                      </time>
                      {urgent ? <Badge variant="warning">{formatRelative(item.date)}</Badge> : null}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
