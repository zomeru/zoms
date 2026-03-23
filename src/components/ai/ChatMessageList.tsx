'use client';

import { useEffect, useRef } from 'react';

import CitationList from './CitationList';
import type { AssistantMessage } from './useChatAssistant';

interface ChatMessageListProps {
  messages: AssistantMessage[];
}

export default function ChatMessageList({ messages }: ChatMessageListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;

    if (!container) {
      return;
    }

    container.scrollTop = container.scrollHeight;
  }, [messages]);

  return (
    <div ref={scrollContainerRef} className='assistant-scrollbar min-h-0 flex-1 overflow-y-auto'>
      <div className='flex min-h-full flex-col justify-end gap-4 p-4'>
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
            <p className='whitespace-pre-wrap text-sm leading-6 text-text-primary'>
              {message.content}
            </p>
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
