"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PenSquare, Search } from "lucide-react";
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
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/ui/user-avatar";
import { fullName } from "@/lib/utils";
import { ROLE_LABELS } from "@/modules/identity/domain/role";
import { startThreadAction } from "../application/messaging.actions";
import type { Contact } from "../application/messaging.queries";
import { MAX_MESSAGE_LENGTH } from "../domain/schemas";

const normalize = (value: string) => value.toLocaleLowerCase("tr-TR");

export function ComposeDialog({ contacts, basePath }: { contacts: Contact[]; basePath: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [receiverId, setReceiverId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const filtered = useMemo(() => {
    const term = normalize(search.trim());
    if (!term) return contacts;
    return contacts.filter((c) =>
      [fullName(c), c.title ?? "", ROLE_LABELS[c.role]].some((field) => normalize(field).includes(term)),
    );
  }, [contacts, search]);
  const receiver = contacts.find((c) => c.id === receiverId) ?? null;

  const reset = () => {
    setSearch("");
    setReceiverId(null);
    setSubject("");
    setContent("");
    setErrors({});
  };

  const submit = () =>
    startTransition(async () => {
      const result = await startThreadAction({ receiverId: receiverId ?? "", subject, content });
      if (!result.ok) {
        setErrors(Object.fromEntries(Object.entries(result.fieldErrors ?? {}).map(([k, v]) => [k, v?.[0]])));
        toast.error(result.error);
        return;
      }
      toast.success("Mesaj gönderildi");
      setOpen(false);
      reset();
      router.push(`${basePath}/${result.data.threadId}`);
    });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <PenSquare aria-hidden /> Yeni mesaj
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Yeni mesaj</DialogTitle>
          <DialogDescription>Alıcı mesajını uygulama içi bildirimle görecek.</DialogDescription>
        </DialogHeader>
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">Alıcı</legend>
            {receiver ? (
              <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-3 py-2">
                <UserAvatar user={receiver} className="size-7" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{fullName(receiver)}</span>
                  <span className="block truncate text-xs text-muted-foreground">{ROLE_LABELS[receiver.role]}</span>
                </span>
                <Button type="button" variant="ghost" size="sm" onClick={() => setReceiverId(null)}>
                  Değiştir
                </Button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input
                    aria-label="Kişi ara"
                    placeholder="İsim, unvan veya rol ara…"
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <ul aria-label="Kişiler" className="max-h-56 overflow-y-auto rounded-lg border">
                  {filtered.length === 0 ? (
                    <li className="px-3 py-6 text-center text-sm text-muted-foreground">Sonuç bulunamadı.</li>
                  ) : (
                    filtered.map((contact) => (
                      <li key={contact.id}>
                        <button
                          type="button"
                          onClick={() => setReceiverId(contact.id)}
                          className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors outline-none hover:bg-accent focus-visible:bg-accent"
                        >
                          <UserAvatar user={contact} className="size-7" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm">{fullName(contact)}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {ROLE_LABELS[contact.role]}
                              {contact.title ? ` · ${contact.title}` : null}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </>
            )}
            {errors.receiverId ? <p className="text-xs text-destructive">{errors.receiverId}</p> : null}
          </fieldset>

          <FormField id="compose-subject" label="Konu" error={errors.subject}>
            <Input
              id="compose-subject"
              value={subject}
              maxLength={150}
              onChange={(e) => setSubject(e.target.value)}
              aria-invalid={Boolean(errors.subject)}
              aria-describedby={errors.subject ? "compose-subject-message" : undefined}
            />
          </FormField>
          <FormField id="compose-content" label="Mesaj" error={errors.content}>
            <Textarea
              id="compose-content"
              rows={5}
              value={content}
              maxLength={MAX_MESSAGE_LENGTH}
              onChange={(e) => setContent(e.target.value)}
              aria-invalid={Boolean(errors.content)}
              aria-describedby={errors.content ? "compose-content-message" : undefined}
            />
          </FormField>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={pending}>
                Vazgeç
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending || !receiverId}>
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
              Gönder
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

