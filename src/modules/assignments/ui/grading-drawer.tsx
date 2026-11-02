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
import { SubmissionPreview } from "./grading-workspace";

/**
 * Dashboard grading desk: recent submissions as a table; a row slides a drawer in from the right with the
 * file preview (PDF / image), the student's note and the grade (0-max) + Markdown feedback form. The full desk stays one link away.
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
      <div className="-mx-6 overflow-x-auto">
        <table className="w-full min-w-[34rem] text-sm">
          <caption className="sr-only">Notlandırılmayı bekleyen teslimler</caption>
          <thead className="border-y border-border bg-muted/40 text-left text-xs text-muted-foreground">
            <tr>
              <th scope="col" className="px-6 py-2 font-medium">Katılımcı</th>
              <th scope="col" className="px-3 py-2 font-medium">Ödev · eğitim</th>
              <th scope="col" className="px-3 py-2 font-medium">Dosya</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Teslim</th>
              <th scope="col" className="px-6 py-2">
                <span className="sr-only">İşlem</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {submissions.map((s) => {
              const openRow = () => {
                setShownId(s.id);
                setOpen(true);
              };
              return (
                <tr key={s.id} onClick={openRow} className="group cursor-pointer transition-colors duration-150 hover:bg-accent/60">
                  <td className="px-6 py-2.5">
                    <span className="flex items-center gap-2.5">
                      <UserAvatar user={s.student} className="size-7" />
                      <span className="truncate font-medium">{fullName(s.student)}</span>
                    </span>
                  </td>
                  <td className="max-w-56 px-3 py-2.5">
                    <span className="block truncate">{s.assignmentTitle}</span>
                    {s.trainingTitle ? <span className="block truncate text-xs text-subtle">{s.trainingTitle}</span> : null}
                  </td>
                  <td className="max-w-40 px-3 py-2.5">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <FileText className="size-3.5 shrink-0" aria-hidden />
                      <span className="truncate">{s.fileName ?? "Dosya"}</span>
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    <time dateTime={s.submittedAt.toISOString()} className="font-mono text-xs text-muted-foreground tabular-nums">
                      {formatRelative(s.submittedAt)}
                    </time>
                  </td>
                  <td className="px-6 py-2.5 text-right">
                    {/* The row is clickable for the mouse; this button is the keyboard and screen-reader path. */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openRow();
                      }}
                      aria-haspopup="dialog"
                      aria-label={`${fullName(s.student)} teslimini notlandır`}
                      className="inline-flex items-center gap-0.5 rounded-sm text-xs font-medium text-brand-soft outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Notlandır <ChevronRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
        {active ? (
          <SheetContent className="max-w-xl">
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

            <SubmissionPreview submissionId={active.id} fileName={active.fileName} />

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
              <ExternalLink className="size-3.5" aria-hidden /> Tam notlandırma masasında aç (geçmiş ve tüm teslimler)
            </Link>
          </SheetContent>
        ) : null}
      </Dialog>
    </>
  );
}
