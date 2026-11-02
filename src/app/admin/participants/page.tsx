import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { listParticipantsForAdmin } from "@/modules/people/application/people.queries";
import { ParticipantAdminPanel } from "@/modules/people/ui/participant-admin-panel";
import { PersonCardGrid } from "@/modules/people/ui/person-card-grid";

export const metadata: Metadata = { title: "Katılımcılar" };

export default async function AdminParticipantsPage() {
  await getViewer("ADMIN");
  const participants = await listParticipantsForAdmin();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Katılımcılar"
        description={`${participants.length} aktif katılımcı. Karta tıklayarak katılımcının profiline girdiği tüm bilgileri görebilir, rozet verebilir ve mesaj gönderebilirsin. Ekipleri Ekipler sayfasından yönetirsin.`}
      />
      <PersonCardGrid
        people={participants}
        canMessage
        emptyTitle="Henüz katılımcı yok"
        emptyDescription="Kullanıcılar sayfasından tek tek ya da CSV ile katılımcı ekleyebilirsin."
        details={Object.fromEntries(participants.map((p) => [p.id, <ParticipantAdminPanel key={p.id} userId={p.id} badgeCodes={p.badgeCodes} />]))}
      />
    </div>
  );
}
