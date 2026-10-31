import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { isRole, type Role } from "@/modules/identity/domain/role";

export interface AdminUserRow {
  id: string;
  name: string;
  surname: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: Date;
}

export interface UserFilters {
  q?: string;
  role?: string;
}

const PAGE_SIZE = 200;

export async function listUsers({ q, role }: UserFilters): Promise<{ users: AdminUserRow[]; counts: Record<Role, number> }> {
  const term = q?.trim();
  const where: Prisma.UserWhereInput = {
    ...(isRole(role) ? { role } : {}),
    ...(term
      ? {
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { surname: { contains: term, mode: "insensitive" } },
            { email: { contains: term, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [users, grouped] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      take: PAGE_SIZE,
      select: { id: true, name: true, surname: true, email: true, role: true, avatarUrl: true, isActive: true, createdAt: true },
    }),
    db.user.groupBy({ by: ["role"], _count: { _all: true } }),
  ]);

  const counts = { STUDENT: 0, INSTRUCTOR: 0, MENTOR: 0, ADMIN: 0 } satisfies Record<Role, number>;
  for (const g of grouped) counts[g.role] = g._count._all;
  return { users, counts };
}
