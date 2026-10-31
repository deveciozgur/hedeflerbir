import "server-only";
import { db } from "@/server/db";

export interface NotificationItem {
  id: string;
  title: string;
  body: string | null;
  href: string | null;
  createdAt: Date;
  read: boolean;
}

export async function getRecentNotifications(userId: string, take = 8): Promise<NotificationItem[]> {
  const rows = await db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
    select: { id: true, title: true, body: true, href: true, createdAt: true, readAt: true },
  });
  return rows.map(({ readAt, ...row }) => ({ ...row, read: readAt !== null }));
}
