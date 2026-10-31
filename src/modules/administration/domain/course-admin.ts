import { z } from "zod";

const TURKISH_MAP: Record<string, string> = { ı: "i", İ: "i", ş: "s", Ş: "s", ğ: "g", Ğ: "g", ü: "u", Ü: "u", ö: "o", Ö: "o", ç: "c", Ç: "c" };

/** "Oyun Geliştirmeye Giriş" → "oyun-gelistirmeye-giris" */
export function slugify(value: string): string {
  return value
    .replace(/[ıİşŞğĞüÜöÖçÇ]/g, (ch) => TURKISH_MAP[ch] ?? ch)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const courseInputSchema = z.object({
  title: z.string().trim().min(3, { error: "Başlık en az 3 karakter olmalı." }).max(140),
  slug: z
    .string()
    .trim()
    .min(3, { error: "Adres en az 3 karakter olmalı." })
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { error: "Yalnızca küçük harf, rakam ve tire kullanın." }),
  description: z.string().trim().min(10, { error: "Açıklama en az 10 karakter olmalı." }).max(5000),
  instructorId: z.string().min(1, { error: "Bir eğitmen seçin." }),
});
export type CourseInput = z.infer<typeof courseInputSchema>;

export const enrollmentSchema = z.object({
  courseId: z.string().min(1),
  studentIds: z.array(z.string().min(1)).min(1, { error: "En az bir katılımcı seçin." }).max(500),
});
