import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { getStudentDashboard } from "@/modules/learning/application/student-dashboard.queries";
import { AnnouncementsCard } from "@/modules/learning/ui/announcements-card";
import { ChronosTimeline } from "@/modules/learning/ui/chronos-timeline";
import { DASHBOARD_GRID } from "@/modules/learning/ui/dashboard-grid";
import { HeroProgress } from "@/modules/learning/ui/hero-progress";
import { ResumeCard } from "@/modules/learning/ui/resume-card";

export const metadata: Metadata = { title: "Ana Sayfa" };

export default async function StudentDashboardPage() {
  const viewer = await getViewer("STUDENT");
  const dashboard = await getStudentDashboard(viewer.id);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={`Merhaba, ${dashboard.firstName}`} description="Bugün hedeflerine bir adım daha yaklaş." />

      <section aria-label="İlerleme ve devam et" className={DASHBOARD_GRID.top}>
        <HeroProgress overall={dashboard.overall} projects={dashboard.projects} />
        <ResumeCard target={dashboard.resume} />
      </section>

      <section aria-label="Zaman akışı ve duyurular" className={DASHBOARD_GRID.bottom}>
        <ChronosTimeline items={dashboard.agenda} />
        <AnnouncementsCard items={dashboard.announcements} />
      </section>
    </div>
  );
}
