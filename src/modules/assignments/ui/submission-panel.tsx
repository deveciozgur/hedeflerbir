"use client";

import { useId, useOptimistic, useState, useTransition } from "react";
import { Download, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/format";
import { submitAssignmentAction } from "../application/assignment.actions";
import type { SubmissionStatus, SubmitEligibility } from "../domain/submission-status";
import { FileDropzone } from "./file-dropzone";
import { SubmissionStatusBadge } from "./status-badges";

interface SubmissionPanelProps {
  assignmentId: string;
  submission: { id: string; status: SubmissionStatus; fileName: string | null; submittedAt: Date } | null;
  eligibility: SubmitEligibility;
  acceptedFileTypes?: string[];
}

export function SubmissionPanel({ assignmentId, submission, eligibility, acceptedFileTypes }: SubmissionPanelProps) {
  const [pending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(submission?.status ?? null);
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [replacing, setReplacing] = useState(false);
  // Several panels can share a page (one per assignment of a training).
  const noteId = useId();

  const hasActiveSubmission = optimisticStatus === "SUBMITTED";
  const showForm = eligibility.allowed && (!hasActiveSubmission || replacing);

  const submit = () => {
    if (!file) return;
    const formData = new FormData();
    formData.set("assignmentId", assignmentId);
    formData.set("file", file);
    formData.set("note", note);

    startTransition(async () => {
      setOptimisticStatus("SUBMITTED");
      const result = await submitAssignmentAction(formData);
      if (!result.ok) {
        toast.error("Teslim başarısız", { description: result.error });
        return;
      }
      toast.success("Ödevin teslim edildi", { description: "Eğitmenin değerlendirdiğinde bildirim alacaksın." });
      setFile(null);
      setNote("");
      setReplacing(false);
    });
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Teslimin</CardTitle>
          <CardDescription>
            {submission ? `Son yükleme: ${formatDateTime(submission.submittedAt)}` : "Henüz bir dosya yüklemedin."}
          </CardDescription>
        </div>
        <SubmissionStatusBadge status={optimisticStatus} />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {submission?.fileName ? (
          <Button asChild variant="outline" className="justify-start">
            <a href={`/api/files/submissions/${submission.id}`}>
              <Download aria-hidden />
              <span className="truncate">{submission.fileName}</span>
            </a>
          </Button>
        ) : null}

        {!eligibility.allowed && optimisticStatus !== "GRADED" ? (
          <p className="rounded-lg bg-muted px-3 py-2.5 text-sm text-muted-foreground">{eligibility.reason}</p>
        ) : null}

        {eligibility.allowed && hasActiveSubmission && !replacing ? (
          <Button variant="ghost" size="sm" className="self-start" onClick={() => setReplacing(true)} disabled={pending}>
            Dosyayı güncelle
          </Button>
        ) : null}

        {showForm ? (
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <FileDropzone file={file} onFileChange={setFile} disabled={pending} acceptedFileTypes={acceptedFileTypes} />
            <div className="flex flex-col gap-2">
              <Label htmlFor={noteId}>Eğitmene not (isteğe bağlı)</Label>
              <Textarea
                id={noteId}
                value={note}
                maxLength={2000}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Çalışman hakkında eklemek istediklerin…"
                disabled={pending}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="brand" disabled={!file || pending}>
                {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
                {pending ? "Yükleniyor…" : optimisticStatus === "RETURNED" ? "Revizyonu gönder" : "Teslim et"}
              </Button>
              {replacing ? (
                <Button type="button" variant="ghost" onClick={() => setReplacing(false)} disabled={pending}>
                  Vazgeç
                </Button>
              ) : null}
            </div>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}
