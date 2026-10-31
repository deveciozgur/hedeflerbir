export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const TYPES = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" } as const;
type AvatarMime = keyof typeof TYPES;

export const AVATAR_ACCEPT = Object.keys(TYPES).join(",");

const isAvatarMime = (type: string): type is AvatarMime => type in TYPES;

export function validateAvatar(file: { type: string; size: number }): { ok: true; extension: string } | { ok: false; error: string } {
  if (!isAvatarMime(file.type)) return { ok: false, error: "Yalnızca PNG, JPG veya WEBP görseller yüklenebilir." };
  if (file.size === 0) return { ok: false, error: "Dosya boş görünüyor." };
  if (file.size > MAX_AVATAR_BYTES) return { ok: false, error: "Görsel 2 MB'tan büyük olamaz." };
  return { ok: true, extension: TYPES[file.type] };
}

/** Real image magic bytes — the browser-reported MIME type is not trusted on its own. */
export function sniffImage(bytes: Uint8Array): AvatarMime | null {
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  return null;
}

/** Public path served by /api/files/avatars/[...path]; the storage key mirrors it under "avatars/". */
const AVATAR_PATH = /^([a-z0-9]+)\/(\d+)\.(png|jpg|webp)$/;

export const avatarKey = (userId: string, version: number, extension: string) => `avatars/${userId}/${version}.${extension}`;
export const avatarUrlFor = (key: string) => `/api/files/${key}`;

export function parseAvatarPath(segments: readonly string[]): { key: string; contentType: string } | null {
  const match = AVATAR_PATH.exec(segments.join("/"));
  if (!match) return null;
  const extension = match[3] as "png" | "jpg" | "webp";
  const contentType = extension === "jpg" ? "image/jpeg" : `image/${extension}`;
  return { key: `avatars/${segments.join("/")}`, contentType };
}

/** Storage key of an avatar URL we issued, or null for external/legacy URLs. */
export const keyFromAvatarUrl = (url: string | null) =>
  url?.startsWith("/api/files/avatars/") ? url.slice("/api/files/".length) : null;
