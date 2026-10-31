import { getSessionUser } from "@/server/auth/guards";
import { getStorage } from "@/server/storage";
import { parseAvatarPath } from "@/modules/identity/domain/avatar-policy";

/** Avatars are visible to any signed-in user. URLs are versioned, so responses are immutable. */
export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  if (!(await getSessionUser())) return new Response("Unauthorized", { status: 401 });

  const parsed = parseAvatarPath((await params).path);
  if (!parsed) return new Response("Not found", { status: 404 });

  try {
    return await getStorage().download(parsed.key, "avatar", { inline: { contentType: parsed.contentType, maxAgeSeconds: 86_400 } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
