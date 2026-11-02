"use client";

import { useState, useTransition } from "react";
import { Check, ExternalLink, Link2, Loader2, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setMeetingLinkAction } from "../application/mentoring.actions";

/** The session's external meeting link: open it, or (mentor / admin) add or change it inline. */
export function MeetingLinkField({ appointmentId, link, editable }: { appointmentId: string; link: string | null; editable: boolean }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(link ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputId = `meeting-link-${appointmentId}`;

  const save = () =>
    startTransition(async () => {
      const result = await setMeetingLinkAction({ appointmentId, meetingLink: value.trim() });
      if (!result.ok) {
        setError(result.fieldErrors?.meetingLink?.[0] ?? result.error);
        return;
      }
      toast.success(value.trim() ? "Görüşme bağlantısı kaydedildi" : "Bağlantı kaldırıldı");
      setError(null);
      setEditing(false);
    });

  if (editing) {
    return (
      <form
        className="flex flex-col gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <label htmlFor={inputId} className="text-xs font-medium text-muted-foreground">
          Görüşme bağlantısı
        </label>
        <div className="flex gap-2">
          <Input
            id={inputId}
            type="url"
            inputMode="url"
            placeholder="https://meet.google.com/..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : undefined}
            autoFocus
            className="h-8"
          />
          <Button type="submit" size="icon" className="size-8 shrink-0" disabled={pending} aria-label="Bağlantıyı kaydet">
            {pending ? <Loader2 className="animate-spin" /> : <Check />}
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8 shrink-0"
            disabled={pending}
            aria-label="Vazgeç"
            onClick={() => {
              setValue(link ?? "");
              setError(null);
              setEditing(false);
            }}
          >
            <X />
          </Button>
        </div>
        {error ? (
          <p id={`${inputId}-error`} className="text-xs text-destructive">
            {error}
          </p>
        ) : null}
      </form>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {link ? (
        <Button asChild size="sm" variant="outline">
          <a href={link} target="_blank" rel="noreferrer noopener">
            <ExternalLink aria-hidden /> Görüşme bağlantısı
          </a>
        </Button>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link2 className="size-3.5" aria-hidden /> Bağlantı eklenmedi
        </span>
      )}
      {editable ? (
        <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(true)}>
          <Pencil aria-hidden /> {link ? "Değiştir" : "Bağlantı ekle"}
        </Button>
      ) : null}
    </div>
  );
}
