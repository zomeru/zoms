'use client';

interface ChatLauncherProps {
  onClick: () => void;
}

export default function ChatLauncher({ onClick }: ChatLauncherProps) {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-label='Open AI assistant'
      className='group fixed bottom-5 right-5 z-50 inline-flex items-center gap-3 rounded-full border border-primary/30 bg-surface/95 px-4 py-3 text-left shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur md:bottom-8 md:right-8'
    >
      <span className='flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 font-mono text-sm text-primary'>
        AI
      </span>
      <span className='hidden min-w-0 md:block'>
        <span className='block font-mono text-[11px] uppercase tracking-[0.22em] text-text-muted'>
          Site Guide
        </span>
        <span className='block text-sm text-text-primary group-hover:text-primary'>
          Ask the site
        </span>
      </span>
    </button>
  );
}
