import { z } from "zod";

export const MAX_MESSAGE_LENGTH = 5000;

const content = z
  .string()
  .trim()
  .min(1, { error: "Mesaj boş olamaz." })
  .max(MAX_MESSAGE_LENGTH, { error: `Mesaj en fazla ${MAX_MESSAGE_LENGTH} karakter olabilir.` });

export const newThreadSchema = z.object({
  receiverId: z.string().min(1, { error: "Bir alıcı seçin." }),
  subject: z.string().trim().min(3, { error: "Konu en az 3 karakter olmalı." }).max(150),
  content,
});
export type NewThreadInput = z.infer<typeof newThreadSchema>;

export const replySchema = z.object({ threadId: z.string().min(1), content });
export type ReplyInput = z.infer<typeof replySchema>;

export const threadIdSchema = z.string().min(1);
