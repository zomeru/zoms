import { DEFAULT_THEME_ID, resolveThemeId, type ThemeId } from './registry';

export const THEME_STORAGE_KEY = 'zoms-theme';

export function readStoredTheme(storage: Pick<Storage, 'getItem'>): ThemeId {
  return resolveThemeId(storage.getItem(THEME_STORAGE_KEY));
}

export function writeStoredTheme(themeId: ThemeId, storage: Pick<Storage, 'setItem'>): void {
  storage.setItem(THEME_STORAGE_KEY, themeId);
}

export function getFallbackTheme(): ThemeId {
  return DEFAULT_THEME_ID;
}
