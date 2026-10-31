"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createTicketAction } from "../application/support.actions";

interface SupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Controlled so it can be opened from a dropdown menu item without nesting focus traps. */
export function SupportDialog({ open, onOpenChange }: SupportDialogProps) {
  const [pending, startTransition] = useTransition();
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const close = (next: boolean) => {
    if (pending) return;
    onOpenChange(next);
    if (!next) {
      setSubject("");
      setContent("");
      setErrors({});
    }
  };

  const submit = () =>
    startTransition(async () => {
      const result = await createTicketAction({ subject, content });
      if (!result.ok) {
        setErrors(Object.fromEntries(Object.entries(result.fieldErrors ?? {}).map(([k, v]) => [k, v?.[0]])));
        toast.error(result.error);
        return;
      }
      toast.success("Destek talebin alındı", { description: "Yanıtı mesaj kutunda göreceksin." });
      close(false);
    });

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Destek talebi</DialogTitle>
          <DialogDescription>Platform yöneticileri talebini inceleyip mesaj kutuna yanıt verecek.</DialogDescription>
        </DialogHeader>
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <FormField id="ticket-subject" label="Konu" error={errors.subject}>
            <Input
              id="ticket-subject"
              value={subject}
              maxLength={150}
              onChange={(e) => setSubject(e.target.value)}
              aria-invalid={Boolean(errors.subject)}
              aria-describedby={errors.subject ? "ticket-subject-message" : undefined}
            />
          </FormField>
          <FormField id="ticket-content" label="Açıklama" error={errors.content}>
            <Textarea
              id="ticket-content"
              rows={5}
              value={content}
              maxLength={5000}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Ne oldu, ne bekliyordun? Hangi sayfadaydın?"
              aria-invalid={Boolean(errors.content)}
              aria-describedby={errors.content ? "ticket-content-message" : undefined}
            />
          </FormField>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={pending}>
                Vazgeç
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
              Gönder
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
