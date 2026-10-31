import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, ChevronRight, ClipboardCheck, Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Progress } from "@/components/ui/progress";
import { formatDateTime } from "@/lib/format";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import {
  getInstructorAssignments,
  getInstructorCourses,
} from "@/modules/assignments/application/instructor-assignments.queries";
import { CreateAssignmentDialog } from "@/modules/assignments/ui/create-assignment-dialog";

export const metadata: Metadata = { title: "Ödev & Puanlama" };

export default async function InstructorAssignmentsPage() {
  const viewer = await getViewer("INSTRUCTOR");
  const [assignments, courses] = await Promise.all([
    getInstructorAssignments(viewer.id),
    getInstructorCourses(viewer.id),
  ]);
  const awaitingTotal = assignments.reduce((sum, a) => sum + a.awaitingReview, 0);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Ödev & Puanlama"
        description={
          awaitingTotal > 0
            ? `${awaitingTotal} teslim değerlendirmeni bekliyor.`
            : "Ödev tanımla, teslimleri puanla ve geri bildirim yaz."
        }
        actions={<CreateAssignmentDialog courses={courses} />}
      />

      {assignments.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Henüz ödev tanımlamadın"
          description={
            courses.length === 0
              ? "Sana bir eğitim atandığında ödev tanımlayabileceksin."
              : "İlk ödevini oluşturarak katılımcılarından teslim almaya başla."
          }
        />
      ) : (
        <Card className="gap-0 py-0">
          <ul className="divide-y">
            {assignments.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/instructor/assignments/${a.id}`}
                  className="flex flex-col gap-3 px-5 py-4 transition-colors outline-none hover:bg-accent/60 focus-visible:bg-accent sm:flex-row sm:items-center sm:gap-6"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate text-sm font-medium">{a.title}</span>
                    <span className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                      {a.courseTitle} ·
                      <CalendarDays className="size-3.5" aria-hidden />
                      <time dateTime={a.dueDate.toISOString()}>{formatDateTime(a.dueDate)}</time>
                    </span>
                  </div>
                  <div className="flex w-full flex-col gap-1.5 sm:w-44">
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {a.submitted}/{a.enrolled} teslim · {a.graded} puanlandı
                    </span>
                    <Progress value={a.enrolled ? (a.submitted / a.enrolled) * 100 : 0} aria-label="Teslim oranı" />
                  </div>
                  <div className="flex w-36 shrink-0 items-center justify-between gap-2 sm:justify-end">
                    {a.awaitingReview > 0 ? (
                      <Badge variant="brand">
                        <Inbox aria-hidden /> {a.awaitingReview} bekliyor
                      </Badge>
                    ) : null}
                    <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
