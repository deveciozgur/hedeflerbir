import { ArrowUpRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { PersonDrawerGrid, type DrawerSkin } from "./person-drawer";
import { people, student } from "./showcase-data";

/**
 * Concept 4 · Editorial Swiss: no cards at all. An asymmetric 5/7 grid, extreme type contrast (a 9rem
 * figure against 13px captions), sections separated by space and one full teal field. Micro
 * interactions are typographic: underlines that grow, arrows that travel.
 */
const num = "font-mono tabular-nums tracking-tighter";
const caption = "text-[13px] text-muted-foreground";
const link =
  "group inline-flex items-center gap-1 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring [background:linear-gradient(currentColor,currentColor)_0_100%/0_1px_no-repeat] transition-[background-size] duration-200 ease-out hover:[background-size:100%_1px]";

const skin: DrawerSkin = {
  grid: "grid grid-cols-2 gap-x-8 gap-y-1 sm:grid-cols-3",
  card: "group flex items-baseline justify-between gap-3 py-3 text-left text-lg font-medium tracking-tight transition-colors duration-150 hover:text-brand-soft",
  avatar: "hidden",
  name: "truncate [background:linear-gradient(currentColor,currentColor)_0_100%/0_1px_no-repeat] transition-[background-size] duration-200 group-hover:[background-size:100%_1px]",
  sheet: "max-w-lg gap-10 rounded-none p-10 shadow-none",
  field: "",
  input: "w-full resize-none border-0 border-b border-foreground/30 bg-transparent px-0 py-2 text-base outline-none focus-visible:border-brand",
  send: "inline-flex h-11 items-center justify-center gap-2 bg-foreground px-5 text-sm font-medium text-background transition-transform duration-150 active:scale-[0.98] disabled:opacity-40",
};

/** A thin progress ring drawn as a single arc, sized to sit beside the giant figure. */
function ThinRing({ value }: { value: number }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 100 100" className="size-24 -rotate-90" role="img" aria-label={`Devam oranı yüzde ${value}`}>
      <circle cx="50" cy="50" r={r} fill="none" strokeWidth="1.5" className="stroke-foreground/15" />
      <circle cx="50" cy="50" r={r} fill="none" strokeWidth="1.5" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} className="stroke-brand" />
    </svg>
  );
}

export function EditorialConcept() {
  const s = student;
  const earned = s.badges.filter((b) => b.earned).length;
  return (
    <div className="flex flex-col gap-24">
      <section aria-label="Karşılama ve devam" className="grid gap-10 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-5">
          <p className={caption}>Merhaba {s.firstName}, programın</p>
          <p className={cn(num, "text-[7rem] leading-[0.85] font-semibold sm:text-[9rem]")}>
            {s.percent}
            <span className="text-[0.35em] align-top">%</span>
          </p>
          <p className="mt-3 max-w-[32ch] text-lg leading-snug">kadarına katıldın. Altı canlı eğitimin dördü tamam, sırada Üretken Yapay Zeka var.</p>
        </div>
        <div className="flex items-end gap-8 lg:col-span-7 lg:justify-end">
          <ThinRing value={s.percent} />
          <dl className="grid grid-cols-3 gap-x-10">
            {[
              ["eğitim", `${s.attended}/${s.total}`],
              ["yoklama", s.rollCall],
              ["rozet", `${earned}/9`],
            ].map(([k, v]) => (
              <div key={k}>
                <dd className={cn(num, "text-4xl font-semibold")}>{v}</dd>
                <dt className={caption}>{k}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section aria-label="Sıradaki oturum" className="grid gap-0 bg-brand text-primary-foreground lg:grid-cols-12">
        <div className="flex flex-col justify-between gap-8 p-8 lg:col-span-7 lg:p-12">
          <p className="text-sm opacity-90">Sıradaki canlı oturum · {s.next.countdown} sonra</p>
          <h2 className="text-4xl leading-[0.95] font-semibold tracking-tight text-balance sm:text-6xl">{s.next.title}</h2>
        </div>
        <div className="flex flex-col justify-between gap-6 border-t border-white/25 p-8 lg:col-span-5 lg:border-t-0 lg:border-l lg:p-12">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="opacity-80">Gün</dt>
              <dd className="font-medium">{s.next.day}</dd>
            </div>
            <div>
              <dt className="opacity-80">Saat</dt>
              <dd className={cn(num, "font-medium")}>{s.next.time}</dd>
            </div>
            <div className="col-span-2">
              <dt className="opacity-80">Eğitmen</dt>
              <dd className="font-medium">{s.next.instructor}</dd>
            </div>
          </dl>
          <button
            type="button"
            className="group inline-flex h-12 w-fit items-center gap-3 bg-white px-6 text-base font-semibold text-[#005c52] transition-transform duration-150 active:scale-[0.98]"
          >
            Canlı sınıfa katıl
            <ArrowUpRight className="size-5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
          </button>
        </div>
      </section>

      <section aria-label="Ekip ve rozetler" className="grid gap-16 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-7">
          <h2 className="text-3xl font-semibold tracking-tight">{s.team.name}</h2>
          <p className="max-w-[52ch] text-xl leading-relaxed">{s.team.problem}</p>
          <dl className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            <div>
              <dt className={caption}>Temsilci</dt>
              <dd className="font-medium">{s.team.representative}</dd>
            </div>
            <div>
              <dt className={caption}>Mentor</dt>
              <dd className="font-medium">{s.team.session.mentor}</dd>
            </div>
            <div>
              <dt className={caption}>Onaylı seans</dt>
              <dd className={cn(num, "font-medium")}>
                {s.team.session.day}, {s.team.session.time}
              </dd>
            </div>
          </dl>
          <a href="#" className={cn(link, "w-fit")}>
            Ekibimi aç <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
          </a>
        </div>
        <div className="flex flex-col gap-4 lg:col-span-5">
          <h2 className="flex items-baseline justify-between text-3xl font-semibold tracking-tight">
            Rozetler <span className={cn(num, "text-base text-muted-foreground")}>{earned}/9</span>
          </h2>
          <ol className="flex flex-col">
            {s.badges.map((b) => (
              <li key={b.name} className="flex items-center justify-between gap-4 py-1.5">
                <span className={cn("text-base", b.earned ? "font-medium" : "text-subtle")}>{b.name}</span>
                {b.earned ? (
                  <span className={cn("h-1.5 w-10", b.tone === "amber" ? "bg-amber" : "bg-brand")} aria-label="Kazanıldı" />
                ) : (
                  <Lock className="size-3.5 text-subtle" aria-label="Kilitli" />
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-label="Kişiler" className="flex flex-col gap-4">
        <h2 className="text-3xl font-semibold tracking-tight">Kişiler</h2>
        <PersonDrawerGrid people={people} skin={skin} />
      </section>
    </div>
  );
}
