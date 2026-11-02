import { WidgetSkeleton } from "@/components/layout/dashboard-skeleton";
import { BENTO_SPAN, BentoGrid } from "@/components/ui/bento";
import { surfaceClass } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Mirrors the bento dashboard box for box: hero (8) + next session (4), timeline (8) + badges (4), to-do (6) + team (6). */
export default function DashboardLoading() {
  return (
    <BentoGrid role="status" aria-label="Ana sayfa yükleniyor">
      <div className={cn(surfaceClass, BENTO_SPAN.main, "flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:gap-8")}>
        <Skeleton className="size-28 shrink-0 rounded-full" />
        <div className="flex flex-1 flex-col gap-3">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-7 w-64 max-w-full" />
          <Skeleton className="h-4 w-80 max-w-full" />
          <div className="grid grid-cols-2 gap-4 pt-1 sm:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-20" />
            ))}
          </div>
        </div>
      </div>

      <div className={cn(surfaceClass, BENTO_SPAN.side, "flex flex-col gap-4 p-6")}>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="h-3.5 w-2/5" />
        <div className="mt-auto flex gap-2">
          <Skeleton className="h-8 w-36 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-md" />
        </div>
      </div>

      <div className={cn(surfaceClass, BENTO_SPAN.main, "flex flex-col gap-5 p-6")}>
        <Skeleton className="h-4 w-40" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-28 w-48 shrink-0 rounded-lg" />
          ))}
        </div>
      </div>

      <div className={cn(surfaceClass, BENTO_SPAN.side, "flex flex-col gap-4 p-6")}>
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

      <WidgetSkeleton className={BENTO_SPAN.half} rows={4} />
      <WidgetSkeleton className={BENTO_SPAN.half} rows={3} />
    </BentoGrid>
  );
}
