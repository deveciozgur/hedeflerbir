import Link from "next/link";
import { ArrowRight, CalendarClock, CheckCircle2, Circle, CircleDashed, Clock, Hourglass, Radio, Sparkles, Users, Video } from "lucide-react";
import { AddToCalendar } from "@/components/ui/add-to-calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressRing } from "@/components/ui/progress-ring";
import { SnapRail } from "@/components/ui/snap-rail";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatCountdown, formatDate, formatDateTime, formatRelative, formatTime, formatTimeRange, relativeDayLabel } from "@/lib/format";
import { cn, fullName } from "@/lib/utils";
import type { StudentAssignmentCard } from "@/modules/assignments/application/student-assignments.queries";
import type { StudentAppointment } from "@/modules/mentoring/application/mentor-directory.queries";
import type { StudentTrainingCard } from "../application/trainings.queries";
import { sessionCalendarEvent, sessionIcsHref } from "../domain/calendar-event";
import { trainingTiming } from "../domain/trainings";

const rowLink =
  "rounded-lg outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const linkClass = "inline-flex items-center gap-1 rounded-sm text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring";

// ─────────────────────────────── Hero ───────────────────────────────

interface StudentHeroProps {
  firstName: string;
  attendance: { present: number; counted: number; rate: number | null };
  trainings: { completed: number; total: number };
  badges: { earned: number; total: number };
  openAssignments: number;
  next: StudentTrainingCard | null;
}

function summaryLine({ attendance, next }: Pick<StudentHeroProps, "attendance" | "next">): string {
  const nextPart = next ? `Sıradaki canlı eğitim: ${relativeDayLabel(next.scheduleDate)} ${formatTime(next.scheduleDate)}.` : "Yeni canlı eğitimler takvime eklendiğinde burada göreceksin.";
  if (attendance.rate === null) return `Yoklamaların girildikçe devam durumun burada görünecek. ${nextPart}`;
  if (attendance.rate >= 80) return `Harika gidiyorsun, devam oranın yüksek. ${nextPart}`;
  if (attendance.rate >= 50) return `İyi bir tempodasın; birkaç eğitim daha ile rozetlerini tamamlayabilirsin. ${nextPart}`;
  return `Canlı eğitimlere katıldıkça rozetlerin açılacak. ${nextPart}`;
}

export function StudentHero(props: StudentHeroProps) {
  const { firstName, attendance, trainings, badges, openAssignments } = props;
  const facts = [
    { label: "Tamamlanan eğitim", value: `${trainings.completed}/${trainings.total}` },
    { label: "Rozet", value: `${badges.earned}/${badges.total}` },
    { label: "Açık ödev", value: String(openAssignments) },
  ];

  return (
    <Card className="overflow-hidden py-0">
      <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:gap-8 lg:p-8">
        <ProgressRing value={attendance.rate ?? 0} size={112} strokeWidth={8} label="Devam oranı" />
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-brand-soft">Devam oranı {attendance.rate === null ? "henüz yok" : `%${attendance.rate}`}</p>
            <h1 className="text-xl font-semibold tracking-tight text-balance sm:text-2xl">Tekrar hoş geldin, {firstName}</h1>
            <p className="max-w-[65ch] text-sm text-pretty text-muted-foreground">{summaryLine(props)}</p>
          </div>
          <dl className="flex flex-wrap gap-x-8 gap-y-3">
            {facts.map((fact) => (
              <div key={fact.label} className="flex flex-col">
                <dt className="text-xs text-subtle">{fact.label}</dt>
                <dd className="font-mono text-lg font-semibold tabular-nums">{fact.value}</dd>
              </div>
            ))}
            <div className="flex flex-col">
              <dt className="text-xs text-subtle">Yoklama</dt>
              <dd className="font-mono text-lg font-semibold tabular-nums">
                {attendance.present}/{attendance.counted}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </Card>
  );
}

// ─────────────────────────── Live trainings ───────────────────────────

function railStatus(training: StudentTrainingCard) {
  const timing = trainingTiming(training.scheduleDate, training.durationMinutes);
  if (training.completed) return { label: "Tamamlandı", icon: CheckCircle2, className: "text-success" };
  if (timing === "live") return { label: "Şu an canlı", icon: Radio, className: "text-destructive" };
  if (timing === "upcoming") return { label: "Yaklaşan", icon: Clock, className: "text-muted-foreground" };
  return { label: "Tamamlanmadı", icon: CircleDashed, className: "text-muted-foreground" };
}

type RailEntry =
  | { kind: "training"; id: string; at: Date; training: StudentTrainingCard }
  | { kind: "mentoring"; id: string; at: Date; session: StudentAppointment };

/** Next live training with a countdown and its actions, then trainings and team mentoring sessions as one snap timeline. */
export function TrainingsWidget({ trainings, next, sessions }: { trainings: StudentTrainingCard[]; next: StudentTrainingCard | null; sessions: StudentAppointment[] }) {
  const rail: RailEntry[] = [
    ...trainings.map((training) => ({ kind: "training" as const, id: training.id, at: training.scheduleDate, training })),
    ...sessions.map((session) => ({ kind: "mentoring" as const, id: session.id, at: session.startTime, session })),
  ].sort((a, b) => a.at.getTime() - b.at.getTime());
  const timing = next ? trainingTiming(next.scheduleDate, next.durationMinutes) : null;
  const soon = next ? timing === "live" || next.scheduleDate.getTime() - Date.now() < 30 * 60_000 : false;

  return (
    <Card className="h-full gap-5">
      <CardHeader>
        <div>
          <CardTitle>Sıradaki canlı eğitim</CardTitle>
          <CardDescription>Türkiye saatiyle</CardDescription>
        </div>
        <Link href="/trainings" className={linkClass}>
          Takvim <ArrowRight className="size-3" aria-hidden />
        </Link>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        {next ? (
          <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface-raised p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={timing === "live" ? "destructive" : "brand"} className="font-mono tabular-nums">
                {timing === "live" ? <Radio aria-hidden /> : <Hourglass aria-hidden />}
                {timing === "live" ? "Şu an canlı" : formatCountdown(next.scheduleDate)}
              </Badge>
              {next.badge ? (
                <Badge variant="outline">
                  <Sparkles aria-hidden /> {next.badge.name} rozeti
                </Badge>
              ) : null}
            </div>
            <div className="flex flex-col gap-1">
              <Link href={`/trainings/${next.id}`} className="w-fit rounded-sm text-lg font-semibold tracking-tight outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">
                {next.title}
              </Link>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
                  <CalendarClock className="size-3.5" aria-hidden />
                  {relativeDayLabel(next.scheduleDate)} · {formatTimeRange(next.scheduleDate, new Date(next.scheduleDate.getTime() + next.durationMinutes * 60_000))}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <UserAvatar user={next.instructor} className="size-5" />
                  {fullName(next.instructor)}
                </span>
              </p>
            </div>
            {next.topics.length > 0 ? (
              <ul className="flex flex-wrap gap-1.5" aria-label="Konu başlıkları">
                {next.topics.slice(0, 4).map((topic) => (
                  <li key={topic} className="rounded-full border border-border bg-card px-2.5 py-0.5 text-xs text-muted-foreground">
                    {topic}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {next.meetingUrl ? (
                <Button asChild size="sm" variant={soon ? "default" : "outline"}>
                  <a href={next.meetingUrl} target="_blank" rel="noreferrer noopener">
                    <Video aria-hidden /> Canlı yayına git
                  </a>
                </Button>
              ) : null}
              <AddToCalendar
                event={sessionCalendarEvent({ ...next, courseTitle: next.programTitle })}
                icsHref={sessionIcsHref(next.id)}
                variant={soon ? "outline" : "default"}
              />
            </div>
          </div>
        ) : (
          <EmptyState icon={CalendarClock} title="Yaklaşan canlı eğitim yok" description="Program yönetimi yeni eğitim eklediğinde burada geri sayım başlayacak." className="py-8" />
        )}

        {rail.length > 0 ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xs font-medium text-subtle">Program zaman çizelgesi</h3>
              <span className="flex items-center gap-3 text-[11px] text-subtle">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-brand" aria-hidden /> Canlı eğitim
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-amber" aria-hidden /> Mentorluk
                </span>
              </span>
            </div>
            <SnapRail label="Canlı eğitim ve mentorluk zaman çizelgesi">
              {rail.map((entry) => {
                if (entry.kind === "mentoring") {
                  const { session } = entry;
                  return (
                    <li key={`m-${session.id}`} className="w-44 shrink-0 snap-start">
                      <Link
                        href="/mentors"
                        className="flex h-full flex-col gap-2 rounded-lg border border-amber/40 bg-amber/5 p-3 outline-none transition-colors duration-150 hover:border-amber focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <time dateTime={session.startTime.toISOString()} className="font-mono text-[11px] text-subtle tabular-nums">
                          {formatDate(session.startTime)} · {formatTime(session.startTime)}
                        </time>
                        <span className="line-clamp-2 text-sm font-medium">Mentorluk · {fullName(session.mentor)}</span>
                        <span className="mt-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Sparkles className="size-3.5" aria-hidden /> Onaylı seans
                        </span>
                      </Link>
                    </li>
                  );
                }
                const { training } = entry;
                const status = railStatus(training);
                const Icon = status.icon;
                return (
                  <li key={training.id} data-current={training.id === next?.id ? "" : undefined} className="w-44 shrink-0 snap-start">
                    <Link
                      href={`/trainings/${training.id}`}
                      className={cn(
                        "flex h-full flex-col gap-2 rounded-lg border p-3 outline-none transition-colors duration-200 hover:border-border-strong focus-visible:ring-2 focus-visible:ring-ring",
                        training.id === next?.id ? "border-brand/50 bg-brand/5" : "border-border",
                      )}
                    >
                      <time dateTime={training.scheduleDate.toISOString()} className="font-mono text-[11px] text-subtle tabular-nums">
                        {formatDate(training.scheduleDate)} · {formatTime(training.scheduleDate)}
                      </time>
                      <span className="line-clamp-2 text-sm font-medium">{training.title}</span>
                      <span className={cn("mt-auto inline-flex items-center gap-1 text-xs", status.className)}>
                        <Icon className="size-3.5" aria-hidden /> {status.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </SnapRail>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────── Team mentoring ───────────────────────────

export function TeamSessionCard({ session, hasTeam }: { session: StudentAppointment | null; hasTeam: boolean }) {
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>Mentorluk seansı</CardTitle>
        <Link href="/mentors" className={linkClass}>
          Mentorlar <ArrowRight className="size-3" aria-hidden />
        </Link>
      </CardHeader>
      <CardContent>
        {session ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <UserAvatar user={session.mentor} className="size-10" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{fullName(session.mentor)}</p>
                <p className="text-xs text-subtle">Mentor · onaylandı</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-amber/10 px-3 py-2">
              <span className="font-mono text-xs tabular-nums">
                {formatDateTime(session.startTime)} - {formatTime(session.endTime)}
              </span>
              <Badge variant="warning" className="font-mono tabular-nums">
                {formatCountdown(session.startTime)}
              </Badge>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-lg border border-dashed border-border p-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-amber/15 text-foreground" aria-hidden>
              {hasTeam ? <Hourglass className="size-4" /> : <Users className="size-4" />}
            </span>
            <p className="text-sm text-muted-foreground">
              {hasTeam
                ? "Ekibin için henüz onaylanmış bir seans yok. Program yönetimi seansı onayladığında burada göreceksin."
                : "Henüz bir ekipte değilsin. Mentorluk seansları ekipler için planlanır."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────── Assignments ───────────────────────────

const OPEN = new Set([null, "RETURNED"]);

/** Linear-style to-do list: open assignments by due date, then the last few handed in (checked). */
export function AssignmentChecklist({ assignments }: { assignments: StudentAssignmentCard[] }) {
  const now = Date.now();
  const open = assignments.filter((a) => OPEN.has(a.status)).sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  const done = assignments
    .filter((a) => !OPEN.has(a.status))
    .sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime())
    .slice(0, 3);
  const rows = [...open.slice(0, 6).map((a) => ({ ...a, done: false })), ...done.map((a) => ({ ...a, done: true }))];

  return (
    <Card className="gap-4">
      <CardHeader>
        <div>
          <CardTitle>
            Ödevler <span className="font-mono text-xs font-normal text-subtle tabular-nums">{open.length} açık</span>
          </CardTitle>
        </div>
        <Link href="/assignments" className={linkClass}>
          Tümü <ArrowRight className="size-3" aria-hidden />
        </Link>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="Ödev yok" description="Eğitimlere bağlı ödevler eklendiğinde burada listelenir." className="py-8" />
        ) : (
          <ul className="-mx-2 flex flex-col divide-y divide-border">
            {rows.map((a) => {
              const overdue = !a.done && a.dueDate.getTime() < now;
              const urgent = !a.done && !overdue && a.dueDate.getTime() - now < 48 * 3_600_000;
              return (
                <li key={a.id}>
                  <Link href={a.href} className={cn(rowLink, "flex items-center gap-3 px-2 py-2.5")}>
                    {a.done ? <CheckCircle2 className="size-4 shrink-0 text-brand" aria-hidden /> : <Circle className="size-4 shrink-0 text-border-hover" aria-hidden />}
                    <span className="sr-only">{a.done ? "Teslim edildi:" : "Açık:"}</span>
                    <span className="min-w-0 flex-1">
                      <span className={cn("block truncate text-sm", a.done ? "text-muted-foreground line-through decoration-border-hover" : "font-medium")}>{a.title}</span>
                      <span className="block truncate text-xs text-subtle">{a.courseTitle}</span>
                    </span>
                    {a.status === "RETURNED" ? <Badge variant="warning">Düzeltme istendi</Badge> : null}
                    <time
                      dateTime={a.dueDate.toISOString()}
                      className={cn("shrink-0 font-mono text-xs tabular-nums", overdue || urgent ? "font-medium text-magenta" : "text-muted-foreground")}
                    >
                      {a.done ? formatDate(a.dueDate) : overdue ? "Süresi geçti" : formatRelative(a.dueDate)}
                    </time>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
