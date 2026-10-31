import Link from "next/link";
import { PlayCircle, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { formatDuration } from "@/lib/format";
import type { ContinueWatching as ContinueWatchingModel } from "../application/student-dashboard.queries";

export function ContinueWatching({ item }: { item: ContinueWatchingModel | null }) {
  if (!item) {
    return (
      <EmptyState
        icon={Video}
        title="İzlemeye devam edecek kayıt yok"
        description="Bir ders kaydı izlemeye başladığında kaldığın yerden buradan devam edebilirsin."
      />
    );
  }

  const totalSeconds = item.durationMinutes * 60;
  const pct = totalSeconds > 0 ? Math.round((item.positionSeconds / totalSeconds) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <div className="min-w-0">
          <CardTitle>Kaldığın yerden devam et</CardTitle>
          <CardDescription className="truncate">{item.courseTitle}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm font-medium text-pretty">{item.sessionTitle}</p>
        <div className="flex flex-col gap-2">
          <Progress value={pct} aria-label="İzleme ilerlemesi" />
          <p className="text-xs text-muted-foreground">
            {formatDuration(item.positionSeconds)} / {formatDuration(totalSeconds)}
          </p>
        </div>
        <Button asChild variant="brand" className="w-full sm:w-fit">
          <Link href={`/courses/${item.courseSlug}?session=${item.sessionId}&t=${item.positionSeconds}`}>
            <PlayCircle aria-hidden /> Devam et
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
