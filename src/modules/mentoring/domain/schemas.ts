import { z } from "zod";
import { MAX_REPEAT_WEEKS, SLOT_LENGTHS } from "./availability";
import { TEMPLATE_FIRST_HOUR, TEMPLATE_LAST_HOUR } from "./weekly-template";

export const availabilityInputSchema = z.object({
  start: z.iso.datetime({ error: "Geçerli bir başlangıç zamanı seçin." }),
  end: z.iso.datetime({ error: "Geçerli bir bitiş zamanı seçin." }),
  slotMinutes: z.union(SLOT_LENGTHS.map((length) => z.literal(length)), { error: "Geçerli bir seans süresi seçin." }),
  repeatWeeks: z.number().int().min(0).max(MAX_REPEAT_WEEKS),
});
export type AvailabilityInput = z.infer<typeof availabilityInputSchema>;

export const teamBookingSchema = z.object({
  slotId: z.string().min(1),
  teamId: z.string().min(1, { error: "Bir takım seçin." }),
  notes: z.string().trim().max(1000, { error: "Not en fazla 1000 karakter olabilir." }),
  /** External meeting link agreed between mentor and team (optional). */
  meetingLink: z
    .union([z.literal(""), z.url({ protocol: /^https?$/, error: "Geçerli bir bağlantı girin." })])
    .transform((v) => v || null),
});
export type TeamBookingInput = z.input<typeof teamBookingSchema>;

/** Admin defines a session between a team and a mentor at any date/time (created PENDING, approved separately). */
export const sessionScheduleSchema = z.object({
  mentorId: z.string().min(1, { error: "Bir mentor seçin." }),
  teamId: z.string().min(1, { error: "Bir ekip seçin." }),
  /** ISO instant built from the Istanbul date/time inputs on the client. */
  start: z.iso.datetime({ offset: true, error: "Geçerli bir tarih ve saat seçin." }),
  durationMinutes: z.coerce.number().int().min(15, { error: "En az 15 dakika." }).max(240, { error: "En fazla 4 saat." }),
  meetingLink: z
    .union([z.literal(""), z.url({ protocol: /^https?$/, error: "Geçerli bir bağlantı girin." })])
    .transform((v) => v || null),
  notes: z.string().trim().max(1000, { error: "Not en fazla 1000 karakter olabilir." }),
  adminNotes: z.string().trim().max(1000, { error: "Not en fazla 1000 karakter olabilir." }),
});
export type SessionScheduleInput = z.input<typeof sessionScheduleSchema>;

export const appointmentIdSchema = z.string().min(1);

export const weeklyAvailabilitySchema = z.object({
  cells: z
    .array(z.object({ day: z.number().int().min(1).max(7), hour: z.number().int().min(TEMPLATE_FIRST_HOUR).max(TEMPLATE_LAST_HOUR - 1) }))
    .max(7 * (TEMPLATE_LAST_HOUR - TEMPLATE_FIRST_HOUR)),
  slotMinutes: z.union(SLOT_LENGTHS.map((length) => z.literal(length)), { error: "Geçerli bir seans süresi seçin." }),
});
