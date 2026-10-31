import { surfaceClass } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { DASHBOARD_GRID } from "@/modules/learning/ui/dashboard-grid";

/** Mirrors the dashboard box-for-box: header, ring + projects, resume card, timeline, announcements. */
export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-8" role="status" aria-label="Ana sayfa yükleniyor">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-72 max-w-full" />
      </div>

      <div className={DASHBOARD_GRID.top}>
        <div className={cn(surfaceClass, "flex items-center gap-8 p-6 max-sm:flex-col max-sm:items-start")}>
          <Skeleton className="size-32 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-6 self-stretch">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-64 max-w-full" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
        <div className={cn(surfaceClass, "flex min-h-64 flex-col justify-between gap-6 p-6")}>
          <div className="flex flex-col gap-4">
            <Skeleton className="size-10 rounded-lg" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-2 w-full" />
          </div>
          <Skeleton className="h-9 w-full" />
        </div>
      </div>

      <div className={DASHBOARD_GRID.bottom}>
        <div className={cn(surfaceClass, "flex flex-col gap-6 p-6")}>
          <Skeleton className="h-4 w-28" />
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="grid grid-cols-[32px_1fr] gap-3">
              <Skeleton className="mt-2 size-8 rounded-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ))}
        </div>
        <div className={cn(surfaceClass, "flex flex-col gap-6 p-6")}>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    </div>
  );
}
