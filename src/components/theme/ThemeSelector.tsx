'use client';

import React, { startTransition, useDeferredValue } from 'react';

import {
  FLOATING_WIDGET_META,
  FLOATING_WIDGET_PANEL_HEADER,
  FLOATING_WIDGET_PANEL_SHELL
} from '@/components/ui/floatingWidgetStyles';
import type { ThemeId } from '@/lib/theme/registry';
import type { ThemeDefinition } from '@/lib/theme/types';

import { useThemeSystem } from './ThemeProvider';

type ThemeFilter = 'all' | 'dark' | 'light';

const FILTERS: ThemeFilter[] = ['all', 'dark', 'light'];

const ThemeOption = React.memo(
  React.forwardRef<
    HTMLButtonElement,
    {
      isActive: boolean;
      isSelected: boolean;
      onActivate: (themeId: ThemeId) => void;
      onCommit: (themeId: ThemeId) => void;
      themeId: ThemeId;
      theme: ThemeDefinition;
    }
  >(function ThemeOption({ isActive, isSelected, onActivate, onCommit, theme, themeId }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        role="option"
        aria-selected={isSelected}
        onClick={() => onCommit(themeId)}
        onFocus={() => onActivate(themeId)}
        onMouseEnter={() => onActivate(themeId)}
        className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all duration-200 ${
          isActive
            ? 'border-primary/45 bg-overlay-strong shadow-[0_0_0_1px_rgb(var(--shadow-rgb)/0.12)]'
            : isSelected
              ? 'border-primary/30 bg-primary/8'
              : 'border-border/70 bg-surface/90 hover:border-primary/25 hover:bg-surface'
        }`}
      >
        <span
          aria-hidden="true"
          className="grid h-11 w-11 shrink-0 grid-cols-2 gap-1 rounded-xl border border-border/70 bg-background p-1.5"
        >
          <span className="rounded-[0.45rem]" style={{ backgroundColor: theme.preview.bg }} />
          <span className="rounded-[0.45rem]" style={{ backgroundColor: theme.preview.surface }} />
          <span className="rounded-[0.45rem]" style={{ backgroundColor: theme.preview.accent }} />
          <span className="rounded-[0.45rem]" style={{ backgroundColor: theme.preview.fg }} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-sm text-text-primary">
            {theme.label}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[10px] text-text-muted uppercase tracking-[0.2em]">
            <span>{theme.group === 'builtin' ? 'Pinned' : theme.scheme}</span>
          </span>
        </span>
        {isSelected && (
          <span className="rounded-full border border-primary/35 bg-primary/10 px-2 py-1 font-mono text-[10px] text-primary uppercase tracking-[0.18em]">
            Selected
          </span>
        )}
      </button>
    );
  })
);

export function ThemeSelector(): React.JSX.Element | null {
  const {
    activeThemeId,
    closeSelector,
    commitTheme,
    isSelectorOpen,
    previewTheme,
    selectedTheme,
    selectedThemeId,
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

  React.useEffect(() => {
    if (!isSelectorOpen) {
      return;
    }

    const selectedOption = optionRefs.current[selectedThemeId];

    if (typeof selectedOption?.scrollIntoView === 'function') {
      selectedOption.scrollIntoView({
        block: 'center'
      });
    }
  }, [isSelectorOpen, selectedThemeId]);

  const activateTheme = React.useCallback(
    (nextThemeId: ThemeId) => {
      setActiveOptionId((currentThemeId) => {
        if (currentThemeId === nextThemeId) {
          return currentThemeId;
        }

        previewTheme(nextThemeId);
        return nextThemeId;
      });
    },
    [previewTheme]
  );

  const commitActiveTheme = React.useCallback(
    (themeId: ThemeId) => {
      commitTheme(themeId);
      setQuery('');
      setFilter('all');
    },
    [commitTheme]
  );

  if (!isSelectorOpen) {
    return null;
  }

  const activeIndex = Math.max(
    visibleThemes.findIndex((theme) => theme.id === activeOptionId),
    0
  );

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
    <div className="fixed inset-0 z-[60] flex items-end justify-start">
      <button
        type="button"
        aria-label="Close theme selector"
        className="absolute inset-0 size-full bg-background/58 backdrop-blur-[3px]"
        onMouseDown={(event) => {
          event.preventDefault();
          closeSelector();
        }}
      />
      <section
        role="dialog"
        aria-label="Theme selector"
        aria-modal="true"
        className={`relative mx-4 mt-4 mb-24 flex h-[calc(100vh-8rem)] w-[min(33rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-[2rem] md:mb-8 md:ml-8 md:h-[min(44rem,calc(100vh-4rem))] ${FLOATING_WIDGET_PANEL_SHELL}`}
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
        <div className={`px-5 py-5 ${FLOATING_WIDGET_PANEL_HEADER}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={FLOATING_WIDGET_META}>Appearance</p>
              <h2 className="mt-2 font-semibold text-text-primary text-xl">Editor themes</h2>
              <p className="mt-2 text-sm text-text-secondary">
                {selectedTheme.label} is selected. Hover to preview and click to apply a full site
                theme.
              </p>
            </div>
            <button
              type="button"
              onClick={() => closeSelector()}
              className="rounded-full border border-border px-3 py-1 font-mono text-[11px] text-text-muted uppercase tracking-[0.18em] transition hover:border-primary/40 hover:text-primary"
            >
              Esc
            </button>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-border/80 bg-surface/95">
            <label htmlFor="theme-search" className="sr-only">
              Search themes
            </label>
            <input
              ref={searchInputRef}
              id="theme-search"
              aria-label="Search themes"
              value={query}
              onChange={(event) => {
                const nextValue = event.target.value;
                startTransition(() => {
                  setQuery(nextValue);
                });
              }}
              placeholder="Search themes, palettes, or keywords"
              className="w-full bg-transparent px-4 py-3 text-sm text-text-primary outline-none placeholder:text-text-muted"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {FILTERS.map((filterOption) => (
              <button
                key={filterOption}
                type="button"
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

        <div className="assistant-scrollbar flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          <div role="listbox" aria-label="Theme options" className="space-y-2">
            {visibleThemes.map((theme) => {
              const isActive = theme.id === activeOptionId;
              const isSelected = theme.id === selectedThemeId;

              return (
                <ThemeOption
                  key={theme.id}
                  ref={(element: HTMLButtonElement | null) => {
                    optionRefs.current[theme.id] = element;
                  }}
                  isActive={isActive}
                  isSelected={isSelected}
                  onActivate={activateTheme}
                  onCommit={commitActiveTheme}
                  themeId={theme.id}
                  theme={theme}
                />
              );
            })}

            {visibleThemes.length === 0 && (
              <div className="rounded-2xl border border-border border-dashed bg-surface/50 px-4 py-8 text-center text-sm text-text-muted">
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
