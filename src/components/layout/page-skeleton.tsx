import { Skeleton } from "@/components/ui/skeleton";

/** Shared body for segment-level `loading.tsx` files. */
export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-8" role="status" aria-label="Yükleniyor">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-44 md:col-span-2" />
        <Skeleton className="h-44" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}
