import "server-only";
import { db } from "@/server/db";
import type { Role } from "@/modules/identity/domain/role";
import { TICKET_STATUSES, type TicketStatus } from "../domain/support";

export interface TicketRow {
  id: string;
  subject: string;
  content: string;
  status: TicketStatus;
  createdAt: Date;
  updatedAt: Date;
  requester: { id: string; name: string; surname: string; email: string; role: Role; avatarUrl: string | null };
}

export async function listTickets(status?: string): Promise<{ tickets: TicketRow[]; counts: Record<TicketStatus, number> }> {
  const filter = TICKET_STATUSES.find((s) => s === status);
  const [tickets, grouped] = await Promise.all([
    db.supportTicket.findMany({
      where: filter ? { status: filter } : {},
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 200,
      select: {
        id: true,
        subject: true,
        content: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        requester: { select: { id: true, name: true, surname: true, email: true, role: true, avatarUrl: true } },
      },
    }),
    db.supportTicket.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const counts = { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0 } satisfies Record<TicketStatus, number>;
  for (const g of grouped) counts[g.status] = g._count._all;
  return { tickets, counts };
}
