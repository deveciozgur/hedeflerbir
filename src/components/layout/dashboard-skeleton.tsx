import { BENTO_SPAN, BentoGrid } from "@/components/ui/bento";
import { surfaceClass } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Loading states for the bento dashboards. Each widget skeleton takes the box its widget will fill
 * (same grid spans, comparable heights), so streaming in the data causes no layout shift.
 */
export function HeaderSkeleton({ actions = 0 }: { actions?: number }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>
      {actions > 0 ? (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: actions }, (_, i) => (
            <Skeleton key={i} className="h-9 w-36 rounded-md" />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function KpiSkeleton() {
  return (
    <div className={cn(surfaceClass, "flex h-[7.25rem] flex-col gap-3 p-6 py-4", BENTO_SPAN.kpi)}>
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-7 w-16" />
      <Skeleton className="h-3.5 w-28" />
    </div>
  );
}

export function WidgetSkeleton({ className, rows = 4, height }: { className?: string; rows?: number; height?: string }) {
  return (
    <div className={cn(surfaceClass, "flex flex-col gap-5 p-6", height, className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3.5 w-12" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-3.5 w-3/5" />
              <Skeleton className="h-3 w-2/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function KpiRow() {
  return (
    <>
      <KpiSkeleton />
      <KpiSkeleton />
      <KpiSkeleton />
      <KpiSkeleton />
    </>
  );
}

/** Admin and instructor dashboards: header, 4 KPI tiles, an 8-column main widget and a 4-column side stack (`wide`: full width until xl). */
export function CommandCenterSkeleton({ label, actions = 0, wide = false }: { label: string; actions?: number; wide?: boolean }) {
  return (
    <div className="flex flex-col gap-8" role="status" aria-label={label}>
      <HeaderSkeleton actions={actions} />
      <BentoGrid>
        <KpiRow />
        <WidgetSkeleton className={wide ? BENTO_SPAN.mainWide : BENTO_SPAN.main} rows={6} height="min-h-[22rem]" />
        <div className={cn(wide ? cn(BENTO_SPAN.sideWide, "grid gap-4 lg:grid-cols-2 xl:flex xl:flex-col") : cn(BENTO_SPAN.side, "flex flex-col gap-4"))}>
          <WidgetSkeleton rows={3} />
          <WidgetSkeleton rows={3} />
        </div>
      </BentoGrid>
    </div>
  );
}
