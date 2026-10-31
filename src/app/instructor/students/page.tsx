import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { listInstructorParticipants } from "@/modules/people/application/people.queries";
import { PersonCardGrid } from "@/modules/people/ui/person-card-grid";

export const metadata: Metadata = { title: "Katılımcılar" };

export default async function InstructorStudentsPage() {
  const viewer = await getViewer("INSTRUCTOR");
  const students = await listInstructorParticipants(viewer.id);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Katılımcılar" description={`Eğitimlerine kayıtlı ${students.length} katılımcı. Bir karta tıklayarak bölümünü, hakkındasını görebilir ve mesaj gönderebilirsin.`} />
      <PersonCardGrid
        people={students}
        canMessage
        emptyTitle="Kayıtlı katılımcı yok"
        emptyDescription="Eğitimlerine katılımcı kaydedildiğinde burada görünecek."
      />
    </div>
  );
}
