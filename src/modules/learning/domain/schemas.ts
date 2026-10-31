import { z } from "zod";

const optionalUrl = z
  .union([z.literal(""), z.url({ protocol: /^https?$/, error: "Geçerli bir https bağlantısı girin." })])
  .transform((value) => value || null);

export const sessionInputSchema = z.object({
  title: z.string().trim().min(3, { error: "Başlık en az 3 karakter olmalı." }).max(160),
  description: z.string().trim().max(5000),
  scheduleDate: z.iso.datetime({ error: "Geçerli bir tarih seçin." }),
  durationMinutes: z
    .number({ error: "Süre girin." })
    .int()
    .min(15, { error: "En az 15 dakika." })
    .max(480, { error: "En fazla 480 dakika." }),
  meetingUrl: optionalUrl,
  recordingUrl: optionalUrl,
  resources: z.string().max(10_000),
});
export type SessionInput = z.input<typeof sessionInputSchema>;

export const watchProgressSchema = z.object({
  sessionId: z.string().min(1),
  positionSeconds: z.number().min(0).max(24 * 3600),
  durationSeconds: z.number().min(0).max(24 * 3600),
});

export const lessonProgressSchema = z.object({
  lessonId: z.string().min(1),
  positionSeconds: z.number().min(0).max(24 * 3600),
  durationSeconds: z.number().min(0).max(24 * 3600),
});

export const attendanceInputSchema = z.object({
  sessionId: z.string().min(1),
  records: z.array(z.object({ studentId: z.string().min(1), status: z.enum(["PRESENT", "ABSENT", "EXCUSED"]) })).max(1000),
});
export type AttendanceInput = z.infer<typeof attendanceInputSchema>;
