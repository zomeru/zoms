'use client';

import ChatComposer from './ChatComposer';
import ChatMessageList from './ChatMessageList';
import type { AssistantMessage } from './useChatAssistant';

interface ChatPanelProps {
  blogSlug?: string;
  error?: string;
  isOpen: boolean;
  isWorking: boolean;
  messages: AssistantMessage[];
  onCitationClick: (
    message: AssistantMessage,
    citation: NonNullable<AssistantMessage['citations']>[number]
  ) => void;
  onClose: () => void;
  onFeedback: (message: AssistantMessage, value: 'down' | 'up') => Promise<void>;
  onSend: (question: string) => Promise<void>;
  onTransform: (mode: 'advanced' | 'beginner' | 'tldr') => Promise<void>;
}

export default function ChatPanel({
  blogSlug,
  error,
  isOpen,
  isWorking,
  messages,
  onCitationClick,
  onClose,
  onFeedback,
  onSend,
  onTransform
}: ChatPanelProps) {
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-[60] transition md:bottom-8 md:right-8 md:left-auto md:w-[28rem] ${
        isOpen
          ? 'pointer-events-auto translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-6 opacity-0'
      }`}
    >
      <section className='glass-panel mx-3 flex h-[80vh] max-h-[44rem] flex-col overflow-hidden rounded-t-3xl border border-border shadow-[0_20px_60px_rgba(0,0,0,0.45)] md:mx-0 md:rounded-3xl'>
        <header className='border-b border-border bg-surface/95 px-4 py-4'>
          <div className='flex items-start justify-between gap-4'>
            <div>
              <h2 className='text-lg font-semibold text-text-primary'>Chat with Zomer</h2>
              <p className='mt-1 text-sm text-text-secondary'>
                An AI version of Zomer grounded in the portfolio, blog, and profile content.
              </p>
            </div>
            <button
              type='button'
              aria-label='Minimize assistant'
              onClick={onClose}
              className='rounded-full border border-border px-3 py-1 font-mono text-xs uppercase tracking-[0.18em] text-text-muted transition hover:border-primary/40 hover:text-primary'
            >
              Hide
            </button>
          </div>

          {blogSlug && (
            <div className='mt-4 flex flex-wrap gap-2'>
              {(['tldr', 'beginner', 'advanced'] as const).map((mode) => (
                <button
                  key={mode}
                  type='button'
                  onClick={() => {
                    onTransform(mode).catch(() => undefined);
                  }}
                  className='rounded-full border border-border px-3 py-1 text-xs text-text-secondary transition hover:border-primary/40 hover:text-primary'
                >
                  {mode === 'tldr' ? 'TL;DR' : mode}
                </button>
              ))}
            </div>
          )}
        </header>

        {error && (
          <div className='border-b border-border bg-terminal-red/10 px-4 py-3 text-sm text-red-200'>
            {error}
          </div>
        )}

        <ChatMessageList
          messages={messages}
          onCitationClick={onCitationClick}
          onFeedback={onFeedback}
        />
        <ChatComposer disabled={isWorking} onSubmit={onSend} />
      </section>
    </div>
  );
}
