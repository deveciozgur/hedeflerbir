import { HeaderSkeleton, KpiRow, WidgetSkeleton } from "@/components/layout/dashboard-skeleton";
import { BENTO_SPAN, BentoGrid } from "@/components/ui/bento";
import { surfaceClass } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Mirrors the cockpit box for box: KPI ribbon, live session + timeline (8) with team (4), badges (6) and tasks (6). */
export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Ana sayfa yükleniyor">
      <HeaderSkeleton />
      <BentoGrid>
        <KpiRow />
        <div className={cn(BENTO_SPAN.main, "flex flex-col gap-4")}>
          <div className={cn(surfaceClass, "flex flex-col gap-4 p-6")}>
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3.5 w-1/2" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-8 w-40 rounded-md" />
              <Skeleton className="h-8 w-28 rounded-md" />
            </div>
          </div>
          <div className={cn(surfaceClass, "flex flex-col gap-5 p-6")}>
            <Skeleton className="h-4 w-40" />
            <div className="flex gap-3 overflow-hidden">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-28 w-48 shrink-0 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
        <WidgetSkeleton className={BENTO_SPAN.side} rows={4} height="min-h-80" />
        <WidgetSkeleton className={BENTO_SPAN.half} rows={3} />
        <WidgetSkeleton className={BENTO_SPAN.half} rows={4} />
      </BentoGrid>
    </div>
  );
}
