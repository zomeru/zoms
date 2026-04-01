'use client';

import {
  FLOATING_WIDGET_META,
  FLOATING_WIDGET_PANEL_HEADER,
  FLOATING_WIDGET_PANEL_SHELL
} from '@/components/ui/floatingWidgetStyles';

import ChatComposer from './ChatComposer';
import ChatMessageList from './ChatMessageList';
import type { AssistantMessage } from './useChatAssistant';

interface ChatPanelProps {
  blogSlug?: string;
  error?: string;
  hasMoreHistory: boolean;
  isHistoryLoadingInitial: boolean;
  isLoadingOlderHistory: boolean;
  isOpen: boolean;
  isWorking: boolean;
  messages: AssistantMessage[];
  onClose: () => void;
  onLoadOlderHistory: () => Promise<void>;
  onSend: (question: string) => Promise<void>;
  onTransform: (mode: 'advanced' | 'beginner' | 'tldr') => Promise<void>;
}

export default function ChatPanel({
  blogSlug,
  error,
  hasMoreHistory,
  isHistoryLoadingInitial,
  isLoadingOlderHistory,
  isOpen,
  isWorking,
  messages,
  onClose,
  onLoadOlderHistory,
  onSend,
  onTransform
}: ChatPanelProps) {
  const panelHeightClass = blogSlug
    ? 'h-[84vh] max-h-[48rem] md:h-[86vh] md:max-h-[50rem]'
    : 'h-[82vh] max-h-[46rem] md:h-[84vh] md:max-h-[47rem]';

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-60 transition md:bottom-8 md:right-8 md:left-auto md:w-md ${
        isOpen
          ? 'pointer-events-auto translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-6 opacity-0'
      }`}
    >
      <section
        className={`mx-3 flex ${panelHeightClass} flex-col overflow-hidden rounded-t-[2rem] md:mx-0 md:rounded-[2rem] ${FLOATING_WIDGET_PANEL_SHELL}`}
      >
        <header className={`px-4 py-4 ${FLOATING_WIDGET_PANEL_HEADER}`}>
          <div className='flex items-start justify-between gap-4'>
            <div>
              <p className={FLOATING_WIDGET_META}>AI Persona</p>
              <h2 className='mt-1 text-lg font-semibold text-text-primary'>Chat with Zomer</h2>
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
          hasMoreHistory={hasMoreHistory}
          isHistoryLoadingInitial={isHistoryLoadingInitial}
          isLoadingOlderHistory={isLoadingOlderHistory}
          messages={messages}
          onLoadOlderHistory={onLoadOlderHistory}
        />
        <ChatComposer disabled={isWorking} onSubmit={onSend} />
      </section>
    </div>
  );
}
