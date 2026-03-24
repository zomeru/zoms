import 'server-only';

import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText, Output } from 'ai';

import { getAiEnv } from './env';
import { buildTransformPrompt } from './prompts';
import { transformResultSchema, type TransformMode, type TransformResult } from './schemas';

function getOpenRouterProvider() {
  const env = getAiEnv();

  return createOpenRouter({
    apiKey: env.OPENROUTER_API_KEY
  });
}

export async function generateBlogTransform(input: {
  mode: TransformMode;
  postTitle: string;
  sourceContent: string;
}): Promise<TransformResult> {
  const env = getAiEnv();
  const provider = getOpenRouterProvider();
  const result = await generateText({
    model: provider.chat(env.OPENROUTER_CHAT_MODEL),
    output: Output.object({
      schema: transformResultSchema
    }),
    prompt: buildTransformPrompt(input)
  });

  return result.output;
}
