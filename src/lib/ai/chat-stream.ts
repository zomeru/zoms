import "server-only";

import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { smoothStream, streamText } from "ai";

import type { QueryClassification } from "@/lib/retrieval/classify";
import type { RetrievedChunk } from "@/lib/retrieval/types";

import { getAiEnv } from "./env";
import { buildGeneralAnswerPrompt, buildGroundedAnswerPrompt } from "./prompts";
import type { Citation } from "./schemas";

const AI_REQUEST_TIMEOUT_MS = 60_000;

function createTimeoutSignal(timeoutMs: number): AbortSignal {
  return AbortSignal.timeout(timeoutMs);
}

function getOpenRouterProvider() {
  const env = getAiEnv();

  return createOpenRouter({
    apiKey: env.OPENROUTER_API_KEY
  });
}

function createStaticTextStream(value: string): AsyncIterable<string> {
  return (async function* () {
    yield value;
  })();
}

function formatRetrievedContext(chunks: RetrievedChunk[]): string {
  return chunks
    .map((chunk, index) =>
      [
        `Source ${index + 1}`,
        `Title: ${chunk.title}`,
        `Content type: ${chunk.contentType}`,
        `Section: ${chunk.sectionTitle}`,
        chunk.publishedAt ? `Published: ${chunk.publishedAt}` : "",
        chunk.tags.length > 0 ? `Tags: ${chunk.tags.join(", ")}` : "",
        `URL: ${chunk.url}`,
        `Content:\n${chunk.content}`
      ]
        .filter(Boolean)
        .join("\n")
    )
    .join("\n\n---\n\n");
}

export async function streamGroundedAnswer(input: {
  citations: Citation[];
  classification: QueryClassification;
  conversationHistory: Array<{
    content: string;
    role: "assistant" | "user";
  }>;
  currentBlogSlug?: string;
  memoryContext?: string;
  query: string;
  shouldRefuse: boolean;
  supportingChunks: RetrievedChunk[];
}): Promise<{
  citations: Citation[];
  supported: boolean;
  textStream: AsyncIterable<string>;
}> {
  if (input.shouldRefuse) {
    return {
      citations: [],
      supported: false,
      textStream: createStaticTextStream(
        "I can only answer from content that is currently indexed on this site."
      )
    };
  }

  const env = getAiEnv();
  const provider = getOpenRouterProvider();
  const prompt = buildGroundedAnswerPrompt({
    citations: input.citations,
    classification: input.classification.intent,
    conversationHistory: input.conversationHistory,
    currentBlogSlug: input.currentBlogSlug,
    memoryContext: input.memoryContext,
    query: input.query,
    retrievedContext: formatRetrievedContext(input.supportingChunks)
  });
  const result = streamText({
    abortSignal: createTimeoutSignal(AI_REQUEST_TIMEOUT_MS),
    experimental_transform: smoothStream({ chunking: "word" }),
    model: provider.chat(env.OPENROUTER_CHAT_MODEL),
    prompt,
    temperature: 0
  });

  return {
    citations: input.citations,
    supported: true,
    textStream: result.textStream
  };
}

export async function streamGeneralAnswer(input: {
  conversationHistory: Array<{
    content: string;
    role: "assistant" | "user";
  }>;
  memoryContext?: string;
  query: string;
  relatedBlogChunks: RetrievedChunk[];
}): Promise<{
  citations: Citation[];
  supported: boolean;
  textStream: AsyncIterable<string>;
}> {
  const env = getAiEnv();
  const provider = getOpenRouterProvider();
  const prompt = buildGeneralAnswerPrompt({
    conversationHistory: input.conversationHistory,
    memoryContext: input.memoryContext,
    query: input.query,
    relatedBlogContext: formatRetrievedContext(input.relatedBlogChunks)
  });
  const result = streamText({
    abortSignal: createTimeoutSignal(AI_REQUEST_TIMEOUT_MS),
    experimental_transform: smoothStream({ chunking: "word" }),
    model: provider.chat(env.OPENROUTER_CHAT_MODEL),
    prompt,
    temperature: 0.3
  });

  return {
    citations: [],
    supported: true,
    textStream: result.textStream
  };
}
