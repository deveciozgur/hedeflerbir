import { z } from "zod";
import { FILE_TYPE_OPTIONS } from "./file-policy";

export const assignmentInputSchema = z.object({
  courseId: z.string().min(1, { error: "Bir eğitim seçin." }),
  title: z.string().trim().min(3, { error: "Başlık en az 3 karakter olmalı." }).max(140),
  description: z.string().trim().min(10, { error: "Açıklama en az 10 karakter olmalı." }).max(10_000),
  dueDate: z.iso.datetime({ error: "Geçerli bir teslim tarihi seçin." }),
  maxScore: z
    .number({ error: "Bir puan girin." })
    .int({ error: "Tam sayı girin." })
    .min(1, { error: "En az 1 olmalı." })
    .max(1000, { error: "En fazla 1000 olabilir." }),
  /** Empty = every platform-supported file type. */
  acceptedFileTypes: z.array(z.enum(FILE_TYPE_OPTIONS as [string, ...string[]])).max(FILE_TYPE_OPTIONS.length),
});

export type AssignmentInput = z.infer<typeof assignmentInputSchema>;

export const gradeDecisionSchema = z.enum(["GRADED", "RETURNED"]);
export type GradeDecision = z.infer<typeof gradeDecisionSchema>;

export const gradeInputSchema = z
  .object({
    submissionId: z.string().min(1),
    decision: gradeDecisionSchema,
    grade: z.number().int().min(0).nullable(),
    feedback: z.string().trim().min(10, { error: "Geri bildirim en az 10 karakter olmalı." }).max(5000),
  })
  .refine((v) => v.decision === "RETURNED" || v.grade !== null, { path: ["grade"], error: "Bir puan girin." });

export type GradeInput = z.infer<typeof gradeInputSchema>;

export const submissionNoteSchema = z.string().trim().max(2000, { error: "Not en fazla 2000 karakter olabilir." });
