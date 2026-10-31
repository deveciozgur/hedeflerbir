"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/server/db";
import { requireRole } from "@/server/auth/guards";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import type { Role } from "@/modules/identity/domain/role";
import {
  activationSchema,
  canChangeRole,
  canSetActive,
  createUserSchema,
  generateTemporaryPassword,
  roleChangeSchema,
} from "../domain/user-admin";

const activeAdminCount = () => db.user.count({ where: { role: "ADMIN", isActive: true } });

const loadTarget = (userId: string) =>
  db.user.findUnique({ where: { id: userId }, select: { id: true, role: true, isActive: true } });

/** Data-dependent guards: a role can't be removed while the user still owns work tied to it. */
async function roleDependencyError(userId: string, from: Role): Promise<string | null> {
  if (from === "INSTRUCTOR" && (await db.course.count({ where: { instructorId: userId } })) > 0) {
    return "Bu eğitmenin atanmış eğitimleri var. Önce eğitimleri başka bir eğitmene atayın.";
  }
  if (
    from === "MENTOR" &&
    (await db.appointment.count({ where: { mentorId: userId, status: "CONFIRMED", slot: { startTime: { gt: new Date() } } } })) > 0
  ) {
    return "Bu mentorun yaklaşan randevuları var. Önce randevuları iptal edin.";
  }
  return null;
}

export async function createUserAction(input: unknown): Promise<ActionResult<{ temporaryPassword: string }>> {
  await requireRole("ADMIN");
  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) return fail("Lütfen alanları kontrol edin.", z.flattenError(parsed.error).fieldErrors);

  if (await db.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } })) {
    return fail("Bu e-posta ile kayıtlı bir kullanıcı zaten var.", { email: ["Bu e-posta kullanımda."] });
  }

  const temporaryPassword = generateTemporaryPassword();
  await db.user.create({
    data: { ...parsed.data, passwordHash: await bcrypt.hash(temporaryPassword, 12), profile: { create: {} } },
  });

  revalidatePath("/admin/users");
  return ok({ temporaryPassword });
}

export async function changeRoleAction(input: unknown): Promise<ActionResult> {
  const admin = await requireRole("ADMIN");
  const parsed = roleChangeSchema.safeParse(input);
  if (!parsed.success) return fail("Geçersiz istek.");

  const target = await loadTarget(parsed.data.userId);
  if (!target) return fail("Kullanıcı bulunamadı.");

  const eligibility = canChangeRole({ actorId: admin.id, target, activeAdminCount: await activeAdminCount() }, parsed.data.role);
  if (!eligibility.allowed) return fail(eligibility.reason);

  const dependency = await roleDependencyError(target.id, target.role);
  if (dependency) return fail(dependency);

  await db.user.update({ where: { id: target.id }, data: { role: parsed.data.role } });
  revalidatePath("/admin/users");
  return ok(undefined);
}

export async function setUserActiveAction(input: unknown): Promise<ActionResult> {
  const admin = await requireRole("ADMIN");
  const parsed = activationSchema.safeParse(input);
  if (!parsed.success) return fail("Geçersiz istek.");

  const target = await loadTarget(parsed.data.userId);
  if (!target) return fail("Kullanıcı bulunamadı.");

  const eligibility = canSetActive({ actorId: admin.id, target, activeAdminCount: await activeAdminCount() }, parsed.data.active);
  if (!eligibility.allowed) return fail(eligibility.reason);

  // Suspended users are signed out on their next request: getViewer() redirects inactive accounts to /logout.
  await db.user.update({ where: { id: target.id }, data: { isActive: parsed.data.active } });
  revalidatePath("/admin/users");
  return ok(undefined);
}
