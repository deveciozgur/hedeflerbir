import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import {
  getStudentUpcomingAppointments,
  listMentors,
} from "@/modules/mentoring/application/mentor-directory.queries";
import { MentorCard } from "@/modules/mentoring/ui/mentor-card";
import { StudentAppointments } from "@/modules/mentoring/ui/student-appointments";

export const metadata: Metadata = { title: "Mentorlar" };

export default async function MentorsPage() {
  const viewer = await getViewer("STUDENT");
  const [mentors, appointments] = await Promise.all([listMentors(), getStudentUpcomingAppointments(viewer.id)]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Mentorlar" description="Mentorlarını keşfet ve uygun bir zamana randevu al." />

      {appointments.length > 0 ? <StudentAppointments appointments={appointments} /> : null}

      {mentors.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Henüz mentor yok"
          description="Programa mentorlar eklendiğinde burada listelenecek."
        />
      ) : (
        <section aria-label="Mentor listesi">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mentors.map((mentor) => (
              <li key={mentor.id}>
                <MentorCard mentor={mentor} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
