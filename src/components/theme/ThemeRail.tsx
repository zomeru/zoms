"use client";

import {
  FLOATING_WIDGET_ICON_SHELL,
  FLOATING_WIDGET_META,
  FLOATING_WIDGET_TRIGGER_SHADOW,
  FLOATING_WIDGET_TRIGGER_SHELL
} from "@/components/ui/floatingWidgetStyles";

import { useThemeSystem } from "./ThemeProvider";

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
      aria-hidden="true"
      className={`grid h-10 w-10 shrink-0 grid-cols-2 gap-1 p-1.5 ${FLOATING_WIDGET_ICON_SHELL}`}
    >
      <span className="rounded-[0.45rem]" style={{ backgroundColor: bg }} />
      <span className="rounded-[0.45rem]" style={{ backgroundColor: surface }} />
      <span className="rounded-[0.45rem]" style={{ backgroundColor: accent }} />
      <span className="rounded-[0.45rem]" style={{ backgroundColor: fg }} />
    </span>
  );
}

function ThemeTrigger({ compact = false }: { compact?: boolean }) {
  const { currentTheme, openSelector } = useThemeSystem();

  return (
    <button
      type="button"
      onClick={openSelector}
      aria-label="Open theme selector"
      className={`group flex items-center gap-3 px-3.5 py-3 text-left transition-all duration-200 hover:border-primary/40 hover:bg-surface ${FLOATING_WIDGET_TRIGGER_SHELL} ${
        compact
          ? FLOATING_WIDGET_TRIGGER_SHADOW
          : "shadow-[0_20px_42px_rgb(var(--shadow-rgb)/0.26)]"
      }`}
    >
      <ThemeSwatch {...currentTheme.preview} />
      <span className={compact ? "hidden min-w-0 sm:block" : "min-w-0"}>
        <span className={`block ${FLOATING_WIDGET_META}`}>Theme</span>
        <span className="mt-1 block truncate font-medium text-sm text-text-primary group-hover:text-primary">
          {currentTheme.label}
        </span>
        <span className="mt-1 block font-mono text-[11px] text-text-muted uppercase tracking-[0.18em]">
          {currentTheme.scheme}
        </span>
      </span>
    </button>
  );
}

export function ThemeRail() {
  return (
    <div className="fixed bottom-5 left-5 z-45 md:bottom-8 md:left-8">
      <ThemeTrigger compact={true} />
    </div>
  );
}
