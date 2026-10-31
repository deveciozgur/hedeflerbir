import { Brand } from "@/components/layout/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Brand href="/login" />
        <main className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-sm">{children}</div>
        </main>
        <p className="text-xs text-subtle">© {new Date().getFullYear()} HedeflerBir</p>
      </div>
      <aside className="relative hidden overflow-hidden border-l border-border bg-zinc-900/40 lg:block" aria-hidden>
        <div className="relative flex h-full flex-col justify-end p-12">
          <p className="max-w-md text-2xl font-semibold tracking-tight text-balance">
            Eğitimler, ödevler ve mentorluk. Hedeflerine giden yol tek bir yerde.
          </p>
          <p className="mt-4 max-w-md text-sm text-muted-foreground">
            İlerlemeni takip et, uzmanlarla bağlantı kur ve projeni tamamla.
          </p>
        </div>
      </aside>
    </div>
  );
}
