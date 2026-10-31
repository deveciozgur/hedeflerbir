import { Brand } from "@/components/layout/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Brand href="/login" />
        <main className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-sm">{children}</div>
        </main>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} HedeflerBir</p>
      </div>
      <aside className="relative hidden overflow-hidden border-l bg-muted/40 lg:block" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--color-brand)/18%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        <div className="relative flex h-full flex-col justify-end p-12">
          <p className="max-w-md text-2xl font-semibold tracking-tight text-balance">
            Eğitimler, ödevler ve mentorluk — hedeflerine giden yol tek bir yerde.
          </p>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            İlerlemeni takip et, uzmanlarla bağlantı kur ve projeni tamamla.
          </p>
        </div>
      </aside>
    </div>
  );
}
