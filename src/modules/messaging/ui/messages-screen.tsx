import Link from "next/link";
import { ArrowLeft, Eye, Inbox, MessagesSquare } from "lucide-react";
import { AutoRefresh } from "@/components/layout/auto-refresh";
import { Badge } from "@/components/ui/badge";
import { SegmentedLinks } from "@/components/ui/segmented-links";
import { UserAvatar } from "@/components/ui/user-avatar";
import { cn, fullName } from "@/lib/utils";
import type { Viewer } from "@/modules/identity/application/viewer.queries";
import { ROLE_LABELS } from "@/modules/identity/domain/role";
import { getThread, listAllThreads, listContacts, listThreads } from "../application/messaging.queries";
import { MESSAGES_PATH } from "../domain/contact-policy";
import { ComposeDialog } from "./compose-dialog";
import { Conversation } from "./conversation";
import { ThreadList } from "./thread-list";

export type MessagesScope = "mine" | "all";

interface MessagesScreenProps {
  viewer: Viewer;
  threadId?: string;
  /** "all" = admin oversight of every conversation (read-only). */
  scope?: MessagesScope;
}

/** Two-pane messaging center shared by every role's area. On mobile only one pane is shown at a time. */
export async function MessagesScreen({ viewer, threadId, scope = "mine" }: MessagesScreenProps) {
  const oversight = scope === "all" && viewer.role === "ADMIN";
  const basePath = MESSAGES_PATH[viewer.role];
  const query = oversight ? "?scope=all" : "";

  const [threads, contacts, thread] = await Promise.all([
    oversight ? listAllThreads() : listThreads(viewer.id),
    listContacts(viewer),
    threadId ? getThread(threadId, oversight ? null : viewer.id) : Promise.resolve(null),
  ]);

  const counterpart = thread && !oversight ? thread.participants.find((p) => p.id !== viewer.id) : undefined;
  const names = thread ? Object.fromEntries(thread.participants.map((p) => [p.id, fullName(p)])) : {};

  return (
    <div className="flex flex-col gap-4">
      <AutoRefresh />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Mesajlar</h1>
        <div className="flex items-center gap-2">
          {viewer.role === "ADMIN" ? (
            <SegmentedLinks
              label="Kapsam"
              value={oversight ? "all" : "mine"}
              options={[
                { value: "mine", label: "Gelen kutum", href: basePath, icon: Inbox },
                { value: "all", label: "Tüm platform", href: `${basePath}?scope=all`, icon: Eye },
              ]}
            />
          ) : null}
          {!oversight ? <ComposeDialog contacts={contacts} basePath={basePath} /> : null}
        </div>
      </div>

      <div className="grid h-[calc(100dvh-12rem)] min-h-[28rem] overflow-hidden rounded-xl border bg-card shadow-xs lg:grid-cols-[22rem_1fr]">
        <section
          aria-label="Konuşma listesi"
          className={cn("min-h-0 overflow-y-auto border-r", thread ? "hidden lg:block" : "block")}
        >
          <ThreadList threads={threads} basePath={basePath} activeId={threadId} query={query} />
        </section>

        <section aria-label="Konuşma" className={cn("min-h-0 flex-col", thread ? "flex" : "hidden lg:flex")}>
          {thread ? (
            <>
              <header className="flex items-center gap-3 border-b px-4 py-3 sm:px-6">
                <Link
                  href={`${basePath}${query}`}
                  className="-ml-1 rounded-md p-1 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 lg:hidden"
                  aria-label="Konuşma listesine dön"
                >
                  <ArrowLeft className="size-5" />
                </Link>
                {counterpart ? <UserAvatar user={counterpart} className="size-9" /> : null}
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-sm font-semibold">{thread.subject}</h2>
                  <p className="truncate text-xs text-muted-foreground">
                    {counterpart
                      ? `${fullName(counterpart)} · ${ROLE_LABELS[counterpart.role]}`
                      : thread.participants.map((p) => `${fullName(p)} (${ROLE_LABELS[p.role]})`).join(" ↔ ")}
                  </p>
                </div>
                {oversight ? (
                  <Badge variant="outline">
                    <Eye aria-hidden /> Denetim
                  </Badge>
                ) : null}
              </header>
              <Conversation
                key={thread.id}
                threadId={thread.id}
                viewerId={oversight ? null : viewer.id}
                messages={thread.messages}
                hasUnread={thread.hasUnread}
                names={names}
                readOnly={oversight}
              />
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
              <span className="grid size-12 place-items-center rounded-full border bg-muted/50" aria-hidden>
                <MessagesSquare className="size-5 text-muted-foreground" />
              </span>
              <p className="text-sm font-medium">Bir konuşma seç</p>
              <p className="max-w-xs text-sm text-muted-foreground">
                {oversight
                  ? "Platformdaki konuşmaları salt okunur olarak inceleyebilirsin."
                  : "Soldaki listeden bir konuşma aç ya da yeni bir mesaj başlat."}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
