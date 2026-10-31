import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { getStudentCourses } from "@/modules/learning/application/student-courses.queries";
import { CourseCard } from "@/modules/learning/ui/course-card";

export const metadata: Metadata = { title: "Eğitimler" };

export default async function CoursesPage() {
  const viewer = await getViewer("STUDENT");
  const courses = await getStudentCourses(viewer.id);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Eğitimler" description="Ders modülleri, canlı oturumlar ve geçmiş ders kayıtları." />
      {courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Henüz bir eğitime kayıtlı değilsin"
          description="Bir eğitime kaydedildiğinde modüller ve kayıtlar burada listelenecek."
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <li key={course.slug}>
              <CourseCard course={course} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
