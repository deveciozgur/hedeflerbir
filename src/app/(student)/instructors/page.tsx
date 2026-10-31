import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { UserAvatar } from "@/components/ui/user-avatar";
import { fullName } from "@/lib/utils";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { listInstructorsForStudents } from "@/modules/learning/application/instructor-directory.queries";

export const metadata: Metadata = { title: "Eğitmenler" };

export default async function InstructorsPage() {
  await getViewer("STUDENT");
  const instructors = await listInstructorsForStudents();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Eğitmenler" description="Programdaki eğitmenler, uzmanlık alanları ve verdikleri eğitimler." />
      {instructors.length === 0 ? (
        <EmptyState icon={GraduationCap} title="Henüz eğitmen yok" description="Eğitmenler programa eklendiğinde burada listelenecek." />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {instructors.map((instructor) => (
            <li key={instructor.id}>
              <Link
                href={`/instructors/${instructor.id}`}
                className="flex h-full flex-col gap-4 rounded-xl border bg-card p-5 shadow-xs transition-[border-color,box-shadow] outline-none hover:border-foreground/20 hover:shadow-sm focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <div className="flex items-center gap-3">
                  <UserAvatar user={instructor} className="size-12" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{fullName(instructor)}</p>
                    {instructor.title ? <p className="truncate text-sm text-muted-foreground">{instructor.title}</p> : null}
                  </div>
                </div>
                {instructor.expertiseArea ? <Badge variant="secondary">{instructor.expertiseArea}</Badge> : null}
                <p className="mt-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                  <BookOpen className="size-3.5" aria-hidden /> {instructor.courseCount} eğitim
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
