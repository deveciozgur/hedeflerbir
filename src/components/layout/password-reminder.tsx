"use client";

import { useEffect, useState } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const dismissKey = (userId: string) => `hb:password-reminder:${userId}`;

/**
 * First-login prompt for users still on an admin-issued temporary password. "Anladım" hides it for
 * the rest of the browser session; it stops for good once the password is changed (mustChangePassword).
 * Mounted after hydration (Radix dialog + sessionStorage).
 */
export function PasswordReminder({ userId, passwordHref }: { userId: string; passwordHref: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(dismissKey(userId)) === "1";
    } catch {
      // storage blocked: show the reminder
    }
    setOpen(!dismissed);
  }, [userId]);

  const dismiss = () => {
    try {
      sessionStorage.setItem(dismissKey(userId), "1");
    } catch {
      // storage blocked: the reminder simply returns on the next page load
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && dismiss()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <span className="mb-1 grid size-10 place-items-center rounded-full bg-amber/20 text-foreground" aria-hidden>
            <KeyRound className="size-5" />
          </span>
          <DialogTitle>Şifreni değiştir</DialogTitle>
          <DialogDescription>Güvenliğiniz için lütfen ilk girişte şifrenizi profil sayfanızdan değiştirin.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={dismiss}>
            Anladım
          </Button>
          <Button asChild>
            {/* A document navigation, so the browser scrolls to the #sifre card (client routing skips the hash here). */}
            <a href={passwordHref} onClick={dismiss}>
              Şifremi Değiştir
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
