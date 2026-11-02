import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Column spans of the 12-column bento grid; shared by every dashboard and its loading.tsx (same boxes, CLS 0). */
export const BENTO_SPAN = {
  full: "sm:col-span-2 lg:col-span-12",
  main: "sm:col-span-2 lg:col-span-8",
  side: "sm:col-span-2 lg:col-span-4",
  /** For dense widgets (a 7-day calendar): full width until xl, then 8 + 4. */
  mainWide: "sm:col-span-2 lg:col-span-12 xl:col-span-8",
  sideWide: "sm:col-span-2 lg:col-span-12 xl:col-span-4",
  /** KPI tiles: two per row up to xl, four on wide screens. */
  kpi: "lg:col-span-6 xl:col-span-3",
} as const;

export function BentoGrid({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12", className)} {...props} />;
}
