import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Clapperboard, Layers, ListTree, Pencil, Plus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SegmentedLinks } from "@/components/ui/segmented-links";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatDateTime } from "@/lib/format";
import { fullName } from "@/lib/utils";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { getInstructorCourse } from "@/modules/learning/application/instructor-courses.queries";
import { getCurriculumEditor } from "@/modules/learning/application/instructor-curriculum.queries";
import { sessionEnd } from "@/modules/learning/domain/curriculum";
import { AttendanceDialog } from "@/modules/learning/ui/attendance-dialog";
import { CurriculumBuilder } from "@/modules/learning/ui/curriculum-builder";
import { AnnouncementDialog } from "@/modules/engagement/ui/announcement-dialog";
import { SessionFormDialog } from "@/modules/learning/ui/session-form-dialog";

export const metadata: Metadata = { title: "Eğitim Yönetimi" };

interface PageProps {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ tab?: string }>;
}

const percent = (value: number | null) => (value === null ? "-" : `%${value}`);

export default async function InstructorCoursePage({ params, searchParams }: PageProps) {
  const [{ courseId }, { tab }, viewer] = await Promise.all([params, searchParams, getViewer("INSTRUCTOR")]);
  const view = tab === "roster" || tab === "sessions" ? tab : "curriculum";
  const [course, editor] = await Promise.all([
    getInstructorCourse(viewer.id, courseId),
    view === "curriculum" ? getCurriculumEditor(viewer.id, courseId) : null,
  ]);
  const now = new Date();
  const base = `/instructor/courses/${course.id}`;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Link
          href="/instructor/courses"
          className="inline-flex w-fit items-center gap-1.5 rounded-md text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <ArrowLeft className="size-4" aria-hidden /> Eğitimlerim
        </Link>
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-semibold tracking-tight text-balance">{course.title}</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">{course.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AnnouncementDialog courseId={course.id} />
            <SegmentedLinks
              label="Görünüm"
              value={view}
              options={[
                { value: "curriculum", label: "Müfredat", href: base, icon: <ListTree /> },
                { value: "sessions", label: "Canlı oturumlar", href: `${base}?tab=sessions`, icon: <Layers /> },
                { value: "roster", label: `Katılımcılar (${course.roster.length})`, href: `${base}?tab=roster`, icon: <Users /> },
              ]}
            />
            {view === "sessions" ? (
              <SessionFormDialog
                courseId={course.id}
                trigger={
                  <Button size="sm">
                    <Plus aria-hidden /> Oturum
                  </Button>
                }
              />
            ) : null}
          </div>
        </header>
      </div>

      {view === "curriculum" && editor ? (
        <CurriculumBuilder editor={editor} />
      ) : view === "sessions" ? (
        course.sessions.length === 0 ? (
          <EmptyState icon={Layers} title="Henüz oturum yok" description="İlk oturumu ekleyerek müfredatı oluşturmaya başla." />
        ) : (
          <Card className="gap-0 py-0">
            <ol className="divide-y">
              {course.sessions.map((session) => {
                const ended = sessionEnd(session) <= now;
                const started = session.scheduleDate <= now;
                return (
                  <li key={session.id} className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center">
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="text-sm font-medium">
                        <span className="text-muted-foreground tabular-nums">{session.order}.</span> {session.title}
                      </span>
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="size-3.5" aria-hidden />
                          <time dateTime={session.scheduleDate.toISOString()}>{formatDateTime(session.scheduleDate)}</time>
                        </span>
                        <span>{session.resources.length} kaynak</span>
                        {session.recordingUrl ? (
                          <span>
                            {session.watchedCount}/{course.roster.length} izledi
                          </span>
                        ) : null}
                        {started ? (
                          <span>{session.attendance.length > 0 ? "Yoklama alındı" : "Yoklama alınmadı"}</span>
                        ) : null}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      {ended && !session.recordingUrl ? (
                        <Badge variant="warning" className="mr-1">
                          <Clapperboard aria-hidden /> Kayıt eksik
                        </Badge>
                      ) : null}
                      {started ? <AttendanceDialog session={session} roster={course.roster} /> : null}
                      <SessionFormDialog
                        courseId={course.id}
                        session={session}
                        trigger={
                          <Button variant="ghost" size="sm">
                            <Pencil aria-hidden /> Düzenle
                          </Button>
                        }
                      />
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>
        )
      ) : course.roster.length === 0 ? (
        <EmptyState icon={Users} title="Kayıtlı katılımcı yok" description="Bu eğitime katılımcı kaydedildiğinde burada listelenecek." />
      ) : (
        <Card className="gap-0 overflow-x-auto py-0">
          <table className="w-full min-w-[36rem] text-sm">
            <caption className="sr-only">Katılımcı ilerleme tablosu</caption>
            <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-5 py-3 font-medium">Katılımcı</th>
                <th scope="col" className="px-3 py-3 text-right font-medium">İzlenen kayıt</th>
                <th scope="col" className="px-3 py-3 text-right font-medium">Devam</th>
                <th scope="col" className="px-5 py-3 text-right font-medium">Ödev ort.</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {course.roster.map((student) => (
                <tr key={student.id}>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-3">
                      <UserAvatar user={student} />
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{fullName(student)}</span>
                        <a href={`mailto:${student.email}`} className="block truncate text-xs text-muted-foreground hover:underline">
                          {student.email}
                        </a>
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {student.watched}/{course.recordedCount}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">{percent(student.attendanceRate)}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{percent(student.averageScore)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
