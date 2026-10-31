"use client";

import { useOptimistic, useTransition } from "react";
import { CalendarDays, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { dayKey, formatLongDay, formatTime } from "@/lib/format";
import { removeSlotAction } from "../application/mentoring.actions";
import type { MentorSlotRow } from "../application/mentor-portal.queries";
import { groupByDay } from "../domain/availability";

function SlotState({ slot }: { slot: MentorSlotRow }) {
  if (slot.bookedBy) return <Badge variant="brand">{slot.bookedBy}</Badge>;
  if (slot.isBooked) return <Badge variant="outline">Kapalı</Badge>;
  return <Badge variant="success">Müsait</Badge>;
}

export function MentorSchedule({ slots }: { slots: MentorSlotRow[] }) {
  const [, startTransition] = useTransition();
  const [visible, removeOptimistic] = useOptimistic(slots, (current, removedId: string) =>
    current.filter((s) => s.id !== removedId),
  );
  const days = groupByDay(visible, (s) => s.startTime, dayKey);

  const remove = (slot: MentorSlotRow) =>
    startTransition(async () => {
      removeOptimistic(slot.id);
      const result = await removeSlotAction(slot.id);
      if (result.ok) toast.success(`${formatTime(slot.startTime)} slotu kaldırıldı`);
      else toast.error(result.error);
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Takvimim</CardTitle>
      </CardHeader>
      <CardContent>
        {days.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Henüz müsaitlik eklemedin"
            description="Slot eklediğinde katılımcılar seninle randevu oluşturabilecek."
            className="py-8"
          />
        ) : (
          <div className="flex flex-col gap-6">
            {days.map((day) => (
              <section key={day.key} aria-labelledby={`day-${day.key}`} className="flex flex-col gap-2">
                <h3 id={`day-${day.key}`} className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {formatLongDay(day.date)}
                </h3>
                <ul className="flex flex-col divide-y rounded-lg border">
                  {day.items.map((slot) => (
                    <li key={slot.id} className="flex items-center gap-3 px-3 py-2">
                      <span className="w-28 shrink-0 text-sm tabular-nums">
                        {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        <SlotState slot={slot} />
                      </span>
                      {!slot.isBooked ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-destructive"
                          onClick={() => remove(slot)}
                          aria-label={`${formatLongDay(slot.startTime)} ${formatTime(slot.startTime)} slotunu kaldır`}
                        >
                          <Trash2 />
                        </Button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
