import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarCheck2, CalendarClock, ChevronRight, FileText, Inbox, ListChecks, Users, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BENTO_SPAN, BentoGrid } from "@/components/ui/bento";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatCountdown, formatDateTime, formatRelative, formatTime, formatTimeRange, relativeDayLabel } from "@/lib/format";
import { fullName } from "@/lib/utils";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { getInstructorOverview } from "@/modules/learning/application/instructor-overview.queries";

export const metadata: Metadata = { title: "Genel Bakış" };

const linkClass = "inline-flex items-center gap-1 rounded-sm text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring";

export default async function InstructorOverviewPage() {
  const viewer = await getViewer("INSTRUCTOR");
  const o = await getInstructorOverview(viewer.id);
  const next = o.next;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={`Merhaba, ${viewer.name}`} description="Canlı eğitimlerin, notlandırma masan ve sıradaki sınıfın tek ekranda." />

      <BentoGrid>
        <section aria-label="Göstergeler" className="contents">
          <div className={BENTO_SPAN.kpi}>
            <StatTile icon={CalendarCheck2} tone="brand" label="Verilen canlı eğitim" value={String(o.kpis.delivered)} />
          </div>
          <div className={BENTO_SPAN.kpi}>
            <StatTile icon={Users} tone="cyan" label="Katılımcı etkileşimi" value={String(o.kpis.attendances)} hint="Yoklamada katıldı işaretlenenler" />
          </div>
          <div className={BENTO_SPAN.kpi}>
            <StatTile icon={Inbox} tone={o.kpis.awaitingReview > 0 ? "magenta" : "neutral"} label="İncelenmeyi bekleyen" value={String(o.kpis.awaitingReview)} hint="Teslim edilen ödevler" />
          </div>
          <div className={BENTO_SPAN.kpi}>
            <StatTile
              icon={CalendarClock}
              tone="amber"
              label="Sıradaki canlı oturum"
              value={o.kpis.nextAt ? formatTime(o.kpis.nextAt) : "-"}
              hint={o.kpis.nextAt ? relativeDayLabel(o.kpis.nextAt) : "Planlanmış oturum yok"}
            />
          </div>
        </section>

        <section aria-label="Notlandırma masası" className={BENTO_SPAN.main}>
          <Card className="h-full gap-4">
            <CardHeader>
              <div>
                <CardTitle>Notlandırma masası</CardTitle>
                <CardDescription>Son teslim edilen ödevler</CardDescription>
              </div>
              <Link href="/instructor/assignments" className={linkClass}>
                Tüm ödevler <ArrowRight className="size-3" aria-hidden />
              </Link>
            </CardHeader>
            <CardContent>
              {o.recentSubmissions.length === 0 ? (
                <EmptyState icon={Inbox} title="Bekleyen teslim yok" description="Katılımcılar ödev teslim ettiğinde burada sıralanır." className="py-10" />
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {o.recentSubmissions.map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/instructor/assignments/${s.assignmentId}`}
                        className="group flex h-full flex-col gap-3 rounded-lg border border-border p-3.5 outline-none transition-colors duration-200 hover:border-border-strong hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="flex items-center gap-2.5">
                          <UserAvatar user={s.student} className="size-7" />
                          <span className="min-w-0 flex-1 truncate text-sm font-medium">{fullName(s.student)}</span>
                          <time dateTime={s.submittedAt.toISOString()} className="shrink-0 font-mono text-[11px] text-subtle tabular-nums">
                            {formatRelative(s.submittedAt)}
                          </time>
                        </span>
                        <span className="flex flex-col gap-0.5">
                          <span className="line-clamp-1 text-sm">{s.assignmentTitle}</span>
                          {s.trainingTitle ? <span className="line-clamp-1 text-xs text-subtle">{s.trainingTitle}</span> : null}
                        </span>
                        <span className="mt-auto flex items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span className="inline-flex min-w-0 items-center gap-1.5">
                            <FileText className="size-3.5 shrink-0" aria-hidden />
                            <span className="truncate">{s.fileName ?? "Metin teslimi"}</span>
                          </span>
                          <span className="inline-flex shrink-0 items-center gap-0.5 font-medium text-brand-soft">
                            Notlandır <ChevronRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>

        <section aria-label="Sıradaki canlı sınıf" className={`${BENTO_SPAN.side} flex flex-col gap-4`}>
          <Card className="gap-4">
            <CardHeader>
              <CardTitle>Sıradaki canlı sınıf</CardTitle>
              {next ? (
                <Badge variant="warning" className="font-mono tabular-nums">
                  {formatCountdown(next.scheduleDate)}
                </Badge>
              ) : null}
            </CardHeader>
            <CardContent>
              {next ? (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <p className="font-semibold tracking-tight">{next.title}</p>
                    <p className="font-mono text-xs text-muted-foreground tabular-nums">
                      {relativeDayLabel(next.scheduleDate)} · {formatTimeRange(next.scheduleDate, new Date(next.scheduleDate.getTime() + next.durationMinutes * 60_000))}
                    </p>
                  </div>
                  {next.topics.length > 0 ? (
                    <div className="flex flex-col gap-1.5">
                      <h3 className="flex items-center gap-1.5 text-xs font-medium text-subtle">
                        <ListChecks className="size-3.5" aria-hidden /> Konu başlıkları
                      </h3>
                      <ol className="flex list-decimal flex-col gap-1 pl-5 text-sm text-muted-foreground">
                        {next.topics.map((topic) => (
                          <li key={topic}>{topic}</li>
                        ))}
                      </ol>
                    </div>
                  ) : null}
                  {next.notes ? (
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="mb-1 text-xs font-medium text-subtle">Sunum notları</p>
                      <p className="line-clamp-4 text-sm whitespace-pre-wrap">{next.notes}</p>
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    {next.meetingUrl ? (
                      <Button asChild size="sm">
                        <a href={next.meetingUrl} target="_blank" rel="noreferrer noopener">
                          <Video aria-hidden /> Canlı sınıfa git
                        </a>
                      </Button>
                    ) : null}
                    <Button asChild size="sm" variant="outline">
                      <Link href="/instructor/students">
                        <Users aria-hidden /> Katılımcılar <span className="font-mono text-xs tabular-nums text-subtle">{next.participantCount}</span>
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <EmptyState icon={CalendarClock} title="Planlanmış sınıf yok" description="Yönetici sana yeni bir canlı eğitim atadığında burada görünecek." className="py-8" />
              )}
            </CardContent>
          </Card>

          {o.upcoming.length > 0 ? (
            <Card className="gap-3 py-5">
              <CardHeader>
                <CardTitle>Sonraki oturumlar</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-2.5">
                  {o.upcoming.map((s) => (
                    <li key={s.id} className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="truncate">{s.title}</span>
                      <time dateTime={s.scheduleDate.toISOString()} className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
                        {formatDateTime(s.scheduleDate)}
                      </time>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </section>
      </BentoGrid>
    </div>
  );
}
