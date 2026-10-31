"use client";

import { useState } from "react";
import { Dialog } from "radix-ui";
import { ListTree, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OutlineModule } from "../domain/lessons";
import { LessonOutline } from "./lesson-outline";

/** Mobile: the lesson tree in a bottom sheet, opened from a sticky button. */
export function OutlineSheet({ slug, modules, activeId, completion }: { slug: string; modules: OutlineModule[]; activeId: string | null; completion: number }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="outline" className="w-full justify-between lg:hidden">
          <span className="flex items-center gap-2">
            <ListTree aria-hidden /> Müfredat
          </span>
          <span className="font-mono text-xs text-muted-foreground tabular-nums">%{completion}</span>
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-overlay backdrop-blur-sm data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in lg:hidden" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[80dvh] flex-col rounded-t-2xl border-t border-border bg-popover shadow-2xl outline-none data-[state=closed]:animate-fade-out data-[state=open]:animate-enter lg:hidden">
          <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border-strong" aria-hidden />
          <div className="flex items-center justify-between px-4 pt-2 pb-3">
            <Dialog.Title className="text-sm font-semibold">Müfredat</Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Kapat">
                <X />
              </Button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">Bölümler ve dersler</Dialog.Description>
          <div className="overflow-y-auto px-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <LessonOutline slug={slug} modules={modules} activeId={activeId} onNavigate={() => setOpen(false)} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
