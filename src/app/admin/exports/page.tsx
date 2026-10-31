import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { db } from "@/server/db";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { ExportBuilder } from "@/modules/administration/ui/export-builder";

export const metadata: Metadata = { title: "Veri Dışa Aktarma" };

export default async function ExportsPage() {
  await getViewer("ADMIN");
  const courses = await db.course.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Veri Dışa Aktarma"
        description="Başarı, katılım, proje ve ödev verilerini filtreleyip CSV, Excel veya kurumsal PDF olarak indir."
      />
      <ExportBuilder courses={courses} />
    </div>
  );
}
