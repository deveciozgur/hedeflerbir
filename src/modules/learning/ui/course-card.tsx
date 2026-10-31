import Link from "next/link";
import { CalendarClock, Layers } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { formatDateTime } from "@/lib/format";
import type { StudentCourseCard } from "../application/student-courses.queries";

export function CourseCard({ course }: { course: StudentCourseCard }) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex h-full flex-col gap-4 rounded-xl border bg-card p-5 shadow-xs transition-[border-color,box-shadow] outline-none hover:border-border-strong hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="flex flex-col gap-1.5">
        <p className="text-xs text-muted-foreground">{course.instructorName}</p>
        <h2 className="text-base font-semibold tracking-tight text-balance">{course.title}</h2>
        <p className="line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
      </div>
      <div className="mt-auto flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{course.lessonCount > 0 ? "İlerleme" : "Kayıtlar"}</span>
            <span className="tabular-nums">%{course.completion}</span>
          </div>
          <Progress value={course.completion} aria-label={`${course.title} izleme ilerlemesi`} />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Layers className="size-3.5" aria-hidden /> {course.lessonCount > 0 ? `${course.lessonCount} ders` : `${course.sessionCount} oturum`}
          </span>
          {course.nextSession ? (
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock className="size-3.5" aria-hidden />
              <time dateTime={course.nextSession.toISOString()}>{formatDateTime(course.nextSession)}</time>
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
