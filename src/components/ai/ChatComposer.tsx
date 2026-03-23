'use client';

import { useState, type KeyboardEvent, type SyntheticEvent } from 'react';

interface ChatComposerProps {
  disabled?: boolean;
  onSubmit: (question: string) => Promise<void>;
}

export default function ChatComposer({ disabled = false, onSubmit }: ChatComposerProps) {
  const [question, setQuestion] = useState('');

  function submitQuestion(): void {
    if (question.trim().length === 0 || disabled) {
      return;
    }

    const currentQuestion = question;
    setQuestion('');
    onSubmit(currentQuestion).catch(() => undefined);
  }

  function handleSubmit(event: SyntheticEvent<HTMLFormElement>): void {
    event.preventDefault();
    submitQuestion();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) {
      return;
    }

    event.preventDefault();
    submitQuestion();
  }

  return (
    <form onSubmit={handleSubmit} className='border-t border-border bg-background/70 p-4'>
      <label htmlFor='assistant-question' className='sr-only'>
        Assistant question
      </label>
      <div className='flex items-end gap-3'>
        <textarea
          id='assistant-question'
          aria-label='Assistant question'
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='Ask about the site or this post'
          rows={2}
          className='assistant-scrollbar min-h-[84px] flex-1 resize-none rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary/40'
        />
        <button
          type='submit'
          disabled={disabled}
          className='inline-flex h-11 items-center justify-center rounded-full border border-primary/30 bg-primary px-5 font-mono text-xs uppercase tracking-[0.18em] text-white disabled:cursor-not-allowed disabled:opacity-50'
        >
          Send
        </button>
      </div>
    </form>
  );
}
