"use client";

import { useState, useTransition } from "react";
import { Loader2, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { createAnnouncementAction } from "../application/announcement.actions";
import { ANNOUNCEMENT_PRIORITIES, PRIORITY_LABELS, type AnnouncementPriority } from "../domain/announcements";

interface AnnouncementDialogProps {
  /** Fixed course (instructor course page). Omit for the admin's platform-wide composer. */
  courseId?: string;
  /** Admin only: optionally target a course instead of the whole platform. */
  courses?: Array<{ id: string; title: string }>;
}

export function AnnouncementDialog({ courseId, courses }: AnnouncementDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [target, setTarget] = useState(courseId ?? "");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<AnnouncementPriority>("NORMAL");
  const [pinned, setPinned] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const submit = () =>
    startTransition(async () => {
      const result = await createAnnouncementAction({ courseId: target || null, title, content, priority, pinned });
      if (!result.ok) {
        setErrors(Object.fromEntries(Object.entries(result.fieldErrors ?? {}).map(([k, v]) => [k, v?.[0]])));
        toast.error(result.error);
        return;
      }
      toast.success("Duyuru yayınlandı");
      setOpen(false);
      setTitle("");
      setContent("");
      setPriority("NORMAL");
      setPinned(false);
      setErrors({});
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Megaphone aria-hidden /> Duyuru
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Duyuru yayınla</DialogTitle>
          <DialogDescription>
            {courseId || target ? "Eğitime kayıtlı katılımcılar bildirim alır." : "Tüm katılımcılar görür; yüksek öncelikte ayrıca bildirim gider."}
          </DialogDescription>
        </DialogHeader>
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          {!courseId && courses ? (
            <FormField id="announcement-target" label="Kapsam">
              <NativeSelect id="announcement-target" value={target} onChange={(e) => setTarget(e.target.value)}>
                <option value="">Tüm platform</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
          ) : null}
          <FormField id="announcement-title" label="Başlık" error={errors.title}>
            <Input id="announcement-title" value={title} onChange={(e) => setTitle(e.target.value)} aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? "announcement-title-message" : undefined} />
          </FormField>
          <FormField id="announcement-content" label="İçerik" error={errors.content}>
            <Textarea id="announcement-content" rows={5} value={content} onChange={(e) => setContent(e.target.value)} aria-invalid={Boolean(errors.content)} aria-describedby={errors.content ? "announcement-content-message" : undefined} />
          </FormField>
          <div className="flex flex-wrap items-end gap-4">
            <FormField id="announcement-priority" label="Öncelik">
              <NativeSelect id="announcement-priority" value={priority} onChange={(e) => setPriority(e.target.value as AnnouncementPriority)} className="w-36">
                {ANNOUNCEMENT_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABELS[p]}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <label className="flex h-9 items-center gap-2 text-sm">
              <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="size-4 accent-[var(--brand)]" />
              Sabitle
            </label>
          </div>
          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={pending}>
                Vazgeç
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
              Yayınla
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
