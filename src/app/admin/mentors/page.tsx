import type { Metadata } from "next";
import { CalendarClock, Hourglass } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SegmentedLinks } from "@/components/ui/segmented-links";
import { fullName } from "@/lib/utils";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { listMentors } from "@/modules/mentoring/application/mentor-directory.queries";
import { listAppointments, type MentorAppointmentRow } from "@/modules/mentoring/application/mentor-portal.queries";
import { MentorAppointmentCard } from "@/modules/mentoring/ui/mentor-appointment-card";
import { MentorDirectory } from "@/modules/mentoring/ui/mentor-directory";
import { SessionScheduleForm } from "@/modules/mentoring/ui/session-schedule-form";
import { listTeams } from "@/modules/people/application/teams.queries";

export const metadata: Metadata = { title: "Mentorlar" };

function SessionGrid({ sessions }: { sessions: MentorAppointmentRow[] }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {sessions.map((session) => (
        <div key={session.id} className="flex flex-col gap-1.5">
          <p className="px-1 text-xs text-muted-foreground">Mentor: {session.mentorName}</p>
          <MentorAppointmentCard appointment={session} />
        </div>
      ))}
    </div>
  );
}

export default async function AdminMentorsPage({ searchParams }: { searchParams: Promise<{ phase?: string }> }) {
  const [{ phase: rawPhase }] = await Promise.all([searchParams, getViewer("ADMIN")]);
  const phase = rawPhase === "past" ? "past" : "upcoming";
  const [mentors, pending, sessions, teams] = await Promise.all([listMentors(), listAppointments("pending"), listAppointments(phase), listTeams()]);
  const completed = phase === "past" ? sessions.filter((s) => s.status === "COMPLETED").length : null;
  const teamOptions = teams.map((t) => ({ id: t.id, name: t.name }));

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        title="Mentorlar"
        description="Mentorluk seanslarını sen koordine edersin: ekip ile mentor arasında seans tanımla, Onayla ile aktifleştir. Onaylanan seanslar mentorun ve ekibin panelinde görünür."
        actions={<SessionScheduleForm mentors={mentors.map((m) => ({ id: m.id, name: fullName(m) }))} teams={teamOptions} />}
      />

      <section aria-labelledby="pending-heading" className="flex flex-col gap-4">
        <h2 id="pending-heading" className="text-lg font-semibold tracking-tight">
          Onay bekleyen seanslar <span className="font-mono text-sm font-normal text-subtle tabular-nums">{pending.length}</span>
        </h2>
        {pending.length === 0 ? (
          <EmptyState icon={Hourglass} title="Onay bekleyen seans yok" description="Yeni seans ile ya da bir mentorun müsait saatinden ekip adına seans tanımlayabilirsin." />
        ) : (
          <SessionGrid sessions={pending} />
        )}
      </section>

      <section aria-labelledby="sessions-heading" className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="sessions-heading" className="text-lg font-semibold tracking-tight">
            Onaylı seanslar
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
          <EmptyState icon={CalendarClock} title={phase === "upcoming" ? "Yaklaşan onaylı seans yok" : "Geçmiş seans yok"} description="Onayladığın seanslar burada listelenir." />
        ) : (
          <SessionGrid sessions={sessions} />
        )}
      </section>

      <section aria-labelledby="mentor-list" className="flex flex-col gap-4">
        <h2 id="mentor-list" className="text-lg font-semibold tracking-tight">
          Mentorlar ve müsaitlikleri
        </h2>
        {mentors.length === 0 ? (
          <EmptyState icon={CalendarClock} title="Henüz mentor yok" description="Kullanıcılar sayfasından mentor hesabı oluşturabilirsin." />
        ) : (
          <MentorDirectory mentors={mentors} booking={{ teams: teamOptions }} profileHref={null} />
        )}
      </section>
    </div>
  );
}
