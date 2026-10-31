"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db";
import { requireRole } from "@/server/auth/guards";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { ROLES } from "@/modules/identity/domain/role";

export async function markNotificationReadAction(notificationId: unknown): Promise<ActionResult> {
  const user = await requireRole(...ROLES);
  const id = z.string().min(1).safeParse(notificationId);
  if (!id.success) return fail("Geçersiz bildirim.");

  await db.notification.updateMany({ where: { id: id.data, userId: user.id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/", "layout");
  return ok(undefined);
}

export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  const user = await requireRole(...ROLES);
  await db.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/", "layout");
  return ok(undefined);
}
