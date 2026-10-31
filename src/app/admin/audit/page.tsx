import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SegmentedLinks } from "@/components/ui/segmented-links";
import { formatDateTime } from "@/lib/format";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { AUDIT_PAGE_SIZE, failedLoginsLastDay, listAuditLogs } from "@/modules/administration/application/audit.queries";
import { AUDIT_ACTIONS, AUDIT_FILTERS, auditTone, isAuditAction, type AuditFilter } from "@/modules/administration/domain/audit";

export const metadata: Metadata = { title: "Denetim Kayıtları" };

const REASON_LABELS: Record<string, string> = {
  unknown_email: "kayıtlı olmayan e-posta",
  wrong_password: "hatalı şifre",
  inactive_account: "askıdaki hesap",
  portal_mismatch: "yanlış giriş kapısı",
  no_password: "şifre henüz belirlenmemiş",
};

/** One-line human summary of the event's metadata. */
function describe(action: string, metadata: Record<string, unknown>): string | null {
  const str = (key: string) => (typeof metadata[key] === "string" || typeof metadata[key] === "number" ? String(metadata[key]) : null);
  switch (action) {
    case "auth.login_failed":
      return REASON_LABELS[str("reason") ?? ""] ?? null;
    case "user.role_changed":
      return `${str("from")} → ${str("to")}`;
    case "user.created":
      return [str("email"), str("role")].filter(Boolean).join(" · ") || null;
    case "user.imported":
      return `${str("created") ?? 0} oluşturuldu, ${str("skippedExisting") ?? 0} atlandı`;
    case "curriculum.module_deleted":
    case "curriculum.lesson_deleted":
      return str("title");
    default:
      return null;
  }
}

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ filter?: string; page?: string }> }) {
  const [query] = await Promise.all([searchParams, getViewer("ADMIN")]);
  const filter = (AUDIT_FILTERS.some((f) => f.value === query.filter) ? query.filter : "all") as AuditFilter;
  const page = Math.max(1, Number.parseInt(query.page ?? "1", 10) || 1);
  const [{ rows, total }, failedLogins] = await Promise.all([listAuditLogs(filter, page), failedLoginsLastDay()]);
  const pages = Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE));
  const href = (next: { filter?: AuditFilter; page?: number }) => {
    const params = new URLSearchParams();
    const f = next.filter ?? filter;
    if (f !== "all") params.set("filter", f);
    if ((next.page ?? 1) > 1) params.set("page", String(next.page));
    const qs = params.toString();
    return `/admin/audit${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Denetim Kayıtları"
        description={`Girişler, rol değişiklikleri, içe aktarmalar ve silme işlemleri. Son 24 saatte ${failedLogins} başarısız giriş denemesi.`}
      />
      <SegmentedLinks label="Kayıt türü" value={filter} options={AUDIT_FILTERS.map((f) => ({ value: f.value, label: f.label, href: href({ filter: f.value }) }))} />

      {rows.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="Kayıt yok" description="Bu filtreyle eşleşen bir denetim kaydı bulunmuyor." />
      ) : (
        <Card className="gap-0 overflow-x-auto py-0">
          <table className="w-full min-w-[46rem] text-sm">
            <caption className="sr-only">Denetim kayıtları</caption>
            <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-5 py-3 font-medium">Zaman</th>
                <th scope="col" className="px-3 py-3 font-medium">Olay</th>
                <th scope="col" className="px-3 py-3 font-medium">Kişi</th>
                <th scope="col" className="px-5 py-3 font-medium">Ayrıntı</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-5 py-3 font-mono text-xs whitespace-nowrap text-muted-foreground tabular-nums">{formatDateTime(row.createdAt)}</td>
                  <td className="px-3 py-3">
                    <Badge variant={auditTone(row.action)}>{isAuditAction(row.action) ? AUDIT_ACTIONS[row.action] : row.action}</Badge>
                  </td>
                  <td className="px-3 py-3">
                    <span className="block truncate font-medium">{row.actorName ?? "Anonim"}</span>
                    {row.actorEmail ? <span className="block truncate text-xs text-muted-foreground">{row.actorEmail}</span> : null}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{describe(row.action, row.metadata) ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {pages > 1 ? (
        <nav aria-label="Sayfalama" className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Sayfa <span className="font-mono tabular-nums">{page}</span>/<span className="font-mono tabular-nums">{pages}</span> · {total} kayıt
          </p>
          <div className="flex gap-2">
            {page > 1 ? (
              <Button asChild variant="outline" size="sm">
                <Link href={href({ page: page - 1 })}>
                  <ChevronLeft aria-hidden /> Önceki
                </Link>
              </Button>
            ) : null}
            {page < pages ? (
              <Button asChild variant="outline" size="sm">
                <Link href={href({ page: page + 1 })}>
                  Sonraki <ChevronRight aria-hidden />
                </Link>
              </Button>
            ) : null}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
