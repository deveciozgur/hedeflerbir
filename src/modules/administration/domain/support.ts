import { z } from "zod";

export const TICKET_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: "Açık",
  IN_PROGRESS: "İşlemde",
  RESOLVED: "Çözüldü",
};

export const ticketInputSchema = z.object({
  subject: z.string().trim().min(5, { error: "Konu en az 5 karakter olmalı." }).max(150),
  content: z.string().trim().min(15, { error: "Lütfen sorunu biraz daha ayrıntılı anlatın (en az 15 karakter)." }).max(5000),
});

export const ticketStatusSchema = z.object({ ticketId: z.string().min(1), status: z.enum(TICKET_STATUSES) });

export const ticketReplySchema = z.object({
  ticketId: z.string().min(1),
  content: z.string().trim().min(1, { error: "Yanıt boş olamaz." }).max(5000),
});
