import type { Metadata } from "next";
import { CalendarDays, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { deleteTrainingAction } from "@/modules/learning/application/training-admin.actions";
import { getAdminTrainings, listProgramOptions } from "@/modules/learning/application/trainings.queries";
import { trainingTiming } from "@/modules/learning/domain/trainings";
import { AttendanceDialog } from "@/modules/learning/ui/attendance-dialog";
import { TrainingCard } from "@/modules/learning/ui/training-card";
import { TrainingFormDialog } from "@/modules/learning/ui/training-form-dialog";
import { listPeople } from "@/modules/people/application/people.queries";
import { PersonCardGrid } from "@/modules/people/ui/person-card-grid";

export const metadata: Metadata = { title: "Eğitimler" };

export default async function AdminTrainingsPage() {
  await getViewer("ADMIN");
  const [trainings, instructors, courses] = await Promise.all([
    getAdminTrainings(),
    listPeople("INSTRUCTOR"),
    listProgramOptions(),
  ]);
  const options = { courses, instructors };

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        title="Eğitimler"
        description={`${trainings.length} canlı eğitim. Yoklamayı eğitim kartından alabilirsin; katılanlar eğitimin rozetini kazanır.`}
        actions={
          <TrainingFormDialog
            {...options}
            trigger={
              <Button disabled={courses.length === 0}>
                <Plus aria-hidden /> Yeni eğitim
              </Button>
            }
          />
        }
      />

      {trainings.length === 0 ? (
        <EmptyState icon={CalendarDays} title="Henüz eğitim yok" description={courses.length === 0 ? "Önce Programlar sayfasından bir program oluşturun." : "İlk canlı eğitimi ekleyerek takvimi oluştur."} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {trainings.map((training) => {
            const started = trainingTiming(training.scheduleDate, training.durationMinutes) !== "upcoming";
            return (
              <li key={training.id}>
                <TrainingCard
                  training={training}
                  footer={
                    <div className="flex flex-col gap-3">
                      <p className="text-xs text-muted-foreground">
                        {training.programTitle} ·{" "}
                        {training.rollTaken ? (
                          <span className="font-mono tabular-nums">
                            {training.present}/{training.enrolled} katıldı
                          </span>
                        ) : started ? (
                          <span className="text-warning">Yoklama alınmadı</span>
                        ) : (
                          `${training.enrolled} kayıtlı katılımcı`
                        )}
                      </p>
                      <div className="flex flex-wrap items-center gap-1">
                        {training.meetingUrl ? (
                          <Button asChild variant="ghost" size="sm">
                            <a href={training.meetingUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink aria-hidden /> Bağlantı
                            </a>
                          </Button>
                        ) : null}
                        {started ? <AttendanceDialog session={training} roster={training.roster} /> : null}
                        <TrainingFormDialog
                          {...options}
                          training={training}
                          trigger={
                            <Button variant="ghost" size="sm">
                              <Pencil aria-hidden /> Düzenle
                            </Button>
                          }
                        />
                        <ConfirmActionButton
                          variant="ghost"
                          label={
                            <>
                              <Trash2 aria-hidden />
                              <span className="sr-only">{training.title} eğitimini sil</span>
                            </>
                          }
                          title="Eğitim silinsin mi?"
                          description={`"${training.title}" ve yoklama kayıtları silinecek. Bağlı ödevler ve teslimler korunur.`}
                          confirmLabel="Eğitimi sil"
                          successMessage="Eğitim silindi"
                          destructive
                          action={deleteTrainingAction.bind(null, training.id)}
                        />
                      </div>
                    </div>
                  }
                />
              </li>
            );
          })}
        </ul>
      )}

      <section aria-labelledby="instructors-heading" className="flex flex-col gap-4">
        <h2 id="instructors-heading" className="text-lg font-semibold tracking-tight">
          Eğitmenler
        </h2>
        <PersonCardGrid people={instructors} canMessage emptyTitle="Henüz eğitmen yok" emptyDescription="Kullanıcılar sayfasından eğitmen hesabı oluşturabilirsin." />
      </section>
    </div>
  );
}
