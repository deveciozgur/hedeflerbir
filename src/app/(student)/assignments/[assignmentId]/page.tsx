import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { getStudentAssignmentDetail } from "@/modules/assignments/application/student-assignments.queries";
import { canSubmit } from "@/modules/assignments/domain/submission-status";
import { FeedbackCard } from "@/modules/assignments/ui/feedback-card";
import { DeadlineBadge } from "@/modules/assignments/ui/status-badges";
import { SubmissionPanel } from "@/modules/assignments/ui/submission-panel";

export const metadata: Metadata = { title: "Ödev" };

export default async function AssignmentDetailPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const [{ assignmentId }, viewer] = await Promise.all([params, getViewer("STUDENT")]);
  const assignment = await getStudentAssignmentDetail(viewer.id, assignmentId);
  const { submission } = assignment;
  const status = submission?.status ?? null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Link
          href="/assignments"
          className="inline-flex w-fit items-center gap-1.5 rounded-md text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <ArrowLeft className="size-4" aria-hidden /> Ödevler
        </Link>
        <header className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{assignment.courseTitle}</p>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">{assignment.title}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4" aria-hidden />
              Teslim: <time dateTime={assignment.dueDate.toISOString()}>{formatDateTime(assignment.dueDate)}</time>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Trophy className="size-4" aria-hidden /> {assignment.maxScore} puan
            </span>
            <DeadlineBadge dueDate={assignment.dueDate} status={status} />
          </div>
        </header>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Ödev açıklaması</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-pretty">{assignment.description}</p>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4 lg:col-span-2">
          {submission && (submission.status === "GRADED" || submission.status === "RETURNED") ? (
            <FeedbackCard
              instructorName={assignment.instructorName}
              status={submission.status}
              grade={submission.grade}
              maxScore={assignment.maxScore}
              feedback={submission.feedback}
              gradedAt={submission.gradedAt}
            />
          ) : null}
          <SubmissionPanel
            assignmentId={assignment.id}
            submission={submission}
            eligibility={canSubmit(assignment, status)}
          />
        </div>
      </div>
    </div>
  );
}
