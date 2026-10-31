import { z } from "zod";

export const trainingInputSchema = z.object({
  courseId: z.string().min(1, { error: "Bir program seçin." }),
  title: z.string().trim().min(3, { error: "Başlık en az 3 karakter olmalı." }).max(160),
  instructorId: z.string().min(1, { error: "Bir eğitmen seçin." }),
  topics: z.string().trim().max(5000),
  durationMinutes: z.number({ error: "Süre girin." }).int().min(15, { error: "En az 15 dk." }).max(480, { error: "En fazla 480 dk." }),
  scheduleDate: z.iso.datetime({ error: "Geçerli bir tarih seçin." }),
  meetingUrl: z.url({ protocol: /^https?$/, error: "Geçerli bir canlı eğitim bağlantısı girin." }),
  /** Programme badge granted on attendance; "" = none. */
  badgeCode: z.string().max(60),
});
export type TrainingInput = z.input<typeof trainingInputSchema>;
