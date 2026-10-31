import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { requireRole } from "@/server/auth/guards";
import type { Role } from "../domain/role";

export interface Viewer {
  id: string;
  name: string;
  surname: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
  unreadNotifications: number;
}

/** Authorizes the request for the given roles and loads the shell's viewer model. */
export const getViewer = cache(async (...roles: Role[]): Promise<Viewer> => {
  const session = await requireRole(...roles);
  const user = await db.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      name: true,
      surname: true,
      email: true,
      role: true,
      avatarUrl: true,
      _count: { select: { notifications: { where: { readAt: null } } } },
    },
  });
  // requireRole already rejects revoked sessions; this covers a deletion racing the request.
  if (!user) redirect("/logout");

  return {
    id: user.id,
    name: user.name,
    surname: user.surname,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    unreadNotifications: user._count.notifications,
  };
});
