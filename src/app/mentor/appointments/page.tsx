import type { Metadata } from "next";
import { CalendarClock, History } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SegmentedLinks } from "@/components/ui/segmented-links";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { getMentorAppointments } from "@/modules/mentoring/application/mentor-portal.queries";
import { MentorAppointmentCard } from "@/modules/mentoring/ui/mentor-appointment-card";

export const metadata: Metadata = { title: "Randevular" };

const PHASES = [
  { value: "upcoming", label: "Yaklaşan", href: "/mentor/appointments", icon: <CalendarClock /> },
  { value: "past", label: "Geçmiş", href: "/mentor/appointments?phase=past", icon: <History /> },
] as const;

export default async function MentorAppointmentsPage({ searchParams }: { searchParams: Promise<{ phase?: string }> }) {
  const [{ phase: rawPhase }, viewer] = await Promise.all([searchParams, getViewer("MENTOR")]);
  const phase = rawPhase === "past" ? "past" : "upcoming";
  const appointments = await getMentorAppointments(viewer.id, phase);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Randevular"
        description="Seanslarından önce katılımcının hedeflerini ve ilerlemesini incele."
        actions={<SegmentedLinks label="Randevu dönemi" value={phase} options={PHASES} />}
      />
      {appointments.length === 0 ? (
        <EmptyState
          icon={phase === "upcoming" ? CalendarClock : History}
          title={phase === "upcoming" ? "Yaklaşan seans yok" : "Geçmiş seans yok"}
          description={
            phase === "upcoming"
              ? "Bir katılımcı randevu aldığında burada ve e-postanda göreceksin."
              : "Tamamlanan ve iptal edilen seanslar burada listelenecek."
          }
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {appointments.map((appointment) => (
            <li key={appointment.id}>
              <MentorAppointmentCard appointment={appointment} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
