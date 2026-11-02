"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Download, ExternalLink, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogDescription, DialogTitle, SheetContent } from "@/components/ui/dialog";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatDateTime, formatRelative } from "@/lib/format";
import { fullName } from "@/lib/utils";
import type { InstructorSubmission } from "@/modules/learning/application/instructor-overview.queries";
import { gradeSubmissionAction } from "../application/assignment.actions";
import { GradingForm, type GradingFormSubmit } from "./grading-form";

/**
 * Dashboard grading desk: recent submissions as rows; a row slides a drawer in from the right with the
 * file, the student's note and the grade (0-max) + feedback form. The full desk stays one link away.
 */
export function GradingDrawer({ submissions }: { submissions: InstructorSubmission[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [shownId, setShownId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const active = submissions.find((s) => s.id === shownId) ?? null;

  const submit = (values: GradingFormSubmit) =>
    startTransition(async () => {
      if (!active) return;
      const result = await gradeSubmissionAction({ submissionId: active.id, ...values });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(values.decision === "GRADED" ? "Ödev notlandırıldı" : "Revizyon istendi", { description: fullName(active.student) });
      setOpen(false);
      router.refresh();
    });

  return (
    <>
      <ul className="-mx-2 flex flex-col divide-y divide-border">
        {submissions.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => {
                setShownId(s.id);
                setOpen(true);
              }}
              aria-haspopup="dialog"
              className="group flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left outline-none transition-colors duration-150 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99]"
            >
              <UserAvatar user={s.student} className="size-8" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{fullName(s.student)}</span>
                <span className="block truncate text-xs text-subtle">
                  {s.assignmentTitle}
                  {s.trainingTitle ? ` · ${s.trainingTitle}` : ""}
                </span>
              </span>
              <time dateTime={s.submittedAt.toISOString()} className="hidden shrink-0 font-mono text-xs text-muted-foreground tabular-nums sm:block">
                {formatRelative(s.submittedAt)}
              </time>
              <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-brand-soft">
                Notlandır <ChevronRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
        {active ? (
          <SheetContent className="max-w-lg">
            <div className="flex items-center gap-3 pr-8">
              <UserAvatar user={active.student} className="size-10" />
              <div className="min-w-0">
                <DialogTitle className="truncate">{fullName(active.student)}</DialogTitle>
                <DialogDescription className="truncate">{active.assignmentTitle}</DialogDescription>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-subtle">Teslim</dt>
                <dd className="font-mono tabular-nums">{formatDateTime(active.submittedAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-subtle">Eğitim</dt>
                <dd className="truncate">{active.trainingTitle ?? "-"}</dd>
              </div>
            </dl>

            <section aria-label="Teslim dosyası" className="flex items-center gap-3 rounded-lg border border-border p-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-md bg-brand/10 text-brand-soft" aria-hidden>
                <FileText className="size-4" />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm">{active.fileName ?? "Teslim dosyası"}</span>
              <Button asChild size="sm" variant="outline">
                <a href={`/api/files/submissions/${active.id}`}>
                  <Download aria-hidden /> İndir
                </a>
              </Button>
            </section>

            {active.note ? (
              <section aria-label="Katılımcının notu" className="rounded-lg bg-muted/50 p-3">
                <p className="mb-1 text-xs font-medium text-subtle">Katılımcının notu</p>
                <p className="text-sm whitespace-pre-wrap">{active.note}</p>
              </section>
            ) : null}

            <div className="border-t border-border pt-5">
              <GradingForm key={active.id} maxScore={active.maxScore} defaultGrade={null} defaultFeedback={null} pending={pending} onSubmit={submit} />
            </div>

            <Link
              href={`/instructor/assignments/${active.assignmentId}`}
              className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-sm text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ExternalLink className="size-3.5" aria-hidden /> Tam notlandırma masasında aç (önizleme ve geçmiş)
            </Link>
          </SheetContent>
        ) : null}
      </Dialog>
    </>
  );
}
