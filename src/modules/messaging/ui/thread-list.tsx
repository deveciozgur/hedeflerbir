import Link from "next/link";
import { Inbox } from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatRelative } from "@/lib/format";
import { cn, fullName } from "@/lib/utils";
import { ROLE_LABELS } from "@/modules/identity/domain/role";
import type { ThreadSummary } from "../application/messaging.queries";

interface ThreadListProps {
  threads: ThreadSummary[];
  basePath: string;
  activeId?: string;
  /** Appended to every link (e.g. "?scope=all" for admin oversight). */
  query?: string;
}

export function ThreadList({ threads, basePath, activeId, query = "" }: ThreadListProps) {
  if (threads.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
        <Inbox className="size-5 text-muted-foreground" aria-hidden />
        <p className="text-sm font-medium">Henüz konuşma yok</p>
        <p className="text-xs text-muted-foreground">Yeni bir mesaj başlattığında burada görünecek.</p>
      </div>
    );
  }

  return (
    <ul aria-label="Konuşmalar" className="flex flex-col divide-y">
      {threads.map((thread) => {
        const active = thread.id === activeId;
        const [first, second] = thread.people;
        return (
          <li key={thread.id}>
            <Link
              href={`${basePath}/${thread.id}${query}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex gap-3 px-4 py-3 transition-colors outline-none focus-visible:bg-accent",
                active ? "bg-accent" : "hover:bg-accent/50",
              )}
            >
              {first ? <UserAvatar user={first} className="mt-0.5 size-9" /> : null}
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex items-baseline gap-2">
                  <span className={cn("truncate text-sm", thread.unread > 0 ? "font-semibold" : "font-medium")}>
                    {first ? fullName(first) : "-"}
                    {second ? <span className="font-normal text-muted-foreground"> ↔ {fullName(second)}</span> : null}
                  </span>
                  <time dateTime={thread.lastAt.toISOString()} className="ml-auto shrink-0 text-[11px] text-muted-foreground">
                    {formatRelative(thread.lastAt)}
                  </time>
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {!second && first ? `${ROLE_LABELS[first.role]} · ` : null}
                  {thread.subject}
                </span>
                <span className="flex items-center gap-2">
                  <span className={cn("truncate text-xs", thread.unread > 0 ? "text-foreground" : "text-muted-foreground")}>
                    {thread.preview}
                  </span>
                  {thread.unread > 0 ? (
                    <span className="ml-auto grid min-w-5 shrink-0 place-items-center rounded-full bg-brand px-1.5 text-[10px] font-semibold text-brand-foreground tabular-nums">
                      {thread.unread}
                      <span className="sr-only"> okunmamış</span>
                    </span>
                  ) : null}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
