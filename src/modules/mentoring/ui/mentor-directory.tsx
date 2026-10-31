"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { surfaceClass } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { PersonHeader } from "@/components/ui/person-header";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatDateTime } from "@/lib/format";
import { cn, fullName, splitTags } from "@/lib/utils";
import type { MentorProfileModel } from "../application/mentor-directory.queries";
import { SlotPicker } from "./slot-picker";

const MAX_CARD_TAGS = 3;

function MentorCard({ mentor, onOpen }: { mentor: MentorProfileModel; onOpen: () => void }) {
  const tags = splitTags(mentor.expertiseArea);
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      className={cn(
        surfaceClass,
        "group flex h-full w-full flex-col gap-4 p-6 text-left outline-none transition-[border-color,background-color] duration-150 hover:border-border-strong hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.99]",
      )}
    >
      <span className="flex items-center gap-3">
        <UserAvatar user={mentor} className="size-12" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{fullName(mentor)}</span>
          {mentor.title ? <span className="block truncate text-sm text-muted-foreground">{mentor.title}</span> : null}
        </span>
      </span>
      {tags.length > 0 ? (
        <span className="flex flex-wrap gap-2">
          {tags.slice(0, MAX_CARD_TAGS).map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
          {tags.length > MAX_CARD_TAGS ? <Badge variant="outline">+{tags.length - MAX_CARD_TAGS}</Badge> : null}
        </span>
      ) : null}
      <span className="mt-auto flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
        <CalendarClock className="size-3.5 shrink-0" aria-hidden />
        {mentor.nextAvailable ? (
          <>
            <span className="truncate">
              İlk müsait <time className="font-mono tabular-nums" dateTime={mentor.nextAvailable.toISOString()}>{formatDateTime(mentor.nextAvailable)}</time>
            </span>
            <span className="ml-auto shrink-0 font-mono tabular-nums text-subtle">{mentor.openSlotCount} slot</span>
          </>
        ) : (
          <span>Şu an müsait saat yok</span>
        )}
      </span>
    </button>
  );
}

/** Mentor grid; a card opens its profile and slot picker in a modal, no navigation needed. */
export function MentorDirectory({ mentors }: { mentors: MentorProfileModel[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const active = mentors.find((m) => m.id === openId) ?? null;

  return (
    <>
      <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {mentors.map((mentor) => (
          <li key={mentor.id}>
            <MentorCard mentor={mentor} onOpen={() => setOpenId(mentor.id)} />
          </li>
        ))}
      </ul>

      <Dialog open={active !== null} onOpenChange={(open) => !open && setOpenId(null)}>
        {active ? (
          <DialogContent className="max-w-2xl gap-8">
            <PersonHeader
              person={active}
              titleAs={(name) => <DialogTitle className="truncate text-lg">{name}</DialogTitle>}
              className="pr-8"
            />
            <DialogDescription className="sr-only">Mentor profili ve müsait randevu saatleri</DialogDescription>
            <section aria-label="Randevu al" className="flex flex-col gap-4">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-sm font-semibold">Randevu al</h3>
                <Link
                  href={`/mentors/${active.id}`}
                  className="inline-flex items-center gap-1 rounded-sm text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-popover"
                >
                  Profil sayfası <ArrowUpRight className="size-3.5" aria-hidden />
                </Link>
              </div>
              <SlotPicker key={active.id} mentorName={fullName(active)} slots={active.slots} />
            </section>
          </DialogContent>
        ) : null}
      </Dialog>
    </>
  );
}
