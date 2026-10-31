import type { Metadata } from "next";
import { LifeBuoy } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SegmentedLinks } from "@/components/ui/segmented-links";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { listTickets } from "@/modules/administration/application/support.queries";
import { TICKET_STATUS_LABELS, TICKET_STATUSES } from "@/modules/administration/domain/support";
import { TicketCard } from "@/modules/administration/ui/ticket-card";

export const metadata: Metadata = { title: "Destek Masası" };

export default async function SupportDeskPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const [{ status }] = await Promise.all([searchParams, getViewer("ADMIN")]);
  const { tickets, counts } = await listTickets(status);
  const active = TICKET_STATUSES.find((s) => s === status) ?? "ALL";
  const total = counts.OPEN + counts.IN_PROGRESS + counts.RESOLVED;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Destek Masası"
        description={counts.OPEN > 0 ? `${counts.OPEN} açık talep yanıt bekliyor.` : "Açık talep yok."}
        actions={
          <SegmentedLinks
            label="Durum filtresi"
            value={active}
            options={[
              { value: "ALL", label: `Tümü (${total})`, href: "/admin/support" },
              ...TICKET_STATUSES.map((s) => ({ value: s, label: `${TICKET_STATUS_LABELS[s]} (${counts[s]})`, href: `/admin/support?status=${s}` })),
            ]}
          />
        }
      />
      {tickets.length === 0 ? (
        <EmptyState
          icon={LifeBuoy}
          title="Talep bulunamadı"
          description="Kullanıcılar hesap menüsündeki “Destek talebi” ile talep oluşturduğunda burada listelenir."
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {tickets.map((ticket) => (
            <li key={ticket.id}>
              <TicketCard ticket={ticket} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
