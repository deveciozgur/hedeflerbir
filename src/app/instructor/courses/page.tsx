import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, CalendarClock, Clapperboard, Layers, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { formatDateTime } from "@/lib/format";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { getInstructorCourseSummaries } from "@/modules/learning/application/instructor-courses.queries";

export const metadata: Metadata = { title: "Eğitimlerim" };

export default async function InstructorCoursesPage() {
  const viewer = await getViewer("INSTRUCTOR");
  const courses = await getInstructorCourseSummaries(viewer.id);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Eğitimlerim" description="Sana atanmış eğitimler, oturumlar ve katılımcı listeleri." />
      {courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Atanmış eğitim yok"
          description="Yönetici sana bir eğitim atadığında oturumları buradan yöneteceksin."
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {courses.map((course) => (
            <li key={course.id}>
              <Link
                href={`/instructor/courses/${course.id}`}
                className="flex h-full flex-col gap-4 rounded-xl border bg-card p-5 shadow-xs transition-[border-color,box-shadow] outline-none hover:border-foreground/20 hover:shadow-sm focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <div className="flex flex-col gap-1.5">
                  <h2 className="text-base font-semibold tracking-tight">{course.title}</h2>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="size-3.5" aria-hidden /> {course.enrolled} katılımcı
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Layers className="size-3.5" aria-hidden /> {course.sessionCount} oturum
                  </span>
                  {course.nextSession ? (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarClock className="size-3.5" aria-hidden /> {formatDateTime(course.nextSession)}
                    </span>
                  ) : null}
                  {course.missingRecordings > 0 ? (
                    <Badge variant="warning">
                      <Clapperboard aria-hidden /> {course.missingRecordings} kayıt eksik
                    </Badge>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
