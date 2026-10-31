"use client";

import { useState } from "react";
import Link from "next/link";
import { LifeBuoy, LogOut, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SupportDialog } from "@/modules/administration/ui/support-dialog";
import { signOutAction } from "@/modules/identity/application/auth.actions";
import { ROLE_LABELS, type Role } from "@/modules/identity/domain/role";
import { initials } from "@/lib/utils";

export interface UserMenuProps {
  name: string;
  surname: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
  profileHref: string;
}

export function UserMenu({ name, surname, email, role, avatarUrl, profileHref }: UserMenuProps) {
  const [supportOpen, setSupportOpen] = useState(false);

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label="Hesap menüsü"
      >
        <Avatar>
          {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
          <AvatarFallback>{initials(name, surname)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>
          <p className="font-medium">
            {name} {surname}
          </p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
          <p className="mt-1 text-xs text-brand">{ROLE_LABELS[role]}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={profileHref}>
            <UserRound /> Profil
          </Link>
        </DropdownMenuItem>
        {role !== "ADMIN" ? (
          <DropdownMenuItem onSelect={() => setSupportOpen(true)}>
            <LifeBuoy /> Destek talebi
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem onSelect={() => void signOutAction()}>
          <LogOut /> Çıkış yap
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <SupportDialog open={supportOpen} onOpenChange={setSupportOpen} />
    </>
  );
}
