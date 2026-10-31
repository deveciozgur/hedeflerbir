import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressRing } from "@/components/ui/progress-ring";

interface TrainingProgressCardProps {
  completed: number;
  total: number;
  percent: number;
  /** Ring label: participant ("Eğitim ilerlemen") or programme-wide (admin). */
  label?: string;
  description?: string;
  href?: string;
}

/** Live-training progress: only trainings with a PRESENT roll call count as completed. */
export function TrainingProgressCard({ completed, total, percent, label = "Eğitim ilerlemen", description, href = "/trainings" }: TrainingProgressCardProps) {
  return (
    <Card className="h-full flex-row items-center gap-8 px-6 max-sm:flex-col max-sm:items-start">
      <ProgressRing value={percent} label={label} />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <h2 className="text-sm font-semibold">{label}</h2>
        <p className="text-sm text-muted-foreground">
          {total === 0 ? (
            "Henüz planlanmış canlı eğitim yok."
          ) : (
            <>
              <span className="font-mono text-foreground tabular-nums">{completed}</span>/<span className="font-mono tabular-nums">{total}</span> canlı eğitim
              tamamlandı. {description ?? "Yoklaması alınan eğitimler sayılır."}
            </>
          )}
        </p>
        <Button asChild variant="ghost" size="sm" className="self-start">
          <Link href={href}>
            Eğitim takvimi <ArrowRight aria-hidden />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
