import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Trophy } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { getGradingWorkspace } from "@/modules/assignments/application/instructor-assignments.queries";
import { GradingWorkspace } from "@/modules/assignments/ui/grading-workspace";

export const metadata: Metadata = { title: "Puanlama" };

export default async function GradingPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const [{ assignmentId }, viewer] = await Promise.all([params, getViewer("INSTRUCTOR")]);
  const workspace = await getGradingWorkspace(viewer.id, assignmentId);
  const awaiting = workspace.roster.filter((e) => e.submission?.status === "SUBMITTED").length;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Link
          href="/instructor/assignments"
          className="inline-flex w-fit items-center gap-1.5 rounded-md text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <ArrowLeft className="size-4" aria-hidden /> Ödevler
        </Link>
        <header className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{workspace.courseTitle}</p>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">{workspace.title}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4" aria-hidden />
              <time dateTime={workspace.dueDate.toISOString()}>{formatDateTime(workspace.dueDate)}</time>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Trophy className="size-4" aria-hidden /> {workspace.maxScore} puan
            </span>
            <span>{awaiting > 0 ? `${awaiting} teslim değerlendirme bekliyor` : "Bekleyen teslim yok"}</span>
          </div>
        </header>
      </div>
      <GradingWorkspace maxScore={workspace.maxScore} roster={workspace.roster} />
    </div>
  );
}
