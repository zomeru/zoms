'use client';

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type SyntheticEvent
} from 'react';
import { AiOutlineArrowUp } from 'react-icons/ai';

import { MAX_CHAT_QUESTION_LENGTH } from '@/lib/ai/chat/schemas';

interface ChatComposerProps {
  disabled?: boolean;
  onSubmit: (question: string) => Promise<void>;
}

const MAX_VISIBLE_LINES = 4;
export default function ChatComposer({ disabled = false, onSubmit }: ChatComposerProps) {
  const [question, setQuestion] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = '0px';
    const computedStyle = window.getComputedStyle(textarea);
    const lineHeight = Number.parseFloat(computedStyle.lineHeight) || 24;
    const maxHeight = lineHeight * MAX_VISIBLE_LINES;
    const nextHeight = Math.min(textarea.scrollHeight, maxHeight);

    textarea.style.height = `${Math.max(nextHeight, lineHeight)}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [question]);

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

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>): void {
    setQuestion(event.target.value.slice(0, MAX_CHAT_QUESTION_LENGTH));
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
      <div className='overflow-hidden rounded-lg border border-border bg-surface shadow-[0_10px_30px_rgba(0,0,0,0.24)] transition focus-within:border-primary/40 focus-within:shadow-[0_0_0_1px_rgba(59,130,246,0.18),0_12px_32px_rgba(0,0,0,0.28)]'>
        <div className='px-4 pt-4 pb-3'>
          <textarea
            ref={textareaRef}
            id='assistant-question'
            aria-label='Assistant question'
            maxLength={MAX_CHAT_QUESTION_LENGTH}
            value={question}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder='Ask about my work, blogs, or any question.'
            rows={1}
            className='assistant-scrollbar block min-h-6 w-full resize-none bg-transparent text-sm leading-6 text-text-primary outline-none placeholder:text-text-muted'
          />
        </div>
        <div className='flex items-center justify-between gap-3 border-t border-border/80 px-3 py-3'>
          <div className='min-w-0 text-[11px] text-text-muted'>
            {question.length}/{MAX_CHAT_QUESTION_LENGTH}
          </div>
          <div className='flex shrink-0 items-center'>
            <button
              type='submit'
              aria-label='Send message'
              disabled={disabled}
              className='inline-flex h-9 min-w-9 items-center justify-center rounded-xl border border-primary/25 bg-primary/90 px-3 text-white transition hover:bg-primary hover:shadow-[0_0_18px_rgba(59,130,246,0.25)] disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-elevated disabled:text-text-muted disabled:shadow-none'
            >
              <AiOutlineArrowUp className='h-4 w-4' aria-hidden='true' />
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
