'use client';

import type { AssistantMessage } from './useChatAssistant';

interface FeedbackControlsProps {
  message: AssistantMessage;
  onFeedback: (value: 'down' | 'up') => Promise<void>;
}

export default function FeedbackControls({ message, onFeedback }: FeedbackControlsProps) {
  if (
    message.role !== 'assistant' ||
    message.supported !== true ||
    !message.messageId ||
    message.transform
  ) {
    return null;
  }

  return (
    <div className='mt-3 flex items-center gap-2'>
      <button
        type='button'
        onClick={() => {
          onFeedback('up').catch(() => undefined);
        }}
        className='rounded-full border border-border px-3 py-1 text-xs text-text-secondary transition hover:border-primary/40 hover:text-primary'
      >
        Helpful
      </button>
      <button
        type='button'
        onClick={() => {
          onFeedback('down').catch(() => undefined);
        }}
        className='rounded-full border border-border px-3 py-1 text-xs text-text-secondary transition hover:border-primary/40 hover:text-primary'
      >
        Not helpful
      </button>
    </div>
  );
}
