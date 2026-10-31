"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/server/db";
import { requireRole } from "@/server/auth/guards";
import { getStorage } from "@/server/storage";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { avatarKey, avatarUrlFor, keyFromAvatarUrl, sniffImage, validateAvatar } from "../domain/avatar-policy";
import { changePasswordSchema } from "../domain/password";
import { adminProfileSchema, compactSocialLinks, expertProfileSchema, studentProfileSchema } from "../domain/profile";
import { ROLES } from "../domain/role";

/** Profile data shows up in shells, directories and inboxes — refresh everything. */
const revalidateEverywhere = () => revalidatePath("/", "layout");

export async function updateStudentProfileAction(input: unknown): Promise<ActionResult> {
  const user = await requireRole("STUDENT");
  const parsed = studentProfileSchema.safeParse(input);
  if (!parsed.success) return fail("Lütfen alanları kontrol edin.", z.flattenError(parsed.error).fieldErrors);

  const { name, surname, bio, goals, department, city } = parsed.data;
  const profile = { bio: bio || null, goals: goals || null, department: department || null, city: city || null };
  await db.user.update({
    where: { id: user.id },
    data: { name, surname, profile: { upsert: { create: profile, update: profile } } },
  });
  revalidateEverywhere();
  return ok(undefined);
}

export async function updateExpertProfileAction(input: unknown): Promise<ActionResult> {
  const user = await requireRole("INSTRUCTOR", "MENTOR");
  const parsed = expertProfileSchema.safeParse(input);
  if (!parsed.success) return fail("Lütfen alanları kontrol edin.", z.flattenError(parsed.error).fieldErrors);

  const { name, surname, bio, title, expertiseArea, socialLinks } = parsed.data;
  const profile = {
    bio: bio || null,
    title: title || null,
    expertiseArea: expertiseArea || null,
    socialLinks: compactSocialLinks(socialLinks),
  };
  await db.user.update({
    where: { id: user.id },
    data: { name, surname, profile: { upsert: { create: profile, update: profile } } },
  });
  revalidateEverywhere();
  return ok(undefined);
}

export async function updateAdminProfileAction(input: unknown): Promise<ActionResult> {
  const user = await requireRole("ADMIN");
  const parsed = adminProfileSchema.safeParse(input);
  if (!parsed.success) return fail("Lütfen alanları kontrol edin.", z.flattenError(parsed.error).fieldErrors);

  await db.user.update({ where: { id: user.id }, data: parsed.data });
  revalidateEverywhere();
  return ok(undefined);
}

export async function changePasswordAction(input: unknown): Promise<ActionResult> {
  const user = await requireRole(...ROLES);
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return fail("Lütfen alanları kontrol edin.", z.flattenError(parsed.error).fieldErrors);

  const account = await db.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  const valid = account?.passwordHash ? await bcrypt.compare(parsed.data.currentPassword, account.passwordHash) : false;
  if (!valid) return fail("Mevcut şifre hatalı.", { currentPassword: ["Mevcut şifre hatalı."] });

  await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 12) } });
  return ok(undefined);
}

export async function uploadAvatarAction(formData: FormData): Promise<ActionResult<{ avatarUrl: string }>> {
  const user = await requireRole(...ROLES);
  const file = formData.get("avatar");
  if (!(file instanceof File)) return fail("Bir görsel seçin.");

  const declared = validateAvatar(file);
  if (!declared.ok) return fail(declared.error);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const actualType = sniffImage(bytes);
  if (!actualType) return fail("Dosya geçerli bir PNG, JPG veya WEBP görsel değil.");
  const verified = validateAvatar({ type: actualType, size: bytes.length });
  if (!verified.ok) return fail(verified.error);

  const storage = getStorage();
  const key = avatarKey(user.id, Date.now(), verified.extension);
  await storage.put(key, bytes, actualType);

  const previous = await db.user.findUnique({ where: { id: user.id }, select: { avatarUrl: true } });
  const avatarUrl = avatarUrlFor(key);
  await db.user.update({ where: { id: user.id }, data: { avatarUrl } });

  const oldKey = keyFromAvatarUrl(previous?.avatarUrl ?? null);
  if (oldKey && oldKey !== key) await storage.delete(oldKey).catch((e: unknown) => console.warn("Old avatar cleanup failed", e));

  revalidateEverywhere();
  return ok({ avatarUrl });
}

export async function removeAvatarAction(): Promise<ActionResult> {
  const user = await requireRole(...ROLES);
  const current = await db.user.findUnique({ where: { id: user.id }, select: { avatarUrl: true } });
  await db.user.update({ where: { id: user.id }, data: { avatarUrl: null } });

  const key = keyFromAvatarUrl(current?.avatarUrl ?? null);
  if (key) await getStorage().delete(key).catch((e: unknown) => console.warn("Avatar cleanup failed", e));

  revalidateEverywhere();
  return ok(undefined);
}
