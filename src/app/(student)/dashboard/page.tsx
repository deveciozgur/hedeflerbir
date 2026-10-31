import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { getStudentDashboard } from "@/modules/learning/application/student-dashboard.queries";
import { AnnouncementsCard } from "@/modules/learning/ui/announcements-card";
import { ContinueWatching } from "@/modules/learning/ui/continue-watching";
import { HeroProgress } from "@/modules/learning/ui/hero-progress";
import { UpcomingAgenda } from "@/modules/learning/ui/upcoming-agenda";

export const metadata: Metadata = { title: "Ana Sayfa" };

export default async function StudentDashboardPage() {
  const viewer = await getViewer("STUDENT");
  const dashboard = await getStudentDashboard(viewer.id);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={`Merhaba, ${dashboard.firstName}`} description="Bugün hedeflerine bir adım daha yaklaş." />

      <section aria-label="İlerleme ve devam et" className="grid gap-4 lg:grid-cols-3">
        <HeroProgress overall={dashboard.overall} projects={dashboard.projects} />
        <ContinueWatching item={dashboard.continueWatching} />
      </section>

      <section aria-label="Takvim ve duyurular" className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <UpcomingAgenda items={dashboard.agenda} />
        </div>
        <div className="lg:col-span-2">
          <AnnouncementsCard items={dashboard.announcements} />
        </div>
      </section>
    </div>
  );
}
