'use client';

import { FiMessageCircle } from 'react-icons/fi';

interface ChatLauncherProps {
  onClick: () => void;
}

export default function ChatLauncher({ onClick }: ChatLauncherProps) {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-label='Open chat with Zomer'
      className='group fixed bottom-5 right-5 z-50 inline-flex items-center gap-3 rounded-full border border-primary/30 bg-surface/95 px-4 py-3 text-left shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur md:bottom-8 md:right-8'
    >
      <span className='flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary'>
        <FiMessageCircle className='size-5' />
      </span>
      <span className='hidden min-w-0 md:block'>
        <span className='block font-mono text-[11px] uppercase tracking-[0.22em] text-text-muted'>
          AI Persona
        </span>
        <span className='block text-sm text-text-primary group-hover:text-primary'>
          Chat with Zomer
        </span>
      </span>
    </button>
  );
}
