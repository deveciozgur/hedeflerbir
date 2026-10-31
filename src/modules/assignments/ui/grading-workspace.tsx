"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Download, FileQuestion, Users } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/format";
import { cn, fullName, initials } from "@/lib/utils";
import { gradeSubmissionAction } from "../application/assignment.actions";
import type { RosterEntry } from "../application/instructor-assignments.queries";
import { canGrade } from "../domain/submission-status";
import { GradingForm, type GradingFormSubmit } from "./grading-form";
import { SubmissionStatusBadge } from "./status-badges";

type RosterPatch = { submissionId: string } & GradingFormSubmit;

function applyPatch(roster: RosterEntry[], patch: RosterPatch): RosterEntry[] {
  return roster.map((entry) =>
    entry.submission?.id === patch.submissionId
      ? {
          ...entry,
          submission: { ...entry.submission, status: patch.decision, grade: patch.grade, feedback: patch.feedback },
        }
      : entry,
  );
}

interface GradingWorkspaceProps {
  maxScore: number;
  roster: RosterEntry[];
}

export function GradingWorkspace({ maxScore, roster }: GradingWorkspaceProps) {
  const [pending, startTransition] = useTransition();
  const [optimisticRoster, patchRoster] = useOptimistic(roster, applyPatch);
  const [selectedId, setSelectedId] = useState(roster[0]?.student.id ?? null);
  const selected = optimisticRoster.find((entry) => entry.student.id === selectedId) ?? null;

  if (roster.length === 0) {
    return (
      <EmptyState icon={Users} title="Kayıtlı katılımcı yok" description="Bu eğitime katılımcı kaydedildiğinde teslimler burada görünecek." />
    );
  }

  const grade = (values: GradingFormSubmit) => {
    const submissionId = selected?.submission?.id;
    if (!submissionId) return;

    startTransition(async () => {
      patchRoster({ submissionId, ...values });
      const result = await gradeSubmissionAction({ submissionId, ...values });
      if (!result.ok) {
        toast.error("Kaydedilemedi", { description: result.error });
        return;
      }
      toast.success(values.decision === "GRADED" ? "Puan kaydedildi" : "Revizyon talebi gönderildi");

      const next = optimisticRoster.find((e) => e.student.id !== selectedId && e.submission?.status === "SUBMITTED");
      if (next) setSelectedId(next.student.id);
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
      <Card className="gap-0 py-0 lg:self-start">
        <ul aria-label="Katılımcılar" className="divide-y">
          {optimisticRoster.map(({ student, submission }) => {
            const active = student.id === selectedId;
            return (
              <li key={student.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(student.id)}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors outline-none focus-visible:bg-accent",
                    active ? "bg-accent" : "hover:bg-accent/50",
                  )}
                >
                  <Avatar>
                    {student.avatarUrl ? <AvatarImage src={student.avatarUrl} alt="" /> : null}
                    <AvatarFallback>{initials(student.name, student.surname)}</AvatarFallback>
                  </Avatar>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate text-sm font-medium">{fullName(student)}</span>
                    <SubmissionStatusBadge status={submission?.status ?? null} />
                  </span>
                  {submission?.status === "GRADED" && submission.grade !== null ? (
                    <span className="text-sm font-semibold tabular-nums">{submission.grade}</span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      {selected ? (
        <Card>
          <CardHeader>
            <div className="min-w-0">
              <CardTitle>{fullName(selected.student)}</CardTitle>
              <CardDescription>
                {selected.submission ? `Teslim: ${formatDateTime(selected.submission.submittedAt)}` : "Henüz teslim etmedi."}
              </CardDescription>
            </div>
            <SubmissionStatusBadge status={selected.submission?.status ?? null} />
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {selected.submission ? (
              <>
                <div className="flex flex-col gap-3">
                  <Button asChild variant="outline" className="justify-start self-start">
                    <a href={`/api/files/submissions/${selected.submission.id}`}>
                      <Download aria-hidden />
                      <span className="truncate">{selected.submission.fileName ?? "Teslim dosyası"}</span>
                    </a>
                  </Button>
                  {selected.submission.note ? (
                    <div className="rounded-lg bg-muted/60 p-3">
                      <p className="mb-1 text-xs font-medium text-muted-foreground">Katılımcının notu</p>
                      <p className="text-sm whitespace-pre-wrap">{selected.submission.note}</p>
                    </div>
                  ) : null}
                </div>
                {canGrade(selected.submission.status) ? (
                  <GradingForm
                    key={selected.submission.id}
                    maxScore={maxScore}
                    defaultGrade={selected.submission.grade}
                    defaultFeedback={selected.submission.feedback}
                    pending={pending}
                    onSubmit={grade}
                  />
                ) : (
                  <p className="rounded-lg bg-muted px-3 py-2.5 text-sm text-muted-foreground">
                    Revizyon istendi. Katılımcı yeni dosyayı yüklediğinde yeniden değerlendirebilirsin.
                  </p>
                )}
              </>
            ) : (
              <EmptyState
                icon={FileQuestion}
                title="Teslim yok"
                description="Bu katılımcı ödevi henüz teslim etmedi."
                className="py-8"
              />
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
