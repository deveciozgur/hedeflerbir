"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db";
import { requireRole } from "@/server/auth/guards";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { ROLES } from "@/modules/identity/domain/role";
import { canMessage, MESSAGES_PATH, threadPath } from "../domain/contact-policy";
import { newThreadSchema, replySchema, threadIdSchema } from "../domain/schemas";
import { counterpartId, isParticipant, previewOf } from "../domain/thread";

const revalidateInboxes = () => {
  for (const path of Object.values(MESSAGES_PATH)) revalidatePath(path, "layout");
};

export async function startThreadAction(input: unknown): Promise<ActionResult<{ threadId: string }>> {
  const sender = await requireRole(...ROLES);
  const parsed = newThreadSchema.safeParse(input);
  if (!parsed.success) return fail("Lütfen alanları kontrol edin.", z.flattenError(parsed.error).fieldErrors);

  const receiver = await db.user.findFirst({
    where: { id: parsed.data.receiverId, isActive: true },
    select: { id: true, role: true },
  });
  if (!receiver || receiver.id === sender.id) return fail("Alıcı bulunamadı.");
  if (!canMessage(sender.role, receiver.role)) return fail("Bu kullanıcıya mesaj gönderme yetkiniz yok.");

  const thread = await db.$transaction(async (tx) => {
    const root = await tx.message.create({
      data: { senderId: sender.id, receiverId: receiver.id, subject: parsed.data.subject, content: parsed.data.content },
      select: { id: true },
    });
    await tx.notification.create({
      data: {
        userId: receiver.id,
        type: "NEW_MESSAGE",
        title: `Yeni mesaj: ${parsed.data.subject}`,
        body: previewOf(parsed.data.content, 80),
        href: threadPath(receiver.role, root.id),
      },
    });
    return root;
  });

  revalidateInboxes();
  return ok({ threadId: thread.id });
}

export async function replyAction(input: unknown): Promise<ActionResult<{ messageId: string }>> {
  const sender = await requireRole(...ROLES);
  const parsed = replySchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Mesaj geçersiz.");

  const root = await db.message.findFirst({
    where: { id: parsed.data.threadId, parentId: null },
    select: {
      id: true,
      subject: true,
      senderId: true,
      receiverId: true,
      sender: { select: { role: true, isActive: true } },
      receiver: { select: { role: true, isActive: true } },
    },
  });
  if (!root || !isParticipant(root, sender.id)) return fail("Konuşma bulunamadı.");

  const receiverId = counterpartId(root, sender.id);
  const receiver = receiverId === root.senderId ? root.sender : root.receiver;
  if (!receiver.isActive) return fail("Bu kullanıcının hesabı artık aktif değil.");

  const message = await db.$transaction(async (tx) => {
    const created = await tx.message.create({
      data: { senderId: sender.id, receiverId, parentId: root.id, subject: root.subject, content: parsed.data.content },
      select: { id: true },
    });
    await tx.notification.create({
      data: {
        userId: receiverId,
        type: "NEW_MESSAGE",
        title: `Yanıt: ${root.subject}`,
        body: previewOf(parsed.data.content, 80),
        href: threadPath(receiver.role, root.id),
      },
    });
    return created;
  });

  revalidateInboxes();
  return ok({ messageId: message.id });
}

/** Marks every message in the thread addressed to the viewer — and the matching notifications — as read. */
export async function markThreadReadAction(threadId: unknown): Promise<ActionResult> {
  const viewer = await requireRole(...ROLES);
  const id = threadIdSchema.safeParse(threadId);
  if (!id.success) return fail("Geçersiz konuşma.");

  const now = new Date();
  await db.$transaction([
    db.message.updateMany({
      where: { receiverId: viewer.id, readAt: null, OR: [{ id: id.data }, { parentId: id.data }] },
      data: { readAt: now },
    }),
    db.notification.updateMany({
      where: { userId: viewer.id, type: "NEW_MESSAGE", readAt: null, href: { endsWith: `/${id.data}` } },
      data: { readAt: now },
    }),
  ]);

  revalidateInboxes();
  return ok(undefined);
}
