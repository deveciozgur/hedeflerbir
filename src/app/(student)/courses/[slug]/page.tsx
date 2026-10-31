import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { UserAvatar } from "@/components/ui/user-avatar";
import { fullName } from "@/lib/utils";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { courseHasLessons, getCoursePlayer } from "@/modules/learning/application/course-player.queries";
import { getStudentCourse } from "@/modules/learning/application/student-courses.queries";
import { defaultSessionId } from "@/modules/learning/domain/curriculum";
import { CoursePlayerScreen } from "@/modules/learning/ui/course-player-screen";
import { CurriculumList } from "@/modules/learning/ui/curriculum-list";
import { ResourceList } from "@/modules/learning/ui/resource-list";
import { SessionStage } from "@/modules/learning/ui/session-stage";

export const metadata: Metadata = { title: "Eğitim" };

interface CoursePageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ session?: string; t?: string; lesson?: string }>;
}

export default async function CourseDetailPage({ params, searchParams }: CoursePageProps) {
  const [{ slug }, query, viewer] = await Promise.all([params, searchParams, getViewer("STUDENT")]);
  // Courses with a module/lesson outline get the course player; older session-only courses keep the session view.
  if (await courseHasLessons(slug)) {
    const player = await getCoursePlayer(viewer.id, slug, query.lesson);
    // Pin the default lesson in the URL, so completing it (which re-renders the page) doesn't jump to the next one.
    if (player.active && query.lesson !== player.active.id) redirect(`/courses/${slug}?lesson=${player.active.id}`);
    return <CoursePlayerScreen course={player} />;
  }

  const course = await getStudentCourse(viewer.id, slug);

  const activeId = course.sessions.some((s) => s.id === query.session) ? query.session : defaultSessionId(course.sessions);
  const active = course.sessions.find((s) => s.id === activeId);
  const requestedStart = Number(query.t);
  const startAt = Number.isFinite(requestedStart) && requestedStart > 0 ? requestedStart : (active?.positionSeconds ?? 0);

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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <UserAvatar user={course.instructor} className="size-6" />
              {fullName(course.instructor)}
              {course.instructor.title ? ` · ${course.instructor.title}` : null}
            </div>
          </div>
          <div className="flex w-full flex-col gap-1.5 sm:w-56">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Kayıt ilerlemesi</span>
              <span className="tabular-nums">%{course.completion}</span>
            </div>
            <Progress value={course.completion} aria-label="Kayıt ilerlemesi" />
          </div>
        </header>
      </div>

      {active ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <div className="flex min-w-0 flex-col gap-6">
            <SessionStage session={active} startAt={startAt} />
            <section aria-labelledby="session-title" className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">Oturum {active.order}</p>
              <h2 id="session-title" className="text-lg font-semibold tracking-tight">
                {active.title}
              </h2>
              {active.description ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">{active.description}</p>
              ) : null}
            </section>
            <Card>
              <CardHeader>
                <CardTitle>Kaynaklar</CardTitle>
              </CardHeader>
              <CardContent>
                <ResourceList resources={active.resources} />
              </CardContent>
            </Card>
          </div>
          <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
            <Card className="gap-3 py-4">
              <CardHeader className="px-4">
                <CardTitle>Müfredat</CardTitle>
              </CardHeader>
              <CardContent className="px-1.5">
                <CurriculumList slug={course.slug} sessions={course.sessions} activeId={active.id} />
              </CardContent>
            </Card>
            <p className="px-1 text-sm leading-relaxed text-muted-foreground">{course.description}</p>
          </aside>
        </div>
      ) : (
        <EmptyState icon={Layers} title="Henüz oturum yok" description="Eğitmen oturumları planladığında müfredat burada görünecek." />
      )}
    </div>
  );
}
