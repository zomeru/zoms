'use client';

import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';

import type {
  Citation,
  RelatedContentItem,
  TransformMode,
  TransformResult
} from '@/lib/ai/schemas';

export interface AssistantMessage {
  citations?: Citation[];
  content: string;
  id: string;
  isPending?: boolean;
  messageId?: string;
  relatedContent?: RelatedContentItem[];
  role: 'assistant' | 'user';
  supported?: boolean;
  transform?: TransformResult;
}

interface ChatHistoryResponse {
  messages: AssistantMessage[];
  sessionKey: string | null;
}

function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getBlogSlugFromPathname(pathname: string): string | undefined {
  const match = /^\/blog\/([^/?#]+)/.exec(pathname);
  return match?.[1];
}

interface StreamEvent {
  answer?: {
    answer: string;
    citations: Citation[];
    relatedContent: RelatedContentItem[];
    supported: boolean;
  };
  messageId?: string;
  sessionKey?: string;
  text?: string;
  type: 'chunk' | 'done' | 'session';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isStreamEvent(value: unknown): value is StreamEvent {
  if (!isRecord(value) || typeof value.type !== 'string') {
    return false;
  }

  return value.type === 'chunk' || value.type === 'done' || value.type === 'session';
}

function isTransformResult(value: unknown): value is TransformResult {
  return (
    isRecord(value) &&
    typeof value.mode === 'string' &&
    typeof value.title === 'string' &&
    typeof value.transformedText === 'string' &&
    Array.isArray(value.bullets)
  );
}

function isAssistantMessage(value: unknown): value is AssistantMessage {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.content === 'string' &&
    (value.role === 'assistant' || value.role === 'user')
  );
}

function isChatHistoryResponse(value: unknown): value is ChatHistoryResponse {
  return (
    isRecord(value) &&
    (typeof value.sessionKey === 'string' || value.sessionKey === null) &&
    Array.isArray(value.messages) &&
    value.messages.every(isAssistantMessage)
  );
}

function appendAssistantChunk(messageId: string, text: string) {
  return (currentMessages: AssistantMessage[]) =>
    currentMessages.map((message) =>
      message.id === messageId
        ? {
            ...message,
            content: `${message.content}${text}`
          }
        : message
    );
}

function finalizeAssistantMessage(messageId: string, event: StreamEvent) {
  return (currentMessages: AssistantMessage[]) =>
    currentMessages.map((message) =>
      message.id === messageId && event.answer
        ? {
            ...message,
            citations: event.answer.citations,
            content: event.answer.answer,
            isPending: false,
            messageId: event.messageId,
            relatedContent: event.answer.relatedContent,
            supported: event.answer.supported
          }
        : message
    );
}

function parseStreamBuffer(buffer: string): { lines: string[]; remainder: string } {
  const lines = buffer.split('\n');
  return {
    lines,
    remainder: lines.pop() ?? ''
  };
}

function applyStreamEvent(
  event: StreamEvent,
  assistantMessageId: string,
  setAssistantMessages: Dispatch<SetStateAction<AssistantMessage[]>>,
  setSession: (value: string) => void
) {
  switch (event.type) {
    case 'session':
      if (event.sessionKey) {
        setSession(event.sessionKey);
      }
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

export function useChatAssistant(input: { pathname: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [sessionKey, setSessionKey] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const hasHydratedHistory = useRef(false);

  const blogSlug = useMemo(() => getBlogSlugFromPathname(input.pathname), [input.pathname]);

  useEffect(() => {
    const storedSessionKey = window.localStorage.getItem('ai-chat-session');
    if (storedSessionKey) {
      setSessionKey(storedSessionKey);
    }
  }, []);

  useEffect(() => {
    if (!sessionKey) {
      return;
    }

    window.localStorage.setItem('ai-chat-session', sessionKey);
  }, [sessionKey]);

  useEffect(() => {
    if (!sessionKey || hasHydratedHistory.current || messages.length > 0) {
      return;
    }

    const sessionKeyToHydrate: string = sessionKey;
    let cancelled = false;

    async function hydrateHistory() {
      try {
        const encodedSessionKey = encodeURIComponent(sessionKeyToHydrate);
        const response = await fetch(`/api/ai/chat?sessionKey=${encodedSessionKey}`);

        if (!response.ok) {
          return;
        }

        const payload: unknown = await response.json();

        if (!isChatHistoryResponse(payload) || cancelled) {
          return;
        }

        hasHydratedHistory.current = true;
        setMessages(payload.messages);
      } catch {
        // Ignore hydration failures and let the next send start fresh.
      }
    }

    hydrateHistory().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [messages.length, sessionKey]);

  async function extractErrorMessage(response: Response, fallbackMessage: string): Promise<string> {
    try {
      const payload: unknown = await response.json();

      if (isRecord(payload) && typeof payload.error === 'string' && payload.error.length > 0) {
        return payload.error;
      }
    } catch {
      // Fall through to the generic message when the response body is empty or invalid.
    }

    return fallbackMessage;
  }

  async function reportFeedback(message: AssistantMessage, value: 'down' | 'up'): Promise<void> {
    if (!sessionKey || !message.messageId) {
      return;
    }

    await fetch('/api/ai/feedback', {
      body: JSON.stringify({
        messageId: message.messageId,
        sessionKey,
        type: 'thumbs',
        value
      }),
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST'
    });
  }

  async function reportCitationClick(message: AssistantMessage, citation: Citation): Promise<void> {
    if (!sessionKey || !message.messageId) {
      return;
    }

    await fetch('/api/ai/feedback', {
      body: JSON.stringify({
        citationId: citation.id,
        messageId: message.messageId,
        sessionKey,
        type: 'citation_click',
        url: citation.url
      }),
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST'
    });
  }

  async function processStreamChunk(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    decoder: TextDecoder,
    buffer: string,
    assistantMessageId: string
  ): Promise<void> {
    const { done, value } = await reader.read();

    if (done) {
      return;
    }

    const nextBuffer = `${buffer}${decoder.decode(value, { stream: true })}`;
    const { lines, remainder } = parseStreamBuffer(nextBuffer);

    for (const line of lines) {
      if (line.trim().length === 0) {
        continue;
      }

      const payload: unknown = JSON.parse(line);

      if (!isStreamEvent(payload)) {
        continue;
      }

      applyStreamEvent(payload, assistantMessageId, setMessages, setSessionKey);
    }

    await processStreamChunk(reader, decoder, remainder, assistantMessageId);
  }

  async function sendQuestion(question: string): Promise<void> {
    const trimmedQuestion = question.trim();

    if (trimmedQuestion.length === 0 || isWorking) {
      return;
    }

    const assistantMessageId = createId('assistant');

    setError(undefined);
    setIsOpen(true);
    setIsWorking(true);
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        content: trimmedQuestion,
        id: createId('user'),
        role: 'user'
      },
      {
        content: '',
        id: assistantMessageId,
        isPending: true,
        role: 'assistant'
      }
    ]);

    try {
      const response = await fetch('/api/ai/chat', {
        body: JSON.stringify({
          blogSlug,
          pathname: input.pathname,
          question: trimmedQuestion
        }),
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST'
      });

      if (!response.ok || !response.body) {
        throw new Error(
          await extractErrorMessage(response, 'Unable to reach the assistant right now.')
        );
      }

      await processStreamChunk(
        response.body.getReader(),
        new TextDecoder(),
        '',
        assistantMessageId
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to reach the assistant right now.'
      );
      setMessages((currentMessages) =>
        currentMessages.filter((message) => message.id !== assistantMessageId)
      );
    } finally {
      setIsWorking(false);
    }
  }

  async function requestTransform(mode: TransformMode): Promise<void> {
    if (!blogSlug || isWorking) {
      return;
    }

    setError(undefined);
    setIsWorking(true);

    try {
      const response = await fetch('/api/ai/transform', {
        body: JSON.stringify({
          mode,
          postSlug: blogSlug
        }),
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Unable to transform this post right now.');
      }

      const payload: unknown = await response.json();

      if (!isTransformResult(payload)) {
        throw new Error('Unable to transform this post right now.');
      }

      const transform = payload;
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          content: transform.transformedText,
          id: createId('assistant-transform'),
          role: 'assistant',
          transform
        }
      ]);
      setIsOpen(true);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to transform this post right now.'
      );
    } finally {
      setIsWorking(false);
    }
  }

  return {
    blogSlug,
    error,
    isOpen,
    isWorking,
    messages,
    reportCitationClick,
    reportFeedback,
    requestTransform,
    sendQuestion,
    sessionKey,
    setIsOpen
  };
}
