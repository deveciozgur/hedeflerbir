import type { Role } from "@/modules/identity/domain/role";

/**
 * What a person card and its detail modal show. The card itself is name + photo only; the modal
 * shows school, department and "Hakkımda" (plus title/expertise for experts).
 */
export interface PersonSummary {
  id: string;
  name: string;
  surname: string;
  avatarUrl: string | null;
  role: Role;
  /** Okuduğu okul / bölüm (participants) */
  school: string | null;
  department: string | null;
  /** "Hakkımda" (Profile.bio) */
  about: string | null;
  /** Experts: job title and comma/dot separated expertise. */
  title: string | null;
  expertiseArea: string | null;
}

/** Everything a participant entered on their profile: the admin's full view. */
export interface PersonRecord extends PersonSummary {
  email: string;
  city: string | null;
  goals: string | null;
  socialLinks: Record<string, string>;
  team: { name: string; focusArea: string | null } | null;
  isRepresentative: boolean;
  /** Roll-call history, newest first (admin view only). */
  attendance: Array<{ title: string; date: Date; status: "PRESENT" | "ABSENT" | "EXCUSED" }>;
}

export const SOCIAL_LABELS: Record<string, string> = { linkedin: "LinkedIn", github: "GitHub", x: "X", website: "Web sitesi" };

/** Brand accents for initials placeholders, picked deterministically so a person keeps their colour. */
const AVATAR_TONES = ["bg-brand/15 text-brand-soft", "bg-magenta/15 text-magenta-soft", "bg-cyan/20 text-foreground", "bg-amber/25 text-foreground"] as const;

export function avatarTone(seed: string): (typeof AVATAR_TONES)[number] {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length]!;
}
