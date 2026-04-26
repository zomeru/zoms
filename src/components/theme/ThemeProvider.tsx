"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { applyThemeToDocument, getThemeFromDocument } from "@/lib/theme/dom";
import {
  DEFAULT_THEME_ID,
  getThemeById,
  orderedThemes,
  THEME_SHORTCUT,
  type ThemeId
} from "@/lib/theme/registry";
import { readStoredTheme, writeStoredTheme } from "@/lib/theme/storage";

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

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [committedThemeId, setCommittedThemeId] = useState<ThemeId>(DEFAULT_THEME_ID);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const previewThemeIdRef = useRef<ThemeId | null>(null);

  useEffect(() => {
    const initialThemeId = resolveInitialThemeId();

    setCommittedThemeId(initialThemeId);
    applyThemeToDocument(initialThemeId);
  }, []);

  useLayoutEffect(() => {
    if (!isSelectorOpen) {
      return;
    }

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [isSelectorOpen]);

  const openSelector = useCallback(() => {
    setIsSelectorOpen(true);
  }, []);

  const closeSelector = useCallback(
    (options?: { revertPreview?: boolean }) => {
      const shouldRevertPreview = options?.revertPreview ?? true;
      const previewThemeId = previewThemeIdRef.current;

      if (shouldRevertPreview && previewThemeId && previewThemeId !== committedThemeId) {
        applyThemeToDocument(committedThemeId);
      }

      previewThemeIdRef.current = null;
      setIsSelectorOpen(false);
    },
    [committedThemeId]
  );

  const previewTheme = useCallback((themeId: ThemeId) => {
    if (previewThemeIdRef.current === themeId) {
      return;
    }

    previewThemeIdRef.current = themeId;
    applyThemeToDocument(themeId);
  }, []);

  const commitTheme = useCallback(
    (themeId: ThemeId) => {
      const resolvedThemeId = applyThemeToDocument(themeId);

      previewThemeIdRef.current = null;

      if (resolvedThemeId !== committedThemeId) {
        writeStoredTheme(resolvedThemeId, window.localStorage);
        setCommittedThemeId(resolvedThemeId);
      }

      setIsSelectorOpen(false);
    },
    [committedThemeId]
  );

  useEffect(() => {
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

      if (event.key === "Escape" && isSelectorOpen) {
        event.preventDefault();
        closeSelector();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeSelector, isSelectorOpen]);

  const activeThemeId = committedThemeId;
  const currentTheme = getThemeById(committedThemeId) ?? getThemeById(DEFAULT_THEME_ID);
  const selectedTheme = getThemeById(committedThemeId) ?? getThemeById(DEFAULT_THEME_ID);

  if (!currentTheme || !selectedTheme) {
    throw new Error("Default theme is missing from the theme registry.");
  }

  const contextValue = useMemo(
    () => ({
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
    }),
    [
      activeThemeId,
      closeSelector,
      commitTheme,
      currentTheme,
      isSelectorOpen,
      openSelector,
      previewTheme,
      selectedTheme,
      committedThemeId
    ]
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

function resolveInitialThemeId(): ThemeId {
  try {
    return readStoredTheme(window.localStorage);
  } catch {
    return getThemeFromDocument();
  }
}

export function useThemeSystem(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useThemeSystem must be used inside ThemeProvider.");
  }

  return context;
}
