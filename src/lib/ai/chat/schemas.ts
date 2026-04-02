import { z } from "zod";

export const AI_CHAT_COOKIE_NAME = "ai_chat_session";
export const MAX_CHAT_QUESTION_LENGTH = 500;

export const chatRequestSchema = z.object({
  blogSlug: z.string().trim().optional(),
  pathname: z.string().trim().optional(),
  question: z.string().trim().min(1).max(MAX_CHAT_QUESTION_LENGTH)
});

export const chatHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
  offset: z.coerce.number().int().min(0).default(0)
});

export type ChatRequestInput = z.infer<typeof chatRequestSchema>;
