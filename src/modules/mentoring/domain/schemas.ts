import { z } from "zod";
import { MAX_REPEAT_WEEKS, SLOT_LENGTHS } from "./availability";

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
