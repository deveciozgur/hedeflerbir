import Link from "next/link";
import { Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BADGE_ICONS, type BadgeGridItem } from "./badge-grid";

/** Dashboard badge vitrine: a 3x3 grid, earned badges in colour with a soft glow, locked ones monochrome. */
export function BadgeShowcase({ badges, href = "/profile" }: { badges: BadgeGridItem[]; href?: string }) {
  const earned = badges.filter((b) => b.awardedAt).length;

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>
          Rozetler <span className="font-mono text-xs font-normal text-subtle tabular-nums">{earned}/{badges.length}</span>
        </CardTitle>
        <Link href={href} className="rounded-sm text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
          Tümü
        </Link>
      </CardHeader>
      <CardContent>
        <ul className="grid grid-cols-3 gap-x-2 gap-y-4">
          {badges.map((badge) => {
            const Icon = BADGE_ICONS[badge.icon];
            const isEarned = badge.awardedAt !== null;
            return (
              <li key={badge.code} className="flex flex-col items-center gap-1.5 text-center" title={badge.description}>
                <span
                  className={cn(
                    "relative grid size-11 place-items-center rounded-full transition-transform duration-200 hover:scale-105",
                    isEarned
                      ? "bg-brand/10 text-brand shadow-[0_0_0_4px_color-mix(in_oklab,var(--brand)_8%,transparent),0_0_18px_color-mix(in_oklab,var(--brand)_35%,transparent)]"
                      : "bg-muted text-muted-foreground opacity-60 grayscale",
                  )}
                  aria-hidden
                >
                  <Icon className="size-5" />
                  {!isEarned ? (
                    <span className="absolute -right-0.5 -bottom-0.5 grid size-4 place-items-center rounded-full border bg-background">
                      <Lock className="size-2" />
                    </span>
                  ) : null}
                </span>
                <span className={cn("line-clamp-2 text-[11px] leading-tight", isEarned ? "font-medium" : "text-muted-foreground")}>
                  {badge.name}
                  <span className="sr-only">{isEarned ? " (kazanıldı)" : " (kilitli)"}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
