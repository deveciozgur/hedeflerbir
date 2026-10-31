"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ROLE_LABELS } from "@/modules/identity/domain/role";
import { importUsersAction, type ImportUsersResult } from "../application/user-admin.actions";
import { cn } from "@/lib/utils";
import { IMPORT_TEMPLATE_PATH, MAX_IMPORT_ROWS, parseUserCsv, type ImportParseResult } from "../domain/user-import";

function downloadText(fileName: string, content: string) {
  const url = URL.createObjectURL(new Blob(["﻿" + content], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: fileName });
  a.click();
  URL.revokeObjectURL(url);
}

/** CSV bulk import: parse and preview in the browser, then the server re-validates and creates the accounts. */
export function ImportUsersDialog() {
  const [open, setOpen] = useState(false);
  const [csv, setCsv] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<ImportParseResult | null>(null);
  const [result, setResult] = useState<ImportUsersResult | null>(null);
  const [dragging, setDragging] = useState(false);
  const [pending, startTransition] = useTransition();

  const reset = () => {
    setCsv(null);
    setFileName("");
    setPreview(null);
    setResult(null);
  };

  const readFile = async (file: File | undefined) => {
    if (!file) return;
    if (!/\.csv$/i.test(file.name)) {
      toast.error("Yalnızca .csv dosyası yükleyebilirsin.");
      return;
    }
    if (file.size > 1_000_000) {
      toast.error("Dosya 1 MB'tan büyük olamaz.");
      return;
    }
    const text = await file.text();
    setCsv(text);
    setFileName(file.name);
    setPreview(parseUserCsv(text));
    setResult(null);
  };

  const runImport = () =>
    startTransition(async () => {
      if (!csv) return;
      const response = await importUsersAction(csv);
      if (!response.ok) {
        toast.error(response.error);
        return;
      }
      setResult(response.data);
      toast.success(`${response.data.created} kullanıcı oluşturuldu`);
    });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload aria-hidden /> CSV ile içe aktar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Toplu kullanıcı içe aktarma</DialogTitle>
          <DialogDescription>
            Sütunlar: ad, soyad, e-posta, isteğe bağlı rol (öğrenci, eğitmen, mentor, yönetici) ve şifre. En fazla {MAX_IMPORT_ROWS} satır. Şifresi verilmeyen hesaplara şifre belirleme davetiyesi gönderilir.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="flex flex-col gap-4">
            <div role="status" className="flex items-center gap-3 rounded-lg border border-success/25 bg-success/5 px-4 py-3">
              <CheckCircle2 className="size-5 text-success" aria-hidden />
              <p className="text-sm">
                <span className="font-semibold">{result.created}</span> hesap oluşturuldu
                {result.withPassword ? ` (${result.withPassword} tanesi CSV'deki şifreyle)` : ""}
                {result.skippedExisting.length ? `, ${result.skippedExisting.length} e-posta zaten kayıtlı olduğu için atlandı` : ""}
                {result.errors.length ? `, ${result.errors.length} satır hatalı` : ""}.
              </p>
            </div>
            {result.inviteLinks.length > 0 ? (
              <div className="flex flex-col gap-2 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3">
                <p className="text-sm text-warning">E-posta gönderimi yapılandırılmadığı için davetler gönderilmedi. Bağlantıları indirip kullanıcılarla paylaşın (72 saat geçerli).</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="self-start"
                  onClick={() => downloadText("davet-baglantilari.csv", ["e-posta,davet baglantisi", ...result.inviteLinks.map((l) => `${l.email},${l.link}`)].join("\n"))}
                >
                  <Download aria-hidden /> Davet bağlantıları (CSV)
                </Button>
              </div>
            ) : null}
            {result.skippedExisting.length > 0 ? (
              <p className="text-xs text-muted-foreground">Atlananlar: {result.skippedExisting.slice(0, 10).join(", ")}{result.skippedExisting.length > 10 ? "…" : ""}</p>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                void readFile(e.dataTransfer.files[0]);
              }}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-8 text-center transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                dragging ? "border-brand/60 bg-brand/5" : "border-border-strong hover:bg-accent/40",
              )}
            >
              <FileSpreadsheet className="size-6 text-muted-foreground" aria-hidden />
              <span className="text-sm font-medium">{fileName || "CSV dosyasını sürükle bırak veya seç"}</span>
              <span className="text-xs text-subtle">UTF-8, virgül veya noktalı virgül ayraçlı</span>
              <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => void readFile(e.target.files?.[0])} />
            </label>
            <Button asChild variant="link" size="sm" className="self-start">
              <a href={IMPORT_TEMPLATE_PATH} download>
                Örnek şablonu indir
              </a>
            </Button>

            {preview ? (
              preview.missingColumns.length > 0 ? (
                <p role="alert" className="text-sm text-destructive">
                  Başlıkta eksik sütun: {preview.missingColumns.join(", ")}
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="success">{preview.rows.length} geçerli satır</Badge>
                    {preview.errors.length ? <Badge variant="destructive">{preview.errors.length} hatalı satır</Badge> : null}
                  </div>
                  {preview.rows.length > 0 ? (
                    <div className="max-h-56 overflow-auto rounded-lg border">
                      <table className="w-full text-sm">
                        <caption className="sr-only">İçe aktarılacak kullanıcılar (önizleme)</caption>
                        <thead className="sticky top-0 bg-surface-sunken text-left text-xs text-muted-foreground">
                          <tr>
                            <th className="px-3 py-2 font-medium">Satır</th>
                            <th className="px-3 py-2 font-medium">Ad Soyad</th>
                            <th className="px-3 py-2 font-medium">E-posta</th>
                            <th className="px-3 py-2 font-medium">Rol</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {preview.rows.slice(0, 50).map((row) => (
                            <tr key={row.line}>
                              <td className="px-3 py-1.5 font-mono text-xs text-subtle tabular-nums">{row.line}</td>
                              <td className="px-3 py-1.5">
                                {row.name} {row.surname}
                              </td>
                              <td className="px-3 py-1.5 text-muted-foreground">{row.email}</td>
                              <td className="px-3 py-1.5">{ROLE_LABELS[row.role]}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                  {preview.errors.length > 0 ? (
                    <ul className="max-h-28 overflow-auto text-xs text-destructive">
                      {preview.errors.slice(0, 20).map((e) => (
                        <li key={`${e.line}-${e.message}`}>
                          Satır {e.line}: {e.message}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              )
            ) : null}
          </div>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={pending}>
              {result ? "Kapat" : "Vazgeç"}
            </Button>
          </DialogClose>
          {result ? null : (
            <Button onClick={runImport} disabled={pending || !preview || preview.rows.length === 0}>
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Upload aria-hidden />}
              {preview?.rows.length ? `${preview.rows.length} kullanıcıyı içe aktar` : "İçe aktar"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
