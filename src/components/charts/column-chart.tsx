"use client";

import { useId, useState } from "react";
import { BarChart3, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ColumnDatum {
  label: string;
  value: number;
}

interface ColumnChartProps {
  data: ColumnDatum[];
  /** Accessible name and table caption. */
  title: string;
  /** Unit for tooltips and the table, e.g. "katılımcı". */
  unit: string;
  height?: number;
}

/** 1 / 2 / 5 × 10ⁿ ceiling, so axis ticks are always clean numbers. */
function niceMax(value: number): number {
  if (value <= 0) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 5, 10].find((s) => s * magnitude >= value) ?? 10;
  return Math.max(step * magnitude, 4);
}

/**
 * Single-series column chart: brand hue, ≤24px columns with 4px rounded caps on a shared baseline,
 * hairline grid, selective cap labels (peak + latest), per-column hover/focus tooltip and a table view.
 */
export function ColumnChart({ data, title, unit, height = 176 }: ColumnChartProps) {
  const id = useId();
  const [view, setView] = useState<"chart" | "table">("chart");
  const [active, setActive] = useState<number | null>(null);

  const max = niceMax(Math.max(...data.map((d) => d.value), 0));
  const ticks = [max, max / 2, 0];
  const peak = data.reduce((best, d, i) => (d.value > (data[best]?.value ?? -1) ? i : best), 0);
  const labelled = new Set([peak, data.length - 1]);

  return (
    <figure className="flex flex-col gap-3" aria-labelledby={`${id}-title`}>
      <div className="flex items-center justify-between gap-2">
        <figcaption id={`${id}-title`} className="sr-only">
          {title}
        </figcaption>
        <div className="ml-auto inline-flex rounded-md border p-0.5" role="group" aria-label="Görünüm">
          {(["chart", "table"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={view === mode}
              onClick={() => setView(mode)}
              className={cn(
                "inline-flex h-6 items-center gap-1 rounded px-2 text-[11px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                view === mode ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {mode === "chart" ? <BarChart3 className="size-3" aria-hidden /> : <Table2 className="size-3" aria-hidden />}
              {mode === "chart" ? "Grafik" : "Tablo"}
            </button>
          ))}
        </div>
      </div>

      {view === "table" ? (
        <table className="w-full text-sm">
          <caption className="sr-only">{title}</caption>
          <thead className="text-left text-xs text-muted-foreground">
            <tr className="border-b">
              <th scope="col" className="py-2 font-medium">Dönem</th>
              <th scope="col" className="py-2 text-right font-medium">Değer</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((d) => (
              <tr key={d.label}>
                <td className="py-1.5">{d.label}</td>
                <td className="py-1.5 text-right tabular-nums">
                  {d.value} {unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="flex gap-2">
          {/* Y axis */}
          <div className="relative w-7 shrink-0 text-right text-[11px] text-muted-foreground tabular-nums" style={{ height }} aria-hidden>
            {ticks.map((t, i) => (
              <span key={t} className="absolute right-0 -translate-y-1/2" style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}>
                {t}
              </span>
            ))}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="relative" style={{ height }}>
              {/* Hairline grid */}
              {ticks.map((t, i) => (
                <div
                  key={t}
                  aria-hidden
                  className={cn("absolute inset-x-0 h-px", t === 0 ? "bg-border" : "bg-border/60")}
                  style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}
                />
              ))}

              <ul className="absolute inset-0 flex items-end" aria-label={title}>
                {data.map((d, i) => {
                  const pct = (d.value / max) * 100;
                  const isActive = active === i;
                  return (
                    <li
                      key={d.label}
                      tabIndex={0}
                      aria-label={`${d.label}: ${d.value} ${unit}`}
                      onPointerEnter={() => setActive(i)}
                      onPointerLeave={() => setActive((cur) => (cur === i ? null : cur))}
                      onFocus={() => setActive(i)}
                      onBlur={() => setActive((cur) => (cur === i ? null : cur))}
                      className="group relative flex h-full flex-1 cursor-default items-end justify-center outline-none"
                    >
                      {/* Cap label: peak and latest only */}
                      {labelled.has(i) && d.value > 0 ? (
                        <span
                          aria-hidden
                          className="absolute text-[11px] font-medium text-foreground tabular-nums"
                          style={{ bottom: `calc(${pct}% + 4px)` }}
                        >
                          {d.value}
                        </span>
                      ) : null}
                      <span
                        aria-hidden
                        className={cn(
                          "w-full max-w-6 rounded-t-[4px] bg-brand transition-[filter] group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-background",
                          isActive && "brightness-110",
                        )}
                        style={{ height: `${pct}%`, minHeight: d.value > 0 ? 2 : 0 }}
                      />
                      {isActive ? (
                        <span
                          role="tooltip"
                          className="pointer-events-none absolute z-10 flex -translate-y-2 flex-col items-center rounded-md border bg-popover px-2.5 py-1.5 whitespace-nowrap shadow-md"
                          style={{ bottom: `${pct}%` }}
                        >
                          <span className="text-sm font-semibold tabular-nums">
                            {d.value} <span className="text-xs font-normal text-muted-foreground">{unit}</span>
                          </span>
                          <span className="text-[11px] text-muted-foreground">{d.label}</span>
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="flex text-[11px] text-muted-foreground" aria-hidden>
              {data.map((d) => (
                <span key={d.label} className="flex-1 truncate text-center">
                  {d.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </figure>
  );
}
