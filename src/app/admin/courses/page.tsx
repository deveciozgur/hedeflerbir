import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { UserAvatar } from "@/components/ui/user-avatar";
import { fullName } from "@/lib/utils";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { listCoursesForAdmin, listInstructors } from "@/modules/administration/application/course-admin.queries";
import { CourseFormDialog } from "@/modules/administration/ui/course-form-dialog";

export const metadata: Metadata = { title: "Eğitimler" };

export default async function AdminCoursesPage() {
  await getViewer("ADMIN");
  const [courses, instructors] = await Promise.all([listCoursesForAdmin(), listInstructors()]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Eğitimler"
        description="Eğitim oluştur, eğitmen ata ve katılımcıları kaydet."
        actions={
          <CourseFormDialog
            instructors={instructors}
            trigger={
              <Button>
                <Plus aria-hidden /> Yeni eğitim
              </Button>
            }
          />
        }
      />
      {courses.length === 0 ? (
        <EmptyState icon={BookOpen} title="Henüz eğitim yok" description="İlk eğitimi oluşturup bir eğitmen atayarak başla." />
      ) : (
        <Card className="gap-0 py-0">
          <ul className="divide-y">
            {courses.map((course) => (
              <li key={course.id}>
                <Link
                  href={`/admin/courses/${course.id}`}
                  className="flex flex-col gap-3 px-5 py-4 transition-colors outline-none hover:bg-accent/60 focus-visible:bg-accent sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{course.title}</p>
                    <p className="truncate font-mono text-xs text-muted-foreground">/courses/{course.slug}</p>
                  </div>
                  <span className="flex items-center gap-2 text-sm sm:w-48">
                    <UserAvatar user={course.instructor} className="size-6" />
                    <span className="truncate">{fullName(course.instructor)}</span>
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums sm:w-56 sm:text-right">
                    {course.enrolled} katılımcı · {course.sessions} oturum · {course.assignments} ödev
                  </span>
                  <ChevronRight className="hidden size-4 text-muted-foreground sm:block" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
