"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition, type KeyboardEvent } from "react";
import { Check, CheckCheck, Loader2, SendHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { markThreadReadAction, replyAction } from "../application/messaging.actions";
import type { ThreadMessage } from "../application/messaging.queries";
import { MAX_MESSAGE_LENGTH } from "../domain/schemas";

interface ConversationProps {
  threadId: string;
  viewerId: string | null;
  messages: ThreadMessage[];
  hasUnread: boolean;
  /** Resolves a sender id to a display name (used in oversight mode, where neither side is "me"). */
  names: Record<string, string>;
  readOnly?: boolean;
}

type PendingMessage = ThreadMessage & { pending?: true };

export function Conversation({ threadId, viewerId, messages, hasUnread, names, readOnly = false }: ConversationProps) {
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState("");
  const [optimistic, addOptimistic] = useOptimistic<PendingMessage[], PendingMessage>(messages, (current, message) => [
    ...current,
    message,
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasUnread && !readOnly) void markThreadReadAction(threadId);
  }, [threadId, hasUnread, readOnly]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [optimistic.length]);

  const send = () => {
    const content = draft.trim();
    if (!content || !viewerId) return;
    setDraft("");
    startTransition(async () => {
      addOptimistic({ id: `pending-${Date.now()}`, senderId: viewerId, content, createdAt: new Date(), readAt: null, pending: true });
      const result = await replyAction({ threadId, content });
      if (!result.ok) {
        setDraft(content);
        toast.error("Mesaj gönderilemedi", { description: result.error });
      }
    });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      send();
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ol aria-label="Mesajlar" className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-5 sm:px-6">
        {optimistic.map((message) => {
          const mine = viewerId !== null && message.senderId === viewerId;
          return (
            <li key={message.id} className={cn("flex max-w-[85%] flex-col gap-1", mine ? "items-end self-end" : "items-start")}>
              {!mine ? <span className="px-1 text-xs font-medium text-muted-foreground">{names[message.senderId]}</span> : null}
              <div
                className={cn(
                  "rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words",
                  mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-muted",
                  message.pending && "opacity-60",
                )}
              >
                {message.content}
              </div>
              <span className="flex items-center gap-1 px-1 text-[11px] text-muted-foreground">
                <time dateTime={message.createdAt.toISOString()}>{formatDateTime(message.createdAt)}</time>
                {mine && !message.pending ? (
                  message.readAt ? (
                    <CheckCheck className="size-3.5 text-brand" aria-label="Okundu" />
                  ) : (
                    <Check className="size-3.5" aria-label="Gönderildi" />
                  )
                ) : null}
              </span>
            </li>
          );
        })}
        <div ref={endRef} />
      </ol>

      {readOnly ? (
        <p className="border-t bg-muted/40 px-6 py-3 text-xs text-muted-foreground">Denetim modu · Bu konuşma salt okunur.</p>
      ) : (
        <form
          className="flex items-end gap-2 border-t p-3 sm:p-4"
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
        >
          <label htmlFor="reply" className="sr-only">
            Yanıt yaz
          </label>
          <Textarea
            id="reply"
            rows={2}
            value={draft}
            maxLength={MAX_MESSAGE_LENGTH}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Yanıt yaz… (Ctrl + Enter ile gönder)"
            className="max-h-40 min-h-11 resize-none"
          />
          <Button type="submit" size="icon" disabled={!draft.trim() || pending} aria-label="Gönder">
            {pending ? <Loader2 className="animate-spin" /> : <SendHorizontal />}
          </Button>
        </form>
      )}
    </div>
  );
}
