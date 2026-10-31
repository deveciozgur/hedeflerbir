import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Award, CalendarClock, Clapperboard, Clock, ClipboardCheck, Video } from "lucide-react";
import { AddToCalendar } from "@/components/ui/add-to-calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatDateTime, formatTime } from "@/lib/format";
import { canSubmit } from "@/modules/assignments/domain/submission-status";
import { FeedbackCard } from "@/modules/assignments/ui/feedback-card";
import { DeadlineBadge } from "@/modules/assignments/ui/status-badges";
import { SubmissionPanel } from "@/modules/assignments/ui/submission-panel";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { getStudentTraining } from "@/modules/learning/application/trainings.queries";
import { sessionCalendarEvent, sessionIcsHref } from "@/modules/learning/domain/calendar-event";
import { trainingTiming } from "@/modules/learning/domain/trainings";
import { ResourceList } from "@/modules/learning/ui/resource-list";
import { TrainingStatusBadge } from "@/modules/learning/ui/training-card";

export const metadata: Metadata = { title: "Eğitim" };

export default async function TrainingDetailPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const [{ sessionId }, viewer] = await Promise.all([params, getViewer("STUDENT")]);
  const training = await getStudentTraining(viewer.id, sessionId);
  const timing = trainingTiming(training.scheduleDate, training.durationMinutes);
  const end = new Date(training.scheduleDate.getTime() + training.durationMinutes * 60_000);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Link
          href="/trainings"
          className="inline-flex w-fit items-center gap-1.5 rounded-md text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <ArrowLeft className="size-4" aria-hidden /> Eğitimler
        </Link>
        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <TrainingStatusBadge completed={training.completed} start={training.scheduleDate} durationMinutes={training.durationMinutes} />
            {training.badge ? (
              <Badge variant="outline" className="border-magenta/30 text-magenta">
                <Award aria-hidden /> {training.badge.name} rozeti
              </Badge>
            ) : null}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">{training.title}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <UserAvatar user={training.instructor} className="size-6" /> {training.instructorName}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock className="size-4" aria-hidden />
              <time className="font-mono tabular-nums" dateTime={training.scheduleDate.toISOString()}>
                {formatDateTime(training.scheduleDate)} - {formatTime(end)}
              </time>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4" aria-hidden /> <span className="font-mono tabular-nums">{training.durationMinutes} dk</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {training.meetingUrl && timing !== "past" ? (
              <Button asChild variant={timing === "live" ? "brand" : "outline"}>
                <a href={training.meetingUrl} target="_blank" rel="noopener noreferrer">
                  <Video aria-hidden /> {timing === "live" ? "Canlı derse katıl" : "Canlı ders bağlantısı"}
                </a>
              </Button>
            ) : null}
            {timing === "upcoming" ? (
              <AddToCalendar
                size="default"
                event={sessionCalendarEvent({ ...training, courseTitle: training.programTitle })}
                icsHref={sessionIcsHref(training.id)}
              />
            ) : null}
            {training.recordingUrl ? (
              <Button asChild variant="outline">
                <a href={training.recordingUrl} target="_blank" rel="noopener noreferrer">
                  <Clapperboard aria-hidden /> Ders kaydı
                </a>
              </Button>
            ) : null}
          </div>
        </header>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Konu başlıkları</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {training.topics.length > 0 ? (
                <ol className="flex flex-col gap-2 text-sm">
                  {training.topics.map((topic, index) => (
                    <li key={topic} className="flex gap-3">
                      <span className="font-mono text-xs text-subtle tabular-nums">{String(index + 1).padStart(2, "0")}</span>
                      {topic}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted-foreground">Konu başlıkları henüz eklenmedi.</p>
              )}
              {training.description ? <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">{training.description}</p> : null}
            </CardContent>
          </Card>
          {training.resources.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Kaynaklar</CardTitle>
              </CardHeader>
              <CardContent>
                <ResourceList resources={training.resources} />
              </CardContent>
            </Card>
          ) : null}
        </div>

        <section aria-labelledby="training-assignments" className="flex flex-col gap-4">
          <h2 id="training-assignments" className="text-sm font-semibold">
            Ödevler ve dosya teslimi
          </h2>
          {training.assignments.length === 0 ? (
            <EmptyState icon={ClipboardCheck} title="Bu eğitimin ödevi yok" description="Eğitmen ödev eklediğinde dosyanı buradan iletebileceksin." className="py-8" />
          ) : (
            training.assignments.map((assignment) => {
              const status = assignment.submission?.status ?? null;
              return (
                <article key={assignment.id} className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-semibold">{assignment.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      Son teslim <span className="font-mono tabular-nums">{formatDateTime(assignment.dueDate)}</span> · {assignment.maxScore} puan
                    </p>
                    <DeadlineBadge dueDate={assignment.dueDate} status={status} />
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">{assignment.description}</p>
                  </div>
                  {assignment.submission && (assignment.submission.status === "GRADED" || assignment.submission.status === "RETURNED") ? (
                    <FeedbackCard
                      instructorName={training.instructorName}
                      status={assignment.submission.status}
                      grade={assignment.submission.grade}
                      maxScore={assignment.maxScore}
                      feedback={assignment.submission.feedback}
                      gradedAt={assignment.submission.gradedAt}
                    />
                  ) : null}
                  <SubmissionPanel
                    assignmentId={assignment.id}
                    submission={assignment.submission}
                    eligibility={canSubmit(assignment, status)}
                    acceptedFileTypes={assignment.acceptedFileTypes}
                  />
                </article>
              );
            })
          )}
        </section>
      </div>
    </div>
  );
}
