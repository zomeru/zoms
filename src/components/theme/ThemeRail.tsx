'use client';

import React from 'react';

import { useThemeSystem } from './ThemeProvider';

function ThemeSwatch({
  accent,
  bg,
  fg,
  surface
}: {
  accent: string;
  bg: string;
  fg: string;
  surface: string;
}) {
  return (
    <span
      aria-hidden='true'
      className='grid h-10 w-10 shrink-0 grid-cols-2 gap-1 rounded-xl border border-border/70 bg-surface p-1.5 shadow-[0_10px_24px_rgba(0,0,0,0.16)]'
    >
      <span className='rounded-[0.45rem]' style={{ backgroundColor: bg }} />
      <span className='rounded-[0.45rem]' style={{ backgroundColor: surface }} />
      <span className='rounded-[0.45rem]' style={{ backgroundColor: accent }} />
      <span className='rounded-[0.45rem]' style={{ backgroundColor: fg }} />
    </span>
  );
}

function ThemeTrigger({ compact = false }: { compact?: boolean }): React.JSX.Element {
  const { currentTheme, openSelector } = useThemeSystem();

  return (
    <button
      type='button'
      onClick={openSelector}
      aria-label={compact ? 'Switch theme' : 'Open theme selector'}
      className={`group flex items-center gap-3 rounded-2xl border border-border/70 bg-surface/92 text-left backdrop-blur-xl transition-all duration-200 hover:border-primary/40 hover:bg-surface ${
        compact ? 'px-3 py-3 shadow-[0_16px_30px_rgb(var(--shadow-rgb)/0.18)]' : 'px-3 py-3'
      }`}
    >
      <ThemeSwatch {...currentTheme.preview} />
      <span className={compact ? 'hidden sm:block min-w-0' : 'min-w-0'}>
        <span className='block font-mono text-[10px] uppercase tracking-[0.24em] text-text-muted'>
          Theme
        </span>
        <span className='mt-1 block truncate text-sm font-medium text-text-primary group-hover:text-primary'>
          {currentTheme.label}
        </span>
        <span className='mt-1 block font-mono text-[11px] uppercase tracking-[0.18em] text-text-muted'>
          {currentTheme.scheme}
        </span>
      </span>
    </button>
  );
}

export function ThemeRail(): React.JSX.Element {
  return (
    <>
      <div className='pointer-events-none fixed left-4 top-24 z-40 hidden lg:flex'>
        <div className='pointer-events-auto flex flex-col gap-3 rounded-3xl border border-border/70 bg-panel-bg p-3 backdrop-blur-2xl shadow-[0_20px_50px_rgb(var(--shadow-rgb)/0.3)]'>
          <div className='px-1'>
            <p className='font-mono text-[10px] uppercase tracking-[0.28em] text-text-muted'>
              Editor Rail
            </p>
          </div>
          <ThemeTrigger />
        </div>
      </div>

      <div className='fixed left-4 top-20 z-[45] lg:hidden'>
        <ThemeTrigger compact={true} />
      </div>
    </>
  );
}
