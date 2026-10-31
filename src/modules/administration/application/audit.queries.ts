import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { fullName } from "@/lib/utils";
import { DELETION_ACTIONS, type AuditFilter } from "../domain/audit";

export const AUDIT_PAGE_SIZE = 50;

export interface AuditRow {
  id: string;
  action: string;
  actorName: string | null;
  actorEmail: string | null;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

const whereFor = (filter: AuditFilter): Prisma.AuditLogWhereInput => {
  switch (filter) {
    case "auth":
      return { action: { startsWith: "auth." } };
    case "user":
      return { action: { startsWith: "user." } };
    case "deletion":
      return { action: { in: DELETION_ACTIONS } };
    default:
      return {};
  }
};

export async function listAuditLogs(filter: AuditFilter, page: number): Promise<{ rows: AuditRow[]; total: number }> {
  const where = whereFor(filter);
  const [rows, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * AUDIT_PAGE_SIZE,
      take: AUDIT_PAGE_SIZE,
      select: {
        id: true,
        action: true,
        actorEmail: true,
        targetType: true,
        targetId: true,
        metadata: true,
        createdAt: true,
        actor: { select: { name: true, surname: true, email: true } },
      },
    }),
    db.auditLog.count({ where }),
  ]);

  return {
    total,
    rows: rows.map(({ actor, metadata, ...row }) => ({
      ...row,
      actorName: actor ? fullName(actor) : null,
      actorEmail: actor?.email ?? row.actorEmail,
      metadata: metadata && typeof metadata === "object" && !Array.isArray(metadata) ? (metadata as Record<string, unknown>) : {},
    })),
  };
}

/** Failed sign-ins in the last 24 hours, for the page header. */
export const failedLoginsLastDay = () =>
  db.auditLog.count({ where: { action: "auth.login_failed", createdAt: { gt: new Date(Date.now() - 86_400_000) } } });
