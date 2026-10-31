import type { Role } from "@/modules/identity/domain/role";

/** What a person card and its detail modal show. Fields are optional per context (a teammate sees less than an admin). */
export interface PersonSummary {
  id: string;
  name: string;
  surname: string;
  avatarUrl: string | null;
  role: Role;
  /** Okuduğu bölüm (participants) */
  department: string | null;
  city: string | null;
  /** "Hakkımda" (Profile.bio) */
  about: string | null;
  /** Experts: job title and comma/dot separated expertise. */
  title: string | null;
  expertiseArea: string | null;
  team: { name: string; focusArea: string | null } | null;
}

/** Brand accents for initials placeholders, picked deterministically so a person keeps their colour. */
const AVATAR_TONES = ["bg-brand/15 text-brand-soft", "bg-magenta/15 text-magenta", "bg-cyan/20 text-foreground", "bg-amber/25 text-foreground"] as const;

export function avatarTone(seed: string): (typeof AVATAR_TONES)[number] {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length]!;
}
