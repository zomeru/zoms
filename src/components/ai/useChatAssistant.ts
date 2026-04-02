'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import type { TransformMode } from '@/lib/ai/schemas';

import { extractErrorMessage, processStreamChunk } from './chatStreamHelpers';
import {
  type AssistantMessage,
  CHAT_HISTORY_PAGE_SIZE,
  createId,
  getBlogSlugFromPathname,
  isChatHistoryResponse,
  isTransformResult,
  WELCOME_MESSAGE,
  WELCOME_MESSAGE_ID
} from './chatTypes';

export type { AssistantMessage };
// Re-export for consumers
export { getBlogSlugFromPathname, WELCOME_MESSAGE, WELCOME_MESSAGE_ID };

export function useChatAssistant(input: { pathname: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [historyHydrationState, setHistoryHydrationState] = useState<
    'checking' | 'empty' | 'loading' | 'ready'
  >('checking');
  const [isLoadingOlderHistory, setIsLoadingOlderHistory] = useState(false);
  const hasHydratedHistory = useRef(false);
  const shouldIgnoreHydrationResult = useRef(false);

  const blogSlug = useMemo(() => getBlogSlugFromPathname(input.pathname), [input.pathname]);
  const shouldShowWelcomeMessage =
    historyHydrationState === 'empty' || historyHydrationState === 'ready';
  const displayedMessages = useMemo(() => {
    if (!shouldShowWelcomeMessage) {
      return messages;
    }

    if (messages.some((message) => message.id === WELCOME_MESSAGE_ID)) {
      return messages;
    }

    return [WELCOME_MESSAGE, ...messages];
  }, [messages, shouldShowWelcomeMessage]);
  const isHistoryLoadingInitial =
    (historyHydrationState === 'checking' || historyHydrationState === 'loading') &&
    messages.length === 0;

  // ── History hydration ─────────────────────────────────────────────────────
  useEffect(() => {
    if (hasHydratedHistory.current || messages.length > 0 || !isOpen) {
      return;
    }

    let cancelled = false;

    async function hydrateHistory() {
      setHistoryHydrationState('loading');

      try {
        const response = await fetch(`/api/ai/chat?limit=${CHAT_HISTORY_PAGE_SIZE}&offset=0`);

        if (!response.ok) {
          if (!cancelled) {
            hasHydratedHistory.current = true;
            setHasMoreHistory(false);
            setHistoryHydrationState('empty');
          }
          return;
        }

        const payload: unknown = await response.json();

        if (!isChatHistoryResponse(payload) || cancelled || shouldIgnoreHydrationResult.current) {
          return;
        }

        hasHydratedHistory.current = true;
        setMessages(payload.messages);
        setHasMoreHistory(payload.hasMore);
        setHistoryHydrationState(payload.messages.length > 0 ? 'ready' : 'empty');
      } catch {
        if (!cancelled) {
          hasHydratedHistory.current = true;
          setHasMoreHistory(false);
          setHistoryHydrationState('empty');
        }
      }
    }

    hydrateHistory().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [isOpen, messages.length]);

  // ── Load older history ────────────────────────────────────────────────────
  async function loadOlderHistory(): Promise<void> {
    if (
      !hasHydratedHistory.current ||
      !hasMoreHistory ||
      isLoadingOlderHistory ||
      isHistoryLoadingInitial
    ) {
      return;
    }

    setIsLoadingOlderHistory(true);

    try {
      const response = await fetch(
        `/api/ai/chat?limit=${CHAT_HISTORY_PAGE_SIZE}&offset=${messages.length}`
      );

      if (!response.ok) {
        return;
      }

      const payload: unknown = await response.json();

      if (!isChatHistoryResponse(payload) || payload.messages.length === 0) {
        setHasMoreHistory(false);
        return;
      }

      setMessages((currentMessages) => [...payload.messages, ...currentMessages]);
      setHasMoreHistory(payload.hasMore);
    } finally {
      setIsLoadingOlderHistory(false);
    }
  }

  // ── Send question ─────────────────────────────────────────────────────────
  async function sendQuestion(question: string): Promise<void> {
    const trimmedQuestion = question.trim();

    if (trimmedQuestion.length === 0 || isWorking) {
      return;
    }

    const assistantMessageId = createId('assistant');

    setError(undefined);
    setIsOpen(true);
    setIsWorking(true);
    shouldIgnoreHydrationResult.current = true;
    hasHydratedHistory.current = true;
    setHistoryHydrationState('ready');
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
        {
          reader: response.body.getReader(),
          decoder: new TextDecoder(),
          assistantMessageId,
          setMessages
        },
        ''
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

  // ── Request transform ─────────────────────────────────────────────────────
  async function requestTransform(mode: TransformMode): Promise<void> {
    if (!blogSlug || isWorking) {
      return;
    }

    setError(undefined);
    setIsWorking(true);
    shouldIgnoreHydrationResult.current = true;
    hasHydratedHistory.current = true;
    setHistoryHydrationState('ready');

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
    hasMoreHistory,
    isHistoryLoadingInitial,
    isLoadingOlderHistory,
    isOpen,
    isWorking,
    loadOlderHistory,
    messages: displayedMessages,
    requestTransform,
    sendQuestion,
    setIsOpen
  };
}
