/** Appointment lifecycle: CONFIRMED → CANCELLED (before cutoff) | COMPLETED (after start, by mentor). */

export type AppointmentStatus = "CONFIRMED" | "CANCELLED" | "COMPLETED";

export type Eligibility = { allowed: true } | { allowed: false; reason: string };

export const CANCELLATION_CUTOFF_HOURS = 2;
const HOUR = 3_600_000;

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  CONFIRMED: "Onaylandı",
  CANCELLED: "İptal edildi",
  COMPLETED: "Tamamlandı",
};

export function canBook(slot: { startTime: Date; isBooked: boolean }, now: Date = new Date()): Eligibility {
  if (slot.isBooked) return { allowed: false, reason: "Bu saat az önce başka bir katılımcı tarafından alındı." };
  if (slot.startTime <= now) return { allowed: false, reason: "Geçmiş bir saate randevu alınamaz." };
  return { allowed: true };
}

export function canCancel(appointment: { status: AppointmentStatus; startTime: Date }, now: Date = new Date()): Eligibility {
  if (appointment.status !== "CONFIRMED") return { allowed: false, reason: "Yalnızca onaylı randevular iptal edilebilir." };
  if (appointment.startTime.getTime() - now.getTime() < CANCELLATION_CUTOFF_HOURS * HOUR) {
    return { allowed: false, reason: `Seansa ${CANCELLATION_CUTOFF_HOURS} saatten az kaldığı için iptal edilemez.` };
  }
  return { allowed: true };
}

export function canComplete(appointment: { status: AppointmentStatus; startTime: Date }, now: Date = new Date()): Eligibility {
  if (appointment.status !== "CONFIRMED") return { allowed: false, reason: "Randevu onaylı durumda değil." };
  if (appointment.startTime > now) return { allowed: false, reason: "Seans başlamadan tamamlandı olarak işaretlenemez." };
  return { allowed: true };
}
