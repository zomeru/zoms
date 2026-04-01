'use client';

import React from 'react';

import { applyThemeToDocument, getThemeFromDocument } from '@/lib/theme/dom';
import {
  DEFAULT_THEME_ID,
  getThemeById,
  orderedThemes,
  THEME_SHORTCUT,
  type ThemeId
} from '@/lib/theme/registry';
import { readStoredTheme, writeStoredTheme } from '@/lib/theme/storage';

interface ThemeContextValue {
  activeThemeId: ThemeId;
  closeSelector: (options?: { revertPreview?: boolean }) => void;
  commitTheme: (themeId: ThemeId) => void;
  currentTheme: NonNullable<ReturnType<typeof getThemeById>>;
  isSelectorOpen: boolean;
  openSelector: () => void;
  previewTheme: (themeId: ThemeId) => void;
  selectedTheme: NonNullable<ReturnType<typeof getThemeById>>;
  selectedThemeId: ThemeId;
  themes: typeof orderedThemes;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  );
}

export function ThemeProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [committedThemeId, setCommittedThemeId] = React.useState<ThemeId>(DEFAULT_THEME_ID);
  const [previewThemeId, setPreviewThemeId] = React.useState<ThemeId | null>(null);
  const [isSelectorOpen, setIsSelectorOpen] = React.useState(false);

  React.useEffect(() => {
    const initialThemeId = resolveInitialThemeId();

    setCommittedThemeId(initialThemeId);
    applyThemeToDocument(initialThemeId);
  }, []);

  const openSelector = React.useCallback(() => {
    setIsSelectorOpen(true);
  }, []);

  const closeSelector = React.useCallback(
    (options?: { revertPreview?: boolean }) => {
      const shouldRevertPreview = options?.revertPreview ?? true;

      if (shouldRevertPreview) {
        applyThemeToDocument(committedThemeId);
        setPreviewThemeId(null);
      }

      setIsSelectorOpen(false);
    },
    [committedThemeId]
  );

  const previewTheme = React.useCallback((themeId: ThemeId) => {
    applyThemeToDocument(themeId);
    setPreviewThemeId(themeId);
  }, []);

  const commitTheme = React.useCallback((themeId: ThemeId) => {
    const resolvedThemeId = applyThemeToDocument(themeId);

    writeStoredTheme(resolvedThemeId, window.localStorage);
    setCommittedThemeId(resolvedThemeId);
    setPreviewThemeId(null);
    setIsSelectorOpen(false);
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isShortcutPressed =
        event.altKey &&
        event.key.toLowerCase() === THEME_SHORTCUT.key &&
        (event.ctrlKey || event.metaKey);

      if (isShortcutPressed && !isEditableTarget(event.target)) {
        event.preventDefault();
        setIsSelectorOpen(true);
        return;
      }

      if (event.key === 'Escape' && isSelectorOpen) {
        event.preventDefault();
        closeSelector();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeSelector, isSelectorOpen]);

  const activeThemeId = previewThemeId ?? committedThemeId;
  const currentTheme = getThemeById(activeThemeId) ?? getThemeById(DEFAULT_THEME_ID);
  const selectedTheme = getThemeById(committedThemeId) ?? getThemeById(DEFAULT_THEME_ID);

  if (!currentTheme || !selectedTheme) {
    throw new Error('Default theme is missing from the theme registry.');
  }

  return (
    <ThemeContext.Provider
      value={{
        activeThemeId,
        closeSelector,
        commitTheme,
        currentTheme,
        isSelectorOpen,
        openSelector,
        previewTheme,
        selectedTheme,
        selectedThemeId: committedThemeId,
        themes: orderedThemes
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

function resolveInitialThemeId(): ThemeId {
  try {
    return readStoredTheme(window.localStorage);
  } catch {
    return getThemeFromDocument();
  }
}

export function useThemeSystem(): ThemeContextValue {
  const context = React.useContext(ThemeContext);

  if (!context) {
    throw new Error('useThemeSystem must be used inside ThemeProvider.');
  }

  return context;
}
