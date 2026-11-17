import { CalendarPlus, Lock, Sparkles, UserRoundCheck, Video } from "lucide-react";
import { ProgressRing } from "@/components/ui/progress-ring";
import { cn } from "@/lib/utils";
import { PersonDrawerGrid, type DrawerSkin } from "./person-drawer";
import { initials, people, student } from "./showcase-data";

/**
 * Concept 3 · Tactile Glass Craft: frosted layers over a faint ambient field, a brand-coloured glow
 * in one corner of each card, micro glows on earned badges and the active card edge, pill buttons.
 */
const glass =
  "relative overflow-hidden rounded-2xl border border-zinc-200/60 bg-white/75 p-5 backdrop-blur-md transition-all duration-150 ease-out hover:border-brand/40 dark:border-zinc-800/60 dark:bg-zinc-900/60";
/** Corner ambient glow: a blurred brand spot behind the card's content. */
const Glow = ({ tone = "brand", corner = "tl" }: { tone?: "brand" | "magenta" | "cyan" | "amber"; corner?: "tl" | "br" }) => (
  <span
    className={cn(
      "pointer-events-none absolute size-40 rounded-full opacity-25 blur-3xl dark:opacity-30",
      corner === "tl" ? "-top-16 -left-16" : "-right-16 -bottom-16",
      { brand: "bg-brand", magenta: "bg-magenta", cyan: "bg-cyan", amber: "bg-amber" }[tone],
    )}
    aria-hidden
  />
);
const heading = "relative text-sm font-semibold tracking-tight";
const num = "font-mono tabular-nums tracking-tight";
const pill = "inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium transition-all duration-150 ease-out active:scale-[0.98]";

const skin: DrawerSkin = {
  grid: "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6",
  card: "flex flex-col items-center gap-2 rounded-2xl border border-zinc-200/60 bg-white/60 p-4 text-center backdrop-blur-md transition-all duration-150 ease-out hover:border-brand/50 hover:shadow-[0_0_0_4px_color-mix(in_oklab,var(--brand)_10%,transparent)] dark:border-zinc-800/60 dark:bg-zinc-900/50",
  avatar: "grid size-11 shrink-0 place-items-center rounded-full bg-brand/15 text-sm font-semibold text-brand-soft ring-1 ring-brand/30",
  name: "text-sm font-medium",
  sheet: "bg-white/85 backdrop-blur-xl dark:bg-zinc-900/80",
  field: "rounded-xl bg-zinc-100/70 p-3 dark:bg-zinc-800/50",
  input: "w-full resize-none rounded-xl border border-zinc-200/60 bg-white/70 px-3 py-2 text-sm outline-none focus-visible:border-brand/60 focus-visible:shadow-[0_0_0_4px_color-mix(in_oklab,var(--brand)_12%,transparent)] dark:border-zinc-800/60 dark:bg-zinc-900/60",
  send: cn(pill, "justify-center bg-brand text-primary-foreground disabled:opacity-50"),
};

export function GlassConcept() {
  const s = student;
  const earned = s.badges.filter((b) => b.earned).length;
  return (
    <div className="relative">
      {/* Ambient field behind the glass so the blur has something to frost. */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        <span className="absolute top-10 left-[10%] size-80 rounded-full bg-brand/15 blur-3xl" />
        <span className="absolute top-1/2 right-[5%] size-72 rounded-full bg-cyan/15 blur-3xl" />
        <span className="absolute bottom-0 left-1/3 size-64 rounded-full bg-magenta/10 blur-3xl" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section className={cn(glass, "border-brand/30 shadow-[0_0_0_1px_color-mix(in_oklab,var(--brand)_15%,transparent)] lg:col-span-8")} aria-label="Karşılama ve devam">
          <Glow />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
            <ProgressRing value={s.percent} size={120} strokeWidth={9} label="Devam oranı" />
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Tekrar hoş geldin, {s.firstName}</h2>
                <p className="text-sm text-muted-foreground">Bu hafta bir canlı eğitimin ve bir mentorluk seansın var.</p>
              </div>
              <dl className="flex flex-wrap gap-2">
                {[
                  ["Eğitim", `${s.attended}/${s.total}`],
                  ["Yoklama", s.rollCall],
                  ["Rozet", `${earned}/9`],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-baseline gap-2 rounded-full border border-zinc-200/60 bg-white/60 px-3 py-1 dark:border-zinc-800/60 dark:bg-zinc-900/50">
                    <dt className="text-xs text-subtle">{k}</dt>
                    <dd className={cn(num, "text-sm font-semibold")}>{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        <section className={cn(glass, "flex flex-col gap-4 lg:col-span-4")} aria-label="Sıradaki oturum">
          <Glow tone="cyan" corner="br" />
          <div className="relative flex items-center justify-between">
            <h2 className={heading}>Sıradaki canlı oturum</h2>
            <span className={cn(num, "rounded-full bg-brand/10 px-2.5 py-0.5 text-xs text-brand-soft ring-1 ring-brand/25")}>{s.next.countdown}</span>
          </div>
          <div className="relative flex flex-col gap-1">
            <p className="text-lg font-semibold tracking-tight">{s.next.title}</p>
            <p className={cn(num, "text-sm text-muted-foreground")}>
              {s.next.day} · {s.next.time}
            </p>
            <p className="text-sm text-muted-foreground">{s.next.instructor}</p>
          </div>
          <div className="relative mt-auto flex gap-2">
            <button type="button" className={cn(pill, "flex-1 justify-center bg-brand text-primary-foreground shadow-[0_0_20px_-6px_var(--brand)]")}>
              <Video className="size-4" aria-hidden /> Canlı sınıfa katıl
            </button>
            <button type="button" className={cn(pill, "border border-zinc-200/60 bg-white/60 px-3 dark:border-zinc-800/60 dark:bg-zinc-900/50")} aria-label="Takvime ekle">
              <CalendarPlus className="size-4" aria-hidden />
            </button>
          </div>
        </section>

        <section className={cn(glass, "flex flex-col gap-4 lg:col-span-5")} aria-label="Rozetler">
          <Glow tone="magenta" corner="br" />
          <h2 className={heading}>
            Rozet vitrini <span className={cn(num, "font-normal text-subtle")}>{earned}/9</span>
          </h2>
          <ul className="relative grid grid-cols-3 gap-x-3 gap-y-5">
            {s.badges.map((b) => (
              <li key={b.name} className="flex flex-col items-center gap-2 text-center">
                <span
                  className={cn(
                    "grid size-12 place-items-center rounded-full transition-all duration-150 ease-out hover:scale-105",
                    b.earned
                      ? b.tone === "amber"
                        ? "bg-amber/20 text-foreground ring-1 ring-amber/50 shadow-[0_0_18px_-2px_color-mix(in_oklab,var(--amber)_60%,transparent)]"
                        : "bg-brand/15 text-brand ring-1 ring-brand/40 shadow-[0_0_18px_-2px_color-mix(in_oklab,var(--brand)_55%,transparent)]"
                      : "bg-zinc-200/60 text-subtle dark:bg-zinc-800/60",
                  )}
                  aria-hidden
                >
                  {b.earned ? <Sparkles className="size-5" /> : <Lock className="size-4" />}
                </span>
                <span className={cn("line-clamp-2 text-[11px] leading-tight", b.earned ? "font-medium" : "text-subtle")}>{b.name}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className={cn(glass, "flex flex-col gap-4 lg:col-span-7")} aria-label="Ekip ve mentorluk">
          <Glow tone="amber" />
          <div className="relative flex items-center justify-between">
            <h2 className={heading}>{s.team.name}</h2>
            <span className="flex -space-x-2">
              {s.team.members.map((m) => (
                <span key={m} className={cn(skin.avatar, "size-8 text-xs ring-2 ring-white dark:ring-zinc-900")} aria-hidden>
                  {initials(m)}
                </span>
              ))}
            </span>
          </div>
          <p className="relative flex items-center gap-1.5 text-sm text-muted-foreground">
            <UserRoundCheck className="size-4" aria-hidden /> Temsilci <span className="font-medium text-foreground">{s.team.representative}</span>
          </p>
          <p className="relative line-clamp-2 text-sm text-muted-foreground">{s.team.problem}</p>
          <div className="relative flex items-center gap-3 rounded-2xl border border-amber/40 bg-amber/10 p-3 shadow-[0_0_0_4px_color-mix(in_oklab,var(--amber)_8%,transparent)]">
            <span className={cn(skin.avatar, "bg-amber/25 text-foreground ring-amber/50")} aria-hidden>
              {initials(s.team.session.mentor)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{s.team.session.mentor}</p>
              <p className={cn(num, "text-xs text-muted-foreground")}>
                {s.team.session.day} · {s.team.session.time}
              </p>
            </div>
            <span className={cn(num, "rounded-full bg-white/70 px-2.5 py-0.5 text-xs dark:bg-zinc-900/60")}>{s.team.session.countdown}</span>
          </div>
        </section>

        <section className={cn(glass, "flex flex-col gap-4 lg:col-span-12")} aria-label="Kişiler">
          <h2 className={heading}>Kişiler</h2>
          <div className="relative">
            <PersonDrawerGrid people={people} skin={skin} />
          </div>
        </section>
      </div>
    </div>
  );
}
