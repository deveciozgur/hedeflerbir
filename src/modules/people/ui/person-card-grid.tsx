"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Building2, Loader2, MapPin, Send, Users } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { surfaceClass } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn, fullName, initials, splitTags } from "@/lib/utils";
import { ROLE_LABELS } from "@/modules/identity/domain/role";
import { startThreadAction } from "@/modules/messaging/application/messaging.actions";
import { avatarTone, type PersonSummary } from "../domain/person";

export function PersonAvatar({ person, className }: { person: Pick<PersonSummary, "id" | "name" | "surname" | "avatarUrl">; className?: string }) {
  return (
    <Avatar className={className}>
      {person.avatarUrl ? <AvatarImage src={person.avatarUrl} alt="" /> : null}
      <AvatarFallback className={cn("text-base font-semibold", avatarTone(person.id))}>{initials(person.name, person.surname)}</AvatarFallback>
    </Avatar>
  );
}

function MessageForm({ person, onSent }: { person: PersonSummary; onSent: () => void }) {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [pending, startTransition] = useTransition();
  const ids = { subject: `msg-subject-${person.id}`, content: `msg-content-${person.id}` };

  return (
    <form
      className="flex flex-col gap-3 border-t border-border pt-5"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await startThreadAction({ receiverId: person.id, subject, content });
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          toast.success("Mesajın gönderildi", { description: fullName(person) });
          setSubject("");
          setContent("");
          onSent();
        });
      }}
    >
      <p className="text-sm font-semibold">Mesaj gönder</p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={ids.subject}>Konu</Label>
        <Input id={ids.subject} value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={150} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={ids.content}>Mesaj</Label>
        <Textarea id={ids.content} rows={4} value={content} onChange={(e) => setContent(e.target.value)} maxLength={5000} />
      </div>
      <Button type="submit" className="self-end" disabled={pending || subject.trim().length < 3 || !content.trim()}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
        Gönder
      </Button>
    </form>
  );
}

interface PersonCardGridProps {
  people: PersonSummary[];
  /** Whether the viewer may message these people (server decides from the contact policy). */
  canMessage?: boolean;
  /** Extra per-person content rendered inside the detail modal (e.g. a mentor's availability). */
  details?: Record<string, ReactNode>;
  emptyTitle?: string;
  emptyDescription?: string;
}

/** Card grid with name + photo only; a card opens the person's details (department, about, team) and a message form. */
export function PersonCardGrid({ people, canMessage = false, details = {}, emptyTitle = "Henüz kimse yok", emptyDescription }: PersonCardGridProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const active = people.find((p) => p.id === openId) ?? null;

  if (people.length === 0) return <EmptyState icon={Users} title={emptyTitle} description={emptyDescription ?? ""} />;

  return (
    <>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {people.map((person) => (
          <li key={person.id}>
            <button
              type="button"
              onClick={() => setOpenId(person.id)}
              aria-haspopup="dialog"
              className={cn(
                surfaceClass,
                "flex h-full w-full flex-col items-center gap-3 px-4 py-6 text-center outline-none transition-[border-color,background-color] duration-150 hover:border-border-hover hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.99]",
              )}
            >
              <PersonAvatar person={person} className="size-16" />
              <span className="line-clamp-2 text-sm font-semibold text-balance">{fullName(person)}</span>
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={active !== null} onOpenChange={(open) => !open && setOpenId(null)}>
        {active ? (
          <DialogContent className="max-w-lg gap-5">
            <div className="flex items-center gap-4 pr-8">
              <PersonAvatar person={active} className="size-16" />
              <div className="min-w-0">
                <DialogTitle className="truncate text-lg">{fullName(active)}</DialogTitle>
                <p className="truncate text-sm text-muted-foreground">{active.title ?? ROLE_LABELS[active.role]}</p>
              </div>
            </div>
            <DialogDescription className="sr-only">{fullName(active)} profil ayrıntıları</DialogDescription>

            <dl className="grid gap-3 text-sm">
              {active.department ? (
                <div className="flex items-start gap-2">
                  <Building2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <dt className="sr-only">Bölüm</dt>
                  <dd>{active.department}</dd>
                </div>
              ) : null}
              {active.city ? (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <dt className="sr-only">Şehir</dt>
                  <dd>{active.city}</dd>
                </div>
              ) : null}
              {active.team ? (
                <div className="flex items-start gap-2">
                  <Users className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <dt className="sr-only">Takım</dt>
                  <dd>
                    {active.team.name}
                    {active.team.focusArea ? <span className="text-muted-foreground"> · {active.team.focusArea}</span> : null}
                  </dd>
                </div>
              ) : null}
            </dl>

            {splitTags(active.expertiseArea).length > 0 ? (
              <ul className="flex flex-wrap gap-2" aria-label="Uzmanlık alanları">
                {splitTags(active.expertiseArea).map((tag) => (
                  <li key={tag}>
                    <Badge variant="secondary">{tag}</Badge>
                  </li>
                ))}
              </ul>
            ) : null}

            <section aria-label="Hakkımda" className="flex flex-col gap-1.5">
              <h3 className="text-xs font-medium text-subtle">Hakkında</h3>
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">{active.about || "Henüz bir şey yazmamış."}</p>
            </section>

            {details[active.id] ?? null}

            {canMessage ? <MessageForm key={active.id} person={active} onSent={() => setOpenId(null)} /> : null}
          </DialogContent>
        ) : null}
      </Dialog>
    </>
  );
}
