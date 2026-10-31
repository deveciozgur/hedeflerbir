import type { Metadata } from "next";
import { Users } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { getMyTeam } from "@/modules/people/application/people.queries";
import { PersonCardGrid } from "@/modules/people/ui/person-card-grid";

export const metadata: Metadata = { title: "Ekibim" };

export default async function MyTeamPage() {
  const viewer = await getViewer("STUDENT");
  const team = await getMyTeam(viewer.id);

  if (!team) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Ekibim" />
        <EmptyState icon={Users} title="Henüz bir takımda değilsin" description="Program yönetimi seni bir takıma eklediğinde takım arkadaşların burada görünecek." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={team.name} description={team.focusArea ? `Çalışma alanı: ${team.focusArea}` : "Takım arkadaşların"} />
      <PersonCardGrid people={team.members} canMessage emptyTitle="Takımında henüz başka kimse yok" />
    </div>
  );
}
