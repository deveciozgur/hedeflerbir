"use client";

import { useId, useMemo, useState, useTransition, type ReactNode } from "react";
import { Loader2, Pencil, Plus, Search, Target, Trash2, UserRoundCheck, Users, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { surfaceClass } from "@/components/ui/card";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { cn, fullName } from "@/lib/utils";
import { deleteTeamAction, saveTeamAction } from "../application/teams.actions";
import type { TeamCandidate, TeamRow } from "../application/teams.queries";
import { PersonAvatar } from "./person-card-grid";

const normalize = (text: string) => text.toLocaleLowerCase("tr");

type FieldErrors = Partial<Record<"name" | "focusArea" | "memberIds" | "representativeId", string>>;

function TeamDialog({ team, candidates, teamNames, trigger }: { team?: TeamRow; candidates: TeamCandidate[]; teamNames: Map<string, string>; trigger: ReactNode }) {
  const ids = useId();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [focusArea, setFocusArea] = useState("");
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [representativeId, setRepresentativeId] = useState("");
  const [query, setQuery] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, startTransition] = useTransition();

  const reset = () => {
    setName(team?.name ?? "");
    setFocusArea(team?.focusArea ?? "");
    setMemberIds(team?.members.map((m) => m.id) ?? []);
    setRepresentativeId(team?.representativeId ?? "");
    setQuery("");
    setErrors({});
  };

  const visible = useMemo(() => {
    const q = normalize(query.trim());
    return q ? candidates.filter((c) => normalize(fullName(c)).includes(q)) : candidates;
  }, [candidates, query]);
  const selected = candidates.filter((c) => memberIds.includes(c.id));

  const toggle = (id: string) =>
    setMemberIds((current) => {
      const next = current.includes(id) ? current.filter((m) => m !== id) : [...current, id];
      if (!next.includes(representativeId)) setRepresentativeId("");
      return next;
    });

  const save = () =>
    startTransition(async () => {
      const result = await saveTeamAction(team?.id ?? null, { name, focusArea, memberIds, representativeId });
      if (!result.ok) {
        const fe = result.fieldErrors ?? {};
        setErrors({ name: fe.name?.[0], focusArea: fe.focusArea?.[0], memberIds: fe.memberIds?.[0], representativeId: fe.representativeId?.[0] });
        toast.error(result.error);
        return;
      }
      toast.success(team ? "Ekip güncellendi" : "Ekip oluşturuldu");
      setOpen(false);
    });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) reset();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{team ? "Ekibi düzenle" : "Yeni ekip"}</DialogTitle>
          <DialogDescription>Kaydettiğin bilgiler üyelerin Ekibim sayfasına yansır; katılımcılar düzenleyemez.</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <FormField id={`${ids}-name`} label="Ekip adı" error={errors.name}>
            <Input id={`${ids}-name`} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} aria-invalid={Boolean(errors.name)} />
          </FormField>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">
              Ekip üyeleri <span className="font-mono text-xs font-normal text-subtle tabular-nums">{memberIds.length} seçili</span>
            </legend>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Katılımcı ara" aria-label="Katılımcı ara" className="pl-9" />
            </div>
            <ul className="max-h-56 divide-y divide-border overflow-y-auto rounded-lg border border-border">
              {visible.length === 0 ? <li className="px-3 py-4 text-center text-sm text-muted-foreground">Eşleşen katılımcı yok.</li> : null}
              {visible.map((c) => {
                const otherTeam = c.teamId && c.teamId !== team?.id ? teamNames.get(c.teamId) : null;
                return (
                  <li key={c.id}>
                    <label className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-accent">
                      <input type="checkbox" checked={memberIds.includes(c.id)} onChange={() => toggle(c.id)} aria-label={fullName(c)} className="size-4 accent-[var(--brand)]" />
                      <PersonAvatar person={c} className="size-7" />
                      <span className="min-w-0 flex-1 truncate text-sm">{fullName(c)}</span>
                      {otherTeam ? <span className="shrink-0 text-xs text-subtle">{otherTeam}</span> : null}
                    </label>
                  </li>
                );
              })}
            </ul>
            <p className={cn("text-xs", errors.memberIds ? "text-destructive" : "text-muted-foreground")}>
              {errors.memberIds ?? "Başka bir ekipteki katılımcıyı seçersen bu ekibe taşınır."}
            </p>
          </fieldset>

          <FormField
            id={`${ids}-rep`}
            label="Ekip temsilcisi"
            error={errors.representativeId}
            hint="Lider değildir; mentorlerle randevuların kurulmasını kolaylaştıran kişidir."
          >
            <NativeSelect id={`${ids}-rep`} value={representativeId} onChange={(e) => setRepresentativeId(e.target.value)} disabled={selected.length === 0}>
              <option value="">{selected.length === 0 ? "Önce üye seçin" : "Üyelerden birini seçin"}</option>
              {selected.map((m) => (
                <option key={m.id} value={m.id}>
                  {fullName(m)}
                </option>
              ))}
            </NativeSelect>
          </FormField>

          <FormField id={`${ids}-problem`} label="Projede çözmek istediğiniz sorun" error={errors.focusArea}>
            <Textarea id={`${ids}-problem`} rows={4} value={focusArea} onChange={(e) => setFocusArea(e.target.value)} maxLength={2000} />
          </FormField>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={pending}>
                Vazgeç
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending || name.trim().length < 2 || memberIds.length === 0 || !representativeId}>
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
              Kaydet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** "Yeni ekip kur" anywhere in the admin area (e.g. the home dock) opens the same create dialog. */
export function NewTeamButton({ teams, candidates, variant = "outline" }: { teams: Array<{ id: string; name: string }>; candidates: TeamCandidate[]; variant?: "outline" | "default" }) {
  return (
    <TeamDialog
      candidates={candidates}
      teamNames={new Map(teams.map((t) => [t.id, t.name]))}
      trigger={
        <Button variant={variant}>
          <UsersRound aria-hidden /> Yeni ekip kur
        </Button>
      }
    />
  );
}

/** Admin's team management: cards with members, representative and problem statement; create/edit/delete. */
export function TeamManager({ teams, candidates }: { teams: TeamRow[]; candidates: TeamCandidate[] }) {
  const teamNames = new Map(teams.map((t) => [t.id, t.name]));

  return (
    <section aria-labelledby="teams-heading" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 id="teams-heading" className="text-lg font-semibold tracking-tight">
          Ekipler <span className="font-mono text-sm font-normal text-subtle tabular-nums">{teams.length}</span>
        </h2>
        <TeamDialog
          candidates={candidates}
          teamNames={teamNames}
          trigger={
            <Button>
              <Plus aria-hidden /> Yeni ekip
            </Button>
          }
        />
      </div>
      {teams.length === 0 ? (
        <EmptyState icon={Users} title="Henüz ekip yok" description="Yeni ekip oluşturup katılımcıları ve ekip temsilcisini seç. Mentorluk seansları ekipler için planlanır." />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {teams.map((team) => {
            const representative = team.members.find((m) => m.id === team.representativeId) ?? null;
            return (
              <li key={team.id} className={cn(surfaceClass, "flex flex-col gap-4 p-5")}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{team.name}</p>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="size-3.5" aria-hidden />
                      <span className="font-mono tabular-nums">{team.members.length}</span> üye ·<span className="font-mono tabular-nums">{team.completedSessions}</span> tamamlanan seans
                    </p>
                  </div>
                  <div className="flex shrink-0">
                    <TeamDialog
                      team={team}
                      candidates={candidates}
                      teamNames={teamNames}
                      trigger={
                        <Button variant="ghost" size="icon" className="size-8" aria-label={`${team.name} ekibini düzenle`}>
                          <Pencil />
                        </Button>
                      }
                    />
                    <ConfirmActionButton
                      variant="ghost"
                      label={
                        <>
                          <Trash2 aria-hidden />
                          <span className="sr-only">{team.name} ekibini sil</span>
                        </>
                      }
                      title="Ekip silinsin mi?"
                      description={`"${team.name}" silinecek; üyeler ekipsiz kalır, geçmiş seanslar korunur.`}
                      confirmLabel="Ekibi sil"
                      successMessage="Ekip silindi"
                      destructive
                      action={deleteTeamAction.bind(null, team.id)}
                    />
                  </div>
                </div>

                <p className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                  <Target className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span className="line-clamp-3">{team.focusArea ?? "Çözülecek sorun henüz eklenmedi."}</span>
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-4">
                  <ul className="flex -space-x-2" aria-label="Ekip üyeleri">
                    {team.members.slice(0, 8).map((m) => (
                      <li key={m.id} title={fullName(m)}>
                        <PersonAvatar person={m} className="size-8 ring-2 ring-background" />
                      </li>
                    ))}
                  </ul>
                  <p className="flex items-center gap-1.5 text-sm">
                    <UserRoundCheck className="size-4 text-muted-foreground" aria-hidden />
                    {representative ? (
                      <>
                        {fullName(representative)} <Badge variant="secondary">Temsilci</Badge>
                      </>
                    ) : (
                      <span className="text-muted-foreground">Temsilci seçilmedi</span>
                    )}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
