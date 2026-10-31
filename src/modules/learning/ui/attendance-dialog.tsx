"use client";

import { useState, useTransition } from "react";
import { ClipboardList, Loader2 } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/ui/user-avatar";
import { cn, fullName } from "@/lib/utils";
import { saveAttendanceAction } from "../application/learning.actions";
import type { InstructorSession, RosterStudent } from "../application/instructor-courses.queries";
import { ATTENDANCE_LABELS, type AttendanceStatus } from "../domain/attendance";

const STATUSES: AttendanceStatus[] = ["PRESENT", "ABSENT", "EXCUSED"];

const initialRecords = (session: InstructorSession, roster: RosterStudent[]) => {
  const existing = new Map(session.attendance.map((a) => [a.studentId, a.status]));
  return Object.fromEntries(roster.map((s) => [s.id, existing.get(s.id) ?? "PRESENT"])) as Record<string, AttendanceStatus>;
};

export function AttendanceDialog({ session, roster }: { session: InstructorSession; roster: RosterStudent[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [records, setRecords] = useState(() => initialRecords(session, roster));
  const taken = session.attendance.length > 0;

  const save = () =>
    startTransition(async () => {
      const result = await saveAttendanceAction({
        sessionId: session.id,
        records: Object.entries(records).map(([studentId, status]) => ({ studentId, status })),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Yoklama kaydedildi (${result.data.saved} katılımcı)`);
      setOpen(false);
    });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        if (next) setRecords(initialRecords(session, roster));
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" disabled={roster.length === 0}>
          <ClipboardList aria-hidden /> {taken ? "Yoklamayı düzenle" : "Yoklama al"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Yoklama · {session.title}</DialogTitle>
          <DialogDescription>Varsayılan olarak herkes &quot;Katıldı&quot; işaretlidir.</DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col divide-y rounded-lg border">
          {roster.map((student) => (
            <li key={student.id} className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center">
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <UserAvatar user={student} className="size-7" />
                <span className="truncate text-sm">{fullName(student)}</span>
              </span>
              <span role="radiogroup" aria-label={`${fullName(student)} yoklama durumu`} className="inline-flex rounded-md border p-0.5">
                {STATUSES.map((status) => {
                  const checked = records[student.id] === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      role="radio"
                      aria-checked={checked}
                      onClick={() => setRecords((prev) => ({ ...prev, [student.id]: status }))}
                      className={cn(
                        "h-7 rounded px-2 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        checked
                          ? status === "ABSENT"
                            ? "bg-destructive/10 text-destructive"
                            : status === "EXCUSED"
                              ? "bg-warning/15 text-warning"
                              : "bg-success/12 text-success"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {ATTENDANCE_LABELS[status]}
                    </button>
                  );
                })}
              </span>
            </li>
          ))}
        </ul>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={pending}>
              Vazgeç
            </Button>
          </DialogClose>
          <Button onClick={save} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
