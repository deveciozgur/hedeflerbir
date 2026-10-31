import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { fullName } from "@/lib/utils";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { getCourseForAdmin } from "@/modules/administration/application/course-admin.queries";
import { CourseFormDialog } from "@/modules/administration/ui/course-form-dialog";
import { EnrollmentManager } from "@/modules/administration/ui/enrollment-manager";

export const metadata: Metadata = { title: "Eğitim" };

export default async function AdminCourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const [{ courseId }] = await Promise.all([params, getViewer("ADMIN")]);
  const course = await getCourseForAdmin(courseId);
  const instructor = course.instructors.find((i) => i.id === course.instructorId);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Link
          href="/admin/courses"
          className="inline-flex w-fit items-center gap-1.5 rounded-md text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <ArrowLeft className="size-4" aria-hidden /> Eğitimler
        </Link>
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-balance">{course.title}</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">{course.description}</p>
            <p className="flex items-center gap-2 text-sm">
              {instructor ? (
                <>
                  <UserAvatar user={instructor} className="size-6" /> {fullName(instructor)}
                </>
              ) : (
                <span className="text-warning">Eğitmen aktif değil — yeni bir eğitmen atayın.</span>
              )}
            </p>
          </div>
          <CourseFormDialog
            instructors={course.instructors}
            course={{ id: course.id, title: course.title, slug: course.slug, description: course.description, instructorId: course.instructorId }}
            trigger={
              <Button variant="outline">
                <Pencil aria-hidden /> Düzenle
              </Button>
            }
          />
        </header>
      </div>
      <EnrollmentManager courseId={course.id} courseTitle={course.title} enrolled={course.enrolled} candidates={course.candidates} />
    </div>
  );
}
