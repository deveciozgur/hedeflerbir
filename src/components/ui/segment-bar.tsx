"use client";

import { motion, useReducedMotion } from "motion/react";
import { clamp, cn } from "@/lib/utils";

interface SegmentBarProps {
  value: number;
  label: string;
  /** Number of cells; 20 ⇒ each cell is 5%. */
  segments?: number;
  className?: string;
}

/**
 * Horizontal segmented progress. Filled cells fade in left-to-right once on mount, which reads
 * as "how far along" without animating width (transform/opacity only).
 */
export function SegmentBar({ value, label, segments = 20, className }: SegmentBarProps) {
  const reduceMotion = useReducedMotion();
  const pct = clamp(Math.round(value));
  const filled = Math.round((pct / 100) * segments);

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("grid h-2 gap-0.5", className)}
      style={{ gridTemplateColumns: `repeat(${segments}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: segments }, (_, i) => {
        const on = i < filled;
        return (
          <span key={i} className="relative rounded-[2px] bg-zinc-800">
            {on ? (
              <motion.span
                className="absolute inset-0 rounded-[2px] bg-brand"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25, delay: 0.15 + i * 0.03, ease: "easeOut" }}
              />
            ) : null}
          </span>
        );
      })}
    </div>
  );
}
