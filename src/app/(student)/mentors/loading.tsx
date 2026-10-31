import { surfaceClass } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Same grid and card anatomy as the mentor directory (avatar row, tags, availability footer). */
export default function MentorsLoading() {
  return (
    <div className="flex flex-col gap-8" role="status" aria-label="Mentorlar yükleniyor">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-5 w-80 max-w-full" />
      </div>
      <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} className={cn(surfaceClass, "flex flex-col gap-4 p-6")}>
            <div className="flex items-center gap-3">
              <Skeleton className="size-12 rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="mt-2 h-4 w-full" />
          </li>
        ))}
      </ul>
    </div>
  );
}
