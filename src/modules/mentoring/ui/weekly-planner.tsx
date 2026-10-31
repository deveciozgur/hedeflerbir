"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Eraser, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";
import { saveWeeklyAvailabilityAction } from "../application/mentoring.actions";
import { SLOT_LENGTHS, type SlotLength } from "../domain/availability";
import {
  cellKey,
  cellsToRanges,
  rangesToCells,
  TEMPLATE_HOURS,
  WEEKDAY_LABELS,
  WEEKDAYS,
  weeklyHours,
  weeklySlotCount,
  type WeeklyRange,
} from "../domain/weekly-template";

const hourLabel = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

/**
 * Weekly recurring hours: click a cell, or press and drag across cells, to switch hours on/off.
 * Saving regenerates bookable slots for the next four weeks; booked slots are never touched.
 */
export function WeeklyPlanner({ ranges, slotMinutes }: { ranges: WeeklyRange[]; slotMinutes: number }) {
  const initial = useMemo(() => new Set(rangesToCells(ranges).map(cellKey)), [ranges]);
  const [selected, setSelected] = useState<ReadonlySet<string>>(initial);
  const [length, setLength] = useState<SlotLength>((SLOT_LENGTHS as readonly number[]).includes(slotMinutes) ? (slotMinutes as SlotLength) : 60);
  const [paint, setPaint] = useState<null | boolean>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => setSelected(initial), [initial]);
  useEffect(() => {
    const stop = () => setPaint(null);
    window.addEventListener("pointerup", stop);
    return () => window.removeEventListener("pointerup", stop);
  }, []);

  const set = (key: string, on: boolean) =>
    setSelected((prev) => {
      if (prev.has(key) === on) return prev;
      const next = new Set(prev);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });

  const cells = [...selected].map((key) => {
    const [day, hour] = key.split("-").map(Number);
    return { day: day!, hour: hour! };
  });
  const draft = cellsToRanges(cells);
  const dirty = selected.size !== initial.size || [...selected].some((k) => !initial.has(k)) || length !== slotMinutes;

  const save = () =>
    startTransition(async () => {
      const result = await saveWeeklyAvailabilityAction({ cells, slotMinutes: length });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Haftalık plan kaydedildi", {
        description: `${result.data.created} yeni slot oluşturuldu${result.data.removed ? `, ${result.data.removed} slot kaldırıldı` : ""}.`,
      });
    });

  return (
    <Card>
      <CardHeader className="flex-col sm:flex-row sm:items-end">
        <div>
          <CardTitle>Haftalık plan</CardTitle>
          <CardDescription>
            Tekrarlayan saatlerini işaretle; önümüzdeki 4 hafta için slotlar otomatik açılır. Rezerve slotlar korunur.
          </CardDescription>
        </div>
        <div className="flex items-end gap-2">
          <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
            Seans süresi
            <NativeSelect value={length} onChange={(e) => setLength(Number(e.target.value) as SlotLength)} className="h-8 w-28 text-sm">
              {SLOT_LENGTHS.map((l) => (
                <option key={l} value={l}>
                  {l} dk
                </option>
              ))}
            </NativeSelect>
          </label>
          <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())} disabled={selected.size === 0 || pending}>
            <Eraser aria-hidden /> Temizle
          </Button>
          <Button size="sm" onClick={save} disabled={!dirty || pending}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
            Kaydet
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] border-separate border-spacing-1 select-none" onPointerLeave={() => setPaint(null)}>
            <caption className="sr-only">Haftalık müsaitlik çizelgesi. Hücreler bir saatlik dilimleri temsil eder.</caption>
            <thead>
              <tr>
                <th scope="col" className="w-14" />
                {WEEKDAYS.map((day) => (
                  <th key={day} scope="col" className="text-xs font-medium text-muted-foreground">
                    {WEEKDAY_LABELS[day]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TEMPLATE_HOURS.map((hour) => (
                <tr key={hour}>
                  <th scope="row" className="pr-1 text-right font-mono text-[11px] font-normal text-subtle tabular-nums">
                    {hourLabel(hour)}
                  </th>
                  {WEEKDAYS.map((day) => {
                    const key = cellKey({ day, hour });
                    const on = selected.has(key);
                    return (
                      <td key={key} className="p-0">
                        <button
                          type="button"
                          aria-pressed={on}
                          aria-label={`${WEEKDAY_LABELS[day]} ${hourLabel(hour)} - ${hourLabel(hour + 1)}`}
                          onPointerDown={(e) => {
                            e.preventDefault();
                            setPaint(!on);
                            set(key, !on);
                          }}
                          onPointerEnter={() => paint !== null && set(key, paint)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              set(key, !on);
                            }
                          }}
                          className={cn(
                            "block h-7 w-full rounded-md border outline-none transition-colors duration-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                            on ? "border-brand/50 bg-brand/25 hover:bg-brand/35" : "border-border bg-surface-sunken hover:border-border-strong",
                          )}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Haftada <span className="font-mono text-foreground tabular-nums">{weeklyHours(draft)}</span> saat, yaklaşık{" "}
          <span className="font-mono text-foreground tabular-nums">{weeklySlotCount(draft, length)}</span> seans.
          {dirty ? " Kaydedilmemiş değişiklikler var." : null}
        </p>
      </CardContent>
    </Card>
  );
}
