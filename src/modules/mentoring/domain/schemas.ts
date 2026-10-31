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

export const bookingInputSchema = z.object({
  slotId: z.string().min(1),
  notes: z.string().trim().max(1000, { error: "Not en fazla 1000 karakter olabilir." }),
});
export type BookingInput = z.infer<typeof bookingInputSchema>;

export const appointmentIdSchema = z.string().min(1);

export const weeklyAvailabilitySchema = z.object({
  cells: z
    .array(z.object({ day: z.number().int().min(1).max(7), hour: z.number().int().min(TEMPLATE_FIRST_HOUR).max(TEMPLATE_LAST_HOUR - 1) }))
    .max(7 * (TEMPLATE_LAST_HOUR - TEMPLATE_FIRST_HOUR)),
  slotMinutes: z.union(SLOT_LENGTHS.map((length) => z.literal(length)), { error: "Geçerli bir seans süresi seçin." }),
});
