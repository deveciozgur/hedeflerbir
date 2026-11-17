import { Lock, Sparkles, UserRoundCheck, Video } from "lucide-react";
import { ProgressRing } from "@/components/ui/progress-ring";
import { cn } from "@/lib/utils";
import { PersonDrawerGrid, type DrawerSkin } from "./person-drawer";
import { initials, people, student } from "./showcase-data";

/**
 * Concept 1 · Linear Hyper-Dense: #FAFAFA / #09090B ground, sharp 1px zinc borders, no shadow,
 * 12px gutters, 13px labels, compact buttons with keyboard hints, a small teal ring.
 */
const panel = "rounded-lg border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-950 transition-all duration-150 ease-out hover:border-zinc-300 dark:hover:border-zinc-700";
const bar = "flex h-9 items-center justify-between border-b border-zinc-200/80 px-3 dark:border-zinc-800/80";
const label = "text-[13px] font-medium";
const num = "font-mono tabular-nums tracking-tight";
const kbd = "rounded border border-zinc-200 px-1 font-mono text-[10px] text-subtle dark:border-zinc-800";
const btn = "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-all duration-150 ease-out active:scale-[0.98]";

const skin: DrawerSkin = {
  grid: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
  card: "flex items-center gap-2 border-r border-b border-zinc-200/80 px-3 py-2.5 text-left transition-colors duration-150 hover:bg-zinc-100 dark:border-zinc-800/80 dark:hover:bg-zinc-900",
  avatar: "grid size-6 shrink-0 place-items-center rounded-full border border-zinc-200 font-mono text-[10px] font-medium dark:border-zinc-800",
  name: "truncate text-[13px]",
  sheet: "rounded-none border-l border-zinc-200/80 bg-white shadow-none dark:border-zinc-800/80 dark:bg-zinc-950",
  field: "border-l border-zinc-200 pl-3 dark:border-zinc-800",
  input: "w-full resize-none rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-brand dark:border-zinc-800",
  send: cn(btn, "h-8 justify-center self-end bg-brand text-primary-foreground disabled:opacity-50"),
};

export function LinearConcept() {
  const s = student;
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
      <section className={cn(panel, "lg:col-span-8")} aria-label="Karşılama ve devam">
        <div className={bar}>
          <h2 className={label}>Genel bakış</h2>
          <span className={cn(num, "text-[11px] text-subtle")}>Program · 2026 güz</span>
        </div>
        <div className="flex items-center gap-5 p-4">
          <ProgressRing value={s.percent} size={72} strokeWidth={6} label="Devam oranı" />
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <p className="text-[15px] font-semibold tracking-tight">Tekrar hoş geldin, {s.firstName}</p>
            <dl className="grid grid-cols-3 divide-x divide-zinc-200/80 rounded-md border border-zinc-200/80 dark:divide-zinc-800/80 dark:border-zinc-800/80">
              {[
                ["Katıldığın eğitim", `${s.attended}/${s.total}`],
                ["Yoklama", s.rollCall],
                ["Rozet", `${s.badges.filter((b) => b.earned).length}/9`],
              ].map(([k, v]) => (
                <div key={k} className="px-3 py-1.5">
                  <dt className="text-[11px] text-subtle">{k}</dt>
                  <dd className={cn(num, "text-sm font-semibold")}>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className={cn(panel, "flex flex-col lg:col-span-4")} aria-label="Sıradaki oturum">
        <div className={bar}>
          <h2 className={label}>Sıradaki oturum</h2>
          <span className={cn(num, "text-[11px] text-brand-soft")}>{s.next.countdown} kaldı</span>
        </div>
        <div className="flex flex-1 flex-col gap-1 p-3">
          <p className="text-[13px] font-semibold">{s.next.title}</p>
          <p className={cn(num, "text-[11px] text-subtle")}>
            {s.next.day} · {s.next.time}
          </p>
          <p className="text-[12px] text-muted-foreground">{s.next.instructor}</p>
          <div className="mt-auto flex items-center gap-2 pt-3">
            <button type="button" className={cn(btn, "bg-brand text-primary-foreground")}>
              <Video className="size-3.5" aria-hidden /> Canlı sınıfa katıl <span className="font-mono text-[10px] opacity-80">↵</span>
            </button>
            <span className="text-[11px] text-subtle">
              Takvim <kbd className={kbd}>C</kbd>
            </span>
          </div>
        </div>
      </section>

      <section className={cn(panel, "lg:col-span-5")} aria-label="Rozetler">
        <div className={bar}>
          <h2 className={label}>Rozetler</h2>
          <span className={cn(num, "text-[11px] text-subtle")}>{s.badges.filter((b) => b.earned).length}/9</span>
        </div>
        <ul className="grid grid-cols-3">
          {s.badges.map((b, i) => (
            <li key={b.name} className={cn("flex items-center gap-2 border-zinc-200/80 px-3 py-2 dark:border-zinc-800/80", i % 3 !== 2 && "border-r", i < 6 && "border-b")}>
              <span className={cn("size-1.5 shrink-0 rounded-full", b.earned ? (b.tone === "amber" ? "bg-amber" : "bg-brand") : "bg-zinc-300 dark:bg-zinc-700")} aria-hidden />
              <span className={cn("line-clamp-2 text-[11px] leading-tight", !b.earned && "text-subtle")}>{b.name}</span>
              {b.earned ? null : <Lock className="ml-auto size-3 shrink-0 text-subtle" aria-label="Kilitli" />}
            </li>
          ))}
        </ul>
      </section>

      <section className={cn(panel, "lg:col-span-7")} aria-label="Ekip ve mentorluk">
        <div className={bar}>
          <h2 className={label}>{s.team.name}</h2>
          <span className="flex -space-x-1">
            {s.team.members.map((m) => (
              <span key={m} className={cn(skin.avatar, "bg-white dark:bg-zinc-950")} aria-hidden>
                {initials(m)}
              </span>
            ))}
          </span>
        </div>
        <div className="grid gap-3 p-3 sm:grid-cols-[1fr_auto]">
          <div className="flex flex-col gap-1.5">
            <p className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <UserRoundCheck className="size-3.5" aria-hidden /> Temsilci <span className="text-foreground">{s.team.representative}</span>
            </p>
            <p className="line-clamp-2 text-[12px] text-muted-foreground">{s.team.problem}</p>
          </div>
          <div className="flex flex-col justify-center rounded-md border border-amber/60 px-3 py-2">
            <p className="flex items-center gap-1.5 text-[12px] font-medium">
              <Sparkles className="size-3 text-amber" aria-hidden /> {s.team.session.mentor}
            </p>
            <p className={cn(num, "text-[11px] text-subtle")}>
              {s.team.session.day} · {s.team.session.time}
            </p>
          </div>
        </div>
      </section>

      <section className={cn(panel, "overflow-hidden lg:col-span-12")} aria-label="Katılımcılar">
        <div className={bar}>
          <h2 className={label}>Kişiler</h2>
          <span className="text-[11px] text-subtle">
            Aç <kbd className={kbd}>↵</kbd>
          </span>
        </div>
        <PersonDrawerGrid people={people} skin={skin} />
      </section>
    </div>
  );
}
