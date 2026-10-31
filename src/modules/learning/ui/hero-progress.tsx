import { FolderKanban } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { ProgressRing } from "@/components/ui/progress-ring";
import { formatDate } from "@/lib/format";
import { PROGRESS_MESSAGES, progressTone, type ProjectProgressSnapshot } from "../domain/progress";

interface HeroProgressProps {
  overall: number;
  projects: ProjectProgressSnapshot[];
}

export function HeroProgress({ overall, projects }: HeroProgressProps) {
  if (projects.length === 0) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="Henüz bir projeye dahil değilsin"
        description="Bir projeye atandığında genel ilerlemen burada görünecek."
        className="lg:col-span-2"
      />
    );
  }

  return (
    <Card className="lg:col-span-2">
      <CardContent className="flex flex-col gap-8 sm:flex-row sm:items-center">
        <div className="flex flex-col items-center gap-3 sm:items-start">
          <ProgressRing value={overall} label="Genel proje tamamlama oranı" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div>
            <h2 className="text-sm font-semibold">Genel ilerleme</h2>
            <p className="mt-1 text-sm text-muted-foreground">{PROGRESS_MESSAGES[progressTone(overall)]}</p>
          </div>
          <ul className="flex flex-col gap-4">
            {projects.map((project) => (
              <li key={project.projectId} className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate font-medium">{project.title}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">%{project.completionPercentage}</span>
                </div>
                <Progress value={project.completionPercentage} aria-label={`${project.title} ilerlemesi`} />
                <p className="text-xs text-muted-foreground">Bitiş: {formatDate(project.endDate)}</p>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
