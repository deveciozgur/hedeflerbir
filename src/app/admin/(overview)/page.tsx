import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarCheck2, Download, Hourglass, Plus, Sparkles, UserRoundCheck, UserRoundX, Users, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BENTO_SPAN, BentoGrid } from "@/components/ui/bento";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";
import { getProgramOverview } from "@/modules/administration/application/program-overview.queries";
import { setUserActiveAction } from "@/modules/administration/application/user-admin.actions";
import { ImportUsersDialog } from "@/modules/administration/ui/import-users-dialog";
import { WeekCalendar } from "@/modules/administration/ui/week-calendar";
import { AnnouncementDialog } from "@/modules/engagement/ui/announcement-dialog";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { listProgramOptions } from "@/modules/learning/application/trainings.queries";
import { TrainingFormDialog } from "@/modules/learning/ui/training-form-dialog";
import { listPeople } from "@/modules/people/application/people.queries";
import { listTeamCandidates, listTeams } from "@/modules/people/application/teams.queries";
import { NewTeamButton } from "@/modules/people/ui/team-manager";

export const metadata: Metadata = { title: "Ana Sayfa" };

/** "+3 bu hafta" pill; nothing new reads as neutral, not as a fake zero growth badge. */
const weekTrend = (n: number) => ({ label: n > 0 ? `+${n} bu hafta` : "bu hafta yok", tone: n > 0 ? ("good" as const) : ("neutral" as const) });

const linkClass = "inline-flex items-center gap-1 rounded-sm text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring";
const rowClass =
  "flex items-center gap-3 rounded-lg px-2 py-2 outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export default async function AdminHomePage() {
  const viewer = await getViewer("ADMIN");
  const [o, courses, instructors, teams, candidates] = await Promise.all([
    getProgramOverview(),
    listProgramOptions(),
    listPeople("INSTRUCTOR"),
    listTeams(),
    listTeamCandidates(),
  ]);
  const actionCount = o.pendingCount + o.teamsWithoutRepresentative + o.suspendedCount;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={`Merhaba, ${viewer.name}`} description="Programın operasyon merkezi: göstergeler, haftalık takvim ve senden aksiyon bekleyenler." />

      <nav aria-label="Hızlı işlemler" className="flex flex-wrap gap-2">
        <TrainingFormDialog
          instructors={instructors}
          trigger={
            <Button disabled={instructors.length === 0}>
              <Plus aria-hidden /> Yeni canlı eğitim
            </Button>
          }
        />
        <NewTeamButton teams={teams} candidates={candidates} />
        <ImportUsersDialog />
        <Button asChild variant="outline">
          <Link href="/admin/reports#export-heading">
            <Download aria-hidden /> Rapor indir
          </Link>
        </Button>
        <AnnouncementDialog courses={courses} />
      </nav>

      <BentoGrid>
        <section aria-label="Ana metrikler" className="contents">
          <div className={BENTO_SPAN.kpi}>
            <StatTile icon={Users} tone="brand" label="Aktif katılımcı" value={String(o.stats.participants)} trend={weekTrend(o.weekly.participants)} />
          </div>
          <div className={BENTO_SPAN.kpi}>
            <StatTile icon={UsersRound} tone="cyan" label="Kurulan ekip" value={String(o.stats.teams)} trend={weekTrend(o.weekly.teams)} hint={o.teamsWithoutRepresentative > 0 ? `${o.teamsWithoutRepresentative} ekibin temsilcisi yok` : "Tüm ekiplerin temsilcisi var"} />
          </div>
          <div className={BENTO_SPAN.kpi}>
            <StatTile
              icon={CalendarCheck2}
              tone="brand"
              label="Gerçekleşen canlı eğitim"
              value={`${o.trainings.held}/${o.trainings.total}`}
              trend={weekTrend(o.weekly.heldTrainings)}
              hint={`Programın %${o.trainings.percent} kadarı tamamlandı`}
            />
          </div>
          <div className={BENTO_SPAN.kpi}>
            <StatTile icon={Sparkles} tone="amber" label="Onaylanan mentorluk seansı" value={String(o.stats.approvedSessions)} trend={weekTrend(o.weekly.approvedSessions)} hint={o.pendingCount > 0 ? `${o.pendingCount} seans onay bekliyor` : "Onay bekleyen yok"} />
          </div>
        </section>

        <section aria-label="Haftalık takvim" className={BENTO_SPAN.mainWide}>
          <WeekCalendar week={o.week} />
        </section>

        <section aria-label="Ekipler ve aksiyonlar" className={cn(BENTO_SPAN.sideWide, "grid gap-4 lg:grid-cols-2 xl:flex xl:flex-col")}>
          <Card className="gap-3 py-5">
            <CardHeader>
              <CardTitle>
                Aksiyon bekleyenler <span className="font-mono text-xs font-normal text-subtle tabular-nums">{actionCount}</span>
              </CardTitle>
              <Link href="/admin/mentors" className={linkClass}>
                Seanslar <ArrowRight className="size-3" aria-hidden />
              </Link>
            </CardHeader>
            <CardContent>
              {actionCount === 0 ? (
                <p className="pb-1 text-sm text-muted-foreground">Onay bekleyen seans, temsilcisiz ekip ya da askıdaki hesap yok.</p>
              ) : (
                <ul className="-mx-2 flex flex-col">
                  {o.pendingSessions.map((p) => (
                    <li key={p.id}>
                      <Link href="/admin/mentors" className={rowClass}>
                        <span className="grid size-7 shrink-0 place-items-center rounded-md bg-amber/20 text-foreground" aria-hidden>
                          <Hourglass className="size-3.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{p.team}</span>
                          <span className="block truncate text-xs text-subtle">
                            {p.mentor} · <span className="font-mono tabular-nums">{formatDateTime(p.start)}</span>
                          </span>
                        </span>
                        <Badge variant="warning">Onayla</Badge>
                      </Link>
                    </li>
                  ))}
                  {o.pendingCount > o.pendingSessions.length ? (
                    <li className="px-2 py-1 text-xs text-subtle">+{o.pendingCount - o.pendingSessions.length} seans daha onay bekliyor</li>
                  ) : null}
                  {o.teamsWithoutRepresentative > 0 ? (
                    <li>
                      <Link href="/admin/teams" className={rowClass}>
                        <span className="grid size-7 shrink-0 place-items-center rounded-md bg-magenta/10 text-magenta-soft" aria-hidden>
                          <UserRoundX className="size-3.5" />
                        </span>
                        <span className="min-w-0 flex-1 text-sm">
                          <span className="font-mono tabular-nums">{o.teamsWithoutRepresentative}</span> ekibin temsilcisi yok
                        </span>
                        <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                      </Link>
                    </li>
                  ) : null}
                </ul>
              )}
              {o.suspended.length > 0 ? (
                <div className="mt-2 flex flex-col gap-1 border-t border-border pt-3">
                  <p className="text-xs font-medium text-subtle">
                    Askıdaki hesaplar <span className="font-mono tabular-nums">{o.suspendedCount}</span>
                  </p>
                  <ul className="flex flex-col">
                    {o.suspended.map((u) => (
                      <li key={u.id} className="flex items-center justify-between gap-3 py-1.5">
                        <span className="min-w-0">
                          <span className="block truncate text-sm">{u.name}</span>
                          <span className="block truncate text-xs text-subtle">{u.email}</span>
                        </span>
                        <ConfirmActionButton
                          variant="outline"
                          label="Etkinleştir"
                          title="Hesap yeniden etkinleştirilsin mi?"
                          description={`${u.name} tekrar giriş yapabilecek.`}
                          confirmLabel="Etkinleştir"
                          successMessage="Hesap etkinleştirildi"
                          action={setUserActiveAction.bind(null, { userId: u.id, active: true })}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <Link href="/admin/users" className={cn(rowClass, "-mx-2 mt-1 border-t border-border pt-3")}>
                <span className="grid size-7 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground" aria-hidden>
                  <UserRoundX className="size-3.5" />
                </span>
                <span className="min-w-0 flex-1 text-sm">Kullanıcı askıya al / etkinleştir</span>
                <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              </Link>
            </CardContent>
          </Card>

          <Card className="gap-3 py-5">
            <CardHeader>
              <CardTitle>Son kurulan ekipler</CardTitle>
              <Link href="/admin/teams" className={linkClass}>
                Ekipler <ArrowRight className="size-3" aria-hidden />
              </Link>
            </CardHeader>
            <CardContent>
              {o.recentTeams.length === 0 ? (
                <p className="text-sm text-muted-foreground">Henüz ekip yok.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {o.recentTeams.map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{t.name}</span>
                        <span className="flex items-center gap-1 truncate text-xs text-subtle">
                          <UserRoundCheck className="size-3 shrink-0" aria-hidden />
                          {t.representative ?? "Temsilci seçilmedi"}
                        </span>
                      </span>
                      <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">{t.memberCount} üye</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>
      </BentoGrid>
    </div>
  );
}
