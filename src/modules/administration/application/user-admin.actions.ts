"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { requireRole } from "@/server/auth/guards";
import { recordAudit } from "@/server/audit";
import { emailDeliveryConfigured } from "@/server/email";
import { createInviteLink, sendAccountInviteEmail } from "@/modules/identity/application/account-invite.service";
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
import { IMPORT_CHUNK_SIZE, parseUserCsv, type ImportRow } from "../domain/user-import";

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
  const admin = await requireRole("ADMIN");
  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) return fail("Lütfen alanları kontrol edin.", z.flattenError(parsed.error).fieldErrors);

  if (await db.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } })) {
    return fail("Bu e-posta ile kayıtlı bir kullanıcı zaten var.", { email: ["Bu e-posta kullanımda."] });
  }

  const temporaryPassword = generateTemporaryPassword();
  const created = await db.user.create({
    data: { ...parsed.data, passwordHash: await bcrypt.hash(temporaryPassword, 12), profile: { create: {} } },
    select: { id: true },
  });
  await recordAudit({
    action: "user.created",
    actorId: admin.id,
    targetType: "user",
    targetId: created.id,
    metadata: { email: parsed.data.email, role: parsed.data.role },
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
  await recordAudit({ action: "user.role_changed", actorId: admin.id, targetType: "user", targetId: target.id, metadata: { from: target.role, to: parsed.data.role } });
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
  await recordAudit({ action: parsed.data.active ? "user.activated" : "user.deactivated", actorId: admin.id, targetType: "user", targetId: target.id });
  revalidatePath("/admin/users");
  return ok(undefined);
}

export interface ImportUsersResult {
  created: number;
  /** E-mails already registered; never overwritten. */
  skippedExisting: string[];
  errors: Array<{ line: number; message: string }>;
  /** Only when e-mail delivery is not configured: links the admin must share manually. */
  inviteLinks: Array<{ email: string; link: string }>;
  /** Accounts created with the password from the CSV (no invitation needed). */
  withPassword: number;
}

/** Creates one account; rows with a CSV password get it bcrypt-hashed, the rest are invited. */
async function createImportedUser(row: ImportRow) {
  const passwordHash = row.password ? await bcrypt.hash(row.password, 12) : null;
  return db.user.create({
    data: { name: row.name, surname: row.surname, email: row.email, role: row.role, passwordHash, profile: { create: {} } },
    select: { id: true, name: true, email: true, passwordHash: true },
  });
}

/** CSV bulk import. New accounts have no password; each gets a one-time "set your password" invitation. */
export async function importUsersAction(csvText: unknown): Promise<ActionResult<ImportUsersResult>> {
  const admin = await requireRole("ADMIN");
  if (typeof csvText !== "string" || csvText.length > 1_000_000) return fail("CSV dosyası okunamadı (en fazla 1 MB).");

  const { rows, errors, missingColumns } = parseUserCsv(csvText);
  if (missingColumns.length > 0) return fail(`CSV başlığında eksik sütun: ${missingColumns.join(", ")}.`);
  if (rows.length === 0) return fail(errors[0] ? `Geçerli satır yok. Satır ${errors[0].line}: ${errors[0].message}` : "CSV dosyasında kullanıcı bulunamadı.");

  const existing = await db.user.findMany({ where: { email: { in: rows.map((r) => r.email) } }, select: { email: true } });
  const taken = new Set(existing.map((u) => u.email));
  const fresh = rows.filter((r) => !taken.has(r.email));

  // Chunked, row-isolated writes: a row that fails (e.g. the e-mail was registered meanwhile) is reported
  // with its line number while the rest of its chunk still goes through.
  const created: Array<{ id: string; name: string; email: string; passwordHash: string | null }> = [];
  const rowErrors = [...errors];
  for (let i = 0; i < fresh.length; i += IMPORT_CHUNK_SIZE) {
    const chunk = fresh.slice(i, i + IMPORT_CHUNK_SIZE);
    const results = await Promise.allSettled(chunk.map(createImportedUser));
    results.forEach((result, index) => {
      if (result.status === "fulfilled") created.push(result.value);
      else {
        const unique = result.reason instanceof Prisma.PrismaClientKnownRequestError && result.reason.code === "P2002";
        rowErrors.push({ line: chunk[index]!.line, message: unique ? "Bu e-posta ile kayıtlı bir kullanıcı var" : "Kayıt oluşturulamadı" });
        if (!unique) console.error("[import] row failed", { line: chunk[index]!.line, error: result.reason instanceof Error ? result.reason.message : result.reason });
      }
    });
  }
  rowErrors.sort((a, b) => a.line - b.line);

  const delivering = emailDeliveryConfigured();
  const inviteLinks: ImportUsersResult["inviteLinks"] = [];
  for (const user of created.filter((u) => !u.passwordHash)) {
    const link = await createInviteLink(user);
    if (delivering) after(() => sendAccountInviteEmail(user, link).catch((e: unknown) => console.error("Invite e-mail failed", e)));
    else inviteLinks.push({ email: user.email, link });
  }

  await recordAudit({
    action: "user.imported",
    actorId: admin.id,
    metadata: { created: created.length, skippedExisting: taken.size, invalidRows: rowErrors.length },
  });
  revalidatePath("/admin/users");
  return ok({
    created: created.length,
    skippedExisting: [...taken],
    errors: rowErrors,
    inviteLinks,
    withPassword: created.filter((u) => u.passwordHash).length,
  });
}
