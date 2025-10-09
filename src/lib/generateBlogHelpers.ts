import { z } from 'zod';

import { getErrorMessage } from './errorMessages';

// 🧩 Define Zod schema for AI JSON output
const AIResponseSchema = z.object({
  title: z.string().min(1, 'Missing title'),
  summary: z.string().min(1, 'Missing summary'),
  body: z.string().min(1, 'Missing body'),
  tags: z.array(z.string().min(1)).min(3).max(5),
  readTime: z.number().int().positive().optional()
});

type AiResponseType = z.infer<typeof AIResponseSchema>;

export function tryParseAIJSON(text: string): AiResponseType {
  try {
    // Remove Markdown wrappers if present
    const cleaned = text
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/```$/i, '');

    // Try parsing directly
    const parsed: unknown = JSON.parse(cleaned);

    // Validate against schema
    const validated = AIResponseSchema.parse(parsed);

    return validated;
  } catch (error) {
    throw new Error(getErrorMessage('AI_JSON_PARSE_ERROR'), { cause: error });
  }
}
