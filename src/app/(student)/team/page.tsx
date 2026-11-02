import type { Metadata } from "next";
import { Target, UserRoundCheck, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { fullName } from "@/lib/utils";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { getMyTeam } from "@/modules/people/application/people.queries";
import { PersonAvatar, PersonCardGrid } from "@/modules/people/ui/person-card-grid";

export const metadata: Metadata = { title: "Ekibim" };

export default async function MyTeamPage() {
  const viewer = await getViewer("STUDENT");
  const team = await getMyTeam(viewer.id);

  if (!team) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Ekibim" />
        <EmptyState icon={Users} title="Henüz bir ekipte değilsin" description="Program yönetimi seni bir ekibe eklediğinde ekip bilgilerin burada görünecek." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={team.name} description="Ekip bilgilerini program yönetimi düzenler." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="size-4 text-muted-foreground" aria-hidden /> Projede çözmek istediğiniz sorun
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">{team.focusArea || "Henüz eklenmedi."}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserRoundCheck className="size-4 text-muted-foreground" aria-hidden /> Ekip temsilcisi
              </CardTitle>
              <CardDescription>Ekip temsilcisi lider değildir, mentorlerle randevuların kurulmasını kolaylaştıran kişidir.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {team.representative ? (
              <div className="flex items-center gap-3">
                <PersonAvatar person={team.representative} className="size-12" />
                <p className="font-medium">
                  {fullName(team.representative)}
                  {team.representative.id === viewer.id ? <span className="font-normal text-muted-foreground"> (sen)</span> : null}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Henüz belirlenmedi.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <section aria-labelledby="members-heading" className="flex flex-col gap-4">
        <h2 id="members-heading" className="text-lg font-semibold tracking-tight">
          Ekip üyeleri <span className="font-mono text-sm font-normal text-subtle tabular-nums">{team.members.length}</span>
        </h2>
        <PersonCardGrid people={team.members} viewerId={viewer.id} canMessage emptyTitle="Ekibinde henüz kimse yok" />
      </section>
    </div>
  );
}
