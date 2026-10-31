"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db";
import { requireRole } from "@/server/auth/guards";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { ROLES } from "@/modules/identity/domain/role";
import { threadPath } from "@/modules/messaging/domain/contact-policy";
import { previewOf } from "@/modules/messaging/domain/thread";
import { ticketInputSchema, ticketReplySchema, ticketStatusSchema } from "../domain/support";

/** Any signed-in user can open a ticket; every active admin is notified. */
export async function createTicketAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await requireRole(...ROLES);
  const parsed = ticketInputSchema.safeParse(input);
  if (!parsed.success) return fail("Lütfen alanları kontrol edin.", z.flattenError(parsed.error).fieldErrors);

  const admins = await db.user.findMany({ where: { role: "ADMIN", isActive: true }, select: { id: true } });
  const ticket = await db.$transaction(async (tx) => {
    const created = await tx.supportTicket.create({ data: { requesterId: user.id, ...parsed.data }, select: { id: true } });
    await tx.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        type: "SYSTEM" as const,
        title: `Yeni destek talebi: ${parsed.data.subject}`,
        body: previewOf(parsed.data.content, 80),
        href: "/admin/support",
      })),
    });
    return created;
  });

  revalidatePath("/admin/support");
  return ok({ id: ticket.id });
}

export async function updateTicketStatusAction(input: unknown): Promise<ActionResult> {
  await requireRole("ADMIN");
  const parsed = ticketStatusSchema.safeParse(input);
  if (!parsed.success) return fail("Geçersiz istek.");

  const ticket = await db.supportTicket.findUnique({ where: { id: parsed.data.ticketId }, select: { id: true, subject: true, requesterId: true, status: true } });
  if (!ticket) return fail("Talep bulunamadı.");
  if (ticket.status === parsed.data.status) return ok(undefined);

  await db.$transaction([
    db.supportTicket.update({ where: { id: ticket.id }, data: { status: parsed.data.status } }),
    ...(parsed.data.status === "RESOLVED"
      ? [
          db.notification.create({
            data: { userId: ticket.requesterId, type: "SYSTEM", title: "Destek talebin çözüldü", body: ticket.subject },
          }),
        ]
      : []),
  ]);

  revalidatePath("/admin/support");
  return ok(undefined);
}

/** Replies through the messaging center so the conversation continues in the requester's inbox. */
export async function replyToTicketAction(input: unknown): Promise<ActionResult<{ threadId: string }>> {
  const admin = await requireRole("ADMIN");
  const parsed = ticketReplySchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Geçersiz yanıt.");

  const ticket = await db.supportTicket.findUnique({
    where: { id: parsed.data.ticketId },
    select: { id: true, subject: true, status: true, requester: { select: { id: true, role: true, isActive: true } } },
  });
  if (!ticket) return fail("Talep bulunamadı.");
  if (!ticket.requester.isActive) return fail("Talep sahibinin hesabı aktif değil.");

  const subject = `Destek: ${ticket.subject}`.slice(0, 150);
  const thread = await db.$transaction(async (tx) => {
    const root = await tx.message.create({
      data: { senderId: admin.id, receiverId: ticket.requester.id, subject, content: parsed.data.content },
      select: { id: true },
    });
    await tx.notification.create({
      data: {
        userId: ticket.requester.id,
        type: "NEW_MESSAGE",
        title: `Destek talebine yanıt: ${ticket.subject}`,
        body: previewOf(parsed.data.content, 80),
        href: threadPath(ticket.requester.role, root.id),
      },
    });
    if (ticket.status === "OPEN") await tx.supportTicket.update({ where: { id: ticket.id }, data: { status: "IN_PROGRESS" } });
    return root;
  });

  revalidatePath("/admin/support");
  revalidatePath("/admin/messages", "layout");
  return ok({ threadId: thread.id });
}
