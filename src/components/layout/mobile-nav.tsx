"use client";

import { useState } from "react";
import { Dialog } from "radix-ui";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SHELL_LABEL, type ShellVariant } from "@/config/navigation";
import { Brand } from "./brand";
import { SidebarNav } from "./sidebar-nav";

export function MobileNav({ variant }: { variant: ShellVariant }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menüyü aç">
          <Menu />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-zinc-950/70 backdrop-blur-sm data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in lg:hidden" />
        <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col gap-6 border-r border-border bg-sidebar p-4 shadow-2xl outline-none data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in lg:hidden">
          <div className="flex items-center justify-between">
            <Brand subtitle={SHELL_LABEL[variant]} />
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Menüyü kapat">
                <X />
              </Button>
            </Dialog.Close>
          </div>
          <Dialog.Title className="sr-only">Navigasyon</Dialog.Title>
          <Dialog.Description className="sr-only">Uygulama sayfaları arasında gezinin.</Dialog.Description>
          <SidebarNav variant={variant} onNavigate={() => setOpen(false)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
