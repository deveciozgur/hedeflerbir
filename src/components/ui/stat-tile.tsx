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
  /** Change since a reference period, computed from real data (e.g. "+3 bu hafta"). Good/bad, not up/down. */
  trend?: { label: string; tone?: "good" | "bad" | "neutral" };
}

const TREND = {
  good: "bg-success/10 text-success",
  bad: "bg-destructive/10 text-destructive",
  neutral: "bg-muted text-muted-foreground",
} as const;

/** KPI tile: sentence-case label with a tinted icon chip, tabular monospace value, optional trend pill and context line. */
export function StatTile({ label, value, hint, icon: Icon, tone = "neutral", trend }: StatTileProps) {
  return (
    <Card className="h-full py-4">
      <CardContent className="flex flex-col gap-3">
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className={cn("grid size-6 place-items-center rounded-md", TONES[tone])} aria-hidden>
            <Icon className="size-3.5" />
          </span>
          {label}
        </p>
        <p className="flex flex-wrap items-baseline gap-2">
          <span className="font-mono text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
          {trend ? (
            <span className={cn("rounded px-1.5 py-0.5 font-mono text-xs tabular-nums", TREND[trend.tone ?? "neutral"])}>{trend.label}</span>
          ) : null}
        </p>
        {hint ? <p className="truncate text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
