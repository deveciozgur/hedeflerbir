import { z } from "zod";
import { QUESTION_TYPES } from "./quiz";

export const quizAnswersSchema = z.record(z.string().min(1), z.union([z.array(z.string().min(1)).max(50), z.string().max(5000)]));

export const submitAttemptSchema = z.object({
  attemptId: z.string().min(1),
  answers: quizAnswersSchema,
});

const optionSchema = z.object({
  id: z.string().optional(),
  text: z.string().trim().min(1, { error: "Seçenek metni boş olamaz." }).max(500),
  isCorrect: z.boolean(),
});

const questionSchema = z.object({
  id: z.string().optional(),
  prompt: z.string().trim().min(3, { error: "Soru metni en az 3 karakter olmalı." }).max(2000),
  type: z.enum(QUESTION_TYPES),
  points: z.number().int().min(1).max(100),
  explanation: z.string().trim().max(2000),
  options: z.array(optionSchema).max(10),
});

export const quizInputSchema = z.object({
  passingScore: z.number().int().min(0).max(100),
  timeLimitMinutes: z.number().int().min(1).max(600).nullable(),
  retriesAllowed: z.number().int().min(0).max(20),
  questions: z.array(questionSchema).min(1, { error: "En az bir soru ekleyin." }).max(100),
});
export type QuizInput = z.infer<typeof quizInputSchema>;
export type QuizQuestionInput = QuizInput["questions"][number];
