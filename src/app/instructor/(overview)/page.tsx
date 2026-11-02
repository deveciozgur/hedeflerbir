import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarCheck2, CalendarClock, ClipboardList, Inbox, ListChecks, Users, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BENTO_SPAN, BentoGrid } from "@/components/ui/bento";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { formatCountdown, formatDateTime, formatTime, formatTimeRange, relativeDayLabel } from "@/lib/format";
import { GradingDrawer } from "@/modules/assignments/ui/grading-drawer";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { getInstructorOverview } from "@/modules/learning/application/instructor-overview.queries";

export const metadata: Metadata = { title: "Genel Bakış" };

/** "12 sa 30 dk" style total for the hours KPI. */
const formatHours = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} sa ${m} dk` : `${h} sa`;
};

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
            <StatTile
              icon={CalendarCheck2}
              tone="brand"
              label="Toplam canlı eğitim saati"
              value={formatHours(o.kpis.deliveredMinutes)}
              hint={`${o.kpis.delivered} oturum verildi`}
            />
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
                <CardTitle>Notlandırma ve inceleme masası</CardTitle>
                <CardDescription>Bir teslime tıkla; dosya, not ve geri bildirim sağdan açılır.</CardDescription>
              </div>
              <Link href="/instructor/assignments" className={linkClass}>
                Tüm ödevler <ArrowRight className="size-3" aria-hidden />
              </Link>
            </CardHeader>
            <CardContent>
              {o.recentSubmissions.length === 0 ? (
                <EmptyState icon={Inbox} title="Bekleyen teslim yok" description="Katılımcılar ödev teslim ettiğinde burada sıralanır." className="py-10" />
              ) : (
                <GradingDrawer submissions={o.recentSubmissions} />
              )}
            </CardContent>
          </Card>
        </section>

        <section aria-label="Sıradaki canlı sınıf" className={`${BENTO_SPAN.side} flex flex-col gap-4`}>
          <Card className="gap-4">
            <CardHeader>
              <CardTitle>Canlı sınıf hazırlığı</CardTitle>
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
                        <ListChecks className="size-3.5" aria-hidden /> Ders planı
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
                      <Link href={`/instructor/courses/${next.courseId}`}>
                        <ClipboardList aria-hidden /> Yoklama
                      </Link>
                    </Button>
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
