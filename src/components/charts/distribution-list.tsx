import { cn } from "@/lib/utils";

interface DistributionListProps {
  items: Array<{ label: string; value: number }>;
  /** Unit after the count, e.g. "katılımcı". */
  unit: string;
  /** Show at most this many rows; the rest are summed into "Diğer". */
  limit?: number;
  tone?: "brand" | "magenta" | "cyan" | "amber";
  empty?: string;
}

const TONE = { brand: "bg-brand", magenta: "bg-magenta", cyan: "bg-cyan", amber: "bg-amber" } as const;

/** Horizontal bar list for categorical distributions (long Turkish labels don't fit under columns). */
export function DistributionList({ items, unit, limit = 8, tone = "brand", empty = "Veri yok." }: DistributionListProps) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  const shown = items.slice(0, limit);
  const rest = items.slice(limit).reduce((sum, i) => sum + i.value, 0);
  const rows = rest > 0 ? [...shown, { label: "Diğer", value: rest }] : shown;
  const max = Math.max(...rows.map((r) => r.value), 1);
  const total = items.reduce((sum, i) => sum + i.value, 0);

  return (
    <ul className="flex flex-col gap-2.5">
      {rows.map((row) => (
        <li key={row.label} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{row.label}</span>
            <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
              {row.value} {unit} · %{Math.round((row.value / total) * 100)}
            </span>
          </div>
          <span className="h-1.5 w-full overflow-hidden rounded-full bg-track" aria-hidden>
            <span className={cn("block h-full rounded-full", TONE[tone])} style={{ width: `${(row.value / max) * 100}%` }} />
          </span>
        </li>
      ))}
    </ul>
  );
}
