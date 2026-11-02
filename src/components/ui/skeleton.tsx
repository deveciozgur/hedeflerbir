import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Placeholder block; give it the exact size of the content it stands in for so nothing shifts (CLS 0). */
export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="skeleton" aria-hidden className={cn("animate-shimmer rounded-md bg-track bg-[linear-gradient(90deg,transparent_0%,rgb(255_255_255/0.55)_50%,transparent_100%)] bg-[length:200%_100%] bg-no-repeat dark:bg-[linear-gradient(90deg,transparent_0%,rgb(255_255_255/0.06)_50%,transparent_100%)]", className)} {...props} />;
}
