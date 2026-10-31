import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, ExternalLink, Layers, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { UserAvatar } from "@/components/ui/user-avatar";
import { fullName } from "@/lib/utils";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { getInstructorForStudent } from "@/modules/learning/application/instructor-directory.queries";

export const metadata: Metadata = { title: "Eğitmen" };

export default async function InstructorDetailPage({ params }: { params: Promise<{ instructorId: string }> }) {
  const [{ instructorId }, viewer] = await Promise.all([params, getViewer("STUDENT")]);
  const instructor = await getInstructorForStudent(instructorId, viewer.id);

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/instructors"
        className="inline-flex w-fit items-center gap-1.5 rounded-md text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <ArrowLeft className="size-4" aria-hidden /> Eğitmenler
      </Link>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2 lg:self-start">
          <CardContent className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <UserAvatar user={instructor} className="size-16" />
              <div className="min-w-0">
                <h1 className="text-lg font-semibold tracking-tight">{fullName(instructor)}</h1>
                {instructor.title ? <p className="text-sm text-muted-foreground">{instructor.title}</p> : null}
              </div>
            </div>
            {instructor.expertiseArea ? <Badge variant="brand">{instructor.expertiseArea}</Badge> : null}
            {instructor.bio ? <p className="text-sm leading-relaxed whitespace-pre-wrap text-pretty">{instructor.bio}</p> : null}
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <a href={`mailto:${instructor.email}`}>
                  <Mail aria-hidden /> E-posta
                </a>
              </Button>
              {instructor.socialLinks.map((link) => (
                <Button key={link.network} asChild variant="outline" size="sm">
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink aria-hidden /> {link.label}
                  </a>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Verdiği eğitimler</CardTitle>
          </CardHeader>
          <CardContent>
            {instructor.courses.length === 0 ? (
              <EmptyState icon={BookOpen} title="Henüz eğitim yok" description="Bu eğitmene atanmış bir eğitim bulunmuyor." className="py-8" />
            ) : (
              <ul className="flex flex-col divide-y">
                {instructor.courses.map((course) => (
                  <li key={course.id} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="text-sm font-medium">{course.title}</h2>
                      {course.enrolled ? <Badge variant="success">Kayıtlısın</Badge> : null}
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Layers className="size-3.5" aria-hidden /> {course.sessionCount} oturum
                      </span>
                      {course.enrolled ? (
                        <Button asChild variant="link" size="sm" className="h-auto px-0">
                          <Link href={`/courses/${course.slug}`}>Eğitime git</Link>
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
