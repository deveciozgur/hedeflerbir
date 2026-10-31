import type { Metadata } from "next";
import { Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { UserAvatar } from "@/components/ui/user-avatar";
import { fullName } from "@/lib/utils";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { getInstructorStudents } from "@/modules/learning/application/instructor-overview.queries";

export const metadata: Metadata = { title: "Katılımcılar" };

const pct = (value: number | null) => (value === null ? "—" : `%${value}`);

export default async function InstructorStudentsPage() {
  const viewer = await getViewer("INSTRUCTOR");
  const students = await getInstructorStudents(viewer.id);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Katılımcılar"
        description="Eğitimlerine kayıtlı katılımcılar; devam, kayıt ve ödev metrikleri yalnızca senin eğitimlerini kapsar."
      />
      {students.length === 0 ? (
        <EmptyState icon={Users} title="Kayıtlı katılımcı yok" description="Eğitimlerine katılımcı kaydedildiğinde burada listelenecek." />
      ) : (
        <Card className="gap-0 overflow-x-auto py-0">
          <table className="w-full min-w-[52rem] text-sm">
            <caption className="sr-only">Katılımcı ilerleme tablosu</caption>
            <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-5 py-3 font-medium">Katılımcı</th>
                <th scope="col" className="px-3 py-3 font-medium">Hedefleri</th>
                <th scope="col" className="px-3 py-3 text-right font-medium">Devam</th>
                <th scope="col" className="px-3 py-3 text-right font-medium">İzlenen</th>
                <th scope="col" className="px-3 py-3 text-right font-medium">Teslim</th>
                <th scope="col" className="px-3 py-3 text-right font-medium">Ödev ort.</th>
                <th scope="col" className="px-5 py-3 text-right font-medium">Proje</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {students.map((s) => (
                <tr key={s.id} className="align-top">
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-3">
                      <UserAvatar user={s} />
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{fullName(s)}</span>
                        <span className="block truncate text-xs text-muted-foreground">{s.courses.join(", ")}</span>
                      </span>
                    </span>
                  </td>
                  <td className="max-w-64 px-3 py-3 text-xs text-muted-foreground">
                    <span className="line-clamp-2">{s.goals ?? "—"}</span>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">{pct(s.attendanceRate)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{s.watched}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{s.submitted}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{pct(s.averageScore)}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{pct(s.projectProgress)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
