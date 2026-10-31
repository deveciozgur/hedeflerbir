"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Loader2, Pencil, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { surfaceClass } from "@/components/ui/card";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createTeamAction, deleteTeamAction, updateTeamAction } from "../application/teams.actions";
import type { TeamRow } from "../application/teams.queries";

function TeamDialog({ team, trigger }: { team?: TeamRow; trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(team?.name ?? "");
  const [focusArea, setFocusArea] = useState(team?.focusArea ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const save = () =>
    startTransition(async () => {
      const result = team ? await updateTeamAction(team.id, { name, focusArea }) : await createTeamAction({ name, focusArea });
      if (!result.ok) {
        setError(result.fieldErrors?.name?.[0] ?? result.error);
        return;
      }
      toast.success(team ? "Takım güncellendi" : "Takım oluşturuldu");
      setOpen(false);
    });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setName(team?.name ?? "");
          setFocusArea(team?.focusArea ?? "");
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{team ? "Takımı düzenle" : "Yeni takım"}</DialogTitle>
          <DialogDescription>Üyeleri katılımcı kartlarından takıma ekleyebilirsin.</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="team-name">Takım adı</Label>
            <Input id="team-name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? "team-name-error" : undefined} />
            {error ? (
              <p id="team-name-error" className="text-xs text-destructive">
                {error}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="team-focus">Çalışma / odak alanı</Label>
            <Textarea id="team-focus" rows={2} value={focusArea} onChange={(e) => setFocusArea(e.target.value)} placeholder="Örn. Sosyal etki odaklı eğitim teknolojisi" />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={pending}>
                Vazgeç
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending || name.trim().length < 2}>
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
              Kaydet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TeamManager({ teams }: { teams: TeamRow[] }) {
  return (
    <section aria-labelledby="teams-heading" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 id="teams-heading" className="text-lg font-semibold tracking-tight">
          Takımlar <span className="font-mono text-sm font-normal text-subtle tabular-nums">{teams.length}</span>
        </h2>
        <TeamDialog
          trigger={
            <Button variant="outline" size="sm">
              <Plus aria-hidden /> Takım
            </Button>
          }
        />
      </div>
      {teams.length === 0 ? (
        <p className="text-sm text-muted-foreground">Henüz takım yok. Mentorluk seansları takımlar için planlanır.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {teams.map((team) => (
            <li key={team.id} className={cn(surfaceClass, "flex flex-col gap-2 p-4")}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{team.name}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{team.focusArea ?? "Çalışma alanı belirtilmedi"}</p>
                </div>
                <div className="flex shrink-0">
                  <TeamDialog
                    team={team}
                    trigger={
                      <Button variant="ghost" size="icon" className="size-8" aria-label={`${team.name} takımını düzenle`}>
                        <Pencil />
                      </Button>
                    }
                  />
                  <ConfirmActionButton
                    variant="ghost"
                    label={
                      <>
                        <Trash2 aria-hidden />
                        <span className="sr-only">{team.name} takımını sil</span>
                      </>
                    }
                    title="Takım silinsin mi?"
                    description={`"${team.name}" silinecek; üyeler takımsız kalır, geçmiş seanslar korunur.`}
                    confirmLabel="Takımı sil"
                    successMessage="Takım silindi"
                    destructive
                    action={() => deleteTeamAction(team.id)}
                  />
                </div>
              </div>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="size-3.5" aria-hidden />
                <span className="font-mono tabular-nums">{team.memberCount}</span> üye ·<span className="font-mono tabular-nums">{team.completedSessions}</span> tamamlanan seans
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
