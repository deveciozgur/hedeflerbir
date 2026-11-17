import { ArrowRight, CalendarPlus, Lock, Sparkles, Video } from "lucide-react";
import { ProgressRing } from "@/components/ui/progress-ring";
import { cn } from "@/lib/utils";
import { PersonDrawerGrid, type DrawerSkin } from "./person-drawer";
import { initials, people, student } from "./showcase-data";

/**
 * Concept 2 · Vercel Pure Minimal: generous negative space (p-6, gap-6), pure white cards with a wide,
 * very soft micro shadow, big figures, calm outline actions and a plain vertical timeline.
 */
const card =
  "rounded-xl border border-zinc-200/70 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-150 ease-out hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-none dark:hover:border-zinc-700";
const heading = "text-sm font-medium text-muted-foreground";
const num = "font-mono tabular-nums tracking-tight";
const btnOutline =
  "inline-flex h-9 items-center gap-2 rounded-md border border-zinc-200 px-3.5 text-sm font-medium transition-all duration-150 ease-out hover:bg-zinc-50 active:scale-[0.98] dark:border-zinc-800 dark:hover:bg-zinc-900";
const btnPrimary = "inline-flex h-9 items-center gap-2 rounded-md bg-foreground px-3.5 text-sm font-medium text-background transition-all duration-150 ease-out active:scale-[0.98]";

const skin: DrawerSkin = {
  grid: "grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6",
  card: "flex flex-col items-center gap-3 rounded-xl border border-transparent p-4 text-center transition-all duration-150 ease-out hover:border-zinc-200 hover:bg-zinc-50 dark:hover:border-zinc-800 dark:hover:bg-zinc-900",
  avatar: "grid size-12 shrink-0 place-items-center rounded-full bg-zinc-100 text-sm font-medium dark:bg-zinc-800",
  name: "text-sm font-medium",
  sheet: "max-w-md gap-8 p-8",
  field: "",
  input: "w-full resize-none rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-zinc-800",
  send: cn(btnPrimary, "justify-center disabled:opacity-40"),
};

export function VercelConcept() {
  const s = student;
  const earned = s.badges.filter((b) => b.earned).length;
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <section className={cn(card, "lg:col-span-8")} aria-label="Karşılama ve devam">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center">
          <ProgressRing value={s.percent} size={128} strokeWidth={7} label="Devam oranı" />
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold tracking-tight">Tekrar hoş geldin, {s.firstName}</h2>
              <p className="text-sm text-muted-foreground">Programın üçte ikisine katıldın.</p>
            </div>
            <dl className="flex gap-10">
              {[
                ["Katıldığın eğitim", `${s.attended}/${s.total}`],
                ["Yoklama", s.rollCall],
                ["Rozet", `${earned}/9`],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-col gap-1">
                  <dt className="text-xs text-subtle">{k}</dt>
                  <dd className={cn(num, "text-3xl font-semibold")}>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className={cn(card, "flex flex-col gap-6 lg:col-span-4")} aria-label="Sıradaki oturum">
        <div className="flex items-baseline justify-between">
          <h2 className={heading}>Sıradaki canlı oturum</h2>
          <span className={cn(num, "text-sm text-brand-soft")}>{s.next.countdown}</span>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-lg font-semibold tracking-tight">{s.next.title}</p>
          <p className={cn(num, "text-sm text-muted-foreground")}>
            {s.next.day} · {s.next.time}
          </p>
          <p className="text-sm text-muted-foreground">{s.next.instructor}</p>
        </div>
        <div className="mt-auto flex gap-2">
          <button type="button" className={btnPrimary}>
            <Video className="size-4" aria-hidden /> Canlı sınıfa katıl
          </button>
          <button type="button" className={btnOutline} aria-label="Takvime ekle">
            <CalendarPlus className="size-4" aria-hidden />
          </button>
        </div>
      </section>

      <section className={cn(card, "flex flex-col gap-6 lg:col-span-5")} aria-label="Rozetler">
        <div className="flex items-baseline justify-between">
          <h2 className={heading}>Rozetler</h2>
          <span className={cn(num, "text-sm text-subtle")}>{earned}/9</span>
        </div>
        <ul className="grid grid-cols-3 gap-x-4 gap-y-6">
          {s.badges.map((b) => (
            <li key={b.name} className="flex flex-col items-center gap-2 text-center">
              <span
                className={cn(
                  "grid size-11 place-items-center rounded-full border transition-all duration-150 ease-out",
                  b.earned
                    ? b.tone === "amber"
                      ? "border-amber/60 text-foreground shadow-[0_0_0_3px_color-mix(in_oklab,var(--amber)_15%,transparent)]"
                      : "border-brand/50 text-brand shadow-[0_0_0_3px_color-mix(in_oklab,var(--brand)_12%,transparent)]"
                    : "border-zinc-200 text-subtle dark:border-zinc-800",
                )}
                aria-hidden
              >
                {b.earned ? <Sparkles className="size-4" /> : <Lock className="size-3.5" />}
              </span>
              <span className={cn("line-clamp-2 text-xs leading-tight", !b.earned && "text-subtle")}>{b.name}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={cn(card, "flex flex-col gap-6 lg:col-span-7")} aria-label="Ekip ve mentorluk">
        <div className="flex items-baseline justify-between">
          <h2 className={heading}>{s.team.name}</h2>
          <span className="text-sm text-muted-foreground">Temsilci: {s.team.representative}</span>
        </div>
        <p className="max-w-[60ch] text-sm leading-relaxed">{s.team.problem}</p>
        <ol className="flex flex-col gap-0 border-l border-zinc-200 pl-5 dark:border-zinc-800">
          <li className="relative pb-5">
            <span className="absolute top-1.5 -left-[1.6rem] size-2.5 rounded-full border-2 border-white bg-zinc-300 dark:border-zinc-950 dark:bg-zinc-700" aria-hidden />
            <p className="text-sm">Ekip kuruldu</p>
            <p className={cn(num, "text-xs text-subtle")}>{s.team.members.length} üye · {s.team.members.map(initials).join(" ")}</p>
          </li>
          <li className="relative">
            <span className="absolute top-1.5 -left-[1.6rem] size-2.5 rounded-full border-2 border-white bg-amber dark:border-zinc-950" aria-hidden />
            <p className="text-sm font-medium">Mentorluk · {s.team.session.mentor}</p>
            <p className={cn(num, "text-xs text-subtle")}>
              {s.team.session.day} · {s.team.session.time} · {s.team.session.countdown} sonra
            </p>
          </li>
        </ol>
        <button type="button" className={cn(btnOutline, "mt-auto w-fit")}>
          Ekibim <ArrowRight className="size-4" aria-hidden />
        </button>
      </section>

      <section className={cn(card, "flex flex-col gap-6 lg:col-span-12")} aria-label="Kişiler">
        <h2 className={heading}>Kişiler</h2>
        <PersonDrawerGrid people={people} skin={skin} />
      </section>
    </div>
  );
}
