import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "./card";

const TONES = {
  neutral: "bg-muted text-muted-foreground",
  brand: "bg-brand/10 text-brand-soft",
  magenta: "bg-magenta/10 text-magenta-soft",
  cyan: "bg-cyan/15 text-foreground",
  amber: "bg-amber/20 text-foreground",
} as const;

interface StatTileProps {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  /** Brand accent of the icon chip: teal for primary metrics, cyan secondary, amber pending, magenta alerts. */
  tone?: keyof typeof TONES;
}

/** KPI tile: sentence-case label with a tinted icon chip, tabular monospace value, optional context line. */
export function StatTile({ label, value, hint, icon: Icon, tone = "neutral" }: StatTileProps) {
  return (
    <Card className="h-full py-4">
      <CardContent className="flex flex-col gap-3">
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className={cn("grid size-6 place-items-center rounded-md", TONES[tone])} aria-hidden>
            <Icon className="size-3.5" />
          </span>
          {label}
        </p>
        <p className="font-mono text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
        {hint ? <p className="truncate text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
