"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogDescription, DialogTitle, SheetContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { initials, type ShowcasePerson } from "./showcase-data";

export interface DrawerSkin {
  /** The grid of cards. */
  grid: string;
  /** One card button (avatar + name only). */
  card: string;
  avatar: string;
  name: string;
  /** The sheet panel and its inner pieces. */
  sheet: string;
  field: string;
  input: string;
  send: string;
}

/**
 * Person cards that slide a detail sheet in from the right: school, department, about and an inline
 * message form. Preview only: sending shows a toast and nothing leaves the page.
 */
export function PersonDrawerGrid({ people, skin }: { people: ShowcasePerson[]; skin: DrawerSkin }) {
  const [open, setOpen] = useState(false);
  const [shownId, setShownId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const active = people.find((p) => p.id === shownId) ?? null;

  return (
    <>
      <ul className={skin.grid}>
        {people.map((person) => (
          <li key={person.id}>
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={() => {
                setShownId(person.id);
                setMessage("");
                setOpen(true);
              }}
              className={cn(
                "w-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]",
                skin.card,
              )}
            >
              <span className={skin.avatar} aria-hidden>
                {initials(person.name)}
              </span>
              <span className={skin.name}>{person.name}</span>
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={open} onOpenChange={setOpen}>
        {active ? (
          <SheetContent className={skin.sheet}>
            <div className="flex items-center gap-4 pr-8">
              <span className={cn(skin.avatar, "size-14 text-lg")} aria-hidden>
                {initials(active.name)}
              </span>
              <div className="min-w-0">
                <DialogTitle className="truncate">{active.name}</DialogTitle>
                <DialogDescription>{active.role}</DialogDescription>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div className={skin.field}>
                <dt className="text-xs text-subtle">Okul</dt>
                <dd>{active.school}</dd>
              </div>
              <div className={skin.field}>
                <dt className="text-xs text-subtle">Bölüm</dt>
                <dd>{active.department}</dd>
              </div>
            </dl>
            <section aria-label="Hakkında" className="flex flex-col gap-1.5">
              <h3 className="text-xs text-subtle">Hakkında</h3>
              <p className="text-sm leading-relaxed">{active.about}</p>
            </section>
            <form
              className="mt-auto flex flex-col gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                toast.success("Önizleme: mesaj gönderilmedi", { description: active.name });
                setOpen(false);
              }}
            >
              <label htmlFor="showcase-message" className="text-sm font-medium">
                {active.name.split(" ")[0]} ile mesajlaş
              </label>
              <textarea
                id="showcase-message"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Merhaba, projen hakkında konuşabilir miyiz?"
                className={skin.input}
              />
              <button type="submit" disabled={!message.trim()} className={skin.send}>
                <Send className="size-4" aria-hidden /> Mesaj gönder
              </button>
            </form>
          </SheetContent>
        ) : null}
      </Dialog>
    </>
  );
}
