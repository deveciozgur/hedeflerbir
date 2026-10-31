import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { listParticipantsForAdmin } from "@/modules/people/application/people.queries";
import { listTeams } from "@/modules/people/application/teams.queries";
import { ParticipantAdminPanel } from "@/modules/people/ui/participant-admin-panel";
import { PersonCardGrid } from "@/modules/people/ui/person-card-grid";
import { TeamManager } from "@/modules/people/ui/team-manager";

export const metadata: Metadata = { title: "Katılımcılar" };

export default async function AdminParticipantsPage() {
  await getViewer("ADMIN");
  const [participants, teams] = await Promise.all([listParticipantsForAdmin(), listTeams()]);
  const teamOptions = teams.map((t) => ({ id: t.id, name: t.name }));

  return (
    <div className="flex flex-col gap-10">
      <PageHeader title="Katılımcılar" description={`${participants.length} aktif katılımcı. Karta tıklayarak bölüm, hakkında ve takım bilgisini görebilir; takım ve rozet atayabilirsin.`} />
      <TeamManager teams={teams} />
      <section aria-labelledby="participants-heading" className="flex flex-col gap-4">
        <h2 id="participants-heading" className="text-lg font-semibold tracking-tight">
          Tüm katılımcılar
        </h2>
        <PersonCardGrid
          people={participants}
          canMessage
          emptyTitle="Henüz katılımcı yok"
          emptyDescription="Kullanıcılar sayfasından tek tek ya da CSV ile katılımcı ekleyebilirsin."
          details={Object.fromEntries(
            participants.map((p) => [p.id, <ParticipantAdminPanel key={p.id} userId={p.id} teamId={p.teamId} teams={teamOptions} badgeCodes={p.badgeCodes} />]),
          )}
        />
      </section>
    </div>
  );
}
