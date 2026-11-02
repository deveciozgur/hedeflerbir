import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { listTeamCandidates, listTeams } from "@/modules/people/application/teams.queries";
import { TeamManager } from "@/modules/people/ui/team-manager";

export const metadata: Metadata = { title: "Ekipler" };

export default async function AdminTeamsPage() {
  await getViewer("ADMIN");
  const [teams, candidates] = await Promise.all([listTeams(), listTeamCandidates()]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Ekipler"
        description="Ekipleri, üyelerini ve ekip temsilcisini buradan yönet. Bilgiler katılımcıların Ekibim sayfasına otomatik yansır; düzenleme yetkisi yalnızca yöneticidedir."
      />
      <TeamManager teams={teams} candidates={candidates} />
    </div>
  );
}
