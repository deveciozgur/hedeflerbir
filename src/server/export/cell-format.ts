import type { CellValue, ColumnFormat } from "@/modules/administration/domain/export-datasets";

const dateTime = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** Human-readable text for CSV and PDF. XLSX keeps native types instead. */
export function formatCell(value: CellValue, format: ColumnFormat): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return dateTime.format(value);
  if (format === "percent" && typeof value === "number") return `%${value}`;
  return String(value);
}
