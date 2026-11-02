"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db";
import { requireRole } from "@/server/auth/guards";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { awardBadgesSafely } from "@/modules/engagement/application/badges.service";
import { formatDateTime } from "@/lib/format";
import { canApprove, canBook, canCancel, canComplete } from "../domain/appointment-policy";
import { generateSlots, partitionConflicts, validateWindow } from "../domain/availability";
import { appointmentIdSchema, availabilityInputSchema, meetingLinkSchema, sessionScheduleSchema, teamBookingSchema, weeklyAvailabilitySchema } from "../domain/schemas";
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

// ───────────────────────────── Admin: team sessions ─────────────────────────────

class BookingConflict extends Error {}

const ACTIVE_STATUSES = ["PENDING", "CONFIRMED"] as const;

/** The team's contact (Appointment.studentId): its representative, else the first member alphabetically. */
const teamWithContact = (teamId: string) =>
  db.team.findUnique({
    where: { id: teamId },
    select: {
      id: true,
      name: true,
      representativeId: true,
      members: { where: { isActive: true, role: "STUDENT" }, orderBy: [{ name: "asc" }, { surname: "asc" }], select: { id: true, ...partySelect } },
    },
  });

const contactOf = (team: NonNullable<Awaited<ReturnType<typeof teamWithContact>>>) =>
  team.members.find((m) => m.id === team.representativeId) ?? team.members[0];

/**
 * Admin reserves an open mentor slot for a team. The session starts PENDING: the mentor and the team
 * only see it (and get notified) once an admin approves it.
 */
export async function bookForTeamAction(input: unknown): Promise<ActionResult<{ appointmentId: string }>> {
  await requireRole("ADMIN");

  const parsed = teamBookingSchema.safeParse(input);
  if (!parsed.success) return fail("Lütfen alanları kontrol edin.", z.flattenError(parsed.error).fieldErrors);

  const [slot, team] = await Promise.all([
    db.mentorSlot.findUnique({
      where: { id: parsed.data.slotId },
      select: { id: true, startTime: true, endTime: true, isBooked: true, mentor: { select: { id: true, role: true, isActive: true } } },
    }),
    teamWithContact(parsed.data.teamId),
  ]);
  if (!slot || slot.mentor.role !== "MENTOR" || !slot.mentor.isActive) return fail("Bu saat artık mevcut değil.");
  if (!team) return fail("Ekip bulunamadı.");
  const contact = contactOf(team);
  if (!contact) return fail("Bu ekipte aktif katılımcı yok.");

  const eligibility = canBook(slot);
  if (!eligibility.allowed) return fail(eligibility.reason);

  const clash = await db.appointment.findFirst({
    where: {
      teamId: team.id,
      status: { in: [...ACTIVE_STATUSES] },
      slot: { startTime: { lt: slot.endTime }, endTime: { gt: slot.startTime } },
    },
    select: { id: true },
  });
  if (clash) return fail("Bu ekibin bu saatte başka bir seansı var.");

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
        data: { slotId: slot.id, studentId: contact.id, teamId: team.id, mentorId: slot.mentor.id, status: "PENDING", meetingLink, notes: parsed.data.notes || null },
        select: { id: true },
      });
      return appointment.id;
    });
  } catch (error) {
    if (error instanceof BookingConflict) return fail("Bu saat az önce başka bir ekibe verildi.");
    throw error;
  }

  revalidateMentoring();
  return ok({ appointmentId });
}

/**
 * Admin defines a session between a team and a mentor at any date/time, independent of the mentor's
 * published availability. Created PENDING; an open slot at the same start is reused, other overlapping
 * open slots are closed so nobody else can be booked on top of it.
 */
export async function scheduleSessionAction(input: unknown): Promise<ActionResult<{ appointmentId: string }>> {
  await requireRole("ADMIN");
  const parsed = sessionScheduleSchema.safeParse(input);
  if (!parsed.success) return fail("Lütfen alanları kontrol edin.", z.flattenError(parsed.error).fieldErrors);

  const start = new Date(parsed.data.start);
  const end = new Date(start.getTime() + parsed.data.durationMinutes * 60_000);
  if (start <= new Date()) return fail("Geçmiş bir saate seans tanımlanamaz.", { start: ["İleri bir tarih seçin."] });

  const [mentor, team] = await Promise.all([
    db.user.findFirst({ where: { id: parsed.data.mentorId, role: "MENTOR", isActive: true }, select: { id: true } }),
    teamWithContact(parsed.data.teamId),
  ]);
  if (!mentor) return fail("Mentor bulunamadı.", { mentorId: ["Bir mentor seçin."] });
  if (!team) return fail("Ekip bulunamadı.", { teamId: ["Bir ekip seçin."] });
  const contact = contactOf(team);
  if (!contact) return fail("Bu ekipte aktif katılımcı yok.", { teamId: ["Önce ekibe üye ekleyin."] });

  const overlap = { startTime: { lt: end }, endTime: { gt: start } };
  const [mentorClash, teamClash] = await Promise.all([
    db.appointment.findFirst({ where: { mentorId: mentor.id, status: { in: [...ACTIVE_STATUSES] }, slot: overlap }, select: { id: true } }),
    db.appointment.findFirst({ where: { teamId: team.id, status: { in: [...ACTIVE_STATUSES] }, slot: overlap }, select: { id: true } }),
  ]);
  if (mentorClash) return fail("Mentorun bu saatte başka bir seansı var.", { start: ["Başka bir saat seçin."] });
  if (teamClash) return fail("Ekibin bu saatte başka bir seansı var.", { start: ["Başka bir saat seçin."] });

  const appointmentId = await db.$transaction(async (tx) => {
    const sameStart = await tx.mentorSlot.findUnique({ where: { mentorId_startTime: { mentorId: mentor.id, startTime: start } }, select: { id: true } });
    const slot = sameStart
      ? await tx.mentorSlot.update({ where: { id: sameStart.id }, data: { endTime: end, isBooked: true }, select: { id: true } })
      : await tx.mentorSlot.create({ data: { mentorId: mentor.id, startTime: start, endTime: end, isBooked: true }, select: { id: true } });
    await tx.mentorSlot.updateMany({ where: { mentorId: mentor.id, id: { not: slot.id }, isBooked: false, ...overlap }, data: { isBooked: true } });
    const appointment = await tx.appointment.create({
      data: {
        slotId: slot.id,
        studentId: contact.id,
        teamId: team.id,
        mentorId: mentor.id,
        status: "PENDING",
        meetingLink: parsed.data.meetingLink,
        notes: parsed.data.notes || null,
        adminNotes: parsed.data.adminNotes || null,
      },
      select: { id: true },
    });
    return appointment.id;
  });

  revalidateMentoring();
  return ok({ appointmentId });
}

/** "Onayla": PENDING → CONFIRMED. From now on the mentor and every team member see it and are notified. */
export async function approveAppointmentAction(appointmentId: unknown): Promise<ActionResult> {
  await requireRole("ADMIN");
  const id = appointmentIdSchema.safeParse(appointmentId);
  if (!id.success) return fail("Geçersiz seans.");

  const appointment = await db.appointment.findUnique({
    where: { id: id.data },
    select: {
      id: true,
      status: true,
      meetingLink: true,
      notes: true,
      slot: { select: { startTime: true, endTime: true } },
      mentor: { select: { id: true, ...partySelect } },
      student: { select: { id: true, ...partySelect } },
      team: { select: { name: true, members: { where: { isActive: true }, select: { id: true } } } },
    },
  });
  if (!appointment) return fail("Seans bulunamadı.");
  const eligibility = canApprove({ status: appointment.status, startTime: appointment.slot.startTime });
  if (!eligibility.allowed) return fail(eligibility.reason);

  const { count } = await db.appointment.updateMany({ where: { id: appointment.id, status: "PENDING" }, data: { status: "CONFIRMED", approvedAt: new Date() } });
  if (count === 0) return fail("Seans az önce güncellendi; sayfayı yenileyin.");

  const when = formatDateTime(appointment.slot.startTime);
  const memberIds = appointment.team?.members.map((m) => m.id) ?? [appointment.student.id];
  await db.notification.createMany({
    data: [
      { userId: appointment.mentor.id, type: "APPOINTMENT_BOOKED" as const, title: `Yeni mentorluk seansı: ${appointment.team?.name ?? `${appointment.student.name} ${appointment.student.surname}`}`, body: when, href: "/mentor/appointments" },
      ...memberIds.map((userId) => ({
        userId,
        type: "APPOINTMENT_BOOKED" as const,
        title: "Ekibine mentorluk seansı planlandı",
        body: `${appointment.mentor.name} ${appointment.mentor.surname} · ${when}`,
        href: "/mentors",
      })),
    ],
  });

  after(() =>
    sendAppointmentBookedEmails({
      student: appointment.student,
      mentor: appointment.mentor,
      startTime: appointment.slot.startTime,
      endTime: appointment.slot.endTime,
      meetingLink: appointment.meetingLink,
      notes: appointment.notes,
    }),
  );

  revalidateMentoring();
  return ok(undefined);
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
  const announced = appointment.status !== "PENDING";
  await db.$transaction([
    db.appointment.update({ where: { id: appointment.id }, data: { status: "CANCELLED" } }),
    // A student/admin cancellation re-opens the slot; a mentor cancellation withdraws it.
    db.mentorSlot.update({ where: { id: appointment.slot.id }, data: { isBooked: user.role === "MENTOR" } }),
    ...(announced
      ? [
          db.notification.create({
            data: {
              userId: counterpartId,
              type: "APPOINTMENT_CANCELLED",
              title: "Mentorluk seansı iptal edildi",
              body: formatDateTime(appointment.slot.startTime),
              href: user.role === "MENTOR" ? "/mentors" : "/mentor/appointments",
            },
          }),
        ]
      : []),
  ]);

  if (announced) after(() =>
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

/** Mentor (own approved sessions) or admin sets the external meeting link; the team is told once it changes. */
export async function setMeetingLinkAction(input: unknown): Promise<ActionResult> {
  const user = await requireRole("MENTOR", "ADMIN");
  const parsed = meetingLinkSchema.safeParse(input);
  if (!parsed.success) return fail("Lütfen bağlantıyı kontrol edin.", z.flattenError(parsed.error).fieldErrors);

  const appointment = await db.appointment.findFirst({
    where: { id: parsed.data.appointmentId, status: { in: ["PENDING", "CONFIRMED"] }, ...(user.role === "MENTOR" ? { mentorId: user.id, status: "CONFIRMED" } : {}) },
    select: { id: true, status: true, meetingLink: true, studentId: true, slot: { select: { startTime: true } }, team: { select: { members: { where: { isActive: true }, select: { id: true } } } } },
  });
  if (!appointment) return fail("Seans bulunamadı.");
  if (appointment.meetingLink === parsed.data.meetingLink) return ok(undefined);

  await db.appointment.update({ where: { id: appointment.id }, data: { meetingLink: parsed.data.meetingLink } });
  // Teams only see approved sessions, so a PENDING one stays silent until "Onayla".
  if (appointment.status === "CONFIRMED" && parsed.data.meetingLink) {
    const memberIds = appointment.team?.members.map((m) => m.id) ?? [appointment.studentId];
    await db.notification.createMany({
      data: memberIds.map((userId) => ({
        userId,
        type: "SYSTEM" as const,
        title: "Mentorluk görüşme bağlantısı eklendi",
        body: formatDateTime(appointment.slot.startTime),
        href: "/mentors",
      })),
    });
  }
  revalidateMentoring();
  return ok(undefined);
}
