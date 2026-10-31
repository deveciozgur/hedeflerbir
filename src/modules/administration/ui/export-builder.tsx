"use client";

import { useState } from "react";
import { FileSpreadsheet, FileText, Sheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";
import { DATASET_IDS, DATASETS, type DatasetId, type ExportFormat } from "../domain/export-datasets";

const FORMATS: Array<{ id: ExportFormat; label: string; icon: typeof Sheet; hint: string }> = [
  { id: "xlsx", label: "Excel (.xlsx)", icon: FileSpreadsheet, hint: "Filtrelenebilir, sayılar ve tarihler korunur" },
  { id: "csv", label: "CSV (.csv)", icon: Sheet, hint: "Diğer sistemlere aktarım için" },
  { id: "pdf", label: "PDF (.pdf)", icon: FileText, hint: "Kurumsal şablonlu, yazdırmaya hazır" },
];

export function ExportBuilder({ courses }: { courses: Array<{ id: string; title: string }> }) {
  const [dataset, setDataset] = useState<DatasetId>("participants");
  const [courseId, setCourseId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const definition = DATASETS[dataset];
  const rangeInvalid = Boolean(from && to && from > to);

  const hrefFor = (format: ExportFormat) => {
    const params = new URLSearchParams({ dataset, format });
    if (courseId) params.set("courseId", courseId);
    if (definition.usesDateRange && from) params.set("from", from);
    if (definition.usesDateRange && to) params.set("to", to);
    return `/api/admin/exports?${params.toString()}`;
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-semibold">Rapor türü</legend>
        {DATASET_IDS.map((id) => {
          const item = DATASETS[id];
          const checked = id === dataset;
          return (
            <label
              key={id}
              className={cn(
                "flex cursor-pointer gap-3 rounded-xl border bg-card p-4 transition-colors has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
                checked ? "border-brand bg-brand/5" : "hover:bg-accent/50",
              )}
            >
              <input type="radio" name="dataset" value={id} checked={checked} onChange={() => setDataset(id)} className="mt-1 size-4 accent-[var(--brand)]" />
              <span className="flex flex-col gap-1">
                <span className="text-sm font-medium">{item.label}</span>
                <span className="text-sm text-muted-foreground">{item.description}</span>
                <span className="text-xs text-muted-foreground">{item.columns.map((c) => c.header).join(" · ")}</span>
              </span>
            </label>
          );
        })}
      </fieldset>

      <Card className="lg:sticky lg:top-20 lg:self-start">
        <CardHeader>
          <div>
            <CardTitle>Filtreler</CardTitle>
            <CardDescription>{definition.label}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <FormField id="export-course" label="Eğitim">
            <NativeSelect id="export-course" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
              <option value="">Tüm eğitimler</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </NativeSelect>
          </FormField>
          {definition.usesDateRange ? (
            <div className="grid grid-cols-2 gap-3">
              <FormField id="export-from" label="Başlangıç">
                <Input id="export-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </FormField>
              <FormField id="export-to" label="Bitiş" error={rangeInvalid ? "Bitiş başlangıçtan önce olamaz." : undefined}>
                <Input id="export-to" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} aria-invalid={rangeInvalid} />
              </FormField>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Bu rapor güncel durumu yansıtır; tarih aralığı uygulanmaz.</p>
          )}
          <div className="flex flex-col gap-2 border-t pt-4">
            <p className="text-sm font-medium">İndir</p>
            {FORMATS.map((format) => (
              <Button
                key={format.id}
                asChild={!rangeInvalid}
                variant={format.id === "xlsx" ? "default" : "outline"}
                disabled={rangeInvalid}
                className="h-auto justify-start py-2.5"
              >
                {rangeInvalid ? (
                  <span>
                    <format.icon aria-hidden /> {format.label}
                  </span>
                ) : (
                  <a href={hrefFor(format.id)} download>
                    <format.icon aria-hidden />
                    <span className="flex flex-col items-start">
                      <span>{format.label}</span>
                      <span className="text-xs font-normal opacity-70">{format.hint}</span>
                    </span>
                  </a>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
