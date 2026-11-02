import type { Metadata } from "next";
import { after } from "next/server";
import { BENTO_SPAN, BentoGrid } from "@/components/ui/bento";
import { getStudentAssignments } from "@/modules/assignments/application/student-assignments.queries";
import { remindDueAssignments } from "@/modules/assignments/application/due-reminders.service";
import { getBadgeShowcase } from "@/modules/engagement/application/badges.service";
import { BadgeShowcase } from "@/modules/engagement/ui/badge-showcase";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { getStudentDashboard } from "@/modules/learning/application/student-dashboard.queries";
import { getStudentTrainings } from "@/modules/learning/application/trainings.queries";
import { trainingTiming } from "@/modules/learning/domain/trainings";
import { AnnouncementsCard } from "@/modules/learning/ui/announcements-card";
import { AssignmentChecklist, NextSessionCard, StudentHero, TeamMentoringCard, TimelineWidget } from "@/modules/learning/ui/student-home";
import { getStudentUpcomingAppointments } from "@/modules/mentoring/application/mentor-directory.queries";
import { getMyTeam } from "@/modules/people/application/people.queries";

export const metadata: Metadata = { title: "Ana Sayfa" };

export default async function StudentDashboardPage() {
  const viewer = await getViewer("STUDENT");
  after(() => remindDueAssignments(viewer.id).catch((error: unknown) => console.error("Due reminders failed", error)));
  const [dashboard, trainings, showcase, assignments, sessions, team] = await Promise.all([
    getStudentDashboard(viewer.id),
    getStudentTrainings(viewer.id),
    getBadgeShowcase(viewer.id),
    getStudentAssignments(viewer.id),
    getStudentUpcomingAppointments(viewer.id),
    getMyTeam(viewer.id),
  ]);

  const next = trainings.find((t) => trainingTiming(t.scheduleDate, t.durationMinutes) !== "past") ?? null;

  return (
    <BentoGrid>
      <section aria-label="Özet" className={BENTO_SPAN.main}>
        <StudentHero
          firstName={dashboard.firstName}
          trainings={{ completed: trainings.filter((t) => t.completed).length, total: trainings.length }}
          attendance={showcase.stats.attendance}
          badges={{ earned: showcase.badges.filter((b) => b.awardedAt).length, total: showcase.badges.length }}
          openAssignments={assignments.filter((a) => a.status === null || a.status === "RETURNED").length}
        />
      </section>

      <section aria-label="Sıradaki canlı oturum" className={BENTO_SPAN.side}>
        <NextSessionCard next={next} />
      </section>

      <section aria-label="Eğitim zaman çizelgesi" className={BENTO_SPAN.main}>
        <TimelineWidget trainings={trainings} sessions={sessions} currentId={next?.id ?? null} />
      </section>

      <section aria-label="Rozetler" className={BENTO_SPAN.side}>
        <BadgeShowcase badges={showcase.badges} />
      </section>

      <section aria-label="Görevler ve ödevler" className={BENTO_SPAN.half}>
        <AssignmentChecklist assignments={assignments} />
      </section>

      <section aria-label="Ekip ve mentorluk" className={BENTO_SPAN.half}>
        <TeamMentoringCard team={team} session={sessions[0] ?? null} />
      </section>

      {dashboard.announcements.length > 0 ? (
        <section aria-label="Duyurular" className={BENTO_SPAN.full}>
          <AnnouncementsCard items={dashboard.announcements} />
        </section>
      ) : null}
    </BentoGrid>
  );
}
