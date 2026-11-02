/**
 * Appointment lifecycle: PENDING (defined by an admin) → CONFIRMED ("Onayla"; now visible to mentor and team)
 * → CANCELLED (before cutoff) | COMPLETED (after start). A PENDING session can be cancelled at any time.
 */

export type AppointmentStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

export type Eligibility = { allowed: true } | { allowed: false; reason: string };

export const CANCELLATION_CUTOFF_HOURS = 2;
const HOUR = 3_600_000;

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  PENDING: "Onay bekliyor",
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
  if (appointment.status === "PENDING") return { allowed: true };
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

export function canApprove(appointment: { status: AppointmentStatus; startTime: Date }, now: Date = new Date()): Eligibility {
  if (appointment.status !== "PENDING") return { allowed: false, reason: "Bu seans onay beklemiyor." };
  if (appointment.startTime <= now) return { allowed: false, reason: "Başlangıç saati geçmiş bir seans onaylanamaz." };
  return { allowed: true };
}
