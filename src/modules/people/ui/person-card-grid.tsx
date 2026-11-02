"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Building2, GraduationCap, Link2, Loader2, Mail, MapPin, Send, Target, Users } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { surfaceClass } from "@/components/ui/card";
import { Dialog, DialogDescription, DialogTitle, SheetContent } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/format";
import { cn, fullName, initials, splitTags } from "@/lib/utils";
import { ATTENDANCE_LABELS } from "@/modules/learning/domain/attendance";
import { ROLE_LABELS } from "@/modules/identity/domain/role";
import { startThreadAction } from "@/modules/messaging/application/messaging.actions";
import { avatarTone, SOCIAL_LABELS, type PersonRecord, type PersonSummary } from "../domain/person";

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

function Fact({ icon: Icon, label, children }: { icon: typeof Building2; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0">
        <dt className="text-xs text-subtle">{label}</dt>
        <dd className="break-words">{children}</dd>
      </div>
    </div>
  );
}

function TextBlock({ title, text, empty }: { title: string; text: string | null; empty: string }) {
  return (
    <section aria-label={title} className="flex flex-col gap-1.5">
      <h3 className="text-xs font-medium text-subtle">{title}</h3>
      <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">{text || empty}</p>
    </section>
  );
}

const ROLE_DOT = { STUDENT: "bg-brand", INSTRUCTOR: "bg-cyan", MENTOR: "bg-amber", ADMIN: "bg-magenta" } as const;

/** Micro role tag: a brand-coloured dot and the role name. */
function RoleTag({ role }: { role: PersonSummary["role"] }) {
  return (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border px-2 py-px text-[11px] text-muted-foreground">
      <span className={cn("size-1.5 rounded-full", ROLE_DOT[role])} aria-hidden />
      {ROLE_LABELS[role]}
    </span>
  );
}

/** Quiet second line on the card: school for participants, title or role for experts. */
const cardSubtitle = (person: PersonSummary) => (person.role === "STUDENT" ? (person.school ?? ROLE_LABELS.STUDENT) : (person.title ?? ROLE_LABELS[person.role]));

const isRecord = (person: PersonSummary | PersonRecord): person is PersonRecord => "email" in person;

/** School, department, about (+ expertise for experts); the admin's record view adds contact, city, goals, team and links. */
function PersonDetails({ person }: { person: PersonSummary | PersonRecord }) {
  const record = isRecord(person) ? person : null;
  const tags = splitTags(person.expertiseArea);
  const links = record ? Object.entries(record.socialLinks) : [];

  return (
    <>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        {record ? (
          <Fact icon={Mail} label="E-posta">
            <a href={`mailto:${record.email}`} className="rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">
              {record.email}
            </a>
          </Fact>
        ) : null}
        {person.role === "STUDENT" || person.school ? (
          <Fact icon={GraduationCap} label="Okul">
            {person.school ?? <span className="text-muted-foreground">Belirtilmemiş</span>}
          </Fact>
        ) : null}
        {person.role === "STUDENT" || person.department ? (
          <Fact icon={Building2} label="Bölüm">
            {person.department ?? <span className="text-muted-foreground">Belirtilmemiş</span>}
          </Fact>
        ) : null}
        {record ? (
          <Fact icon={MapPin} label="Şehir">
            {record.city ?? <span className="text-muted-foreground">Belirtilmemiş</span>}
          </Fact>
        ) : null}
        {record ? (
          <Fact icon={Users} label="Ekip">
            {record.team ? (
              <>
                {record.team.name}
                {record.isRepresentative ? (
                  <Badge variant="secondary" className="ml-2 align-middle">
                    Ekip temsilcisi
                  </Badge>
                ) : null}
              </>
            ) : (
              <span className="text-muted-foreground">Ekip yok</span>
            )}
          </Fact>
        ) : null}
      </dl>

      {tags.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label="Uzmanlık alanları">
          {tags.map((tag) => (
            <li key={tag}>
              <Badge variant="secondary">{tag}</Badge>
            </li>
          ))}
        </ul>
      ) : null}

      <TextBlock title="Hakkımda" text={person.about} empty="Henüz bir şey yazmamış." />
      {record ? <TextBlock title="Hedefler" text={record.goals} empty="Henüz hedef eklememiş." /> : null}
      {record?.team?.focusArea ? (
        <section aria-label="Ekibin çözmek istediği sorun" className="flex items-start gap-2.5 rounded-lg bg-muted/40 p-3 text-sm">
          <Target className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <p className="leading-relaxed text-muted-foreground">{record.team.focusArea}</p>
        </section>
      ) : null}
      {record ? (
        <section aria-label="Yoklama geçmişi" className="flex flex-col gap-2">
          <h3 className="flex items-baseline justify-between text-xs font-medium text-subtle">
            Yoklama geçmişi
            <span className="font-mono tabular-nums">
              {record.attendance.filter((a) => a.status === "PRESENT").length}/{record.attendance.filter((a) => a.status !== "EXCUSED").length} katıldı
            </span>
          </h3>
          {record.attendance.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz yoklama alınmadı.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
              {record.attendance.map((a) => (
                <li key={`${a.title}-${a.date.toISOString()}`} className="flex items-center justify-between gap-3 px-3 py-1.5 text-sm">
                  <span className="min-w-0 truncate">{a.title}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="font-mono text-xs text-subtle tabular-nums">{formatDate(a.date)}</span>
                    <Badge variant={a.status === "PRESENT" ? "success" : a.status === "ABSENT" ? "destructive" : "outline"}>{ATTENDANCE_LABELS[a.status]}</Badge>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
      {links.length > 0 ? (
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm" aria-label="Bağlantılar">
          {links.map(([key, url]) => (
            <li key={key}>
              <a
                href={url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 rounded-sm text-brand-soft underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Link2 className="size-3.5" aria-hidden />
                {SOCIAL_LABELS[key] ?? key}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

interface PersonCardGridProps {
  people: Array<PersonSummary | PersonRecord>;
  /** Whether the viewer may message these people (server decides from the contact policy). */
  canMessage?: boolean;
  /** The viewer's own card (e.g. in "Ekibim") opens without a message form. */
  viewerId?: string;
  /** Extra per-person content rendered inside the detail modal (e.g. the admin's badge panel). */
  details?: Record<string, ReactNode>;
  emptyTitle?: string;
  emptyDescription?: string;
}

/** Compact card grid (photo or initials, name, role tag); a card slides the details and a message form in from the right. */
export function PersonCardGrid({ people, canMessage = false, viewerId, details = {}, emptyTitle = "Henüz kimse yok", emptyDescription }: PersonCardGridProps) {
  const [open, setOpen] = useState(false);
  // The last opened person stays rendered while the sheet slides out.
  const [shownId, setShownId] = useState<string | null>(null);
  const active = people.find((p) => p.id === shownId) ?? null;

  if (people.length === 0) return <EmptyState icon={Users} title={emptyTitle} description={emptyDescription ?? ""} />;

  return (
    <>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {people.map((person) => (
          <li key={person.id}>
            <button
              type="button"
              onClick={() => {
                setShownId(person.id);
                setOpen(true);
              }}
              aria-haspopup="dialog"
              className={cn(
                surfaceClass,
                "flex h-full w-full items-center gap-3 px-4 py-3.5 text-left outline-none transition-[border-color,background-color,scale] duration-150 hover:border-brand/50 hover:bg-brand/[0.03] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]",
              )}
            >
              <PersonAvatar person={person} className="size-10" />
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate text-sm font-medium">
                  {fullName(person)}
                  {person.id === viewerId ? <span className="font-normal text-muted-foreground"> (sen)</span> : null}
                </span>
                <RoleTag role={person.role} />
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={open} onOpenChange={setOpen}>
        {active ? (
          <SheetContent>
            <div className="flex items-center gap-4 pr-8">
              <PersonAvatar person={active} className="size-14" />
              <div className="flex min-w-0 flex-col gap-1">
                <DialogTitle className="truncate">{fullName(active)}</DialogTitle>
                <p className="truncate text-sm text-muted-foreground">{cardSubtitle(active)}</p>
              </div>
            </div>
            <DialogDescription className="sr-only">{fullName(active)} profil ayrıntıları</DialogDescription>

            <PersonDetails person={active} />

            {details[active.id] ?? null}

            {canMessage && active.id !== viewerId ? <MessageForm key={active.id} person={active} onSent={() => setOpen(false)} /> : null}
          </SheetContent>
        ) : null}
      </Dialog>
    </>
  );
}
