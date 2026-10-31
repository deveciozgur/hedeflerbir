"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { requireRole } from "@/server/auth/guards";
import { recordAudit } from "@/server/audit";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { setBadge } from "@/modules/engagement/application/badges.service";
import { badgeByCode } from "@/modules/engagement/domain/badges";

const teamSchema = z.object({
  name: z.string().trim().min(2, { error: "Takım adı en az 2 karakter olmalı." }).max(80),
  focusArea: z.string().trim().max(200),
});

const revalidatePeople = () => {
  revalidatePath("/admin", "layout");
  revalidatePath("/team");
  revalidatePath("/mentor", "layout");
};

const duplicateName = (error: unknown) => error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

export async function createTeamAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const admin = await requireRole("ADMIN");
  const parsed = teamSchema.safeParse(input);
  if (!parsed.success) return fail("Lütfen alanları kontrol edin.", z.flattenError(parsed.error).fieldErrors);
  try {
    const team = await db.team.create({ data: { name: parsed.data.name, focusArea: parsed.data.focusArea || null }, select: { id: true } });
    await recordAudit({ action: "team.changed", actorId: admin.id, targetType: "team", targetId: team.id, metadata: { created: parsed.data.name } });
    revalidatePeople();
    return ok(team);
  } catch (error) {
    if (duplicateName(error)) return fail("Bu adla bir takım zaten var.", { name: ["Başka bir ad seçin."] });
    throw error;
  }
}

export async function updateTeamAction(teamId: unknown, input: unknown): Promise<ActionResult> {
  await requireRole("ADMIN");
  const parsed = teamSchema.safeParse(input);
  if (!parsed.success) return fail("Lütfen alanları kontrol edin.", z.flattenError(parsed.error).fieldErrors);
  try {
    await db.team.update({ where: { id: String(teamId) }, data: { name: parsed.data.name, focusArea: parsed.data.focusArea || null } });
  } catch (error) {
    if (duplicateName(error)) return fail("Bu adla bir takım zaten var.", { name: ["Başka bir ad seçin."] });
    throw error;
  }
  revalidatePeople();
  return ok(undefined);
}

/** Members become team-less; past mentoring sessions keep their history. */
export async function deleteTeamAction(teamId: unknown): Promise<ActionResult> {
  const admin = await requireRole("ADMIN");
  const team = await db.team.findUnique({ where: { id: String(teamId) }, select: { id: true, name: true } });
  if (!team) return fail("Takım bulunamadı.");
  await db.team.delete({ where: { id: team.id } });
  await recordAudit({ action: "team.changed", actorId: admin.id, targetType: "team", targetId: team.id, metadata: { deleted: team.name } });
  revalidatePeople();
  return ok(undefined);
}

export async function assignTeamAction(input: unknown): Promise<ActionResult> {
  const admin = await requireRole("ADMIN");
  const parsed = z.object({ userId: z.string().min(1), teamId: z.string().nullable() }).safeParse(input);
  if (!parsed.success) return fail("Geçersiz istek.");
  const user = await db.user.findFirst({ where: { id: parsed.data.userId, role: "STUDENT" }, select: { id: true } });
  if (!user) return fail("Katılımcı bulunamadı.");
  if (parsed.data.teamId && !(await db.team.findUnique({ where: { id: parsed.data.teamId }, select: { id: true } }))) return fail("Takım bulunamadı.");

  await db.user.update({ where: { id: user.id }, data: { teamId: parsed.data.teamId } });
  await recordAudit({ action: "team.changed", actorId: admin.id, targetType: "user", targetId: user.id, metadata: { teamId: parsed.data.teamId } });
  revalidatePeople();
  return ok(undefined);
}

/** Manual badge award / correction by an admin (the "karma" model's manual half). */
export async function setBadgeAction(input: unknown): Promise<ActionResult> {
  const admin = await requireRole("ADMIN");
  const parsed = z.object({ userId: z.string().min(1), code: z.string().min(1), awarded: z.boolean() }).safeParse(input);
  if (!parsed.success || !badgeByCode(parsed.data.code)) return fail("Geçersiz rozet.");
  const user = await db.user.findFirst({ where: { id: parsed.data.userId, role: "STUDENT" }, select: { id: true } });
  if (!user) return fail("Katılımcı bulunamadı.");

  await setBadge(user.id, parsed.data.code, parsed.data.awarded);
  await recordAudit({
    action: parsed.data.awarded ? "badge.awarded" : "badge.revoked",
    actorId: admin.id,
    targetType: "user",
    targetId: user.id,
    metadata: { badge: parsed.data.code },
  });
  revalidatePath("/admin", "layout");
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return ok(undefined);
}
