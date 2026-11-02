import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { listPeople } from "@/modules/people/application/people.queries";
import { PersonCardGrid } from "@/modules/people/ui/person-card-grid";

export const metadata: Metadata = { title: "Katılımcılar" };

export default async function InstructorStudentsPage() {
  await getViewer("INSTRUCTOR");
  const students = await listPeople("STUDENT");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Katılımcılar" description={`Programdaki ${students.length} katılımcı. Bir karta tıklayarak okul, bölüm ve hakkında bilgisini görebilir, mesaj gönderebilirsin.`} />
      <PersonCardGrid
        people={students}
        canMessage
        emptyTitle="Henüz katılımcı yok"
        emptyDescription="Programa katılımcı eklendiğinde burada görünecek."
      />
    </div>
  );
}
