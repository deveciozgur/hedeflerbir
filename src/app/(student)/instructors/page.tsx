import type { Metadata } from "next";
import { GraduationCap } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { listInstructorsForStudents } from "@/modules/learning/application/instructor-directory.queries";
import { InstructorDirectory } from "@/modules/learning/ui/instructor-directory";

export const metadata: Metadata = { title: "Eğitmenler" };

export default async function InstructorsPage() {
  const viewer = await getViewer("STUDENT");
  const instructors = await listInstructorsForStudents(viewer.id);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Eğitmenler" description="Programdaki eğitmenler, uzmanlık alanları ve verdikleri eğitimler." />
      {instructors.length === 0 ? (
        <EmptyState icon={GraduationCap} title="Henüz eğitmen yok" description="Eğitmenler programa eklendiğinde burada listelenecek." />
      ) : (
        <section aria-label="Eğitmen listesi">
          <InstructorDirectory instructors={instructors} />
        </section>
      )}
    </div>
  );
}
