import { bootstrapThemeSnapshot, DEFAULT_THEME_ID } from "./registry";
import { THEME_STORAGE_KEY } from "./storage";

const fallbackTheme = bootstrapThemeSnapshot[DEFAULT_THEME_ID];

export function createThemeBootstrapScript(): string {
  return `(() => {
    const themeKey = ${JSON.stringify(THEME_STORAGE_KEY)};
    const defaultThemeId = ${JSON.stringify(DEFAULT_THEME_ID)};
    const themeSnapshot = ${JSON.stringify(bootstrapThemeSnapshot)};
    const apply = (themeId) => {
      const theme = themeSnapshot[themeId] ?? themeSnapshot[defaultThemeId];
      const resolvedThemeId = themeSnapshot[themeId] ? themeId : defaultThemeId;
      const root = document.documentElement;
      root.dataset.theme = resolvedThemeId;
      root.style.colorScheme = theme.scheme;
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute('content', theme.browserThemeColor);
      }
    };

    try {
      const storedThemeId = window.localStorage.getItem(themeKey);
      apply(storedThemeId ?? defaultThemeId);
    } catch {
      document.documentElement.dataset.theme = defaultThemeId;
      document.documentElement.style.colorScheme = ${JSON.stringify(fallbackTheme.scheme)};
    }
  })();`;
}
