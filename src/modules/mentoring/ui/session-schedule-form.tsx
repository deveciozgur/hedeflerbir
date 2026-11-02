"use client";

import { useId, useState, useTransition } from "react";
import { CalendarPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { scheduleSessionAction } from "../application/mentoring.actions";

interface Option {
  id: string;
  name: string;
}

const DURATIONS = [30, 45, 60, 90, 120] as const;
type Field = "mentorId" | "teamId" | "start" | "durationMinutes" | "meetingLink" | "notes" | "adminNotes";

/** Istanbul is fixed UTC+3 (see lib/format), so the date/time inputs map to an instant without a tz library. */
const istanbulInstant = (date: string, time: string) => (date && time ? `${date}T${time}:00+03:00` : "");

/** Admin defines a team-mentor session at any date/time; it stays "Onay bekliyor" until approved. */
export function SessionScheduleForm({ mentors, teams }: { mentors: Option[]; teams: Option[] }) {
  const ids = useId();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({ mentorId: "", teamId: "", date: "", time: "", durationMinutes: "60", meetingLink: "", notes: "", adminNotes: "" });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [pending, startTransition] = useTransition();
  const set = (key: keyof typeof values) => (e: { target: { value: string } }) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const submit = () =>
    startTransition(async () => {
      const result = await scheduleSessionAction({
        mentorId: values.mentorId,
        teamId: values.teamId,
        start: istanbulInstant(values.date, values.time),
        durationMinutes: values.durationMinutes,
        meetingLink: values.meetingLink.trim(),
        notes: values.notes,
        adminNotes: values.adminNotes,
      });
      if (!result.ok) {
        const fe = result.fieldErrors ?? {};
        setErrors(Object.fromEntries(Object.entries(fe).map(([k, v]) => [k, v?.[0]])) as Partial<Record<Field, string>>);
        toast.error(result.error);
        return;
      }
      toast.success("Seans tanımlandı", { description: "Onayladığında mentor ve ekip görecek." });
      setOpen(false);
    });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setValues({ mentorId: "", teamId: "", date: "", time: "", durationMinutes: "60", meetingLink: "", notes: "", adminNotes: "" });
          setErrors({});
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <CalendarPlus aria-hidden /> Yeni seans
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yeni mentorluk seansı</DialogTitle>
          <DialogDescription>Bir ekip ile mentor arasında seans tanımla. Onayla dediğinde seans mentorun ve ekibin panelinde görünür.</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id={`${ids}-team`} label="Ekip" error={errors.teamId}>
              <NativeSelect id={`${ids}-team`} value={values.teamId} onChange={set("teamId")} aria-invalid={Boolean(errors.teamId)}>
                <option value="">Ekip seçin</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField id={`${ids}-mentor`} label="Mentor" error={errors.mentorId}>
              <NativeSelect id={`${ids}-mentor`} value={values.mentorId} onChange={set("mentorId")} aria-invalid={Boolean(errors.mentorId)}>
                <option value="">Mentor seçin</option>
                {mentors.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField id={`${ids}-date`} label="Tarih" error={errors.start}>
              <Input id={`${ids}-date`} type="date" value={values.date} onChange={set("date")} aria-invalid={Boolean(errors.start)} />
            </FormField>
            <FormField id={`${ids}-time`} label="Saat (TSİ)">
              <Input id={`${ids}-time`} type="time" step={900} value={values.time} onChange={set("time")} />
            </FormField>
            <FormField id={`${ids}-duration`} label="Süre" error={errors.durationMinutes}>
              <NativeSelect id={`${ids}-duration`} value={values.durationMinutes} onChange={set("durationMinutes")}>
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d} dakika
                  </option>
                ))}
              </NativeSelect>
            </FormField>
          </div>
          <FormField id={`${ids}-link`} label="Seans bağlantısı" error={errors.meetingLink} hint="İsteğe bağlı, örn. Google Meet bağlantısı.">
            <Input id={`${ids}-link`} type="url" inputMode="url" placeholder="https://" value={values.meetingLink} onChange={set("meetingLink")} />
          </FormField>
          <FormField id={`${ids}-notes`} label="Seans notu" error={errors.notes} hint="Mentor görür.">
            <Textarea id={`${ids}-notes`} rows={2} value={values.notes} onChange={set("notes")} maxLength={1000} />
          </FormField>
          <FormField id={`${ids}-admin`} label="Yönetici notu" error={errors.adminNotes} hint="Yalnızca yöneticiler görür.">
            <Textarea id={`${ids}-admin`} rows={2} value={values.adminNotes} onChange={set("adminNotes")} maxLength={1000} />
          </FormField>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={pending}>
                Vazgeç
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending || !values.mentorId || !values.teamId || !values.date || !values.time}>
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
              Seansı tanımla
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
