"use client";

import { useOptimistic, useTransition } from "react";
import { Award, Check } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";
import { BADGES } from "@/modules/engagement/domain/badges";
import { assignTeamAction, setBadgeAction } from "../application/teams.actions";

interface ParticipantAdminPanelProps {
  userId: string;
  teamId: string | null;
  teams: Array<{ id: string; name: string }>;
  badgeCodes: string[];
}

/** Admin controls inside a participant's detail modal: team membership and manual badge awards. */
export function ParticipantAdminPanel({ userId, teamId, teams, badgeCodes }: ParticipantAdminPanelProps) {
  const [pending, startTransition] = useTransition();
  const [team, setOptimisticTeam] = useOptimistic(teamId ?? "");
  const [held, toggleOptimistic] = useOptimistic(new Set(badgeCodes), (current: Set<string>, code: string) => {
    const next = new Set(current);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    return next;
  });

  const changeTeam = (value: string) =>
    startTransition(async () => {
      setOptimisticTeam(value);
      const result = await assignTeamAction({ userId, teamId: value || null });
      if (!result.ok) toast.error(result.error);
      else toast.success(value ? "Takım güncellendi" : "Takımdan çıkarıldı");
    });

  const toggleBadge = (code: string) =>
    startTransition(async () => {
      const awarded = !held.has(code);
      toggleOptimistic(code);
      const result = await setBadgeAction({ userId, code, awarded });
      if (!result.ok) toast.error(result.error);
    });

  return (
    <section aria-label="Yönetici işlemleri" className="flex flex-col gap-4 border-t border-border pt-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`team-${userId}`}>Takım</Label>
        <NativeSelect id={`team-${userId}`} value={team} onChange={(e) => changeTeam(e.target.value)} disabled={pending}>
          <option value="">Takımsız</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </NativeSelect>
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 flex items-center gap-1.5 text-sm font-medium">
          <Award className="size-4 text-muted-foreground" aria-hidden /> Rozetler
        </legend>
        <p className="text-xs text-muted-foreground">Çoğu rozet yoklama ve tamamlanan seanslarla otomatik gelir; buradan elle de verebilirsin.</p>
        <div className="flex flex-wrap gap-1.5">
          {BADGES.map((badge) => {
            const on = held.has(badge.code);
            return (
              <button
                key={badge.code}
                type="button"
                aria-pressed={on}
                disabled={pending}
                onClick={() => toggleBadge(badge.code)}
                className={cn(
                  "inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60",
                  on ? "border-brand/50 bg-brand/10 text-brand-soft" : "border-border text-muted-foreground hover:bg-accent",
                )}
              >
                {on ? <Check className="size-3" aria-hidden /> : null}
                {badge.name}
              </button>
            );
          })}
        </div>
      </fieldset>
    </section>
  );
}
