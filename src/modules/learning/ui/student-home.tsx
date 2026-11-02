import Link from "next/link";
import { ArrowRight, CalendarClock, CheckCircle2, Circle, CircleDashed, Hourglass, Radio, Sparkles, Target, UserRoundCheck, Users, Video } from "lucide-react";
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
import type { MyTeam } from "@/modules/people/application/people.queries";
import type { StudentTrainingCard } from "../application/trainings.queries";
import { sessionCalendarEvent, sessionIcsHref } from "../domain/calendar-event";
import { trainingCompletion, trainingTiming } from "../domain/trainings";

const rowLink =
  "rounded-lg outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const linkClass = "inline-flex items-center gap-1 rounded-sm text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring";

const endOf = (t: Pick<StudentTrainingCard, "scheduleDate" | "durationMinutes">) => new Date(t.scheduleDate.getTime() + t.durationMinutes * 60_000);

// ─────────────────────────────── Hero (8) ───────────────────────────────

interface StudentHeroProps {
  firstName: string;
  trainings: { completed: number; total: number };
  attendance: { present: number; counted: number };
  badges: { earned: number; total: number };
  openAssignments: number;
}

function motivation(percent: number, total: number): string {
  if (total === 0) return "Canlı eğitimler takvime eklendiğinde ilerlemen burada görünecek.";
  if (percent >= 80) return "Harika gidiyorsun; programın neredeyse tamamına katıldın.";
  if (percent >= 50) return "İyi bir tempodasın. Birkaç eğitim daha ile rozetlerini tamamlayabilirsin.";
  if (percent > 0) return "Güzel bir başlangıç. Canlı eğitimlere katıldıkça rozetlerin açılacak.";
  return "İlk canlı eğitimine katıldığında yolculuğun burada başlayacak.";
}

/** Greeting with the attendance ring: attended live trainings over all programme trainings (from the roll calls). */
export function StudentHero({ firstName, trainings, attendance, badges, openAssignments }: StudentHeroProps) {
  const percent = trainingCompletion(trainings.completed, trainings.total);
  const facts = [
    { label: "Tamamlanan eğitim", value: `${trainings.completed}/${trainings.total}` },
    { label: "Yoklama", value: `${attendance.present}/${attendance.counted}` },
    { label: "Rozet", value: `${badges.earned}/${badges.total}` },
    { label: "Açık ödev", value: String(openAssignments) },
  ];

  return (
    <Card className="h-full justify-center py-0">
      <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:gap-8">
        <ProgressRing value={percent} size={112} strokeWidth={8} label="Canlı eğitim devam oranı" />
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <p className="font-mono text-xs font-medium text-brand-soft tabular-nums">Devam %{percent}</p>
            <h1 className="text-lg font-semibold tracking-tight text-balance sm:text-xl">Tekrar hoş geldin, {firstName}</h1>
            <p className="max-w-[60ch] text-sm text-pretty text-muted-foreground">{motivation(percent, trainings.total)}</p>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
            {facts.map((fact) => (
              <div key={fact.label} className="flex flex-col">
                <dt className="text-xs text-subtle">{fact.label}</dt>
                <dd className="font-mono text-lg font-semibold tracking-tight tabular-nums">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </Card>
  );
}

// ──────────────────────── Next live session (4) ────────────────────────

/** Countdown card for the nearest live training with the join and calendar actions. */
export function NextSessionCard({ next }: { next: StudentTrainingCard | null }) {
  if (!next) {
    return (
      <Card className="h-full gap-4">
        <CardHeader>
          <CardTitle>Sıradaki canlı oturum</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 items-center">
          <EmptyState icon={CalendarClock} title="Yaklaşan oturum yok" description="Yeni canlı eğitim eklendiğinde geri sayım burada başlar." className="w-full py-6" />
        </CardContent>
      </Card>
    );
  }

  const timing = trainingTiming(next.scheduleDate, next.durationMinutes);
  const soon = timing === "live" || next.scheduleDate.getTime() - Date.now() < 30 * 60_000;

  return (
    <Card className="h-full gap-4">
      <CardHeader>
        <CardTitle>Sıradaki canlı oturum</CardTitle>
        <Badge variant={timing === "live" ? "destructive" : "brand"} className="font-mono tabular-nums">
          {timing === "live" ? <Radio aria-hidden /> : <Hourglass aria-hidden />}
          {timing === "live" ? "Şu an canlı" : formatCountdown(next.scheduleDate)}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Link href={`/trainings/${next.id}`} className="w-fit rounded-sm font-semibold tracking-tight outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">
            {next.title}
          </Link>
          <p className="font-mono text-xs text-muted-foreground tabular-nums">
            {relativeDayLabel(next.scheduleDate)} · {formatTimeRange(next.scheduleDate, endOf(next))}
          </p>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <UserAvatar user={next.instructor} className="size-5" />
            {fullName(next.instructor)}
          </p>
        </div>
        {next.topics[0] ? <p className="line-clamp-2 text-sm text-pretty">Konu: {next.topics.slice(0, 2).join(", ")}</p> : null}
        {next.badge ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="size-3.5 text-magenta-soft" aria-hidden /> Katılırsan {next.badge.name} rozeti
          </p>
        ) : null}
        <div className="mt-auto flex flex-wrap gap-2">
          {next.meetingUrl ? (
            <Button asChild size="sm" variant={soon ? "default" : "outline"}>
              <a href={next.meetingUrl} target="_blank" rel="noreferrer noopener">
                <Video aria-hidden /> Canlı eğitime katıl
              </a>
            </Button>
          ) : null}
          <AddToCalendar event={sessionCalendarEvent({ ...next, courseTitle: next.programTitle })} icsHref={sessionIcsHref(next.id)} variant={soon ? "outline" : "default"} />
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────── Timeline (8) ───────────────────────────

function trainingStatus(training: StudentTrainingCard) {
  if (training.completed) return { label: "Tamamlandı", icon: CheckCircle2, className: "text-success" };
  if (trainingTiming(training.scheduleDate, training.durationMinutes) === "live") return { label: "Şu an canlı", icon: Radio, className: "text-destructive" };
  return { label: "Tamamlanmadı", icon: CircleDashed, className: "text-muted-foreground" };
}

type RailEntry =
  | { kind: "training"; id: string; at: Date; training: StudentTrainingCard }
  | { kind: "mentoring"; id: string; at: Date; session: StudentAppointment };

/** Past and upcoming live trainings plus the team's approved mentoring sessions, as one horizontal snap timeline. */
export function TimelineWidget({ trainings, sessions, currentId }: { trainings: StudentTrainingCard[]; sessions: StudentAppointment[]; currentId: string | null }) {
  const rail: RailEntry[] = [
    ...trainings.map((training) => ({ kind: "training" as const, id: training.id, at: training.scheduleDate, training })),
    ...sessions.map((session) => ({ kind: "mentoring" as const, id: session.id, at: session.startTime, session })),
  ].sort((a, b) => a.at.getTime() - b.at.getTime());

  return (
    <Card className="h-full gap-4">
      <CardHeader>
        <div>
          <CardTitle>Eğitim zaman çizelgesi</CardTitle>
          <CardDescription className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-brand" aria-hidden /> Canlı eğitim
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-amber" aria-hidden /> Mentorluk
            </span>
          </CardDescription>
        </div>
        <Link href="/trainings" className={linkClass}>
          Takvim <ArrowRight className="size-3" aria-hidden />
        </Link>
      </CardHeader>
      <CardContent>
        {rail.length === 0 ? (
          <EmptyState icon={CalendarClock} title="Takvim boş" description="Program yönetimi canlı eğitim ekledikçe zaman çizelgen dolacak." className="py-8" />
        ) : (
          <SnapRail label="Canlı eğitim ve mentorluk zaman çizelgesi">
            {rail.map((entry) => {
              if (entry.kind === "mentoring") {
                const { session } = entry;
                return (
                  <li key={`m-${session.id}`} className="w-48 shrink-0 snap-start">
                    <Link
                      href="/mentors"
                      className="flex h-full flex-col gap-2 rounded-lg border border-amber/40 bg-amber/5 p-3 outline-none transition-colors duration-150 hover:border-amber focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <time dateTime={session.startTime.toISOString()} className="font-mono text-[11px] text-subtle tabular-nums">
                        {formatDate(session.startTime)} · {formatTimeRange(session.startTime, session.endTime)}
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
              const status = trainingStatus(training);
              const Icon = status.icon;
              const isCurrent = training.id === currentId;
              return (
                <li key={training.id} data-current={isCurrent ? "" : undefined} className="w-48 shrink-0 snap-start">
                  <Link
                    href={`/trainings/${training.id}`}
                    className={cn(
                      "flex h-full flex-col gap-2 rounded-lg border p-3 outline-none transition-colors duration-150 hover:border-border-strong focus-visible:ring-2 focus-visible:ring-ring",
                      isCurrent ? "border-brand/50 bg-brand/5" : "border-border",
                    )}
                  >
                    <time dateTime={training.scheduleDate.toISOString()} className="font-mono text-[11px] text-subtle tabular-nums">
                      {formatDate(training.scheduleDate)} · {formatTime(training.scheduleDate)} · {training.durationMinutes} dk
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
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────── Team & mentoring (6) ───────────────────────

/** Read-only team summary (name, representative, problem) with the next admin-approved mentoring session. */
export function TeamMentoringCard({ team, session }: { team: MyTeam | null; session: StudentAppointment | null }) {
  return (
    <Card className="h-full gap-4">
      <CardHeader>
        <CardTitle>Ekip ve mentorluk</CardTitle>
        <Link href="/team" className={linkClass}>
          Ekibim <ArrowRight className="size-3" aria-hidden />
        </Link>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {team ? (
          <div className="flex flex-col gap-2">
            <p className="flex items-center justify-between gap-3">
              <span className="truncate font-semibold tracking-tight">{team.name}</span>
              <span className="flex shrink-0 -space-x-1.5" aria-label={`${team.members.length} üye`}>
                {team.members.slice(0, 5).map((m) => (
                  <UserAvatar key={m.id} user={m} className="size-6 ring-2 ring-card" />
                ))}
              </span>
            </p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <UserRoundCheck className="size-3.5" aria-hidden /> Temsilci: <span className="text-foreground">{team.representative ? fullName(team.representative) : "Henüz seçilmedi"}</span>
            </p>
            {team.focusArea ? (
              <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Target className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                <span className="line-clamp-2">{team.focusArea}</span>
              </p>
            ) : null}
          </div>
        ) : (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="size-4" aria-hidden /> Henüz bir ekipte değilsin.
          </p>
        )}

        {session ? (
          <div className="flex flex-col gap-3 rounded-lg border border-amber/40 bg-amber/5 p-3">
            <div className="flex items-center gap-3">
              <UserAvatar user={session.mentor} className="size-9" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{fullName(session.mentor)}</p>
                <p className="font-mono text-xs text-muted-foreground tabular-nums">
                  {formatDateTime(session.startTime)} - {formatTime(session.endTime)}
                </p>
              </div>
              <Badge variant="warning" className="shrink-0 font-mono tabular-nums">
                {formatCountdown(session.startTime)}
              </Badge>
            </div>
            {session.meetingLink ? (
              <Button asChild size="sm" variant="outline" className="w-fit">
                <a href={session.meetingLink} target="_blank" rel="noreferrer noopener">
                  <Video aria-hidden /> Görüşme bağlantısı
                </a>
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-lg border border-dashed border-border p-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-amber/15 text-foreground" aria-hidden>
              <Hourglass className="size-4" />
            </span>
            <p className="text-sm text-muted-foreground">
              {team ? "Onaylanmış mentorluk seansı yok. Program yönetimi seansı onayladığında burada göreceksin." : "Mentorluk seansları ekipler için planlanır."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────── Assignments (6) ───────────────────────────

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
    <Card className="h-full gap-4">
      <CardHeader>
        <CardTitle>
          Görevler ve ödevler <span className="font-mono text-xs font-normal text-subtle tabular-nums">{open.length} açık</span>
        </CardTitle>
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
                      className={cn("shrink-0 font-mono text-xs tabular-nums", overdue || urgent ? "font-medium text-magenta-soft" : "text-muted-foreground")}
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
