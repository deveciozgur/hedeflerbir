import Link from "next/link";
import { ArrowRight, ClipboardCheck, PlayCircle, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { formatDateTime, formatDuration, formatRelative } from "@/lib/format";
import type { ResumeTarget } from "../application/student-dashboard.queries";

/** One-click "pick up where you left off": the last unfinished recording, else the most pressing assignment. */
export function ResumeCard({ target }: { target: ResumeTarget }) {
  if (!target) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Her şey yolunda"
        description="Yarım kalan kaydın ya da bekleyen ödevin yok."
        className="h-full"
      />
    );
  }

  if (target.kind === "recording") {
    const { item } = target;
    const totalSeconds = item.durationMinutes * 60;
    const pct = totalSeconds > 0 ? Math.round((item.positionSeconds / totalSeconds) * 100) : 0;
    return (
      <Card className="h-full justify-between gap-6 px-6">
        <div className="flex flex-col gap-4">
          <span className="grid size-10 place-items-center rounded-lg border border-brand/30 bg-brand/10 text-brand-soft" aria-hidden>
            <PlayCircle className="size-5" />
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-xs text-subtle">Kaldığın yerden devam et</p>
            <h2 className="text-sm font-semibold text-pretty">{item.sessionTitle}</h2>
            <p className="truncate text-xs text-muted-foreground">{item.courseTitle}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Progress value={pct} aria-label="İzleme ilerlemesi" />
            <p className="font-mono text-xs text-subtle tabular-nums">
              {formatDuration(item.positionSeconds)} / {formatDuration(totalSeconds)}
            </p>
          </div>
        </div>
        <Button asChild className="w-full">
          <Link href={`/courses/${item.courseSlug}?session=${item.sessionId}&t=${item.positionSeconds}`}>
            Devam et <ArrowRight aria-hidden />
          </Link>
        </Button>
      </Card>
    );
  }

  const { item } = target;
  return (
    <Card className="h-full justify-between gap-6 px-6">
      <div className="flex flex-col gap-4">
        <span className="grid size-10 place-items-center rounded-lg border border-border-strong bg-surface-raised text-muted-foreground" aria-hidden>
          <ClipboardCheck className="size-5" />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-xs text-subtle">{item.returned ? "Revizyon bekliyor" : "Sıradaki ödev"}</p>
          <h2 className="text-sm font-semibold text-pretty">{item.title}</h2>
          <p className="truncate text-xs text-muted-foreground">{item.courseTitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <time dateTime={item.dueDate.toISOString()} className="font-mono text-xs text-subtle tabular-nums">
            {formatDateTime(item.dueDate)}
          </time>
          {item.returned ? <Badge variant="warning">Revizyon</Badge> : <Badge variant="outline">{formatRelative(item.dueDate)}</Badge>}
        </div>
      </div>
      <Button asChild className="w-full">
        <Link href={`/assignments/${item.id}`}>
          Ödeve git <ArrowRight aria-hidden />
        </Link>
      </Button>
    </Card>
  );
}
