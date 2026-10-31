import { surfaceClass } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Header, tab bar and list rows at their final sizes. */
export default function AssignmentsLoading() {
  return (
    <div className="flex flex-col gap-8" role="status" aria-label="Ödevler yükleniyor">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-5 w-72 max-w-full" />
      </div>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
          <Skeleton className="h-10 w-full max-w-md rounded-lg" />
          <Skeleton className="h-10 w-40 rounded-lg" />
        </div>
        <div className={cn(surfaceClass, "divide-y divide-border overflow-hidden")}>
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4">
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-56 max-w-full" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="hidden h-5 w-24 rounded-full sm:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
