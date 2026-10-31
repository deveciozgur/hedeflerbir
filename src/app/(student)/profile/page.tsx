import type { Metadata } from "next";
import { Award, CalendarCheck, Download, GraduationCap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import { formatDate } from "@/lib/format";
import { fullName } from "@/lib/utils";
import { attendanceRate } from "@/modules/engagement/domain/badges";
import { BadgeGrid } from "@/modules/engagement/ui/badge-grid";
import { getOwnProfile, getStudentProfileOverview } from "@/modules/identity/application/profile.queries";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { AvatarUploader } from "@/modules/identity/ui/avatar-uploader";
import { PasswordForm } from "@/modules/identity/ui/password-form";
import { StudentProfileForm } from "@/modules/identity/ui/profile-forms";
import { getStudentCertificates } from "@/modules/learning/application/certificate.queries";
import { getTrainingProgress } from "@/modules/learning/application/trainings.queries";
import { getMyTeam } from "@/modules/people/application/people.queries";

export const metadata: Metadata = { title: "Profilim" };

export default async function StudentProfilePage() {
  const viewer = await getViewer("STUDENT");
  const [profile, overview, certificates, trainings, team] = await Promise.all([
    getOwnProfile(viewer.id),
    getStudentProfileOverview(viewer.id),
    getStudentCertificates(viewer.id),
    getTrainingProgress(viewer.id),
    getMyTeam(viewer.id),
  ]);
  const earned = overview.badges.filter((b) => b.awardedAt).length;
  const attendance = attendanceRate(overview.stats.attendance);

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardContent className="flex flex-col gap-4">
          <AvatarUploader user={profile} />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{fullName(profile)}</h1>
            <p className="text-sm text-muted-foreground">
              {[profile.department, profile.email].filter(Boolean).join(" · ")} · {formatDate(profile.createdAt)} tarihinden beri katılımcı
            </p>
          </div>
        </CardContent>
      </Card>

      <section aria-label="Özet" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile icon={CalendarCheck} label="Devam oranı" value={attendance === null ? "-" : `%${attendance}`} hint="Canlı eğitim yoklamalarına göre" />
        <StatTile icon={GraduationCap} label="Tamamlanan eğitim" value={`${trainings.completed}/${trainings.total}`} />
        <StatTile icon={Award} label="Rozetler" value={`${earned}/${overview.badges.length}`} />
        <StatTile icon={Users} label="Takım" value={team?.name ?? "-"} />
      </section>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Rozetlerim</CardTitle>
            <CardDescription>Konu rozetleri ilgili canlı eğitime katılınca, mentorluk rozetleri tamamlanan seanslarla kazanılır.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <BadgeGrid badges={overview.badges} />
        </CardContent>
      </Card>

      {certificates.length > 0 ? (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Sertifikalarım</CardTitle>
              <CardDescription>Doğrulanabilir sertifikaların</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col divide-y">
              {certificates.map((certificate) => (
                <li key={certificate.code} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <h3 className="truncate text-sm font-medium">{certificate.courseTitle}</h3>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(certificate.issuedAt)} · <span className="font-mono">{certificate.code}</span>
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <a href={`/api/certificates/${certificate.code}`} target="_blank" rel="noopener noreferrer">
                      <Download aria-hidden /> PDF
                    </a>
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <StudentProfileForm
          defaults={{ name: profile.name, surname: profile.surname, bio: profile.bio, goals: profile.goals, department: profile.department, city: profile.city }}
        />
        <PasswordForm />
      </div>
    </div>
  );
}
