import Link from "next/link";
import { Award, CalendarClock, CheckCircle2, CircleDashed, Clock, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { surfaceClass } from "@/components/ui/card";
import { formatDateTime, formatTime } from "@/lib/format";
import { cn, fullName } from "@/lib/utils";
import type { TrainingCard as TrainingCardModel } from "../application/trainings.queries";
import { trainingTiming } from "../domain/trainings";

interface TrainingCardProps {
  training: TrainingCardModel;
  href?: string;
  /** Participant view: Tamamlandı / Tamamlanmadı instead of a percentage. */
  completed?: boolean;
  footer?: React.ReactNode;
}

export function TrainingStatusBadge({ completed, start, durationMinutes }: { completed: boolean; start: Date; durationMinutes: number }) {
  const timing = trainingTiming(start, durationMinutes);
  if (completed) {
    return (
      <Badge variant="success">
        <CheckCircle2 aria-hidden /> Tamamlandı
      </Badge>
    );
  }
  if (timing === "live") {
    return (
      <Badge variant="destructive">
        <Radio aria-hidden /> Şu an canlı
      </Badge>
    );
  }
  return (
    <Badge variant="outline">
      <CircleDashed aria-hidden /> Tamamlanmadı
    </Badge>
  );
}

export function TrainingCard({ training, href, completed, footer }: TrainingCardProps) {
  const end = new Date(training.scheduleDate.getTime() + training.durationMinutes * 60_000);
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="text-base font-semibold tracking-tight text-balance">{training.title}</h3>
          <p className="truncate text-sm text-muted-foreground">{fullName(training.instructor)}</p>
        </div>
        {completed !== undefined ? <TrainingStatusBadge completed={completed} start={training.scheduleDate} durationMinutes={training.durationMinutes} /> : null}
      </div>
      {training.topics.length > 0 ? (
        <ul className="flex flex-col gap-1 text-sm text-foreground/90">
          {training.topics.slice(0, 3).map((topic) => (
            <li key={topic} className="flex gap-2">
              <span className="mt-2 size-1 shrink-0 rounded-full bg-brand" aria-hidden />
              <span className="line-clamp-1">{topic}</span>
            </li>
          ))}
          {training.topics.length > 3 ? <li className="pl-3 text-xs text-subtle">+{training.topics.length - 3} başlık</li> : null}
        </ul>
      ) : null}
      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <CalendarClock className="size-3.5" aria-hidden />
          <time className="font-mono tabular-nums" dateTime={training.scheduleDate.toISOString()}>
            {formatDateTime(training.scheduleDate)} - {formatTime(end)}
          </time>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-3.5" aria-hidden />
          <span className="font-mono tabular-nums">{training.durationMinutes} dk</span>
        </span>
        {training.badge ? (
          <span className="inline-flex items-center gap-1.5 text-magenta">
            <Award className="size-3.5" aria-hidden /> {training.badge.name}
          </span>
        ) : null}
      </div>
      {footer}
    </>
  );

  const className = cn(surfaceClass, "flex h-full flex-col gap-4 p-5");
  return href ? (
    <Link
      href={href}
      className={cn(
        className,
        "outline-none transition-[border-color,background-color] duration-150 hover:border-border-hover hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
    >
      {body}
    </Link>
  ) : (
    <article className={className}>{body}</article>
  );
}
