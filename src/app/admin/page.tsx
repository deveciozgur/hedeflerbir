import type { Metadata } from "next";
import { Activity, Award, CalendarCheck2, ClipboardCheck, Clock, GraduationCap, Trophy, UserCheck } from "lucide-react";
import { ColumnChart } from "@/components/charts/column-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { getAdminAnalytics } from "@/modules/administration/application/analytics.queries";
import { AnnouncementDialog } from "@/modules/engagement/ui/announcement-dialog";

export const metadata: Metadata = { title: "Analitik" };

const pct = (value: number | null) => (value === null ? "-" : `%${value}`);

export default async function AdminAnalyticsPage() {
  await getViewer("ADMIN");
  const a = await getAdminAnalytics();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Analitik"
        description={`${a.totals.students} katılımcı · ${a.totals.instructors} eğitmen · ${a.totals.mentors} mentor · ${a.totals.courses} eğitim`}
        actions={<AnnouncementDialog courses={a.courses.map((c) => ({ id: c.id, title: c.title }))} />}
      />

      <section aria-label="Temel metrikler" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile icon={UserCheck} label="Retention (14 gün)" value={pct(a.retention)} hint="Son 14 günde aktif katılımcı" />
        <StatTile icon={GraduationCap} label="Devam oranı" value={pct(a.attendance)} hint="Mazeretliler hariç" />
        <StatTile icon={ClipboardCheck} label="Ödev teslim oranı" value={pct(a.submissionRate)} hint="Süresi dolan ödevler" />
        <StatTile icon={Trophy} label="Ödev ortalaması" value={pct(a.averageScore)} hint="Değerlendirilen teslimler" />
        <StatTile icon={CalendarCheck2} label="Mentorluk tamamlama" value={pct(a.mentoringCompletion)} hint="İptaller dahil" />
        <StatTile icon={Activity} label="Bu hafta aktif" value={String(a.weeklyActive.at(-1)?.value ?? 0)} hint="Tekil katılımcı" />
        <StatTile icon={Award} label="Eğitim tamamlama" value={pct(a.courseCompletion)} hint="Ders bazlı eğitimlerde sertifika alan kayıt" />
        <StatTile icon={Clock} label="Bu hafta izlenme" value={`${a.watchHoursThisWeek} sa`} hint="Video ve ders kaydı" />
      </section>

      <section aria-label="Grafikler" className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Haftalık aktif katılımcı</CardTitle>
              <CardDescription>Kayıt izleme, ödev teslimi, canlı derse katılım veya mentor randevusu · son 8 hafta</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ColumnChart data={a.weeklyActive} title="Haftalık aktif katılımcı, son 8 hafta" unit="katılımcı" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Haftalık izlenme süresi</CardTitle>
              <CardDescription>Katılımcıların izlediği video ve kayıt süresi (saat) · son 8 hafta</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ColumnChart data={a.weeklyWatchHours} title="Haftalık izlenme süresi, son 8 hafta" unit="saat" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Ödev başarı dağılımı</CardTitle>
              <CardDescription>Değerlendirilen teslimlerin puan yüzdesine göre dağılımı</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ColumnChart data={a.scoreBands} title="Ödev puan dağılımı" unit="teslim" />
          </CardContent>
        </Card>
      </section>

      <section aria-label="Kırılımlar" className="grid gap-4 xl:grid-cols-2">
        <Card className="gap-3">
          <CardHeader>
            <CardTitle>Eğitim bazında</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto px-0">
            <table className="w-full min-w-[30rem] text-sm">
              <caption className="sr-only">Eğitim bazında metrikler</caption>
              <thead className="border-y bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-5 py-2.5 font-medium">Eğitim</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">Katılımcı</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">Tamamlama</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">Devam</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">Teslim</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-medium">Ort. puan</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {a.courses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-6 text-center text-muted-foreground">Henüz eğitim yok.</td>
                  </tr>
                ) : (
                  a.courses.map((c) => (
                    <tr key={c.id}>
                      <td className="max-w-56 truncate px-5 py-2.5 font-medium">{c.title}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{c.enrolled}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{pct(c.lessonCompletion)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{pct(c.attendance)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{pct(c.submissionRate)}</td>
                      <td className="px-5 py-2.5 text-right tabular-nums">{pct(c.averageScore)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="gap-3">
          <CardHeader>
            <CardTitle>Mentorluk seansları</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto px-0">
            <table className="w-full min-w-[30rem] text-sm">
              <caption className="sr-only">Mentor bazında seans metrikleri</caption>
              <thead className="border-y bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-5 py-2.5 font-medium">Mentor</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">Tamamlanan</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">İptal</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">Yaklaşan</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-medium">Tamamlama</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {a.mentors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-6 text-center text-muted-foreground">Henüz mentor yok.</td>
                  </tr>
                ) : (
                  a.mentors.map((m) => (
                    <tr key={m.id}>
                      <td className="max-w-56 truncate px-5 py-2.5 font-medium">{m.name}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{m.completed}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{m.cancelled}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{m.upcoming}</td>
                      <td className="px-5 py-2.5 text-right tabular-nums">{pct(m.completion)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
