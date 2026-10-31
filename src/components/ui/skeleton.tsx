import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Placeholder block; give it the exact size of the content it stands in for so nothing shifts (CLS 0). */
export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="skeleton" aria-hidden className={cn("animate-shimmer rounded-md bg-track", className)} {...props} />;
}
