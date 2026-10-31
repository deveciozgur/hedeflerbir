import Link from "next/link";
import { ArrowLeft, Award, BadgeCheck, Download, Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, surfaceClass } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatDate, formatDuration } from "@/lib/format";
import { cn, fullName } from "@/lib/utils";
import type { CoursePlayer } from "../application/course-player.queries";
import { flattenLessons, totalDurationMinutes } from "../domain/lessons";
import { LessonOutline } from "./lesson-outline";
import { LessonStage } from "./lesson-stage";
import { OutlineSheet } from "./outline-sheet";

function CertificateBanner({ code }: { code: string }) {
  return (
    <div className={cn(surfaceClass, "flex flex-col gap-4 border-success/25 p-5 sm:flex-row sm:items-center")}>
      <span className="grid size-10 shrink-0 place-items-center rounded-full border border-success/30 text-success" aria-hidden>
        <Award className="size-5" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-sm font-semibold">Eğitimi tamamladın</p>
        <p className="text-sm text-muted-foreground">
          Doğrulama kodu <span className="font-mono text-foreground">{code}</span>
        </p>
      </div>
      <div className="flex gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/verify/${code}`} target="_blank">
            <BadgeCheck aria-hidden /> Doğrula
          </Link>
        </Button>
        <Button asChild size="sm">
          <a href={`/api/certificates/${code}`} target="_blank" rel="noopener noreferrer">
            <Download aria-hidden /> Sertifika (PDF)
          </a>
        </Button>
      </div>
    </div>
  );
}

const PRIORITY_BADGE = { HIGH: { variant: "destructive", label: "Önemli" }, NORMAL: null, LOW: null } as const;

export function CoursePlayerScreen({ course }: { course: CoursePlayer }) {
  const lessons = flattenLessons(course.modules);
  const minutes = totalDurationMinutes(lessons);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Link
          href="/courses"
          className="inline-flex w-fit items-center gap-1.5 rounded-md text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <ArrowLeft className="size-4" aria-hidden /> Eğitimler
        </Link>
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-balance">{course.title}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <UserAvatar user={course.instructor} className="size-6" />
              {fullName(course.instructor)}
              <span aria-hidden>·</span>
              <span className="font-mono tabular-nums">
                {lessons.length} ders{minutes > 0 ? `, ${formatDuration(minutes * 60)}` : ""}
              </span>
            </div>
          </div>
          <div className="flex w-full flex-col gap-1.5 sm:w-56">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">İlerleme</span>
              <span className="tabular-nums">%{course.completion}</span>
            </div>
            <Progress value={course.completion} aria-label="Eğitim ilerlemesi" />
          </div>
        </header>
        {course.certificateCode ? <CertificateBanner code={course.certificateCode} /> : null}
      </div>

      {course.active ? (
        <div className="grid gap-6 lg:grid-cols-[18rem_1fr] lg:gap-10">
          <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:self-start lg:overflow-y-auto">
            <OutlineSheet slug={course.slug} modules={course.modules} activeId={course.active.id} completion={course.completion} />
            <div className="hidden lg:block">
              <LessonOutline slug={course.slug} modules={course.modules} activeId={course.active.id} />
            </div>
          </aside>
          <div className="flex min-w-0 flex-col gap-8">
            <LessonStage course={course} lesson={course.active} />
            {course.announcements.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Megaphone className="size-4 text-muted-foreground" aria-hidden /> Eğitim duyuruları
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="flex flex-col divide-y divide-border">
                    {course.announcements.map((a) => {
                      const badge = PRIORITY_BADGE[a.priority];
                      return (
                        <li key={a.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{a.title}</p>
                            {badge ? <Badge variant={badge.variant}>{badge.label}</Badge> : null}
                            <span className="ml-auto text-xs text-subtle">{formatDate(a.publishedAt)}</span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap text-muted-foreground">{a.content}</p>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      ) : (
        <EmptyState icon={BadgeCheck} title="Henüz ders yok" description="Eğitmen dersleri eklediğinde müfredat burada görünecek." />
      )}
    </div>
  );
}
