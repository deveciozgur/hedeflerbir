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
import { appointmentIdSchema, availabilityInputSchema, bookingInputSchema } from "../domain/schemas";
import { sendAppointmentBookedEmails, sendAppointmentCancelledEmail } from "./appointment-emails";

const partySelect = { name: true, surname: true, email: true } as const;

const revalidateMentoring = () => {
  revalidatePath("/mentors", "layout");
  revalidatePath("/mentor", "layout");
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

export async function bookSlotAction(input: unknown): Promise<ActionResult<{ appointmentId: string }>> {
  const student = await requireRole("STUDENT");

  const parsed = bookingInputSchema.safeParse(input);
  if (!parsed.success) return fail("Lütfen alanları kontrol edin.", z.flattenError(parsed.error).fieldErrors);

  const slot = await db.mentorSlot.findUnique({
    where: { id: parsed.data.slotId },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      isBooked: true,
      mentor: { select: { id: true, role: true, isActive: true, ...partySelect, profile: { select: { meetingUrl: true } } } },
    },
  });
  if (!slot || slot.mentor.role !== "MENTOR" || !slot.mentor.isActive) return fail("Bu saat artık mevcut değil.");

  const eligibility = canBook(slot);
  if (!eligibility.allowed) return fail(eligibility.reason);

  const clash = await db.appointment.findFirst({
    where: {
      studentId: student.id,
      status: "CONFIRMED",
      slot: { startTime: { lt: slot.endTime }, endTime: { gt: slot.startTime } },
    },
    select: { id: true },
  });
  if (clash) return fail("Bu saatte zaten başka bir seansın var.");

  const meetingLink = slot.mentor.profile?.meetingUrl ?? null;
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
        data: {
          slotId: slot.id,
          studentId: student.id,
          mentorId: slot.mentor.id,
          meetingLink,
          notes: parsed.data.notes || null,
        },
        select: { id: true },
      });
      await tx.notification.create({
        data: {
          userId: slot.mentor.id,
          type: "APPOINTMENT_BOOKED",
          title: "Yeni mentorluk seansı",
          body: formatDateTime(slot.startTime),
          href: "/mentor/appointments",
        },
      });
      return appointment.id;
    });
  } catch (error) {
    if (error instanceof BookingConflict) return fail("Bu saat az önce başka bir katılımcı tarafından alındı.");
    throw error;
  }

  const studentParty = await db.user.findUniqueOrThrow({ where: { id: student.id }, select: partySelect });
  after(() =>
    sendAppointmentBookedEmails({
      student: studentParty,
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
  const user = await requireRole("STUDENT", "MENTOR");
  const id = appointmentIdSchema.safeParse(appointmentId);
  if (!id.success) return fail("Geçersiz randevu.");

  const appointment = await db.appointment.findFirst({
    where: { id: id.data, ...(user.role === "MENTOR" ? { mentorId: user.id } : { studentId: user.id }) },
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

export async function completeAppointmentAction(appointmentId: unknown): Promise<ActionResult> {
  const mentor = await requireRole("MENTOR");
  const id = appointmentIdSchema.safeParse(appointmentId);
  if (!id.success) return fail("Geçersiz randevu.");

  const appointment = await db.appointment.findFirst({
    where: { id: id.data, mentorId: mentor.id },
    select: { id: true, status: true, studentId: true, slot: { select: { startTime: true } } },
  });
  if (!appointment) return fail("Randevu bulunamadı.");

  const eligibility = canComplete({ status: appointment.status, startTime: appointment.slot.startTime });
  if (!eligibility.allowed) return fail(eligibility.reason);

  await db.appointment.update({ where: { id: appointment.id }, data: { status: "COMPLETED" } });
  after(() => awardBadgesSafely([appointment.studentId]));
  revalidateMentoring();
  return ok(undefined);
}
