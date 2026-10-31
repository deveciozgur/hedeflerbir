import { CalendarClock, Clapperboard, Radio, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatRelative, formatTime } from "@/lib/format";
import type { CurriculumSession } from "../application/student-courses.queries";
import { SESSION_STATE_LABELS, sessionEnd } from "../domain/curriculum";
import { parseRecordingSource } from "../domain/recording";
import { RecordingPlayer } from "./recording-player";

function StagePanel({ icon: Icon, children }: { icon: typeof Video; children: React.ReactNode }) {
  return (
    <div className="flex aspect-video flex-col items-center justify-center gap-4 rounded-xl border bg-muted/40 p-6 text-center">
      <span className="grid size-12 place-items-center rounded-full border bg-background shadow-xs" aria-hidden>
        <Icon className="size-5 text-muted-foreground" />
      </span>
      {children}
    </div>
  );
}

/** The main area of the course page: player, live-class card, or "recording on its way". */
export function SessionStage({ session, startAt }: { session: CurriculumSession; startAt: number }) {
  const end = sessionEnd(session);

  if (session.state === "upcoming" || session.state === "live") {
    const live = session.state === "live";
    return (
      <StagePanel icon={live ? Radio : CalendarClock}>
        <div className="flex flex-col items-center gap-2">
          <Badge variant={live ? "destructive" : "brand"}>{live ? "Canlı" : formatRelative(session.scheduleDate)}</Badge>
          <p className="text-sm font-medium">
            <time dateTime={session.scheduleDate.toISOString()}>{formatDateTime(session.scheduleDate)}</time> - {formatTime(end)}
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {live ? "Ders şu an devam ediyor." : "Canlı ders bağlantısı ders saatinde aktif olur. Kayıt, dersten sonra burada yayınlanır."}
          </p>
        </div>
        {session.meetingUrl ? (
          <Button asChild variant={live ? "brand" : "outline"}>
            <a href={session.meetingUrl} target="_blank" rel="noopener noreferrer">
              <Video aria-hidden /> {live ? "Derse katıl" : "Ders bağlantısı"}
            </a>
          </Button>
        ) : null}
      </StagePanel>
    );
  }

  const source = parseRecordingSource(session.recordingUrl, startAt);
  if (!source) {
    return (
      <StagePanel icon={Clapperboard}>
        <p className="text-sm font-medium">{SESSION_STATE_LABELS.awaitingRecording}</p>
        <p className="max-w-sm text-sm text-muted-foreground">Eğitmen kaydı yüklediğinde bildirim alacaksın.</p>
      </StagePanel>
    );
  }

  return (
    <RecordingPlayer
      key={session.id}
      sessionId={session.id}
      title={session.title}
      source={source}
      startAt={startAt}
      alreadyWatched={session.state === "watched"}
    />
  );
}
