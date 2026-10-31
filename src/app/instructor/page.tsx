import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, CalendarClock, ChevronRight, Inbox, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { formatDateTime, formatRelative } from "@/lib/format";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { getInstructorOverview } from "@/modules/learning/application/instructor-overview.queries";

export const metadata: Metadata = { title: "Genel Bakış" };

export default async function InstructorOverviewPage() {
  const viewer = await getViewer("INSTRUCTOR");
  const o = await getInstructorOverview(viewer.id);

  if (o.courses.length === 0) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title={`Merhaba, ${viewer.name}`} description="Atanmış eğitimlerin ve değerlendirme bekleyen ödevler." />
        <EmptyState icon={BookOpen} title="Henüz atanmış bir eğitimin yok" description="Yönetici sana bir eğitim atadığında özet burada görünecek." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={`Merhaba, ${viewer.name}`} description="Atanmış eğitimlerin, değerlendirme bekleyen ödevler ve yaklaşan dersler." />

      <section aria-label="Özet" className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatTile icon={BookOpen} label="Eğitim" value={String(o.courses.length)} />
        <StatTile icon={Users} label="Katılımcı" value={String(o.studentCount)} />
        <StatTile icon={Inbox} label="Değerlendirme bekleyen" value={String(o.awaitingReviewTotal)} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Değerlendirme kuyruğu</CardTitle>
              <CardDescription>En eski teslim en üstte</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {o.awaitingReview.length === 0 ? (
              <EmptyState icon={Inbox} title="Bekleyen teslim yok" description="Yeni teslimler geldiğinde burada sıralanır." className="py-8" />
            ) : (
              <ul className="-mx-2 flex flex-col">
                {o.awaitingReview.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/instructor/assignments/${s.assignmentId}`}
                      className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{s.studentName}</span>
                        <span className="block truncate text-xs text-muted-foreground">{s.assignmentTitle}</span>
                      </span>
                      <time dateTime={s.submittedAt.toISOString()} className="shrink-0 text-xs text-muted-foreground">
                        {formatRelative(s.submittedAt)}
                      </time>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Yaklaşan dersler</CardTitle>
          </CardHeader>
          <CardContent>
            {o.upcomingSessions.length === 0 ? (
              <EmptyState icon={CalendarClock} title="Planlanmış ders yok" description="Eğitim sayfasından yeni oturum ekleyebilirsin." className="py-8" />
            ) : (
              <ul className="-mx-2 flex flex-col">
                {o.upcomingSessions.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/instructor/courses/${s.courseId}`}
                      className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <CalendarClock className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{s.title}</span>
                        <span className="block truncate text-xs text-muted-foreground">{s.courseTitle}</span>
                      </span>
                      <time dateTime={s.scheduleDate.toISOString()} className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {formatDateTime(s.scheduleDate)}
                      </time>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
