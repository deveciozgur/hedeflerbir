"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, Reply } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatDateTime, formatRelative } from "@/lib/format";
import { fullName } from "@/lib/utils";
import { ROLE_LABELS } from "@/modules/identity/domain/role";
import { replyToTicketAction, updateTicketStatusAction } from "../application/support.actions";
import type { TicketRow } from "../application/support.queries";
import { TICKET_STATUS_LABELS, TICKET_STATUSES, type TicketStatus } from "../domain/support";

const STATUS_VARIANT = { OPEN: "warning", IN_PROGRESS: "brand", RESOLVED: "success" } as const;

export function TicketCard({ ticket }: { ticket: TicketRow }) {
  const [pending, startTransition] = useTransition();
  const [status, setOptimisticStatus] = useOptimistic(ticket.status);
  const [replying, setReplying] = useState(false);
  const [reply, setReply] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);
  const name = fullName(ticket.requester);

  const changeStatus = (next: TicketStatus) =>
    startTransition(async () => {
      setOptimisticStatus(next);
      const result = await updateTicketStatusAction({ ticketId: ticket.id, status: next });
      if (result.ok) toast.success(`Talep: ${TICKET_STATUS_LABELS[next]}`);
      else toast.error(result.error);
    });

  const sendReply = () =>
    startTransition(async () => {
      const result = await replyToTicketAction({ ticketId: ticket.id, content: reply });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Yanıt mesaj olarak gönderildi");
      setThreadId(result.data.threadId);
      setReply("");
      setReplying(false);
    });

  return (
    <Card>
      <CardHeader className="flex-col sm:flex-row">
        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar user={ticket.requester} className="size-9" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{ticket.subject}</p>
            <p className="truncate text-xs text-muted-foreground">
              {name} · {ROLE_LABELS[ticket.requester.role]} ·{" "}
              <time dateTime={ticket.createdAt.toISOString()} title={formatDateTime(ticket.createdAt)}>
                {formatRelative(ticket.createdAt)}
              </time>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_VARIANT[status]}>{TICKET_STATUS_LABELS[status]}</Badge>
          <NativeSelect
            aria-label={`${ticket.subject} durumu`}
            value={status}
            disabled={pending}
            onChange={(e) => changeStatus(e.target.value as TicketStatus)}
            className="h-8 w-32 text-xs"
          >
            {TICKET_STATUSES.map((s) => (
              <option key={s} value={s}>
                {TICKET_STATUS_LABELS[s]}
              </option>
            ))}
          </NativeSelect>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-pretty">{ticket.content}</p>
        {replying ? (
          <form
            className="flex flex-col gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              sendReply();
            }}
          >
            <label htmlFor={`reply-${ticket.id}`} className="text-xs font-medium text-muted-foreground">
              {name} kişisine mesaj olarak gönderilir
            </label>
            <Textarea id={`reply-${ticket.id}`} rows={3} value={reply} onChange={(e) => setReply(e.target.value)} maxLength={5000} disabled={pending} />
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={!reply.trim() || pending}>
                {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
                Gönder
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setReplying(false)} disabled={pending}>
                Vazgeç
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setReplying(true)}>
              <Reply aria-hidden /> Yanıtla
            </Button>
            {threadId ? (
              <Button size="sm" variant="link" asChild>
                <Link href={`/admin/messages/${threadId}`}>Konuşmayı aç</Link>
              </Button>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
