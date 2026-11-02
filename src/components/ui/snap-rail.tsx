"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Horizontal, scroll-snapping list. On mount it scrolls the item marked `data-current` to the start,
 * so a timeline opens on "now" instead of the first past entry.
 */
export function SnapRail({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const rail = ref.current;
    const current = rail?.querySelector<HTMLElement>("[data-current]");
    if (rail && current) rail.scrollLeft = current.offsetLeft - rail.offsetLeft - 4;
  }, []);

  return (
    <ol
      ref={ref}
      aria-label={label}
      className={cn("-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]", className)}
    >
      {children}
    </ol>
  );
}
