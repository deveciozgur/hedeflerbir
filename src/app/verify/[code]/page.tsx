import type { Metadata } from "next";
import { BadgeCheck, Download, ShieldX } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { surfaceClass } from "@/components/ui/card";
import { formatFullDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { findCertificate } from "@/modules/learning/application/certificate.queries";

export const metadata: Metadata = { title: "Sertifika doğrulama", robots: { index: false } };

/** Public page an employer opens from the code printed on a certificate. */
export default async function VerifyCertificatePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const certificate = await findCertificate(decodeURIComponent(code));

  return (
    <div className="flex min-h-dvh flex-col items-center gap-10 bg-background px-4 py-12">
      <Brand href="/login" />
      <main className={cn(surfaceClass, "flex w-full max-w-lg flex-col gap-6 p-8")}>
        {certificate ? (
          <>
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full border border-success/30 text-success" aria-hidden>
                <BadgeCheck className="size-5" />
              </span>
              <div>
                <h1 className="text-lg font-semibold">Sertifika geçerli</h1>
                <p className="font-mono text-sm text-muted-foreground">{certificate.code}</p>
              </div>
            </div>
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Sahibi</dt>
                <dd className="mt-0.5 text-base font-semibold">{certificate.holderName}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Eğitim</dt>
                <dd className="mt-0.5 font-medium">{certificate.courseTitle}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Eğitmen</dt>
                <dd className="mt-0.5 font-medium">{certificate.instructorName}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Veriliş tarihi</dt>
                <dd className="mt-0.5 font-medium">{formatFullDate(certificate.issuedAt)}</dd>
              </div>
            </dl>
            <Button asChild variant="outline" className="self-start">
              <a href={`/api/certificates/${certificate.code}`} target="_blank" rel="noopener noreferrer">
                <Download aria-hidden /> PDF olarak görüntüle
              </a>
            </Button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <ShieldX className="size-8 text-destructive" aria-hidden />
            <h1 className="text-lg font-semibold">Sertifika bulunamadı</h1>
            <p className="max-w-sm text-sm text-muted-foreground">Kodu kontrol edin. Doğrulama kodları &quot;HB-XXXX-XXXX&quot; biçimindedir.</p>
          </div>
        )}
      </main>
    </div>
  );
}
