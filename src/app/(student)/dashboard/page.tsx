import type { Metadata } from "next";
import { after } from "next/server";
import { Award, CalendarCheck2, ClipboardCheck, Percent } from "lucide-react";
import { BENTO_SPAN, BentoGrid } from "@/components/ui/bento";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { cn } from "@/lib/utils";
import { getStudentAssignments } from "@/modules/assignments/application/student-assignments.queries";
import { remindDueAssignments } from "@/modules/assignments/application/due-reminders.service";
import { getBadgeShowcase } from "@/modules/engagement/application/badges.service";
import { BadgeShowcase } from "@/modules/engagement/ui/badge-showcase";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { getStudentDashboard } from "@/modules/learning/application/student-dashboard.queries";
import { getStudentTrainings } from "@/modules/learning/application/trainings.queries";
import { trainingCompletion, trainingTiming } from "@/modules/learning/domain/trainings";
import { AnnouncementsCard } from "@/modules/learning/ui/announcements-card";
import { AssignmentChecklist, NextSessionCard, TeamMentoringCard, TimelineWidget } from "@/modules/learning/ui/student-home";
import { getStudentUpcomingAppointments } from "@/modules/mentoring/application/mentor-directory.queries";
import { getMyTeam } from "@/modules/people/application/people.queries";

export const metadata: Metadata = { title: "Ana Sayfa" };

const DAY = 86_400_000;

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

  const now = Date.now();
  const next = trainings.find((t) => trainingTiming(t.scheduleDate, t.durationMinutes) !== "past") ?? null;
  const completed = trainings.filter((t) => t.completed).length;
  const held = trainings.filter((t) => trainingTiming(t.scheduleDate, t.durationMinutes) !== "upcoming").length;
  const submitted = assignments.filter((a) => a.status === "SUBMITTED" || a.status === "GRADED").length;
  const earned = showcase.badges.filter((b) => b.awardedAt);
  const earnedThisWeek = earned.filter((b) => b.awardedAt && now - b.awardedAt.getTime() < 7 * DAY).length;
  const dueSoon = assignments.filter((a) => (a.status === null || a.status === "RETURNED") && a.dueDate.getTime() > now && a.dueDate.getTime() - now < 3 * DAY).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`Tekrar hoş geldin, ${dashboard.firstName}`} description="Bootcamp sürecinin canlı özeti: yoklamalar, oturumlar, görevler ve rozetler." />

      <BentoGrid>
        <section aria-label="Göstergeler" className="contents">
          <div className={BENTO_SPAN.kpi}>
            <StatTile icon={Percent} tone="brand" label="Toplam devam oranı" value={`%${trainingCompletion(completed, trainings.length)}`} hint="Yoklamada katıldı işaretlenen eğitimler" />
          </div>
          <div className={BENTO_SPAN.kpi}>
            <StatTile
              icon={CalendarCheck2}
              tone="cyan"
              label="Tamamlanan canlı oturum"
              value={`${completed}/${trainings.length}`}
              trend={held > completed ? { label: `${held - completed} katılmadı`, tone: "bad" } : { label: "eksiksiz", tone: "good" }}
            />
          </div>
          <div className={BENTO_SPAN.kpi}>
            <StatTile
              icon={ClipboardCheck}
              tone={dueSoon > 0 ? "magenta" : "neutral"}
              label="Bekleyen ödev"
              value={String(assignments.length - submitted)}
              trend={dueSoon > 0 ? { label: `${dueSoon} görev 3 gün içinde`, tone: "bad" } : undefined}
              hint={`${submitted}/${assignments.length} teslim edildi`}
            />
          </div>
          <div className={BENTO_SPAN.kpi}>
            <StatTile
              icon={Award}
              tone="amber"
              label="Rozet skoru"
              value={`${earned.length}/${showcase.badges.length}`}
              trend={earnedThisWeek > 0 ? { label: `+${earnedThisWeek} bu hafta`, tone: "good" } : undefined}
            />
          </div>
        </section>

        <section aria-label="Canlı oturum ve zaman çizelgesi" className={cn(BENTO_SPAN.main, "flex flex-col gap-4")}>
          <NextSessionCard next={next} />
          <TimelineWidget trainings={trainings} sessions={sessions} currentId={next?.id ?? null} />
        </section>

        <section aria-label="Ekip ve seans durumu" className={BENTO_SPAN.side}>
          <TeamMentoringCard team={team} session={sessions[0] ?? null} />
        </section>

        <section aria-label="Rozet vitrini" className={BENTO_SPAN.half}>
          <BadgeShowcase badges={showcase.badges} />
        </section>

        <section aria-label="Görev ve ödev takibi" className={BENTO_SPAN.half}>
          <AssignmentChecklist assignments={assignments} />
        </section>

        {dashboard.announcements.length > 0 ? (
          <section aria-label="Duyurular" className={BENTO_SPAN.full}>
            <AnnouncementsCard items={dashboard.announcements} />
          </section>
        ) : null}
      </BentoGrid>
    </div>
  );
}
