import { z } from "zod";

/** Export engine contract: every dataset is a flat table with typed columns, rendered by any format writer. */

export type CellValue = string | number | Date | null;
export type ColumnFormat = "text" | "number" | "percent" | "datetime";

export interface ExportColumn {
  key: string;
  header: string;
  format: ColumnFormat;
  /** Relative width hint used by XLSX and PDF writers. */
  width: number;
}

export interface ExportTable {
  title: string;
  subtitle: string;
  columns: ExportColumn[];
  rows: Array<Record<string, CellValue>>;
}

export const DATASET_IDS = ["participants", "assignments", "attendance", "projects", "mentoring"] as const;
export type DatasetId = (typeof DATASET_IDS)[number];

export const EXPORT_FORMATS = ["csv", "xlsx", "pdf"] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

const col = (key: string, header: string, format: ColumnFormat = "text", width = 14): ExportColumn => ({ key, header, format, width });

export const DATASETS: Record<DatasetId, { label: string; description: string; columns: ExportColumn[]; usesDateRange: boolean }> = {
  participants: {
    label: "Katılımcı başarı raporu",
    description: "Katılımcı başına devam, izlenen kayıt, ödev ortalaması, proje ilerlemesi ve mentor seansları.",
    usesDateRange: false,
    columns: [
      col("name", "Ad Soyad", "text", 22),
      col("email", "E-posta", "text", 28),
      col("courses", "Eğitimler", "text", 26),
      col("attendanceRate", "Devam oranı", "percent", 12),
      col("watched", "İzlenen kayıt", "number", 12),
      col("submitted", "Teslim edilen ödev", "number", 14),
      col("averageScore", "Ödev ortalaması", "percent", 14),
      col("projectProgress", "Proje ilerlemesi", "percent", 14),
      col("mentorSessions", "Tamamlanan mentor seansı", "number", 16),
    ],
  },
  assignments: {
    label: "Ödev istatistikleri",
    description: "Ödev başına teslim oranı, değerlendirme durumu ve ortalama puan.",
    usesDateRange: true,
    columns: [
      col("course", "Eğitim", "text", 24),
      col("title", "Ödev", "text", 26),
      col("dueDate", "Teslim tarihi", "datetime", 16),
      col("enrolled", "Kayıtlı", "number", 9),
      col("submitted", "Teslim", "number", 9),
      col("submissionRate", "Teslim oranı", "percent", 12),
      col("graded", "Değerlendirilen", "number", 13),
      col("returned", "Revizyon", "number", 10),
      col("averageScore", "Ortalama puan", "percent", 13),
    ],
  },
  attendance: {
    label: "Devam / katılım raporu",
    description: "Canlı oturum başına katılan, katılmayan ve mazeretli sayıları.",
    usesDateRange: true,
    columns: [
      col("course", "Eğitim", "text", 24),
      col("session", "Oturum", "text", 28),
      col("date", "Tarih", "datetime", 16),
      col("present", "Katılan", "number", 9),
      col("absent", "Katılmayan", "number", 11),
      col("excused", "Mazeretli", "number", 10),
      col("rate", "Devam oranı", "percent", 12),
    ],
  },
  projects: {
    label: "Proje ilerlemeleri",
    description: "Proje ve katılımcı bazında tamamlanma yüzdesi ve durum.",
    usesDateRange: false,
    columns: [
      col("project", "Proje", "text", 28),
      col("name", "Katılımcı", "text", 22),
      col("email", "E-posta", "text", 28),
      col("progress", "İlerleme", "percent", 11),
      col("status", "Durum", "text", 14),
      col("endDate", "Bitiş", "datetime", 16),
    ],
  },
  mentoring: {
    label: "Mentorluk seansları",
    description: "Tüm randevular: mentor, katılımcı, zaman ve durum.",
    usesDateRange: true,
    columns: [
      col("mentor", "Mentor", "text", 22),
      col("student", "Katılımcı", "text", 22),
      col("start", "Başlangıç", "datetime", 16),
      col("duration", "Süre (dk)", "number", 10),
      col("status", "Durum", "text", 14),
    ],
  },
};

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const exportQuerySchema = z.object({
  dataset: z.enum(DATASET_IDS),
  format: z.enum(EXPORT_FORMATS),
  courseId: z.string().min(1).optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
});
export type ExportQuery = z.infer<typeof exportQuerySchema>;

export interface ExportFilters {
  courseId?: string;
  from?: Date;
  /** Exclusive upper bound (start of the day after `to`). */
  until?: Date;
}

/** Date inputs are calendar days in Istanbul (UTC+3); `to` is inclusive. */
export function toFilters(query: ExportQuery): ExportFilters {
  const day = (value: string, offsetDays = 0) => new Date(new Date(`${value}T00:00:00+03:00`).getTime() + offsetDays * 86_400_000);
  return {
    courseId: query.courseId,
    from: query.from ? day(query.from) : undefined,
    until: query.to ? day(query.to, 1) : undefined,
  };
}

export const exportFileName = (dataset: DatasetId, format: ExportFormat, now: Date = new Date()) =>
  `hedeflerbir-${dataset}-${now.toISOString().slice(0, 10)}.${format}`;
