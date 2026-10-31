import { z } from "zod";

export const RESOURCE_TYPES = ["pdf", "link", "file"] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

// A type alias (not an interface) so it stays assignable to Prisma's JSON input type.
export type SessionResource = {
  title: string;
  url: string;
  type: ResourceType;
};

const resourceSchema = z.object({
  title: z.string().trim().min(1).max(200),
  url: z.url({ protocol: /^https?$/ }),
  type: z.enum(RESOURCE_TYPES).catch("link"),
});

/** Tolerant reader for the CourseSession.resources JSON column — malformed entries are skipped. */
export function parseResources(value: unknown): SessionResource[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    const parsed = resourceSchema.safeParse(entry);
    return parsed.success ? [parsed.data] : [];
  });
}

const inferType = (url: string): ResourceType => {
  const path = new URL(url).pathname.toLowerCase();
  if (path.endsWith(".pdf")) return "pdf";
  if (/\.(zip|rar|7z|pptx?|docx?|xlsx?|unitypackage)$/.test(path)) return "file";
  return "link";
};

/**
 * Instructor-friendly plain-text format, one resource per line:
 *   Ders slaytları | https://example.com/slides.pdf
 */
export function parseResourceLines(text: string): { resources: SessionResource[]; invalidLines: number[] } {
  const resources: SessionResource[] = [];
  const invalidLines: number[] = [];

  text.split(/\r?\n/).forEach((line, index) => {
    if (!line.trim()) return;
    const separator = line.lastIndexOf("|");
    const title = separator === -1 ? "" : line.slice(0, separator).trim();
    const url = (separator === -1 ? line : line.slice(separator + 1)).trim();
    const parsed = resourceSchema.safeParse({ title: title || url, url, type: "link" });
    if (!parsed.success) {
      invalidLines.push(index + 1);
      return;
    }
    resources.push({ ...parsed.data, type: inferType(parsed.data.url) });
  });

  return { resources, invalidLines };
}

export const formatResourceLines = (resources: readonly SessionResource[]) =>
  resources.map((r) => `${r.title} | ${r.url}`).join("\n");
