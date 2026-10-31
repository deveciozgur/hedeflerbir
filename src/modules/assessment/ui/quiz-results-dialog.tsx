"use client";

import { useState, useTransition } from "react";
import { BarChart3, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/format";
import { getQuizResultsAction, type QuizResultRow } from "@/modules/learning/application/curriculum-admin.actions";

/** Finished attempts with scores and the open-ended answers the instructor reads by hand. Loaded on open. */
export function QuizResultsDialog({ lessonId, lessonTitle, attemptCount }: { lessonId: string; lessonTitle: string; attemptCount: number }) {
  const [rows, setRows] = useState<QuizResultRow[] | null>(null);
  const [pending, startTransition] = useTransition();

  const load = () =>
    startTransition(async () => {
      const result = await getQuizResultsAction(lessonId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setRows(result.data);
    });

  return (
    <Dialog onOpenChange={(open) => open && load()}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" disabled={attemptCount === 0}>
          <BarChart3 aria-hidden /> Sonuçlar ({attemptCount})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Quiz sonuçları</DialogTitle>
          <DialogDescription>{lessonTitle}</DialogDescription>
        </DialogHeader>
        <div className="max-h-[65dvh] overflow-y-auto">
          {pending || rows === null ? (
            <p className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden /> Yükleniyor
            </p>
          ) : rows.length === 0 ? (
            <p className="py-8 text-sm text-muted-foreground">Henüz tamamlanan deneme yok.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {rows.map((row) => (
                <li key={row.id} className="flex flex-col gap-2 py-3">
                  <div className="flex items-center gap-3">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{row.studentName}</span>
                    <span className="font-mono text-sm tabular-nums">%{row.score}</span>
                    <Badge variant={row.isPassed ? "success" : "outline"}>{row.isPassed ? "Geçti" : "Kaldı"}</Badge>
                    <span className="hidden text-xs text-subtle sm:inline">{formatDateTime(row.finishedAt)}</span>
                  </div>
                  {row.openAnswers.map((a, i) => (
                    <div key={i} className="rounded-lg bg-surface-sunken px-3 py-2">
                      <p className="text-xs text-muted-foreground">{a.prompt}</p>
                      <p className="mt-1 text-sm whitespace-pre-wrap">{a.answer}</p>
                    </div>
                  ))}
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
