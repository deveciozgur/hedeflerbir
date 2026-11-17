import { ChevronDown, Lock, Radio, Sparkles, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { PersonDrawerGrid, type DrawerSkin } from "./person-drawer";
import { initials, people, student } from "./showcase-data";

/**
 * Concept 6 · Zaman Ekseni: the screen is organised along time instead of a bento. A vertical spine on
 * the left carries "now", the live session and the mentoring session; each node opens in place
 * (native <details>, keyboard-ready). A sticky side column holds the ring, badges and people.
 */
const num = "font-mono tabular-nums tracking-tight";
const node = "relative pl-10 before:absolute before:top-0 before:bottom-0 before:left-[11px] before:w-px before:bg-border";
const dot = (tone: string) => cn("absolute top-1.5 left-0 grid size-6 place-items-center rounded-full ring-4 ring-background", tone);

const skin: DrawerSkin = {
  grid: "flex flex-col",
  card: "group flex items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors duration-150 hover:bg-accent",
  avatar: "grid size-8 shrink-0 place-items-center rounded-full bg-brand/10 text-xs font-semibold text-brand-soft transition-transform duration-150 group-hover:scale-110",
  name: "text-sm font-medium",
  sheet: "max-w-md",
  field: "rounded-lg bg-muted/60 p-3",
  input: "w-full resize-none rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
  send: "inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-primary-foreground transition-transform duration-150 active:scale-[0.98] disabled:opacity-50",
};

function Summary({ title, meta, tone }: { title: string; meta: string; tone: string }) {
  return (
    <summary className="flex cursor-pointer list-none items-start justify-between gap-4 rounded-lg p-3 outline-none transition-colors duration-150 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
      <span className="flex flex-col gap-0.5">
        <span className={cn("text-xs font-medium", tone)}>{meta}</span>
        <span className="text-base font-semibold tracking-tight">{title}</span>
      </span>
      <ChevronDown className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" aria-hidden />
    </summary>
  );
}

export function AgendaConcept() {
  const s = student;
  const earned = s.badges.filter((b) => b.earned).length;
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section aria-label="Zaman ekseni" className="flex flex-col">
        <div className={cn(node, "pb-8")}>
          <span className={dot("bg-foreground text-background")} aria-hidden>
            <span className="size-2 rounded-full bg-background" />
          </span>
          <p className="text-xs text-muted-foreground">Şimdi · Pazartesi, 3 Kasım</p>
          <h2 className="text-2xl font-semibold tracking-tight">Tekrar hoş geldin, {s.firstName}</h2>
          <p className="text-sm text-muted-foreground">Bu hafta bir canlı eğitimin ve ekibinin bir mentorluk seansı var.</p>
        </div>

        <details className={cn(node, "group pb-6")} open>
          <span className={dot("bg-brand text-primary-foreground")} aria-hidden>
            <Radio className="size-3" />
          </span>
          <Summary title={s.next.title} meta={`Canlı eğitim · ${s.next.countdown} sonra`} tone="text-brand-soft" />
          <div className="ml-3 flex flex-col gap-4 border-l-2 border-brand/40 py-2 pl-4">
            <p className={cn(num, "text-sm")}>
              {s.next.day} · {s.next.time} · {s.next.instructor}
            </p>
            <ul className="flex flex-wrap gap-2">
              {s.next.topics.map((t) => (
                <li key={t} className="rounded-md bg-muted px-2 py-1 text-xs">
                  {t}
                </li>
              ))}
            </ul>
            <button type="button" className="inline-flex h-9 w-fit items-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-primary-foreground transition-transform duration-150 active:scale-[0.98]">
              <Video className="size-4" aria-hidden /> Canlı sınıfa katıl
            </button>
          </div>
        </details>

        <details className={cn(node, "group pb-6")}>
          <span className={dot("bg-amber text-foreground")} aria-hidden>
            <Sparkles className="size-3" />
          </span>
          <Summary title={`${s.team.name} · ${s.team.session.mentor}`} meta={`Onaylı mentorluk · ${s.team.session.countdown} sonra`} tone="text-warning" />
          <div className="ml-3 flex flex-col gap-3 border-l-2 border-amber/60 py-2 pl-4">
            <p className={cn(num, "text-sm")}>
              {s.team.session.day} · {s.team.session.time}
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Temsilci:</span> {s.team.representative}
            </p>
            <p className="max-w-[60ch] text-sm leading-relaxed text-muted-foreground">{s.team.problem}</p>
            <div className="flex -space-x-2">
              {s.team.members.map((m) => (
                <span key={m} className={cn(skin.avatar, "ring-2 ring-background")} aria-hidden>
                  {initials(m)}
                </span>
              ))}
            </div>
          </div>
        </details>

        <div className={cn(node, "pb-2 before:bottom-auto before:h-4 before:bg-gradient-to-b before:from-border before:to-transparent")}>
          <span className={dot("border-2 border-dashed border-border bg-background")} aria-hidden />
          <p className="pt-1 text-sm text-muted-foreground">
            Sonra: Girişimcilik · <span className={num}>12 Kasım, 19:00</span>
          </p>
        </div>
      </section>

      <aside className="flex flex-col gap-8 lg:sticky lg:top-24 lg:self-start" aria-label="Özet">
        <section aria-label="Devam" className="flex items-center gap-4">
          <div
            className="grid size-20 shrink-0 place-items-center rounded-full"
            style={{ background: `conic-gradient(var(--brand) ${s.percent * 3.6}deg, var(--track) 0)` }}
            role="img"
            aria-label={`Devam oranı yüzde ${s.percent}`}
          >
            <span className={cn(num, "grid size-16 place-items-center rounded-full bg-background text-lg font-semibold")}>%{s.percent}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            <span className={cn(num, "text-foreground")}>{s.attended}/{s.total}</span> eğitime katıldın · yoklama <span className={num}>{s.rollCall}</span>
          </p>
        </section>

        <section aria-label="Rozetler" className="flex flex-col gap-3">
          <h2 className="flex items-baseline justify-between text-sm font-semibold">
            Rozetler <span className={cn(num, "text-xs font-normal text-muted-foreground")}>{earned}/9</span>
          </h2>
          <ul className="grid grid-cols-9 gap-1.5">
            {s.badges.map((b) => (
              <li key={b.name} className="group relative">
                <span
                  tabIndex={0}
                  className={cn(
                    "grid aspect-square place-items-center rounded-md outline-none transition-transform duration-150 hover:scale-125 focus-visible:scale-125 focus-visible:ring-2 focus-visible:ring-ring",
                    b.earned ? (b.tone === "amber" ? "bg-amber text-foreground" : "bg-brand text-primary-foreground") : "bg-muted text-subtle",
                  )}
                  aria-label={`${b.name}: ${b.earned ? "kazanıldı" : "kilitli"}`}
                >
                  {b.earned ? <Sparkles className="size-3" aria-hidden /> : <Lock className="size-2.5" aria-hidden />}
                </span>
                <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-max max-w-40 -translate-x-1/2 rounded-md bg-foreground px-2 py-1 text-[11px] text-background opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100" aria-hidden>
                  {b.name}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Kişiler" className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold">Kişiler</h2>
          <PersonDrawerGrid people={people} skin={skin} />
        </section>
      </aside>
    </div>
  );
}
