import { FolderKanban } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressRing } from "@/components/ui/progress-ring";
import { SegmentBar } from "@/components/ui/segment-bar";
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
        className="h-full"
      />
    );
  }

  return (
    <Card className="h-full flex-row items-center gap-8 px-6 max-sm:flex-col max-sm:items-start">
      <ProgressRing value={overall} label="Genel proje tamamlama oranı" />
      <div className="flex min-w-0 flex-1 flex-col gap-6 self-stretch">
        <div>
          <h2 className="text-sm font-semibold">Genel ilerleme</h2>
          <p className="mt-2 text-sm text-muted-foreground">{PROGRESS_MESSAGES[progressTone(overall)]}</p>
        </div>
        <ul className="flex flex-col gap-4">
          {projects.map((project) => (
            <li key={project.projectId} className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-4 text-sm">
                <span className="line-clamp-2 font-medium text-pretty">{project.title}</span>
                <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">%{project.completionPercentage}</span>
              </div>
              <SegmentBar value={project.completionPercentage} label={`${project.title} ilerlemesi`} />
              <p className="text-xs text-subtle tabular-nums">Bitiş {formatDate(project.endDate)}</p>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
