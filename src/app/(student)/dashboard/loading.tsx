import { WidgetSkeleton } from "@/components/layout/dashboard-skeleton";
import { BENTO_SPAN, BentoGrid } from "@/components/ui/bento";
import { surfaceClass } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Mirrors the bento dashboard box for box: hero, trainings (8) + badges/session (4), checklist. */
export default function DashboardLoading() {
  return (
    <BentoGrid role="status" aria-label="Ana sayfa yükleniyor">
      <div className={cn(surfaceClass, BENTO_SPAN.full, "flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:gap-8 lg:p-8")}>
        <Skeleton className="size-28 shrink-0 rounded-full" />
        <div className="flex flex-1 flex-col gap-3">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-8 w-72 max-w-full" />
          <Skeleton className="h-4 w-[28rem] max-w-full" />
          <div className="flex gap-8 pt-1">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-20" />
            ))}
          </div>
        </div>
      </div>

      <div className={cn(surfaceClass, BENTO_SPAN.main, "flex flex-col gap-6 p-6")}>
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-52 w-full rounded-xl" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-24 w-44 shrink-0 rounded-lg" />
          ))}
        </div>
      </div>

      <div className={cn(BENTO_SPAN.side, "flex flex-col gap-4")}>
        <div className={cn(surfaceClass, "flex flex-col gap-4 p-6")}>
          <Skeleton className="h-4 w-24" />
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 9 }, (_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <Skeleton className="size-11 rounded-full" />
                <Skeleton className="h-2.5 w-14" />
              </div>
            ))}
          </div>
        </div>
        <WidgetSkeleton rows={1} />
      </div>

      <WidgetSkeleton className={BENTO_SPAN.full} rows={4} />
    </BentoGrid>
  );
}
