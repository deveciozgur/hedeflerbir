import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { AgendaConcept } from "./concept-agenda";
import { BrutalConcept } from "./concept-brutal";
import { EditorialConcept } from "./concept-editorial";
import { GlassConcept } from "./concept-glass";
import { LinearConcept } from "./concept-linear";
import { VercelConcept } from "./concept-vercel";

export const metadata: Metadata = { title: "UI Showcase", robots: { index: false, follow: false } };

const CONCEPTS = {
  linear: { name: "Linear Hyper-Dense", note: "Mühendislik ve yüksek veri yoğunluğu · Linear / Raycast" },
  vercel: { name: "Vercel Pure Minimal", note: "Ferah tipografi ve dengeli boşluk · Vercel / Stripe" },
  glass: { name: "Tactile Glass Craft", note: "Buzlu cam katmanları ve ortam ışıması · macOS / Raycast Store" },
  editorial: { name: "Editorial Swiss", note: "Kartsız, asimetrik grid ve dev rakamlar · İsviçre tipografisi" },
  brutal: { name: "Neo-Brutal Bilet", note: "Kalın çizgi, sert gölge, bilet ve damga metaforu" },
  agenda: { name: "Zaman Ekseni", note: "Bento yerine zaman çizgisi, yerinde açılan düğümler" },
} as const;
type ConceptKey = keyof typeof CONCEPTS;
const isConcept = (k: string | undefined): k is ConceptKey => k !== undefined && Object.hasOwn(CONCEPTS, k);
const VIEWS: Record<ConceptKey, () => React.JSX.Element> = {
  linear: LinearConcept,
  vercel: VercelConcept,
  glass: GlassConcept,
  editorial: EditorialConcept,
  brutal: BrutalConcept,
  agenda: AgendaConcept,
};

/**
 * Temporary design preview (mock data, no auth, no DB). Development only: it 404s in production so a
 * stray deploy can't expose it. Delete the (preview) folder once a concept is chosen.
 */
export default async function UiShowcasePage({ searchParams }: { searchParams: Promise<{ k?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { k } = await searchParams;
  const concept: ConceptKey = isConcept(k) ? k : "linear";
  const View = VIEWS[concept];

  return (
    <div className="min-h-dvh bg-[#FAFAFA] dark:bg-[#09090B]">
      <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-[#FAFAFA]/85 backdrop-blur-md dark:border-zinc-800/80 dark:bg-[#09090B]/85">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <div className="mr-auto flex items-center gap-3">
            <span className="grid size-7 place-items-center rounded-md bg-brand font-mono text-xs font-semibold text-primary-foreground" aria-hidden>
              HB
            </span>
            <div>
              <h1 className="text-sm font-semibold tracking-tight">HedeflerBir · Katılımcı paneli önizlemesi</h1>
              <p className="text-xs text-muted-foreground">{CONCEPTS[concept].note} · örnek veriler</p>
            </div>
          </div>
          <nav aria-label="Konsept" className="flex flex-wrap gap-1 rounded-lg border border-zinc-200/80 bg-white p-1 dark:border-zinc-800/80 dark:bg-zinc-950">
            {(Object.keys(CONCEPTS) as ConceptKey[]).map((key) => (
              <Link
                key={key}
                href={`/ui-showcase?k=${key}`}
                aria-current={key === concept ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium outline-none transition-all duration-150 ease-out focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]",
                  key === concept ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="mr-1 font-mono text-[11px] opacity-60">{(Object.keys(CONCEPTS) as ConceptKey[]).indexOf(key) + 1}</span>
                {CONCEPTS[key].name}
              </Link>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </header>

      <main className="relative isolate mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <View />
      </main>
    </div>
  );
}
