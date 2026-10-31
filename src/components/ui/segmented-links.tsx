"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

interface SegmentedLinksProps {
  label: string;
  value: string;
  options: ReadonlyArray<{ value: string; label: string; href: string; /** Rendered icon element, e.g. <List />. */ icon?: ReactNode; count?: number }>;
  /** Unique per control on a page so their moving indicators don't share a layout animation. */
  layoutId?: string;
}

/**
 * URL-driven tabs: the selection survives reloads and is shareable.
 * The active background glides between options (shared `layoutId`) - feedback for the state change.
 */
export function SegmentedLinks({ label, value, options, layoutId = "activeTab" }: SegmentedLinksProps) {
  const reduceMotion = useReducedMotion();

  return (
    <nav aria-label={label} className="inline-flex max-w-full gap-1 overflow-x-auto rounded-lg border border-border bg-surface-raised p-1">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Link
            key={option.value}
            href={option.href}
            scroll={false}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative inline-flex h-8 shrink-0 items-center gap-2 rounded-md px-3 text-xs font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active ? (
              <motion.span
                layoutId={layoutId}
                aria-hidden
                className="absolute inset-0 rounded-md border border-border-strong/70 bg-chip-active shadow-sm shadow-shadow dark:shadow-none"
                transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 40 }}
              />
            ) : null}
            <span className="relative inline-flex items-center gap-2">
              {option.icon ? <span className="[&_svg]:size-3.5" aria-hidden>{option.icon}</span> : null}
              {option.label}
              {option.count !== undefined ? (
                <span className={cn("tabular-nums", active ? "text-muted-foreground" : "text-subtle")}>{option.count}</span>
              ) : null}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
