import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import type { AuditAction } from "@/modules/administration/domain/audit";

export interface AuditEvent {
  action: AuditAction;
  actorId?: string | null;
  actorEmail?: string | null;
  targetType?: string;
  targetId?: string;
  metadata?: Prisma.InputJsonObject;
}

/**
 * Appends to the audit trail. Never throws: losing an audit row must not fail the
 * user's action, so errors are logged instead.
 */
export async function recordAudit(event: AuditEvent): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        action: event.action,
        actorId: event.actorId ?? null,
        actorEmail: event.actorEmail ?? null,
        targetType: event.targetType ?? null,
        targetId: event.targetId ?? null,
        metadata: event.metadata ?? {},
      },
    });
  } catch (error) {
    console.error("[audit] write failed", { action: event.action, error: error instanceof Error ? error.message : error });
  }
}
