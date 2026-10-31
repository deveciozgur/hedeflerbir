import type { Metadata } from "next";
import Link from "next/link";
import { after } from "next/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { remindDueAssignments } from "@/modules/assignments/application/due-reminders.service";
import { getBadgeShowcase } from "@/modules/engagement/application/badges.service";
import { BadgeGrid } from "@/modules/engagement/ui/badge-grid";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { getStudentDashboard } from "@/modules/learning/application/student-dashboard.queries";
import { getTrainingProgress } from "@/modules/learning/application/trainings.queries";
import { AnnouncementsCard } from "@/modules/learning/ui/announcements-card";
import { ChronosTimeline } from "@/modules/learning/ui/chronos-timeline";
import { DASHBOARD_GRID } from "@/modules/learning/ui/dashboard-grid";
import { TrainingProgressCard } from "@/modules/learning/ui/training-progress-card";

export const metadata: Metadata = { title: "Ana Sayfa" };

export default async function StudentDashboardPage() {
  const viewer = await getViewer("STUDENT");
  after(() => remindDueAssignments(viewer.id).catch((error: unknown) => console.error("Due reminders failed", error)));
  const [dashboard, progress, showcase] = await Promise.all([getStudentDashboard(viewer.id), getTrainingProgress(viewer.id), getBadgeShowcase(viewer.id)]);
  const earned = showcase.badges.filter((b) => b.awardedAt).length;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={`Merhaba, ${dashboard.firstName}`} description="Bugün hedeflerine bir adım daha yaklaş." />

      <section aria-label="İlerleme" className="flex flex-col gap-6">
        <TrainingProgressCard {...progress} />
        <Card>
          <CardHeader>
            <CardTitle>
              Rozetler <span className="font-mono text-xs font-normal text-subtle tabular-nums">{earned}/{showcase.badges.length}</span>
            </CardTitle>
            <Link href="/profile" className="rounded-sm text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
              Profilde gör
            </Link>
          </CardHeader>
          <CardContent>
            <BadgeGrid badges={showcase.badges} compact />
          </CardContent>
        </Card>
      </section>

      <section aria-label="Zaman akışı ve duyurular" className={DASHBOARD_GRID.bottom}>
        <ChronosTimeline items={dashboard.agenda} />
        <AnnouncementsCard items={dashboard.announcements} />
      </section>
    </div>
  );
}
