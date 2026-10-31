import type { Metadata } from "next";
import { CalendarClock } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SegmentedLinks } from "@/components/ui/segmented-links";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { listMentors } from "@/modules/mentoring/application/mentor-directory.queries";
import { listAppointments } from "@/modules/mentoring/application/mentor-portal.queries";
import { MentorAppointmentCard } from "@/modules/mentoring/ui/mentor-appointment-card";
import { MentorDirectory } from "@/modules/mentoring/ui/mentor-directory";
import { listTeams } from "@/modules/people/application/teams.queries";

export const metadata: Metadata = { title: "Mentorlar" };

export default async function AdminMentorsPage({ searchParams }: { searchParams: Promise<{ phase?: string }> }) {
  const [{ phase: rawPhase }] = await Promise.all([searchParams, getViewer("ADMIN")]);
  const phase = rawPhase === "past" ? "past" : "upcoming";
  const [mentors, sessions, teams] = await Promise.all([listMentors(), listAppointments(phase), listTeams()]);
  const completed = phase === "past" ? sessions.filter((s) => s.status === "COMPLETED").length : null;

  return (
    <div className="flex flex-col gap-10">
      <PageHeader title="Mentorlar" description="Mentorların müsaitliklerini gör ve takımlar adına seans planla. Seansların tamamlanma durumunu buradan takip edebilirsin." />

      <section aria-labelledby="mentor-list" className="flex flex-col gap-4">
        <h2 id="mentor-list" className="text-lg font-semibold tracking-tight">
          Mentorlar
        </h2>
        {mentors.length === 0 ? (
          <EmptyState icon={CalendarClock} title="Henüz mentor yok" description="Kullanıcılar sayfasından mentor hesabı oluşturabilirsin." />
        ) : (
          <MentorDirectory mentors={mentors} booking={{ teams: teams.map((t) => ({ id: t.id, name: t.name })) }} profileHref={null} />
        )}
      </section>

      <section aria-labelledby="sessions-heading" className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="sessions-heading" className="text-lg font-semibold tracking-tight">
            Mentorluk seansları
            {completed !== null ? (
              <span className="ml-2 font-mono text-sm font-normal text-subtle tabular-nums">
                {completed}/{sessions.length} tamamlandı
              </span>
            ) : null}
          </h2>
          <SegmentedLinks
            label="Seans dönemi"
            layoutId="admin-session-phase"
            value={phase}
            options={[
              { value: "upcoming", label: "Yaklaşan", href: "/admin/mentors" },
              { value: "past", label: "Geçmiş", href: "/admin/mentors?phase=past" },
            ]}
          />
        </div>
        {sessions.length === 0 ? (
          <EmptyState icon={CalendarClock} title={phase === "upcoming" ? "Planlanmış seans yok" : "Geçmiş seans yok"} description="Bir mentor kartından takım adına seans planlayabilirsin." />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {sessions.map((session) => (
              <div key={session.id} className="flex flex-col gap-1.5">
                <p className="px-1 text-xs text-muted-foreground">Mentor: {session.mentorName}</p>
                <MentorAppointmentCard appointment={session} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
