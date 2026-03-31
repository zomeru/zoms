import type { Dispatch, SetStateAction } from 'react';

import { appendStreamText } from '@/lib/ai/streaming';

import { isStreamEvent, type AssistantMessage, type StreamEvent } from './chatTypes';

export function appendAssistantChunk(messageId: string, text: string) {
  return (currentMessages: AssistantMessage[]) =>
    currentMessages.map((message) =>
      message.id === messageId
        ? {
            ...message,
            content: appendStreamText(message.content, text)
          }
        : message
    );
}

export function finalizeAssistantMessage(messageId: string, event: StreamEvent) {
  return (currentMessages: AssistantMessage[]) =>
    currentMessages.map((message) =>
      message.id === messageId && event.answer
        ? {
            ...message,
            citations: event.answer.citations,
            content: event.answer.answer,
            isPending: false,
            messageId: event.messageId,
            supported: event.answer.supported
          }
        : message
    );
}

function safeParseJSON(input: string): unknown {
  try {
    return JSON.parse(input);
  } catch {
    return undefined;
  }
}

function parseStreamBuffer(buffer: string): { lines: string[]; remainder: string } {
  const lines = buffer.split('\n');
  return {
    lines,
    remainder: lines.pop() ?? ''
  };
}

export function applyStreamEvent(
  event: StreamEvent,
  assistantMessageId: string,
  setAssistantMessages: Dispatch<SetStateAction<AssistantMessage[]>>
) {
  switch (event.type) {
    case 'session':
      return;

    case 'chunk':
      if (event.text) {
        setAssistantMessages(appendAssistantChunk(assistantMessageId, event.text));
      }
      return;

    case 'done':
      if (event.answer) {
        setAssistantMessages(finalizeAssistantMessage(assistantMessageId, event));
      }
  }
}

interface StreamChunkContext {
  assistantMessageId: string;
  decoder: TextDecoder;
  reader: ReadableStreamDefaultReader<Uint8Array>;
  setMessages: Dispatch<SetStateAction<AssistantMessage[]>>;
}

export async function processStreamChunk(ctx: StreamChunkContext, buffer: string): Promise<void> {
  const { done, value } = await ctx.reader.read();

  if (done) {
    return;
  }

  const nextBuffer = `${buffer}${ctx.decoder.decode(value, { stream: true })}`;
  const { lines, remainder } = parseStreamBuffer(nextBuffer);

  for (const line of lines) {
    if (line.trim().length === 0) {
      continue;
    }

    const payload = safeParseJSON(line);
    if (!payload) {
      continue;
    }

    if (!isStreamEvent(payload)) {
      continue;
    }

    applyStreamEvent(payload, ctx.assistantMessageId, ctx.setMessages);
  }

  await processStreamChunk(ctx, remainder);
}

export async function extractErrorMessage(
  response: Response,
  fallbackMessage: string
): Promise<string> {
  try {
    const payload: unknown = await response.json();

    if (
      typeof payload === 'object' &&
      payload !== null &&
      'error' in payload &&
      typeof (payload as Record<string, unknown>).error === 'string'
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Guarded by typeof check above
      const errorValue = (payload as Record<string, unknown>).error as string;
      if (errorValue.length > 0) {
        return errorValue;
      }
    }
  } catch {
    // Fall through to the generic message when the response body is empty or invalid.
  }

  return fallbackMessage;
}
