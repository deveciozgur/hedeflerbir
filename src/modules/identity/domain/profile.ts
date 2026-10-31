import { z } from "zod";

export const SOCIAL_NETWORKS = ["linkedin", "github", "x", "website"] as const;
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];

export const SOCIAL_LABELS: Record<SocialNetwork, string> = {
  linkedin: "LinkedIn",
  github: "GitHub",
  x: "X",
  website: "Web sitesi",
};

/** Only http(s) links are ever rendered as hrefs — never javascript:, data:, etc. */
const webUrl = z.url({ protocol: /^https?$/ });

/** Tolerant parser for the Profile.socialLinks JSON column — invalid entries are dropped, never thrown. */
export function parseSocialLinks(value: unknown): Array<{ network: SocialNetwork; label: string; url: string }> {
  if (typeof value !== "object" || value === null) return [];
  return SOCIAL_NETWORKS.flatMap((network) => {
    const url = webUrl.safeParse((value as Record<string, unknown>)[network]);
    return url.success ? [{ network, label: SOCIAL_LABELS[network], url: url.data }] : [];
  });
}

/**
 * Empty string ⇒ null, otherwise must be an http(s) URL. Accepts null too, so a value already parsed
 * client-side (by the same schema via the form resolver) re-validates on the server.
 */
const optionalWebUrl = z.union([z.literal(""), z.null(), webUrl]).transform((v) => v || null);

const personName = (label: string) =>
  z.string().trim().min(2, { error: `${label} en az 2 karakter olmalı.` }).max(60, { error: `${label} en fazla 60 karakter olabilir.` });

const basics = {
  name: personName("Ad"),
  surname: personName("Soyad"),
  bio: z.string().trim().max(2000, { error: "Biyografi en fazla 2000 karakter olabilir." }),
};

export const studentProfileSchema = z.object({
  ...basics,
  goals: z.string().trim().max(1000, { error: "Hedefler en fazla 1000 karakter olabilir." }),
});
export type StudentProfileInput = z.input<typeof studentProfileSchema>;

export const expertProfileSchema = z.object({
  ...basics,
  title: z.string().trim().max(80),
  expertiseArea: z.string().trim().max(120),
  meetingUrl: optionalWebUrl,
  socialLinks: z.object({
    linkedin: optionalWebUrl,
    github: optionalWebUrl,
    x: optionalWebUrl,
    website: optionalWebUrl,
  }),
});
export type ExpertProfileInput = z.input<typeof expertProfileSchema>;

export const adminProfileSchema = z.object({ name: basics.name, surname: basics.surname });
export type AdminProfileInput = z.input<typeof adminProfileSchema>;

/** Drops empty networks so the stored JSON only holds real links. */
export const compactSocialLinks = (links: Record<SocialNetwork, string | null>) =>
  Object.fromEntries(Object.entries(links).filter(([, url]) => url !== null)) as Partial<Record<SocialNetwork, string>>;
