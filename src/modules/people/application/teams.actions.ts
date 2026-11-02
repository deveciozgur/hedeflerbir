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
  name: z.string().trim().min(2, { error: "Ekip adı en az 2 karakter olmalı." }).max(80),
  focusArea: z.string().trim().max(2000, { error: "En fazla 2000 karakter olabilir." }),
  memberIds: z.array(z.string().min(1)).min(1, { error: "En az bir üye seçin." }).max(50),
  representativeId: z.string().min(1, { error: "Ekip temsilcisini seçin." }),
});

const revalidatePeople = () => {
  revalidatePath("/admin", "layout");
  revalidatePath("/team");
  revalidatePath("/mentor", "layout");
};

const duplicateName = (error: unknown) => error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

/**
 * Creates or updates a team with its members and representative (admin only; participants see it
 * read-only on "Ekibim"). Members join from any team; a representative who moves loses that role.
 */
export async function saveTeamAction(teamId: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  const admin = await requireRole("ADMIN");
  const parsed = teamSchema.safeParse(input);
  if (!parsed.success) return fail("Lütfen alanları kontrol edin.", z.flattenError(parsed.error).fieldErrors);
  const { name, focusArea, representativeId } = parsed.data;
  const memberIds = [...new Set(parsed.data.memberIds)];
  if (!memberIds.includes(representativeId)) return fail("Temsilci ekip üyelerinden biri olmalı.", { representativeId: ["Üyelerden birini seçin."] });

  const valid = await db.user.count({ where: { id: { in: memberIds }, role: "STUDENT", isActive: true } });
  if (valid !== memberIds.length) return fail("Seçilen üyelerden biri bulunamadı.");
  if (teamId && !(await db.team.findUnique({ where: { id: teamId }, select: { id: true } }))) return fail("Ekip bulunamadı.");

  try {
    const id = await db.$transaction(async (tx) => {
      // The representative column is unique: clear it before reassigning.
      const team = teamId
        ? await tx.team.update({ where: { id: teamId }, data: { name, focusArea: focusArea || null, representativeId: null }, select: { id: true } })
        : await tx.team.create({ data: { name, focusArea: focusArea || null }, select: { id: true } });
      await tx.user.updateMany({ where: { teamId: team.id, id: { notIn: memberIds } }, data: { teamId: null } });
      await tx.team.updateMany({ where: { id: { not: team.id }, representativeId: { in: memberIds } }, data: { representativeId: null } });
      await tx.user.updateMany({ where: { id: { in: memberIds } }, data: { teamId: team.id } });
      await tx.team.update({ where: { id: team.id }, data: { representativeId } });
      return team.id;
    });
    await recordAudit({
      action: "team.changed",
      actorId: admin.id,
      targetType: "team",
      targetId: id,
      metadata: { [teamId ? "updated" : "created"]: name, members: memberIds.length },
    });
    revalidatePeople();
    return ok({ id });
  } catch (error) {
    if (duplicateName(error)) return fail("Bu adla bir ekip zaten var.", { name: ["Başka bir ad seçin."] });
    throw error;
  }
}

/** Members become team-less; past mentoring sessions keep their history. */
export async function deleteTeamAction(teamId: unknown): Promise<ActionResult> {
  const admin = await requireRole("ADMIN");
  const team = await db.team.findUnique({ where: { id: String(teamId) }, select: { id: true, name: true } });
  if (!team) return fail("Ekip bulunamadı.");
  await db.team.delete({ where: { id: team.id } });
  await recordAudit({ action: "team.changed", actorId: admin.id, targetType: "team", targetId: team.id, metadata: { deleted: team.name } });
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
