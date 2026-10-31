import { z } from "zod";
import { LESSON_TYPES } from "./lessons";

export const moduleInputSchema = z.object({
  title: z.string().trim().min(2, { error: "Bölüm adı en az 2 karakter olmalı." }).max(120),
});

const optionalUrl = z
  .union([z.literal(""), z.url({ protocol: /^https?$/, error: "Geçerli bir https bağlantısı girin." })])
  .transform((value) => value || null);

export const lessonInputSchema = z
  .object({
    title: z.string().trim().min(3, { error: "Ders adı en az 3 karakter olmalı." }).max(160),
    type: z.enum(LESSON_TYPES),
    durationMinutes: z.number().int().min(1).max(600).nullable(),
    content: z.string().max(50_000),
    videoUrl: optionalUrl,
    resources: z.string().max(10_000),
    sessionId: z.string().min(1).nullable(),
    assignmentId: z.string().min(1).nullable(),
  })
  .refine((v) => v.type !== "VIDEO" || v.videoUrl !== null, { path: ["videoUrl"], error: "Video dersi için bir video bağlantısı girin." })
  .refine((v) => v.type !== "ARTICLE" || v.content.trim().length > 0, { path: ["content"], error: "Okuma dersi için içerik yazın." })
  .refine((v) => v.type !== "LIVE_SESSION" || v.sessionId !== null, { path: ["sessionId"], error: "Bağlanacak canlı dersi seçin." })
  .refine((v) => v.type !== "ASSIGNMENT" || v.assignmentId !== null, { path: ["assignmentId"], error: "Bağlanacak ödevi seçin." });
export type LessonInput = z.input<typeof lessonInputSchema>;

/** Whole-outline order after a drag: modules in order, each with its lessons in order. */
export const curriculumOrderSchema = z
  .array(z.object({ moduleId: z.string().min(1), lessonIds: z.array(z.string().min(1)).max(500) }))
  .max(100);
export type CurriculumOrder = z.infer<typeof curriculumOrderSchema>;
