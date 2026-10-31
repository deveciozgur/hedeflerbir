"use client";

import { useMemo, useState, useTransition } from "react";
import { CalendarPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { addAvailabilityAction } from "../application/mentoring.actions";
import { generateSlots, MAX_REPEAT_WEEKS, SLOT_LENGTHS, validateWindow, type SlotLength } from "../domain/availability";

const todayInput = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};

/** Working-hours window → consecutive slots, optionally repeated weekly. */
export function AddAvailabilityForm() {
  const [pending, startTransition] = useTransition();
  const [date, setDate] = useState(todayInput);
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("12:00");
  const [slotMinutes, setSlotMinutes] = useState<SlotLength>(60);
  const [repeatWeeks, setRepeatWeeks] = useState(0);

  const window = useMemo(
    () => ({ start: new Date(`${date}T${startTime}`), end: new Date(`${date}T${endTime}`) }),
    [date, startTime, endTime],
  );
  const validWindow = !Number.isNaN(window.start.getTime()) && !Number.isNaN(window.end.getTime());
  const problem = validWindow ? validateWindow(window, slotMinutes) : "Tarih ve saat seçin.";
  const slotCount = problem ? 0 : generateSlots(window, slotMinutes, repeatWeeks).length;

  const submit = () => {
    if (problem) return;
    startTransition(async () => {
      const result = await addAvailabilityAction({
        start: window.start.toISOString(),
        end: window.end.toISOString(),
        slotMinutes,
        repeatWeeks,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const { created, skipped } = result.data;
      toast.success(`${created} slot eklendi`, {
        description: skipped > 0 ? `${skipped} slot mevcut saatlerle çakıştığı için atlandı.` : undefined,
      });
    });
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Müsaitlik ekle</CardTitle>
          <CardDescription>Çalışma aralığını seç; seans süresine göre slotlara bölünür.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <FormField id="slot-date" label="Tarih">
            <Input id="slot-date" type="date" min={todayInput()} value={date} onChange={(e) => setDate(e.target.value)} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField id="slot-start" label="Başlangıç">
              <Input id="slot-start" type="time" step={900} value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </FormField>
            <FormField id="slot-end" label="Bitiş">
              <Input id="slot-end" type="time" step={900} value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField id="slot-length" label="Seans süresi">
              <NativeSelect id="slot-length" value={slotMinutes} onChange={(e) => setSlotMinutes(Number(e.target.value) as SlotLength)}>
                {SLOT_LENGTHS.map((length) => (
                  <option key={length} value={length}>
                    {length} dk
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField id="slot-repeat" label="Tekrarla">
              <NativeSelect id="slot-repeat" value={repeatWeeks} onChange={(e) => setRepeatWeeks(Number(e.target.value))}>
                <option value={0}>Tekrarlama</option>
                {Array.from({ length: MAX_REPEAT_WEEKS }, (_, i) => i + 1).map((weeks) => (
                  <option key={weeks} value={weeks}>
                    {weeks} hafta daha
                  </option>
                ))}
              </NativeSelect>
            </FormField>
          </div>
          <p role="status" className={problem ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
            {problem ?? `${slotCount} slot oluşturulacak.`}
          </p>
          <Button type="submit" disabled={pending || Boolean(problem)}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : <CalendarPlus aria-hidden />}
            Slotları ekle
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
