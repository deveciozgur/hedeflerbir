import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { getStudentTrainings } from "@/modules/learning/application/trainings.queries";
import { trainingTiming } from "@/modules/learning/domain/trainings";
import { TrainingCard } from "@/modules/learning/ui/training-card";

export const metadata: Metadata = { title: "Eğitimler" };

export default async function TrainingsPage() {
  const viewer = await getViewer("STUDENT");
  const trainings = await getStudentTrainings(viewer.id);
  const upcoming = trainings.filter((t) => trainingTiming(t.scheduleDate, t.durationMinutes) !== "past");
  const past = trainings.filter((t) => trainingTiming(t.scheduleDate, t.durationMinutes) === "past").reverse();
  const completed = trainings.filter((t) => t.completed).length;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Eğitimler"
        description={`Canlı eğitim takvimin. ${trainings.length} eğitimin ${completed} tanesini tamamladın.`}
      />
      {trainings.length === 0 ? (
        <EmptyState icon={CalendarDays} title="Henüz planlanmış eğitim yok" description="Program yönetimi eğitimleri planladığında burada görünecek." />
      ) : (
        <>
          {[
            { id: "upcoming", title: "Yaklaşan eğitimler", items: upcoming, empty: "Yaklaşan eğitim yok." },
            { id: "past", title: "Geçmiş eğitimler", items: past, empty: "Henüz geçmiş eğitim yok." },
          ].map((group) => (
            <section key={group.id} aria-labelledby={`trainings-${group.id}`} className="flex flex-col gap-4">
              <h2 id={`trainings-${group.id}`} className="text-sm font-semibold">
                {group.title} <span className="font-mono text-xs font-normal text-subtle tabular-nums">{group.items.length}</span>
              </h2>
              {group.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">{group.empty}</p>
              ) : (
                <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {group.items.map((training) => (
                    <li key={training.id}>
                      <TrainingCard
                        training={training}
                        href={`/trainings/${training.id}`}
                        completed={training.completed}
                        footer={
                          training.openAssignments > 0 ? (
                            <p className="text-xs font-medium text-warning">{training.openAssignments} ödev teslim bekliyor</p>
                          ) : null
                        }
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </>
      )}
    </div>
  );
}
