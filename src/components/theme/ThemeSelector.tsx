'use client';

import React, { startTransition, useDeferredValue } from 'react';

import type { ThemeId } from '@/lib/theme/registry';
import type { ThemeDefinition } from '@/lib/theme/types';

import { useThemeSystem } from './ThemeProvider';

type ThemeFilter = 'all' | 'dark' | 'light';

const FILTERS: ThemeFilter[] = ['all', 'dark', 'light'];

const ThemeOption = React.forwardRef<
  HTMLButtonElement,
  {
    isActive: boolean;
    isCurrent: boolean;
    onClick: () => void;
    onFocus: () => void;
    onMouseEnter: () => void;
    theme: ThemeDefinition;
  }
>(function ThemeOption({ isActive, isCurrent, onClick, onFocus, onMouseEnter, theme }, ref) {
  return (
    <button
      ref={ref}
      type='button'
      role='option'
      aria-selected={isCurrent}
      onClick={onClick}
      onFocus={onFocus}
      onMouseEnter={onMouseEnter}
      className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all duration-200 ${
        isActive
          ? 'border-primary/40 bg-primary/10 shadow-[0_0_0_1px_rgba(59,130,246,0.18)]'
          : 'border-border/70 bg-surface/70 hover:border-primary/25 hover:bg-surface'
      }`}
    >
      <span
        aria-hidden='true'
        className='grid h-11 w-11 shrink-0 grid-cols-2 gap-1 rounded-xl border border-border/70 bg-background p-1.5'
      >
        <span className='rounded-[0.45rem]' style={{ backgroundColor: theme.preview.bg }} />
        <span className='rounded-[0.45rem]' style={{ backgroundColor: theme.preview.surface }} />
        <span className='rounded-[0.45rem]' style={{ backgroundColor: theme.preview.accent }} />
        <span className='rounded-[0.45rem]' style={{ backgroundColor: theme.preview.fg }} />
      </span>
      <span className='min-w-0 flex-1'>
        <span className='block truncate text-sm font-medium text-text-primary'>{theme.label}</span>
        <span className='mt-1 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted'>
          <span>{theme.group === 'builtin' ? 'Pinned' : theme.scheme}</span>
          {isCurrent && <span>Active</span>}
        </span>
      </span>
      {isCurrent && (
        <span className='rounded-full border border-primary/35 bg-primary/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-primary'>
          Current
        </span>
      )}
    </button>
  );
});

export function ThemeSelector(): React.JSX.Element | null {
  const {
    activeThemeId,
    closeSelector,
    commitTheme,
    currentTheme,
    isSelectorOpen,
    previewTheme,
    themes
  } = useThemeSystem();
  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState<ThemeFilter>('all');
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const optionRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const [activeOptionId, setActiveOptionId] = React.useState<ThemeId>(activeThemeId);

  const visibleThemes = React.useMemo(() => {
    const pinnedTheme = themes.find((theme) => theme.id === 'zomeru');
    const matchingThemes = themes.filter((theme) => {
      if (theme.id === 'zomeru') {
        return false;
      }

      const matchesFilter = filter === 'all' ? true : theme.scheme === filter;
      const matchesQuery =
        normalizedQuery.length === 0
          ? true
          : [theme.label, ...theme.keywords].some((token) =>
              token.toLowerCase().includes(normalizedQuery)
            );

      return matchesFilter && matchesQuery;
    });

    return pinnedTheme ? [pinnedTheme, ...matchingThemes] : matchingThemes;
  }, [filter, normalizedQuery, themes]);

  React.useEffect(() => {
    if (!isSelectorOpen) {
      return;
    }

    setActiveOptionId(activeThemeId);
    searchInputRef.current?.focus();
  }, [activeThemeId, isSelectorOpen]);

  React.useEffect(() => {
    if (!isSelectorOpen) {
      return;
    }

    if (!visibleThemes.some((theme) => theme.id === activeOptionId)) {
      setActiveOptionId(visibleThemes[0]?.id ?? activeThemeId);
    }
  }, [activeOptionId, activeThemeId, isSelectorOpen, visibleThemes]);

  if (!isSelectorOpen) {
    return null;
  }

  const activeIndex = Math.max(
    visibleThemes.findIndex((theme) => theme.id === activeOptionId),
    0
  );

  const activateTheme = (nextThemeId: ThemeId) => {
    setActiveOptionId(nextThemeId);
    previewTheme(nextThemeId);
  };

  const commitActiveTheme = (themeId: ThemeId) => {
    commitTheme(themeId);
    setQuery('');
    setFilter('all');
  };

  const moveActiveTheme = (direction: -1 | 1) => {
    if (visibleThemes.length === 0) {
      return;
    }

    const nextIndex = (activeIndex + direction + visibleThemes.length) % visibleThemes.length;
    const nextTheme = visibleThemes[nextIndex];

    activateTheme(nextTheme.id);
    optionRefs.current[nextTheme.id]?.focus();
  };

  return (
    <div
      className='fixed inset-0 z-[60] flex items-start justify-start bg-overlay backdrop-blur-[2px]'
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          closeSelector();
        }
      }}
    >
      <section
        role='dialog'
        aria-label='Theme selector'
        aria-modal='true'
        className='mx-4 mt-24 flex h-[calc(100vh-7rem)] w-[min(32rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-[2rem] border border-border/70 bg-panel-bg shadow-[0_30px_80px_rgb(var(--shadow-rgb)/0.35)] backdrop-blur-2xl lg:ml-24 lg:mt-20 lg:h-[min(44rem,calc(100vh-6rem))]'
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            moveActiveTheme(1);
          }

          if (event.key === 'ArrowUp') {
            event.preventDefault();
            moveActiveTheme(-1);
          }

          if (event.key === 'Enter') {
            event.preventDefault();
            commitActiveTheme(activeOptionId);
          }
        }}
      >
        <div className='border-b border-border/70 px-5 py-5'>
          <div className='flex items-start justify-between gap-4'>
            <div>
              <p className='font-mono text-[10px] uppercase tracking-[0.28em] text-text-muted'>
                Appearance
              </p>
              <h2 className='mt-2 text-xl font-semibold text-text-primary'>Editor themes</h2>
              <p className='mt-2 text-sm text-text-secondary'>
                {currentTheme.label} is active. Search, preview, and commit a full site theme.
              </p>
            </div>
            <button
              type='button'
              onClick={() => closeSelector()}
              className='rounded-full border border-border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-text-muted transition hover:border-primary/40 hover:text-primary'
            >
              Esc
            </button>
          </div>

          <div className='mt-5 overflow-hidden rounded-2xl border border-border bg-surface/85'>
            <label htmlFor='theme-search' className='sr-only'>
              Search themes
            </label>
            <input
              ref={searchInputRef}
              id='theme-search'
              aria-label='Search themes'
              value={query}
              onChange={(event) => {
                const nextValue = event.target.value;
                startTransition(() => {
                  setQuery(nextValue);
                });
              }}
              placeholder='Search themes, palettes, or keywords'
              className='w-full bg-transparent px-4 py-3 text-sm text-text-primary outline-none placeholder:text-text-muted'
            />
          </div>

          <div className='mt-4 flex flex-wrap gap-2'>
            {FILTERS.map((filterOption) => (
              <button
                key={filterOption}
                type='button'
                onClick={() => {
                  startTransition(() => {
                    setFilter(filterOption);
                  });
                }}
                className={`rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] transition ${
                  filter === filterOption
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border text-text-muted hover:border-primary/30 hover:text-primary'
                }`}
              >
                {filterOption}
              </button>
            ))}
          </div>
        </div>

        <div className='assistant-scrollbar flex-1 overflow-y-auto px-4 py-4'>
          <div role='listbox' aria-label='Theme options' className='space-y-2'>
            {visibleThemes.map((theme) => {
              const isActive = theme.id === activeOptionId;
              const isCurrent = theme.id === activeThemeId;

              return (
                <ThemeOption
                  key={theme.id}
                  ref={(element: HTMLButtonElement | null) => {
                    optionRefs.current[theme.id] = element;
                  }}
                  isActive={isActive}
                  isCurrent={isCurrent}
                  onClick={() => commitActiveTheme(theme.id)}
                  onFocus={() => activateTheme(theme.id)}
                  onMouseEnter={() => activateTheme(theme.id)}
                  theme={theme}
                />
              );
            })}

            {visibleThemes.length === 0 && (
              <div className='rounded-2xl border border-dashed border-border bg-surface/50 px-4 py-8 text-center text-sm text-text-muted'>
                No themes matched that search. Zomeru remains pinned so you always have a safe
                reset.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
