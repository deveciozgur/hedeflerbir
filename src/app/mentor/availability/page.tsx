import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { getMentorSchedule } from "@/modules/mentoring/application/mentor-portal.queries";
import { AddAvailabilityForm } from "@/modules/mentoring/ui/add-availability-form";
import { MentorSchedule } from "@/modules/mentoring/ui/mentor-schedule";

export const metadata: Metadata = { title: "Müsaitlik" };

export default async function AvailabilityPage() {
  const viewer = await getViewer("MENTOR");
  const slots = await getMentorSchedule(viewer.id);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Müsaitlik" description="Çalışma saatlerini belirle, slot ekle veya kaldır. Saatler Türkiye saatiyle gösterilir." />
      <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
        <div className="lg:sticky lg:top-20 lg:self-start">
          <AddAvailabilityForm />
        </div>
        <MentorSchedule slots={slots} />
      </div>
    </div>
  );
}
