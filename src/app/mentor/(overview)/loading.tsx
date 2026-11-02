import { HeaderSkeleton, WidgetSkeleton } from "@/components/layout/dashboard-skeleton";
import { BENTO_SPAN, BentoGrid } from "@/components/ui/bento";
import { surfaceClass } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function MentorHomeLoading() {
  return (
    <div className="flex flex-col gap-8" role="status" aria-label="Genel bakış yükleniyor">
      <HeaderSkeleton />
      <BentoGrid>
        <div className={cn(BENTO_SPAN.main, "flex flex-col gap-4")}>
          <Skeleton className="h-5 w-48" />
          <WidgetSkeleton rows={4} height="min-h-64" />
          <WidgetSkeleton rows={4} height="min-h-64" />
        </div>
        <div className={cn(surfaceClass, BENTO_SPAN.side, "flex h-fit flex-col items-center gap-6 p-6")}>
          <Skeleton className="h-4 w-28 self-start" />
          <Skeleton className="size-[8.5rem] rounded-full" />
          <div className="flex w-full flex-col gap-2.5">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
      </BentoGrid>
    </div>
  );
}
