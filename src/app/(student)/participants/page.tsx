import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { listPeople } from "@/modules/people/application/people.queries";
import { PersonCardGrid } from "@/modules/people/ui/person-card-grid";

export const metadata: Metadata = { title: "Katılımcılar" };

export default async function ParticipantsPage() {
  const viewer = await getViewer("STUDENT");
  const participants = await listPeople("STUDENT", viewer.id);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Katılımcılar" description="Bootcamp'teki diğer katılımcılar. Karta tıklayarak okul, bölüm ve hakkında bilgisini görebilir, mesaj gönderebilirsin." />
      <PersonCardGrid people={participants} canMessage emptyTitle="Henüz başka katılımcı yok" emptyDescription="Programa yeni katılımcılar eklendiğinde burada görünecek." />
    </div>
  );
}
