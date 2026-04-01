'use client';

import { FiMessageCircle } from 'react-icons/fi';

import {
  FLOATING_WIDGET_ICON_SHELL,
  FLOATING_WIDGET_META,
  FLOATING_WIDGET_TRIGGER_SHADOW,
  FLOATING_WIDGET_TRIGGER_SHELL
} from '@/components/ui/floatingWidgetStyles';

interface ChatLauncherProps {
  onClick: () => void;
}

export default function ChatLauncher({ onClick }: ChatLauncherProps) {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-label='Open chat with Zomer'
      className={`group fixed bottom-5 right-5 z-50 inline-flex items-center gap-3 px-3.5 py-3 text-left transition-all duration-200 hover:border-primary/40 hover:bg-surface md:bottom-8 md:right-8 ${FLOATING_WIDGET_TRIGGER_SHELL} ${FLOATING_WIDGET_TRIGGER_SHADOW}`}
    >
      <span
        className={`flex h-10 w-10 items-center justify-center text-primary ${FLOATING_WIDGET_ICON_SHELL}`}
      >
        <FiMessageCircle className='size-5' />
      </span>
      <span className='hidden min-w-0 md:block'>
        <span className={`block ${FLOATING_WIDGET_META}`}>AI Persona</span>
        <span className='block text-sm text-text-primary group-hover:text-primary'>
          Chat with Zomer
        </span>
      </span>
    </button>
  );
}
