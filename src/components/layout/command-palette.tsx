"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useTheme } from "next-themes";
import {
  BookOpen,
  ClipboardCheck,
  CornerDownLeft,
  GraduationCap,
  Layers,
  Loader2,
  LogOut,
  Moon,
  Search,
  Sparkles,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { NAVIGATION, PROFILE_HREF, type ShellVariant } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { searchAction, type SearchGroup, type SearchResult } from "@/modules/search/application/search.actions";

const GROUP_ICON: Record<SearchGroup, LucideIcon> = {
  Eğitimler: BookOpen,
  Dersler: Layers,
  Ödevler: ClipboardCheck,
  Mentorlar: Sparkles,
  Eğitmenler: GraduationCap,
  Kullanıcılar: UserRound,
};

const itemClass =
  "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm outline-none data-[selected=true]:bg-accent data-[selected=true]:text-foreground aria-disabled:opacity-50";
const groupClass =
  "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-subtle";

/** ⌘K / Ctrl+K spotlight: jump to any page, or search courses, lessons, assignments and people the role can see. */
export function CommandPalette({ variant }: { variant: ShellVariant }) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, startSearch] = useTransition();
  const [isMac, setIsMac] = useState(false);
  // The dialog (Radix ids, cmdk) mounts only after hydration; rendering it during SSR shifted the ids of
  // the header's other Radix widgets and caused a hydration mismatch.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsMac(/mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent));
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Debounced server search; stale responses are dropped by the cleanup flag.
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    let stale = false;
    const timer = setTimeout(() => {
      startSearch(async () => {
        const found = await searchAction(query);
        if (!stale) setResults(found);
      });
    }, 200);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [query]);

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  const groups = [...new Set(results.map((r) => r.group))];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 items-center gap-2 rounded-md border border-border bg-surface-raised px-2.5 text-sm text-muted-foreground outline-none transition-colors hover:border-border-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-56"
        aria-label="Ara"
      >
        <Search className="size-4 shrink-0" aria-hidden />
        <span className="hidden flex-1 text-left sm:inline">Ara…</span>
        <kbd className="hidden rounded border border-border bg-surface-sunken px-1.5 font-mono text-[11px] sm:inline">{isMac ? "⌘K" : "Ctrl K"}</kbd>
      </button>

      {mounted ? (
        <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
          <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-overlay backdrop-blur-sm data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />
            <DialogPrimitive.Content
              className="fixed top-[12dvh] left-1/2 z-50 w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border border-border-strong/60 bg-popover text-popover-foreground shadow-2xl shadow-shadow outline-none data-[state=closed]:animate-exit data-[state=open]:animate-enter"
              aria-describedby={undefined}
            >
              <DialogPrimitive.Title className="sr-only">Hızlı erişim</DialogPrimitive.Title>
              <Command label="Hızlı erişim" loop>
                <div className="flex items-center gap-2 border-b border-border px-4">
                  {searching ? (
                    <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
                  ) : (
                    <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  )}
                  <Command.Input
                    value={query}
                    onValueChange={setQuery}
                    placeholder="Sayfa, eğitim, ders, ödev veya kişi ara…"
                    className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-subtle"
                  />
                  <kbd className="rounded border border-border bg-surface-sunken px-1.5 font-mono text-[11px] text-muted-foreground">Esc</kbd>
                </div>
                <Command.List className="max-h-[min(60dvh,26rem)] overflow-y-auto p-2">
                  <Command.Empty className="px-3 py-8 text-center text-sm text-muted-foreground">
                    {searching ? "Aranıyor…" : "Sonuç bulunamadı."}
                  </Command.Empty>

                  {groups.map((group) => {
                    const Icon = GROUP_ICON[group];
                    return (
                      <Command.Group key={group} heading={group} className={groupClass}>
                        {results
                          .filter((r) => r.group === group)
                          .map((r) => (
                            <Command.Item
                              key={`${group}-${r.id}`}
                              value={`${r.group} ${r.title} ${r.subtitle ?? ""} ${r.id}`}
                              onSelect={() => go(r.href)}
                              className={itemClass}
                            >
                              <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                              <span className="min-w-0 flex-1 truncate">{r.title}</span>
                              {r.subtitle ? <span className="max-w-[45%] truncate text-xs text-subtle">{r.subtitle}</span> : null}
                            </Command.Item>
                          ))}
                      </Command.Group>
                    );
                  })}

                  {NAVIGATION[variant].map((section, index) => (
                    <Command.Group key={section.label ?? index} heading={section.label ?? "Sayfalar"} className={groupClass}>
                      {section.items.map((item) => (
                        <Command.Item key={item.href} value={`sayfa ${item.title} ${item.href}`} onSelect={() => go(item.href)} className={itemClass}>
                          <item.icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                          <span className="flex-1">{item.title}</span>
                          <CornerDownLeft className="size-3.5 text-subtle opacity-0 [[data-selected=true]_&]:opacity-100" aria-hidden />
                        </Command.Item>
                      ))}
                    </Command.Group>
                  ))}

                  <Command.Group heading="İşlemler" className={groupClass}>
                    <Command.Item value="ayarlar profil hesap" onSelect={() => go(PROFILE_HREF[variant])} className={itemClass}>
                      <UserRound className="size-4 shrink-0 text-muted-foreground" aria-hidden /> Profil ve ayarlar
                    </Command.Item>
                    <Command.Item
                      value="tema karanlık aydınlık dark light"
                      onSelect={() => {
                        setTheme(resolvedTheme === "dark" ? "light" : "dark");
                        setOpen(false);
                      }}
                      className={itemClass}
                    >
                      <Moon className="size-4 shrink-0 text-muted-foreground" aria-hidden />{" "}
                      {resolvedTheme === "dark" ? "Aydınlık temaya geç" : "Karanlık temaya geç"}
                    </Command.Item>
                    <Command.Item
                      value="çıkış yap oturumu kapat logout"
                      onSelect={() => window.location.assign("/logout")}
                      className={cn(itemClass, "text-destructive")}
                    >
                      <LogOut className="size-4 shrink-0" aria-hidden /> Çıkış yap
                    </Command.Item>
                  </Command.Group>
                </Command.List>
              </Command>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      ) : null}
    </>
  );
}
