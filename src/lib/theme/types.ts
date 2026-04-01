export type ThemeScheme = 'dark' | 'light';

export interface ThemePreview {
  accent: string;
  bg: string;
  fg: string;
  surface: string;
}

export interface ThemeDefinition {
  browserThemeColor: string;
  group: 'builtin' | ThemeScheme;
  id: string;
  keywords: string[];
  label: string;
  order: number;
  preview: ThemePreview;
  scheme: ThemeScheme;
  source?: string;
}
