import { CalendarCheck, Compass, Flag, Lock, PlayCircle, Star, Sunrise, Trophy, Upload, type LucideIcon } from "lucide-react";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BadgeIcon } from "../domain/badges";

const ICONS: Record<BadgeIcon, LucideIcon> = {
  upload: Upload,
  trophy: Trophy,
  star: Star,
  calendar: CalendarCheck,
  play: PlayCircle,
  compass: Compass,
  flag: Flag,
  sunrise: Sunrise,
};

export interface BadgeGridItem {
  code: string;
  name: string;
  description: string;
  icon: BadgeIcon;
  awardedAt: Date | null;
  progress: number;
}

/** Earned badges in full color with the award date; locked ones muted with progress toward the criterion. */
export function BadgeGrid({ badges }: { badges: BadgeGridItem[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {badges.map((badge) => {
        const Icon = ICONS[badge.icon];
        const earned = badge.awardedAt !== null;
        const pct = Math.round(badge.progress * 100);
        return (
          <li
            key={badge.code}
            className={cn("flex flex-col items-center gap-2 rounded-xl border p-4 text-center", earned ? "bg-card" : "bg-muted/30")}
          >
            <span
              className={cn(
                "relative grid size-12 place-items-center rounded-full",
                earned ? "bg-brand/10 text-brand ring-4 ring-brand/5" : "bg-muted text-muted-foreground",
              )}
              aria-hidden
            >
              <Icon className="size-5" />
              {!earned ? (
                <span className="absolute -right-0.5 -bottom-0.5 grid size-5 place-items-center rounded-full border bg-background">
                  <Lock className="size-2.5" />
                </span>
              ) : null}
            </span>
            <span className={cn("text-sm font-medium", !earned && "text-muted-foreground")}>
              {badge.name}
              <span className="sr-only">{earned ? " (kazanıldı)" : " (kilitli)"}</span>
            </span>
            <span className="text-xs text-pretty text-muted-foreground">{badge.description}</span>
            {earned && badge.awardedAt ? (
              <time dateTime={badge.awardedAt.toISOString()} className="mt-auto text-[11px] text-muted-foreground">
                {formatDate(badge.awardedAt)}
              </time>
            ) : (
              <span className="mt-auto flex w-full flex-col gap-1">
                <span
                  role="progressbar"
                  aria-label={`${badge.name} ilerlemesi`}
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="h-1 w-full overflow-hidden rounded-full bg-muted"
                >
                  <span className="block h-full rounded-full bg-muted-foreground/40" style={{ width: `${pct}%` }} />
                </span>
                <span className="text-[11px] text-muted-foreground tabular-nums">%{pct}</span>
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
