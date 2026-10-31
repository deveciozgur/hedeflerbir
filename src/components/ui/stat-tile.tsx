import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "./card";

interface StatTileProps {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
}

/** Stat tile: sentence-case label, semibold value, optional context line. */
export function StatTile({ label, value, hint, icon: Icon }: StatTileProps) {
  return (
    <Card className="py-4">
      <CardContent className="flex flex-col gap-2">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon className="size-3.5" aria-hidden /> {label}
        </p>
        <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
