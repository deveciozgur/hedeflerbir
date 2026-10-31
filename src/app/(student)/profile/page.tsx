import type { Metadata } from "next";
import { Award, CalendarCheck, ClipboardCheck, FolderKanban, PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { ProgressRing } from "@/components/ui/progress-ring";
import { StatTile } from "@/components/ui/stat-tile";
import { formatDate } from "@/lib/format";
import { fullName } from "@/lib/utils";
import { BadgeGrid } from "@/modules/engagement/ui/badge-grid";
import { getOwnProfile, getStudentProfileOverview } from "@/modules/identity/application/profile.queries";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { AvatarUploader } from "@/modules/identity/ui/avatar-uploader";
import { PasswordForm } from "@/modules/identity/ui/password-form";
import { StudentProfileForm } from "@/modules/identity/ui/profile-forms";

export const metadata: Metadata = { title: "Profilim" };

const STATUS = {
  NOT_STARTED: { label: "Başlamadı", variant: "outline" },
  IN_PROGRESS: { label: "Devam ediyor", variant: "brand" },
  COMPLETED: { label: "Tamamlandı", variant: "success" },
} as const;

export default async function StudentProfilePage() {
  const viewer = await getViewer("STUDENT");
  const [profile, overview] = await Promise.all([getOwnProfile(viewer.id), getStudentProfileOverview(viewer.id)]);
  const { stats } = overview;
  const earned = overview.badges.filter((b) => b.awardedAt).length;
  const attendance = stats.attendance.counted ? Math.round((stats.attendance.present / stats.attendance.counted) * 100) : null;

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-4">
            <AvatarUploader user={profile} />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{fullName(profile)}</h1>
              <p className="text-sm text-muted-foreground">
                {profile.email} · {formatDate(profile.createdAt)} tarihinden beri katılımcı
              </p>
            </div>
          </div>
          {overview.projects.length > 0 ? <ProgressRing value={overview.overall} label="Genel proje tamamlama oranı" size={112} /> : null}
        </CardContent>
      </Card>

      <section aria-label="Özet" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile icon={Award} label="Rozetler" value={`${earned}/${overview.badges.length}`} />
        <StatTile icon={ClipboardCheck} label="Teslim edilen ödev" value={String(stats.submitted)} />
        <StatTile icon={PlayCircle} label="İzlenen kayıt" value={String(stats.watchedRecordings)} />
        <StatTile icon={CalendarCheck} label="Devam oranı" value={attendance === null ? "—" : `%${attendance}`} />
      </section>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Projelerim</CardTitle>
            <CardDescription>Dahil olduğun projeler ve tamamlama durumun</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {overview.projects.length === 0 ? (
            <EmptyState icon={FolderKanban} title="Henüz bir projeye dahil değilsin" description="Bir projeye atandığında ilerlemen burada görünecek." className="py-8" />
          ) : (
            <ul className="flex flex-col divide-y">
              {overview.projects.map((project) => {
                const status = STATUS[project.status as keyof typeof STATUS] ?? STATUS.NOT_STARTED;
                return (
                  <li key={project.id} className="flex flex-col gap-2.5 py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-medium">{project.title}</h3>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{project.description}</p>
                    <div className="flex items-center gap-3">
                      <Progress value={project.completionPercentage} aria-label={`${project.title} ilerlemesi`} />
                      <span className="w-10 shrink-0 text-right text-sm tabular-nums">%{project.completionPercentage}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(project.startDate)} – {formatDate(project.endDate)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Rozetler</CardTitle>
            <CardDescription>Ödev, devam, kayıt izleme ve mentorluk etkinliklerinle kazanılır.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <BadgeGrid badges={overview.badges} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <StudentProfileForm defaults={{ name: profile.name, surname: profile.surname, bio: profile.bio, goals: profile.goals }} />
        <PasswordForm />
      </div>
    </div>
  );
}
