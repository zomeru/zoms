'use client';

import { useEffect, useRef } from 'react';

import ChatMessageContent from './ChatMessageContent';
import CitationList from './CitationList';
import { WELCOME_MESSAGE_ID, type AssistantMessage } from './useChatAssistant';

interface ChatMessageListProps {
  hasMoreHistory: boolean;
  isHistoryLoadingInitial: boolean;
  isLoadingOlderHistory: boolean;
  messages: AssistantMessage[];
  onLoadOlderHistory?: () => Promise<void>;
}

export default function ChatMessageList({
  hasMoreHistory,
  isHistoryLoadingInitial,
  isLoadingOlderHistory,
  messages,
  onLoadOlderHistory
}: ChatMessageListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const realMessageCount = messages.filter((message) => message.id !== WELCOME_MESSAGE_ID).length;
  const previousMetricsRef = useRef<{
    count: number;
    firstId?: string;
    lastId?: string;
    scrollHeight: number;
  } | null>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;

    if (!container) {
      return;
    }

    const previousMetrics = previousMetricsRef.current;
    const firstId = messages.find((message) => message.id !== WELCOME_MESSAGE_ID)?.id;
    const lastId = messages.at(-1)?.id;

    if (previousMetrics) {
      const prependedOlderMessages =
        previousMetrics.lastId === lastId &&
        previousMetrics.firstId !== firstId &&
        messages.length > previousMetrics.count;

      if (prependedOlderMessages) {
        container.scrollTop += container.scrollHeight - previousMetrics.scrollHeight;
      } else {
        container.scrollTop = container.scrollHeight;
      }
    } else {
      container.scrollTop = container.scrollHeight;
    }

    previousMetricsRef.current = {
      count: messages.length,
      firstId,
      lastId,
      scrollHeight: container.scrollHeight
    };
  }, [messages]);

  function handleScroll() {
    const container = scrollContainerRef.current;

    if (
      !container ||
      !hasMoreHistory ||
      isHistoryLoadingInitial ||
      isLoadingOlderHistory ||
      !onLoadOlderHistory
    ) {
      return;
    }

    if (container.scrollTop <= 24) {
      onLoadOlderHistory().catch(() => undefined);
    }
  }

  return (
    <div
      ref={scrollContainerRef}
      aria-label='Chat conversation history'
      className='assistant-scrollbar min-h-0 flex-1 overflow-y-auto'
      onScroll={handleScroll}
    >
      <div className='flex min-h-full flex-col justify-end gap-4 p-4'>
        {isHistoryLoadingInitial && realMessageCount === 0 ? (
          <div className='mx-auto my-auto flex h-full min-h-32 items-center justify-center'>
            <div className='rounded-2xl border border-border bg-surface/80 px-4 py-3 text-sm text-text-secondary'>
              Loading conversation history...
            </div>
          </div>
        ) : null}
        {isLoadingOlderHistory ? (
          <div className='mx-auto rounded-full border border-border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-text-muted'>
            Loading older messages
          </div>
        ) : null}
        {messages.map((message) => (
          <article
            key={message.id}
            className={
              message.role === 'user'
                ? 'ml-auto max-w-[85%] shrink-0 rounded-2xl rounded-br-md border border-primary/20 bg-primary/10 px-4 py-3'
                : 'max-w-[92%] shrink-0 rounded-2xl rounded-bl-md border border-border bg-surface/90 px-4 py-3'
            }
          >
            <p className='mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-text-muted'>
              {message.role === 'user' ? 'You' : 'Zomer'}
            </p>
            <ChatMessageContent content={message.content} isStreaming={message.isPending} />
            {message.role === 'assistant' && message.isPending && (
              <div
                aria-label='Assistant is responding'
                className='mt-3 inline-flex items-center gap-1.5 text-text-muted'
              >
                {[0, 1, 2].map((dot) => (
                  <span
                    key={dot}
                    className='h-2 w-2 rounded-full bg-current animate-pulse'
                    style={{ animationDelay: `${dot * 180}ms` }}
                  />
                ))}
              </div>
            )}
            {message.transform && (
              <ul className='mt-3 list-disc space-y-1 pl-5 text-sm text-text-secondary'>
                {message.transform.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            )}
            {message.citations && message.citations.length > 0 && (
              <CitationList citations={message.citations} />
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
