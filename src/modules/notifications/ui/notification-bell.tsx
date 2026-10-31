"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { markAllNotificationsReadAction, markNotificationReadAction } from "../application/notifications.actions";
import type { NotificationItem } from "../application/notifications.queries";

type Patch = { type: "one"; id: string } | { type: "all" };

interface NotificationBellProps {
  items: NotificationItem[];
  unreadCount: number;
}

export function NotificationBell({ items, unreadCount }: NotificationBellProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const [state, patch] = useOptimistic({ items, unreadCount }, (current, change: Patch) => {
    if (change.type === "all") return { items: current.items.map((n) => ({ ...n, read: true })), unreadCount: 0 };
    const target = current.items.find((n) => n.id === change.id);
    if (!target || target.read) return current;
    return {
      items: current.items.map((n) => (n.id === change.id ? { ...n, read: true } : n)),
      unreadCount: Math.max(0, current.unreadCount - 1),
    };
  });

  const openItem = (item: NotificationItem) => {
    setOpen(false);
    startTransition(async () => {
      patch({ type: "one", id: item.id });
      if (item.href) router.push(item.href);
      await markNotificationReadAction(item.id);
    });
  };

  const markAll = () =>
    startTransition(async () => {
      patch({ type: "all" });
      await markAllNotificationsReadAction();
    });

  const label = state.unreadCount > 0 ? `Bildirimler, ${state.unreadCount} okunmamış` : "Bildirimler";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={label}>
          <Bell />
          {state.unreadCount > 0 ? (
            <span
              className="absolute top-1 right-1 grid min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] leading-4 font-semibold text-brand-foreground tabular-nums ring-2 ring-background"
              aria-hidden
            >
              {state.unreadCount > 9 ? "9+" : state.unreadCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent aria-label="Bildirimler">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Bildirimler</p>
          {state.unreadCount > 0 ? (
            <Button variant="ghost" size="sm" onClick={markAll}>
              <CheckCheck aria-hidden /> Tümünü okundu say
            </Button>
          ) : null}
        </div>
        {state.items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
            <BellOff className="size-5 text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">Henüz bildirimin yok.</p>
          </div>
        ) : (
          <ul className="max-h-96 divide-y overflow-y-auto">
            {state.items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => openItem(item)}
                  className="flex w-full gap-3 px-4 py-3 text-left transition-colors outline-none hover:bg-accent focus-visible:bg-accent"
                >
                  <span
                    className={cn("mt-1.5 size-2 shrink-0 rounded-full", item.read ? "bg-transparent" : "bg-brand")}
                    aria-hidden
                  />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className={cn("text-sm", item.read ? "text-muted-foreground" : "font-medium")}>
                      {item.title}
                      {!item.read ? <span className="sr-only"> (okunmamış)</span> : null}
                    </span>
                    {item.body ? <span className="truncate text-xs text-muted-foreground">{item.body}</span> : null}
                    <time dateTime={item.createdAt.toISOString()} className="text-[11px] text-muted-foreground">
                      {formatRelative(item.createdAt)}
                    </time>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
