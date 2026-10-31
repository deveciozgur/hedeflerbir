import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarClock, ClipboardCheck, Clock, FileQuestion } from "lucide-react";
import { AddToCalendar } from "@/components/ui/add-to-calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, surfaceClass } from "@/components/ui/card";
import { Markdown } from "@/components/ui/markdown";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { QuizRunner } from "@/modules/assessment/ui/quiz-runner";
import { DeadlineBadge, SubmissionStatusBadge } from "@/modules/assignments/ui/status-badges";
import type { ActiveLesson, CoursePlayer } from "../application/course-player.queries";
import { sessionCalendarEvent, sessionIcsHref } from "../domain/calendar-event";
import { COMPLETION_RULE, LESSON_TYPE_LABELS } from "../domain/lessons";
import { parseRecordingSource } from "../domain/recording";
import { LessonVideo } from "./lesson-video";
import { LESSON_TYPE_ICON } from "./lesson-type-icon";
import { MarkCompleteButton } from "./mark-complete-button";
import { ResourceList } from "./resource-list";
import { SessionStage } from "./session-stage";

const lessonHref = (slug: string, id: string) => `/courses/${slug}?lesson=${id}`;

function Placeholder({ icon: Icon, title, children }: { icon: typeof Clock; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-xl border bg-muted/40 p-6 text-center">
      <Icon className="size-6 text-muted-foreground" aria-hidden />
      <p className="text-sm font-medium">{title}</p>
      {children}
    </div>
  );
}

function AssignmentPanel({ assignment }: { assignment: NonNullable<ActiveLesson["assignment"]> }) {
  const status = assignment.submission?.status ?? null;
  return (
    <div className={cn(surfaceClass, "flex flex-col gap-5 p-6")}>
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl border bg-surface-raised" aria-hidden>
          <ClipboardCheck className="size-5 text-muted-foreground" />
        </span>
        <div className="flex min-w-0 flex-col gap-1.5">
          <h2 className="text-base font-semibold">{assignment.title}</h2>
          <p className="text-sm text-muted-foreground">
            Son teslim <time className="font-mono tabular-nums" dateTime={assignment.dueDate.toISOString()}>{formatDateTime(assignment.dueDate)}</time> · {assignment.maxScore} puan
          </p>
          <div className="flex flex-wrap gap-2">
            <SubmissionStatusBadge status={status} />
            <DeadlineBadge dueDate={assignment.dueDate} status={status} />
            {assignment.submission?.grade != null ? (
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                Puan {assignment.submission.grade}/{assignment.maxScore}
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <Button asChild className="self-start">
        <Link href={`/assignments/${assignment.id}`}>{status ? "Teslimi görüntüle" : "Ödevi teslim et"}</Link>
      </Button>
    </div>
  );
}

function MainArea({ course, lesson }: { course: CoursePlayer; lesson: ActiveLesson }) {
  switch (lesson.type) {
    case "VIDEO": {
      const source = parseRecordingSource(lesson.videoUrl, lesson.lastWatchedSecond);
      if (!source) return <Placeholder icon={Clock} title="Video henüz eklenmedi" />;
      return (
        <LessonVideo
          lessonId={lesson.id}
          title={lesson.title}
          source={source}
          startAt={lesson.lastWatchedSecond}
          isCompleted={lesson.isCompleted}
          next={course.next && { href: lessonHref(course.slug, course.next.id), title: course.next.title }}
        />
      );
    }
    case "ARTICLE":
      return lesson.content ? (
        <article className={cn(surfaceClass, "p-6 sm:p-8")}>
          <Markdown>{lesson.content}</Markdown>
        </article>
      ) : (
        <Placeholder icon={Clock} title="İçerik henüz eklenmedi" />
      );
    case "QUIZ":
      return lesson.quiz ? <QuizRunner key={lesson.id} quiz={lesson.quiz} /> : <Placeholder icon={FileQuestion} title="Quiz henüz hazırlanmadı" />;
    case "ASSIGNMENT":
      return lesson.assignment ? <AssignmentPanel assignment={lesson.assignment} /> : <Placeholder icon={ClipboardCheck} title="Ödev henüz bağlanmadı" />;
    case "LIVE_SESSION":
      return lesson.session ? (
        <SessionStage session={lesson.session} startAt={lesson.session.positionSeconds} />
      ) : (
        <Placeholder icon={CalendarClock} title="Canlı ders henüz planlanmadı" />
      );
  }
}

export function LessonStage({ course, lesson }: { course: CoursePlayer; lesson: ActiveLesson }) {
  const TypeIcon = LESSON_TYPE_ICON[lesson.type];
  const rule = COMPLETION_RULE[lesson.type];
  const manualCompletion = rule === "manual" || (rule === "watch" && parseRecordingSource(lesson.videoUrl)?.kind !== "file");
  const upcomingSession = lesson.session && (lesson.session.state === "upcoming" || lesson.session.state === "live") ? lesson.session : null;

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <TypeIcon className="size-3.5" aria-hidden />
          {LESSON_TYPE_LABELS[lesson.type]}
          {lesson.durationMinutes ? <span className="font-mono tabular-nums">· {lesson.durationMinutes} dk</span> : null}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-balance">{lesson.title}</h2>
          {upcomingSession ? (
            <AddToCalendar
              event={sessionCalendarEvent({ ...upcomingSession, courseTitle: course.title })}
              icsHref={sessionIcsHref(upcomingSession.id)}
            />
          ) : null}
        </div>
      </header>

      <MainArea course={course} lesson={lesson} />

      {lesson.type !== "ARTICLE" && lesson.content ? (
        <section aria-label="Ders notları" className="text-sm">
          <Markdown>{lesson.content}</Markdown>
        </section>
      ) : null}

      {lesson.resources.length > 0 || (lesson.session?.resources.length ?? 0) > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Kaynaklar</CardTitle>
          </CardHeader>
          <CardContent>
            <ResourceList resources={[...lesson.resources, ...(lesson.session?.resources ?? [])]} />
          </CardContent>
        </Card>
      ) : null}

      <nav aria-label="Ders gezinme" className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        {course.previous ? (
          <Button asChild variant="ghost" className="justify-start">
            <Link href={lessonHref(course.slug, course.previous.id)} scroll={false}>
              <ArrowLeft aria-hidden /> <span className="truncate">{course.previous.title}</span>
            </Link>
          </Button>
        ) : (
          <span />
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {manualCompletion ? <MarkCompleteButton lessonId={lesson.id} isCompleted={lesson.isCompleted} /> : null}
          {course.next ? (
            <Button asChild>
              <Link href={lessonHref(course.slug, course.next.id)} scroll={false}>
                Sonraki ders <ArrowRight aria-hidden />
              </Link>
            </Button>
          ) : null}
        </div>
      </nav>
    </div>
  );
}
