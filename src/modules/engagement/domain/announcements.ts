import { z } from "zod";

export const ANNOUNCEMENT_PRIORITIES = ["LOW", "NORMAL", "HIGH"] as const;
export type AnnouncementPriority = (typeof ANNOUNCEMENT_PRIORITIES)[number];

export const PRIORITY_LABELS: Record<AnnouncementPriority, string> = { LOW: "Düşük", NORMAL: "Normal", HIGH: "Yüksek" };

export const announcementInputSchema = z.object({
  /** null = platform-wide (admins only). */
  courseId: z.string().min(1).nullable(),
  title: z.string().trim().min(3, { error: "Başlık en az 3 karakter olmalı." }).max(160),
  content: z.string().trim().min(5, { error: "İçerik en az 5 karakter olmalı." }).max(5000),
  priority: z.enum(ANNOUNCEMENT_PRIORITIES),
  pinned: z.boolean(),
});
export type AnnouncementInput = z.infer<typeof announcementInputSchema>;
