"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db";
import { requireRole } from "@/server/auth/guards";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { awardBadgesSafely } from "@/modules/engagement/application/badges.service";
import { formatDateTime } from "@/lib/format";
import { canBook, canCancel, canComplete } from "../domain/appointment-policy";
import { generateSlots, partitionConflicts, validateWindow } from "../domain/availability";
import { appointmentIdSchema, availabilityInputSchema, teamBookingSchema, weeklyAvailabilitySchema } from "../domain/schemas";
import { cellsToRanges } from "../domain/weekly-template";
import { syncTemplateSlots } from "./weekly-availability.service";
import { sendAppointmentBookedEmails, sendAppointmentCancelledEmail } from "./appointment-emails";

const partySelect = { name: true, surname: true, email: true } as const;

const revalidateMentoring = () => {
  revalidatePath("/mentors", "layout");
  revalidatePath("/mentor", "layout");
  revalidatePath("/admin", "layout");
  revalidatePath("/dashboard");
};

// ───────────────────────────── Mentor: availability ─────────────────────────────

export async function addAvailabilityAction(input: unknown): Promise<ActionResult<{ created: number; skipped: number }>> {
  const mentor = await requireRole("MENTOR");

  const parsed = availabilityInputSchema.safeParse(input);
  if (!parsed.success) return fail("Lütfen alanları kontrol edin.", z.flattenError(parsed.error).fieldErrors);

  const window = { start: new Date(parsed.data.start), end: new Date(parsed.data.end) };
  const windowError = validateWindow(window, parsed.data.slotMinutes);
  if (windowError) return fail(windowError);

  const candidates = generateSlots(window, parsed.data.slotMinutes, parsed.data.repeatWeeks);
  const last = candidates.at(-1);
  if (!last) return fail("Bu aralıkta oluşturulacak slot bulunamadı.");

  const existing = await db.mentorSlot.findMany({
    where: { mentorId: mentor.id, startTime: { lt: last.end }, endTime: { gt: window.start } },
    select: { startTime: true, endTime: true },
  });
  const { accepted, skipped } = partitionConflicts(
    candidates,
    existing.map((s) => ({ start: s.startTime, end: s.endTime })),
  );
  if (accepted.length === 0) return fail("Seçilen saatlerin tamamı mevcut slotlarla çakışıyor.");

  const { count } = await db.mentorSlot.createMany({
    data: accepted.map((slot) => ({ mentorId: mentor.id, startTime: slot.start, endTime: slot.end })),
    skipDuplicates: true,
  });

  revalidateMentoring();
  return ok({ created: count, skipped: skipped + (accepted.length - count) });
}

/** Replaces the weekly template and regenerates the rolling window of slots from it. */
export async function saveWeeklyAvailabilityAction(input: unknown): Promise<ActionResult<{ created: number; removed: number }>> {
  const mentor = await requireRole("MENTOR");
  const parsed = weeklyAvailabilitySchema.safeParse(input);
  if (!parsed.success) return fail("Geçersiz haftalık plan.");

  const ranges = cellsToRanges(parsed.data.cells);
  await db.$transaction([
    db.mentorAvailability.deleteMany({ where: { mentorId: mentor.id } }),
    db.mentorAvailability.createMany({
      data: ranges.map((r) => ({ mentorId: mentor.id, ...r, slotDurationMinutes: parsed.data.slotMinutes })),
    }),
  ]);
  const result = await syncTemplateSlots(mentor.id, { prune: true });

  revalidateMentoring();
  return ok(result);
}

export async function removeSlotAction(slotId: unknown): Promise<ActionResult> {
  const mentor = await requireRole("MENTOR");
  const id = appointmentIdSchema.safeParse(slotId);
  if (!id.success) return fail("Geçersiz slot.");

  const { count } = await db.mentorSlot.deleteMany({
    where: { id: id.data, mentorId: mentor.id, isBooked: false, appointments: { none: {} } },
  });
  if (count === 0) {
    // Slots with historical (cancelled) appointments are kept for reporting; just close them.
    const closed = await db.mentorSlot.updateMany({
      where: { id: id.data, mentorId: mentor.id, isBooked: false },
      data: { isBooked: true },
    });
    if (closed.count === 0) return fail("Rezerve edilmiş bir slot kaldırılamaz. Önce randevuyu iptal edin.");
  }

  revalidateMentoring();
  return ok(undefined);
}

// ───────────────────────────── Student: booking ─────────────────────────────

class BookingConflict extends Error {}

/**
 * Admin books a mentor slot for a team. The first team member (alphabetically) is stored as the
 * contact (Appointment.studentId); every member and the mentor are notified.
 */
export async function bookForTeamAction(input: unknown): Promise<ActionResult<{ appointmentId: string }>> {
  await requireRole("ADMIN");

  const parsed = teamBookingSchema.safeParse(input);
  if (!parsed.success) return fail("Lütfen alanları kontrol edin.", z.flattenError(parsed.error).fieldErrors);

  const [slot, team] = await Promise.all([
    db.mentorSlot.findUnique({
      where: { id: parsed.data.slotId },
      select: { id: true, startTime: true, endTime: true, isBooked: true, mentor: { select: { id: true, role: true, isActive: true, ...partySelect } } },
    }),
    db.team.findUnique({
      where: { id: parsed.data.teamId },
      select: { id: true, name: true, members: { where: { isActive: true, role: "STUDENT" }, orderBy: [{ name: "asc" }, { surname: "asc" }], select: { id: true, ...partySelect } } },
    }),
  ]);
  if (!slot || slot.mentor.role !== "MENTOR" || !slot.mentor.isActive) return fail("Bu saat artık mevcut değil.");
  if (!team) return fail("Takım bulunamadı.");
  const contact = team.members[0];
  if (!contact) return fail("Bu takımda aktif katılımcı yok.");

  const eligibility = canBook(slot);
  if (!eligibility.allowed) return fail(eligibility.reason);

  const clash = await db.appointment.findFirst({
    where: {
      teamId: team.id,
      status: "CONFIRMED",
      slot: { startTime: { lt: slot.endTime }, endTime: { gt: slot.startTime } },
    },
    select: { id: true },
  });
  if (clash) return fail("Bu takımın bu saatte başka bir seansı var.");

  const meetingLink = parsed.data.meetingLink;
  let appointmentId: string;
  try {
    appointmentId = await db.$transaction(async (tx) => {
      // Conditional claim — exactly one concurrent request can flip isBooked.
      const claim = await tx.mentorSlot.updateMany({
        where: { id: slot.id, isBooked: false, startTime: { gt: new Date() } },
        data: { isBooked: true },
      });
      if (claim.count !== 1) throw new BookingConflict();

      const appointment = await tx.appointment.create({
        data: { slotId: slot.id, studentId: contact.id, teamId: team.id, mentorId: slot.mentor.id, meetingLink, notes: parsed.data.notes || null },
        select: { id: true },
      });
      await tx.notification.createMany({
        data: [
          { userId: slot.mentor.id, type: "APPOINTMENT_BOOKED" as const, title: `Yeni mentorluk seansı: ${team.name}`, body: formatDateTime(slot.startTime), href: "/mentor/appointments" },
          ...team.members.map((m) => ({
            userId: m.id,
            type: "APPOINTMENT_BOOKED" as const,
            title: "Takımına mentorluk seansı planlandı",
            body: `${slot.mentor.name} ${slot.mentor.surname} · ${formatDateTime(slot.startTime)}`,
            href: "/mentors",
          })),
        ],
      });
      return appointment.id;
    });
  } catch (error) {
    if (error instanceof BookingConflict) return fail("Bu saat az önce başka bir takıma verildi.");
    throw error;
  }

  after(() =>
    sendAppointmentBookedEmails({
      student: contact,
      mentor: slot.mentor,
      startTime: slot.startTime,
      endTime: slot.endTime,
      meetingLink,
      notes: parsed.data.notes || null,
    }),
  );

  revalidateMentoring();
  return ok({ appointmentId });
}

// ───────────────────────────── Shared: lifecycle ─────────────────────────────

export async function cancelAppointmentAction(appointmentId: unknown): Promise<ActionResult> {
  const user = await requireRole("STUDENT", "MENTOR", "ADMIN");
  const id = appointmentIdSchema.safeParse(appointmentId);
  if (!id.success) return fail("Geçersiz randevu.");

  const appointment = await db.appointment.findFirst({
    where: { id: id.data, ...(user.role === "MENTOR" ? { mentorId: user.id } : user.role === "STUDENT" ? { studentId: user.id } : {}) },
    select: {
      id: true,
      status: true,
      meetingLink: true,
      slot: { select: { id: true, startTime: true, endTime: true } },
      student: { select: { id: true, ...partySelect } },
      mentor: { select: { id: true, ...partySelect } },
    },
  });
  if (!appointment) return fail("Randevu bulunamadı.");

  const eligibility = canCancel({ status: appointment.status, startTime: appointment.slot.startTime });
  if (!eligibility.allowed) return fail(eligibility.reason);

  const counterpartId = user.role === "MENTOR" ? appointment.student.id : appointment.mentor.id;
  await db.$transaction([
    db.appointment.update({ where: { id: appointment.id }, data: { status: "CANCELLED" } }),
    // A student cancellation re-opens the slot; a mentor cancellation withdraws it.
    db.mentorSlot.update({ where: { id: appointment.slot.id }, data: { isBooked: user.role === "MENTOR" } }),
    db.notification.create({
      data: {
        userId: counterpartId,
        type: "APPOINTMENT_CANCELLED",
        title: "Mentorluk seansı iptal edildi",
        body: formatDateTime(appointment.slot.startTime),
        href: user.role === "MENTOR" ? "/mentors" : "/mentor/appointments",
      },
    }),
  ]);

  after(() =>
    sendAppointmentCancelledEmail(
      {
        student: appointment.student,
        mentor: appointment.mentor,
        startTime: appointment.slot.startTime,
        endTime: appointment.slot.endTime,
        meetingLink: appointment.meetingLink,
      },
      user.role === "MENTOR" ? "MENTOR" : "STUDENT",
    ),
  );

  revalidateMentoring();
  return ok(undefined);
}

/** Mentor (own sessions) or admin (any) marks a session held; mentoring badges go to the whole team. */
export async function completeAppointmentAction(appointmentId: unknown): Promise<ActionResult> {
  const user = await requireRole("MENTOR", "ADMIN");
  const id = appointmentIdSchema.safeParse(appointmentId);
  if (!id.success) return fail("Geçersiz randevu.");

  const appointment = await db.appointment.findFirst({
    where: { id: id.data, ...(user.role === "MENTOR" ? { mentorId: user.id } : {}) },
    select: { id: true, status: true, studentId: true, team: { select: { members: { select: { id: true } } } }, slot: { select: { startTime: true } } },
  });
  if (!appointment) return fail("Randevu bulunamadı.");

  const eligibility = canComplete({ status: appointment.status, startTime: appointment.slot.startTime });
  if (!eligibility.allowed) return fail(eligibility.reason);

  await db.appointment.update({ where: { id: appointment.id }, data: { status: "COMPLETED" } });
  const attendees = new Set([appointment.studentId, ...(appointment.team?.members.map((m) => m.id) ?? [])]);
  after(() => awardBadgesSafely([...attendees]));
  revalidateMentoring();
  return ok(undefined);
}
