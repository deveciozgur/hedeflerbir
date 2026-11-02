import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { getStudentUpcomingAppointments } from "@/modules/mentoring/application/mentor-directory.queries";
import { StudentAppointments } from "@/modules/mentoring/ui/student-appointments";
import { listPeople } from "@/modules/people/application/people.queries";
import { PersonCardGrid } from "@/modules/people/ui/person-card-grid";

export const metadata: Metadata = { title: "Mentorlar" };

export default async function MentorsPage() {
  const viewer = await getViewer("STUDENT");
  const [mentors, appointments] = await Promise.all([listPeople("MENTOR"), getStudentUpcomingAppointments(viewer.id)]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Mentorlar" description="Programın mentorları. Mentorluk seanslarını program yönetimi ekibin adına planlar ve onaylar." />

      {appointments.length > 0 ? <StudentAppointments appointments={appointments} /> : null}

      <section aria-label="Mentor listesi">
        <PersonCardGrid people={mentors} canMessage emptyTitle="Henüz mentor yok" emptyDescription="Programa mentorlar eklendiğinde burada listelenecek." />
      </section>
    </div>
  );
}
