import type { Metadata } from "next";
import { after } from "next/server";
import { BENTO_SPAN, BentoGrid } from "@/components/ui/bento";
import { getStudentAssignments } from "@/modules/assignments/application/student-assignments.queries";
import { remindDueAssignments } from "@/modules/assignments/application/due-reminders.service";
import { getBadgeShowcase } from "@/modules/engagement/application/badges.service";
import { attendanceRate } from "@/modules/engagement/domain/badges";
import { BadgeShowcase } from "@/modules/engagement/ui/badge-showcase";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { getStudentDashboard } from "@/modules/learning/application/student-dashboard.queries";
import { getStudentTrainings } from "@/modules/learning/application/trainings.queries";
import { trainingTiming } from "@/modules/learning/domain/trainings";
import { AnnouncementsCard } from "@/modules/learning/ui/announcements-card";
import { AssignmentChecklist, StudentHero, TeamSessionCard, TrainingsWidget } from "@/modules/learning/ui/student-home";
import { getStudentUpcomingAppointments } from "@/modules/mentoring/application/mentor-directory.queries";

export const metadata: Metadata = { title: "Ana Sayfa" };

export default async function StudentDashboardPage() {
  const viewer = await getViewer("STUDENT");
  after(() => remindDueAssignments(viewer.id).catch((error: unknown) => console.error("Due reminders failed", error)));
  const [dashboard, trainings, showcase, assignments, sessions] = await Promise.all([
    getStudentDashboard(viewer.id),
    getStudentTrainings(viewer.id),
    getBadgeShowcase(viewer.id),
    getStudentAssignments(viewer.id),
    getStudentUpcomingAppointments(viewer.id),
  ]);

  const next = trainings.find((t) => trainingTiming(t.scheduleDate, t.durationMinutes) !== "past") ?? null;
  const { attendance } = showcase.stats;
  const openAssignments = assignments.filter((a) => a.status === null || a.status === "RETURNED").length;

  return (
    <BentoGrid>
      <section aria-label="Özet" className={BENTO_SPAN.full}>
        <StudentHero
          firstName={dashboard.firstName}
          attendance={{ ...attendance, rate: attendanceRate(attendance) }}
          trainings={{ completed: trainings.filter((t) => t.completed).length, total: trainings.length }}
          badges={{ earned: showcase.badges.filter((b) => b.awardedAt).length, total: showcase.badges.length }}
          openAssignments={openAssignments}
          next={next}
        />
      </section>

      <section aria-label="Canlı eğitimler" className={BENTO_SPAN.main}>
        <TrainingsWidget trainings={trainings} next={next} />
      </section>

      <section aria-label="Rozetler ve mentorluk" className={`${BENTO_SPAN.side} flex flex-col gap-4`}>
        <BadgeShowcase badges={showcase.badges} />
        <TeamSessionCard session={sessions[0] ?? null} hasTeam={dashboard.hasTeam} />
      </section>

      <section aria-label="Ödevler" className={dashboard.announcements.length > 0 ? BENTO_SPAN.main : BENTO_SPAN.full}>
        <AssignmentChecklist assignments={assignments} />
      </section>

      {dashboard.announcements.length > 0 ? (
        <section aria-label="Duyurular" className={BENTO_SPAN.side}>
          <AnnouncementsCard items={dashboard.announcements} />
        </section>
      ) : null}
    </BentoGrid>
  );
}
