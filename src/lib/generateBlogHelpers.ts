import { z } from 'zod';

import {
  aiProviderTopics,
  backendFrameworkTopics,
  cloudPlatformTopics,
  frontendFrameworkTopics,
  hostingTopics,
  webDevGeneralTopics
} from '@/constants/topics';

import { getErrorMessage } from './errorMessages';
import { pickOneOrNone, pickRandom } from './utils';

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

/**
 * Select a combination of topics
 * @returns Array of selected topics
 */
export function selectCombinationOfTopics(): string[] {
  const frontendTopic = pickOneOrNone<string>(frontendFrameworkTopics);
  const backendTopic = pickOneOrNone<string>(backendFrameworkTopics, !frontendTopic);

  const fullStackTopics: string[] = [frontendTopic, backendTopic].filter((t) => t !== undefined);

  const cloudPlatformTopic = pickOneOrNone<string>(cloudPlatformTopics);
  const hostingTopic = pickOneOrNone<string>(hostingTopics, !cloudPlatformTopic);
  const aiTopic = pickOneOrNone<string>(aiProviderTopics);

  const nullableTopics = [cloudPlatformTopic, hostingTopic, aiTopic].filter((t) => t !== undefined);

  const selectedGeneralTopics = pickRandom<string>(webDevGeneralTopics, 2, 3);

  return [...fullStackTopics, ...nullableTopics, ...selectedGeneralTopics];
}
