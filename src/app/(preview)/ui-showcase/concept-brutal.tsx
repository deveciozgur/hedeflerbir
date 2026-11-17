import { Lock, Stamp, Ticket, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { PersonDrawerGrid, type DrawerSkin } from "./person-drawer";
import { initials, people, student } from "./showcase-data";

/**
 * Concept 5 · Neo-Brutal Bilet: 2px ink borders, hard 4px offset shadows, whole fields of the brand's
 * accents, an irregular grid of tall and short blocks. The live session is a ticket with a tear line,
 * badges are rubber stamps. Pressing a block pushes it into its shadow.
 */
const block =
  "border-2 border-foreground bg-card shadow-[4px_4px_0_var(--foreground)] transition-[translate,box-shadow] duration-100 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--foreground)]";
const press = "active:translate-x-1 active:translate-y-1 active:shadow-none";
const num = "font-mono tabular-nums tracking-tight";
const tag = "inline-flex items-center gap-1.5 border-2 border-foreground px-2 py-0.5 text-xs font-bold uppercase";

const skin: DrawerSkin = {
  grid: "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6",
  card: cn(block, press, "flex flex-col items-center gap-2 p-4 text-center"),
  avatar: "grid size-12 shrink-0 place-items-center border-2 border-foreground bg-cyan font-mono text-sm font-bold text-foreground",
  name: "text-sm font-bold",
  sheet: "rounded-none border-l-4 border-foreground shadow-none",
  field: "border-2 border-foreground p-3",
  input: "w-full resize-none border-2 border-foreground bg-transparent px-3 py-2 text-sm outline-none focus-visible:bg-amber/15",
  send: cn("inline-flex h-11 items-center justify-center gap-2 border-2 border-foreground bg-amber px-4 text-sm font-bold text-foreground shadow-[3px_3px_0_var(--foreground)] disabled:opacity-50", press),
};

export function BrutalConcept() {
  const s = student;
  const earned = s.badges.filter((b) => b.earned).length;
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:grid-rows-[auto_auto]">
      <section aria-label="Karşılama ve devam" className={cn(block, "flex flex-col justify-between gap-6 bg-amber p-6 text-foreground lg:col-span-4 lg:row-span-2")}>
        <div>
          <p className="text-sm font-bold">Selam {s.firstName}!</p>
          <h2 className="text-3xl leading-none font-black tracking-tight">Devam karnen</h2>
        </div>
        <div className="relative mx-auto grid size-44 place-items-center rounded-full border-4 border-foreground bg-card">
          {/* Stepped ring: one segment per training, filled when attended. */}
          <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden>
            {Array.from({ length: s.total }, (_, i) => {
              const seg = 360 / s.total;
              const start = (i * seg + 3) * (Math.PI / 180);
              const end = ((i + 1) * seg - 3) * (Math.PI / 180);
              const r = 42;
              const d = `M ${50 + r * Math.cos(start)} ${50 + r * Math.sin(start)} A ${r} ${r} 0 0 1 ${50 + r * Math.cos(end)} ${50 + r * Math.sin(end)}`;
              return <path key={i} d={d} fill="none" strokeWidth="9" strokeLinecap="butt" className={i < s.attended ? "stroke-brand" : "stroke-foreground/15"} />;
            })}
          </svg>
          <p className={cn(num, "text-5xl font-black")} aria-label={`Devam oranı yüzde ${s.percent}`}>
            %{s.percent}
          </p>
        </div>
        <dl className="grid grid-cols-3 border-2 border-foreground bg-card">
          {[
            ["Eğitim", `${s.attended}/${s.total}`],
            ["Yoklama", s.rollCall],
            ["Rozet", `${earned}/9`],
          ].map(([k, v], i) => (
            <div key={k} className={cn("p-2 text-center", i < 2 && "border-r-2 border-foreground")}>
              <dd className={cn(num, "text-xl font-black")}>{v}</dd>
              <dt className="text-[11px] font-bold">{k}</dt>
            </div>
          ))}
        </dl>
      </section>

      <section aria-label="Sıradaki oturum" className={cn(block, "relative flex overflow-hidden lg:col-span-8")}>
        <div className="flex flex-1 flex-col gap-3 p-6">
          <span className={cn(tag, "w-fit bg-cyan text-foreground")}>
            <Ticket className="size-3.5" aria-hidden /> Canlı oturum bileti
          </span>
          <h2 className="text-3xl leading-none font-black tracking-tight sm:text-4xl">{s.next.title}</h2>
          <p className="text-sm font-medium">
            {s.next.instructor} · {s.next.topics.join(" / ")}
          </p>
          <button type="button" className={cn("mt-auto inline-flex h-11 w-fit items-center gap-2 border-2 border-foreground bg-brand px-5 text-sm font-bold text-primary-foreground shadow-[3px_3px_0_var(--foreground)]", press)}>
            <Video className="size-4" aria-hidden /> Canlı sınıfa katıl
          </button>
        </div>
        {/* Tear line with punched notches. */}
        <div className="relative w-0 border-l-2 border-dashed border-foreground" aria-hidden>
          <span className="absolute -top-3 -left-3 size-6 rounded-full border-2 border-foreground bg-background" />
          <span className="absolute -bottom-3 -left-3 size-6 rounded-full border-2 border-foreground bg-background" />
        </div>
        <div className="flex w-40 shrink-0 flex-col items-center justify-center gap-1 bg-foreground p-4 text-center text-background sm:w-48">
          <p className="text-xs font-bold uppercase opacity-80">Kalan</p>
          <p className={cn(num, "text-2xl leading-tight font-black")}>{s.next.countdown}</p>
          <p className="text-xs font-bold">{s.next.day}</p>
          <p className={cn(num, "text-xs")}>{s.next.time}</p>
        </div>
      </section>

      <section aria-label="Rozetler" className={cn(block, "flex flex-col gap-4 p-6 lg:col-span-5")}>
        <h2 className="flex items-center justify-between text-xl font-black">
          Damga koleksiyonu <span className={cn(num, "text-sm")}>{earned}/9</span>
        </h2>
        <ul className="grid grid-cols-3 gap-3">
          {s.badges.map((b, i) => (
            <li
              key={b.name}
              className={cn(
                "flex aspect-square flex-col items-center justify-center gap-1 rounded-full border-2 p-2 text-center transition-transform duration-150 hover:rotate-0",
                b.earned
                  ? cn("border-foreground", b.tone === "amber" ? "bg-amber/30" : "bg-brand/20", i % 2 ? "rotate-6" : "-rotate-6")
                  : "border-dashed border-foreground/30 text-subtle",
              )}
            >
              {b.earned ? <Stamp className="size-4" aria-hidden /> : <Lock className="size-3.5" aria-hidden />}
              <span className="line-clamp-2 text-[10px] leading-tight font-bold">{b.name}</span>
              <span className="sr-only">{b.earned ? "kazanıldı" : "kilitli"}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Ekip ve mentorluk" className={cn(block, "flex flex-col gap-4 bg-magenta/10 p-6 lg:col-span-3")}>
        <h2 className="text-xl leading-none font-black">{s.team.name}</h2>
        <div className="flex -space-x-2">
          {s.team.members.map((m) => (
            <span key={m} className={cn(skin.avatar, "size-9 text-xs")} aria-hidden>
              {initials(m)}
            </span>
          ))}
        </div>
        <p className="text-xs font-bold">Temsilci: {s.team.representative}</p>
        <p className="line-clamp-4 text-sm">{s.team.problem}</p>
        <div className="mt-auto border-2 border-foreground bg-card p-3">
          <p className="text-xs font-bold uppercase">Onaylı mentorluk</p>
          <p className="text-sm font-black">{s.team.session.mentor}</p>
          <p className={cn(num, "text-xs")}>
            {s.team.session.day} · {s.team.session.time}
          </p>
        </div>
      </section>

      <section aria-label="Kişiler" className="flex flex-col gap-4 lg:col-span-12">
        <h2 className="text-xl font-black">Kişiler</h2>
        <PersonDrawerGrid people={people} skin={skin} />
      </section>
    </div>
  );
}
