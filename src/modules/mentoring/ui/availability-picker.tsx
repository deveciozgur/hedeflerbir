"use client";

import { useMemo, useState, useTransition } from "react";
import { CalendarX2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { dayKey, formatDayNumber, formatLongDay, formatTime, formatWeekday } from "@/lib/format";
import { cn } from "@/lib/utils";
import { bookSlotAction } from "../application/mentoring.actions";
import type { OpenSlot } from "../application/mentor-directory.queries";
import { groupByDay } from "../domain/availability";

interface AvailabilityPickerProps {
  mentorName: string;
  slots: OpenSlot[];
}

export function AvailabilityPicker({ mentorName, slots }: AvailabilityPickerProps) {
  const [pending, startTransition] = useTransition();
  const [booked, setBooked] = useState<ReadonlySet<string>>(new Set());
  const days = useMemo(
    () => groupByDay(slots.filter((s) => !booked.has(s.id)), (s) => s.startTime, dayKey),
    [slots, booked],
  );
  const [dayKeyState, setDayKey] = useState(days[0]?.key ?? null);
  const [selected, setSelected] = useState<OpenSlot | null>(null);
  const [notes, setNotes] = useState("");

  const activeDay = days.find((d) => d.key === dayKeyState) ?? days[0];

  if (!activeDay) {
    return (
      <EmptyState
        icon={CalendarX2}
        title="Müsait saat yok"
        description="Mentor yeni saatler eklediğinde buradan randevu oluşturabileceksin."
      />
    );
  }

  const confirm = () => {
    if (!selected) return;
    const slot = selected;
    startTransition(async () => {
      const result = await bookSlotAction({ slotId: slot.id, notes });
      if (!result.ok) {
        toast.error("Randevu oluşturulamadı", { description: result.error });
        return;
      }
      setBooked((prev) => new Set(prev).add(slot.id));
      setSelected(null);
      setNotes("");
      toast.success("Seansın onaylandı", {
        description: `${formatLongDay(slot.startTime)} ${formatTime(slot.startTime)} · E-posta ile bilgilendirildin.`,
      });
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div role="group" aria-label="Gün seçin" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {days.map((day) => {
          const active = day.key === activeDay.key;
          return (
            <button
              key={day.key}
              type="button"
              aria-pressed={active}
              aria-label={`${formatLongDay(day.date)}, ${day.items.length} müsait saat`}
              onClick={() => setDayKey(day.key)}
              className={cn(
                "flex w-14 shrink-0 flex-col items-center gap-0.5 rounded-lg border py-2 transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent",
              )}
            >
              <span className={cn("text-[11px] uppercase", !active && "text-muted-foreground")}>{formatWeekday(day.date)}</span>
              <span className="text-base font-semibold tabular-nums">{formatDayNumber(day.date)}</span>
              <span className={cn("text-[10px]", active ? "text-primary-foreground/80" : "text-muted-foreground")}>
                {day.items.length} slot
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        <p id="slot-day" className="text-sm font-medium" aria-live="polite">
          {formatLongDay(activeDay.date)}
        </p>
        <div role="group" aria-labelledby="slot-day" className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {activeDay.items.map((slot) => (
            <Button key={slot.id} variant="outline" className="tabular-nums" onClick={() => setSelected(slot)}>
              {formatTime(slot.startTime)}
            </Button>
          ))}
        </div>
      </div>

      <Dialog open={selected !== null} onOpenChange={(open) => !open && !pending && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Randevuyu onayla</DialogTitle>
            <DialogDescription>
              {selected
                ? `${mentorName} · ${formatLongDay(selected.startTime)}, ${formatTime(selected.startTime)}–${formatTime(selected.endTime)}`
                : null}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="booking-notes">Görüşmek istediğin konular (isteğe bağlı)</Label>
            <Textarea
              id="booking-notes"
              value={notes}
              maxLength={1000}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Örn. portfolyo incelemesi, kariyer planı…"
              disabled={pending}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={pending}>
                Vazgeç
              </Button>
            </DialogClose>
            <Button variant="brand" onClick={confirm} disabled={pending}>
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
              Randevu oluştur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
