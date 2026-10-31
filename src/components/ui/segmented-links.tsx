import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SegmentedLinksProps {
  label: string;
  value: string;
  options: ReadonlyArray<{ value: string; label: string; href: string; icon?: LucideIcon }>;
}

/** URL-driven segmented control — the selected view survives reloads and is shareable. */
export function SegmentedLinks({ label, value, options }: SegmentedLinksProps) {
  return (
    <nav aria-label={label} className="inline-flex rounded-lg border bg-muted/50 p-0.5">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Link
            key={option.value}
            href={option.href}
            scroll={false}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
              active ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.icon ? <option.icon className="size-3.5" aria-hidden /> : null}
            {option.label}
          </Link>
        );
      })}
    </nav>
  );
}
