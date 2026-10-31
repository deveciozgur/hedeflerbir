"use client";

import { useMemo, useState, useTransition } from "react";
import { CalendarCheck2, CalendarX2, Check, Loader2, MessageSquarePlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { dayKey, formatDayNumber, formatLongDay, formatTimeRange, formatWeekday } from "@/lib/format";
import { cn } from "@/lib/utils";
import { bookSlotAction } from "../application/mentoring.actions";
import type { BookableSlot } from "../application/mentor-directory.queries";
import { groupByDay } from "../domain/availability";

interface SlotPickerProps {
  mentorName: string;
  slots: BookableSlot[];
}

const choiceClass =
  "outline-none transition-[background-color,border-color,color,transform] duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-popover";

/**
 * Day pills (horizontal, scroll-snapped) → that day's time buttons → one confirm.
 * Booked slots stay visible but inert so the student sees how the day fills up.
 */
export function SlotPicker({ mentorName, slots }: SlotPickerProps) {
  const [pending, startTransition] = useTransition();
  const [bookedNow, setBookedNow] = useState<ReadonlySet<string>>(new Set());
  const [confirmed, setConfirmed] = useState<BookableSlot | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState("");

  const view = useMemo(() => slots.map((s) => ({ ...s, isBooked: s.isBooked || bookedNow.has(s.id) })), [slots, bookedNow]);
  const days = useMemo(() => groupByDay(view, (s) => s.startTime, dayKey), [view]);
  const firstOpenDay = days.find((d) => d.items.some((s) => !s.isBooked))?.key ?? days[0]?.key ?? null;
  const [dayKeyState, setDayKey] = useState(firstOpenDay);
  const activeDay = days.find((d) => d.key === dayKeyState) ?? days[0];
  const selected = view.find((s) => s.id === selectedId && !s.isBooked) ?? null;

  if (confirmed) {
    return (
      <div role="status" className="flex flex-col items-center gap-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-6 py-8 text-center">
        <span className="grid size-10 place-items-center rounded-full border border-emerald-500/30 text-emerald-400" aria-hidden>
          <Check className="size-5" />
        </span>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold">Randevun onaylandı</p>
          <p className="text-sm text-muted-foreground">
            {mentorName}, {formatLongDay(confirmed.startTime)} {formatTimeRange(confirmed.startTime, confirmed.endTime)}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setConfirmed(null)}>
          Başka bir saat seç
        </Button>
      </div>
    );
  }

  if (!activeDay) {
    return (
      <EmptyState icon={CalendarX2} title="Müsait saat yok" description="Mentor yeni saatler eklediğinde buradan randevu oluşturabilirsin." />
    );
  }

  const confirm = () => {
    if (!selected) return;
    const slot = selected;
    startTransition(async () => {
      const result = await bookSlotAction({ slotId: slot.id, notes });
      // Either way the slot is gone: booked by us, or taken by someone else meanwhile.
      setBookedNow((prev) => new Set(prev).add(slot.id));
      setSelectedId(null);
      if (!result.ok) {
        toast.error("Randevu oluşturulamadı", { description: result.error });
        return;
      }
      setNotes("");
      setNotesOpen(false);
      setConfirmed(slot);
      toast.success("Seansın onaylandı", { description: "E-posta ile de bilgilendirildin." });
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div
        role="group"
        aria-label="Gün seçin"
        className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pt-1 pb-2 [scrollbar-width:thin]"
      >
        {days.map((day) => {
          const active = day.key === activeDay.key;
          const open = day.items.filter((s) => !s.isBooked).length;
          return (
            <button
              key={day.key}
              type="button"
              aria-pressed={active}
              aria-label={`${formatLongDay(day.date)}, ${open} müsait saat`}
              onClick={() => {
                setDayKey(day.key);
                setSelectedId(null);
              }}
              className={cn(
                choiceClass,
                "flex w-16 shrink-0 snap-start flex-col items-center gap-1 rounded-xl border py-2 active:scale-[0.98]",
                active ? "border-brand/60 bg-brand/10 text-foreground" : "border-border bg-zinc-900/60 hover:border-border-strong",
                open === 0 && !active && "opacity-60",
              )}
            >
              <span className="text-xs text-muted-foreground">{formatWeekday(day.date)}</span>
              <span className="text-lg font-semibold tabular-nums">{formatDayNumber(day.date)}</span>
              <span className={cn("font-mono text-[11px] tabular-nums", open > 0 ? "text-muted-foreground" : "text-subtle")}>
                {open > 0 ? `${open} boş` : "dolu"}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        <p id="slot-day" className="text-sm font-medium" aria-live="polite">
          {formatLongDay(activeDay.date)}
        </p>
        <div role="group" aria-labelledby="slot-day" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {activeDay.items.map((slot) => {
            const isSelected = slot.id === selectedId;
            const range = formatTimeRange(slot.startTime, slot.endTime);
            return (
              <button
                key={slot.id}
                type="button"
                disabled={slot.isBooked || pending}
                aria-pressed={isSelected}
                aria-label={slot.isBooked ? `${range}, dolu` : range}
                onClick={() => setSelectedId(isSelected ? null : slot.id)}
                className={cn(
                  choiceClass,
                  "h-10 rounded-md border font-mono text-sm tabular-nums active:scale-[0.98]",
                  slot.isBooked && "cursor-not-allowed border-border line-through opacity-40",
                  !slot.isBooked && !isSelected && "border-border-strong/70 bg-zinc-900/60 hover:border-zinc-500 hover:bg-zinc-800",
                  isSelected && "border-brand bg-brand/15 text-foreground",
                )}
              >
                {range}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-4 border-t border-border pt-6">
        {notesOpen ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="booking-notes">Görüşmek istediğin konular</Label>
            <Textarea
              id="booking-notes"
              rows={3}
              value={notes}
              maxLength={1000}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Örn. portfolyo incelemesi, kariyer planı"
              disabled={pending}
            />
          </div>
        ) : (
          <Button variant="ghost" size="sm" className="self-start" onClick={() => setNotesOpen(true)}>
            <MessageSquarePlus aria-hidden /> Not ekle
          </Button>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {selected ? (
              <>
                <span className="text-foreground">{formatLongDay(selected.startTime)}</span>{" "}
                <span className="font-mono tabular-nums">{formatTimeRange(selected.startTime, selected.endTime)}</span>
              </>
            ) : (
              "Bir saat seç"
            )}
          </p>
          <Button onClick={confirm} disabled={!selected || pending} className="sm:w-auto">
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : <CalendarCheck2 aria-hidden />}
            Randevuyu onayla
          </Button>
        </div>
      </div>
    </div>
  );
}
