import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { getProgramOverview } from "@/modules/administration/application/program-overview.queries";
import { WeekCalendar } from "@/modules/administration/ui/week-calendar";
import { AnnouncementDialog } from "@/modules/engagement/ui/announcement-dialog";
import { listProgramOptions } from "@/modules/learning/application/trainings.queries";
import { TrainingProgressCard } from "@/modules/learning/ui/training-progress-card";

export const metadata: Metadata = { title: "Ana Sayfa" };

export default async function AdminHomePage() {
  const viewer = await getViewer("ADMIN");
  const [overview, courses] = await Promise.all([getProgramOverview(), listProgramOptions()]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={`Merhaba, ${viewer.name}`} description="Programın canlı eğitim ilerlemesi ve bu haftanın takvimi." actions={<AnnouncementDialog courses={courses} />} />
      <TrainingProgressCard
        completed={overview.trainings.held}
        total={overview.trainings.total}
        percent={overview.trainings.percent}
        label="Canlı eğitim ilerlemesi"
        description="Tarihi geçen eğitimler sayılır."
        href="/admin/trainings"
      />
      <WeekCalendar week={overview.week} />
    </div>
  );
}
