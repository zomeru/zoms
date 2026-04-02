import type { ThemeDefinition } from "./types";

const themes = [
  {
    browserThemeColor: "#0a0a0f",
    group: "builtin",
    id: "zomeru",
    keywords: ["default", "portfolio", "terminal", "editor", "zoms"],
    label: "Zomeru",
    order: 0,
    preview: {
      accent: "#3b82f6",
      bg: "#0a0a0f",
      fg: "#f1f5f9",
      surface: "#12121a"
    },
    scheme: "dark",
    source: "Built-in"
  },
  {
    browserThemeColor: "#1e1e1e",
    group: "dark",
    id: "vscode-dark-plus",
    keywords: ["vscode", "dark plus", "microsoft"],
    label: "VS Code Dark+",
    order: 10,
    preview: {
      accent: "#569cd6",
      bg: "#1e1e1e",
      fg: "#d4d4d4",
      surface: "#252526"
    },
    scheme: "dark"
  },
  {
    browserThemeColor: "#0d1117",
    group: "dark",
    id: "github-dark",
    keywords: ["github", "dark", "primer"],
    label: "GitHub Dark",
    order: 20,
    preview: {
      accent: "#58a6ff",
      bg: "#0d1117",
      fg: "#c9d1d9",
      surface: "#161b22"
    },
    scheme: "dark"
  },
  {
    browserThemeColor: "#22272e",
    group: "dark",
    id: "github-dark-dimmed",
    keywords: ["github", "dark dimmed", "primer"],
    label: "GitHub Dark Dimmed",
    order: 30,
    preview: {
      accent: "#6cb6ff",
      bg: "#22272e",
      fg: "#adbac7",
      surface: "#2d333b"
    },
    scheme: "dark"
  },
  {
    browserThemeColor: "#282c34",
    group: "dark",
    id: "one-dark-pro",
    keywords: ["one dark", "atom", "pro"],
    label: "One Dark Pro",
    order: 40,
    preview: {
      accent: "#61afef",
      bg: "#282c34",
      fg: "#abb2bf",
      surface: "#2f343f"
    },
    scheme: "dark"
  },
  {
    browserThemeColor: "#282a36",
    group: "dark",
    id: "dracula",
    keywords: ["dracula", "pink", "purple"],
    label: "Dracula",
    order: 50,
    preview: {
      accent: "#bd93f9",
      bg: "#282a36",
      fg: "#f8f8f2",
      surface: "#303341"
    },
    scheme: "dark"
  },
  {
    browserThemeColor: "#0b0e14",
    group: "dark",
    id: "ayu-dark",
    keywords: ["ayu", "dark", "orange"],
    label: "Ayu Dark",
    order: 60,
    preview: {
      accent: "#ffb454",
      bg: "#0b0e14",
      fg: "#b3b1ad",
      surface: "#131721"
    },
    scheme: "dark"
  },
  {
    browserThemeColor: "#1f2430",
    group: "dark",
    id: "ayu-mirage",
    keywords: ["ayu", "mirage", "teal"],
    label: "Ayu Mirage",
    order: 70,
    preview: {
      accent: "#73d0ff",
      bg: "#1f2430",
      fg: "#cccac2",
      surface: "#242936"
    },
    scheme: "dark"
  },
  {
    browserThemeColor: "#2d2a2e",
    group: "dark",
    id: "monokai-pro",
    keywords: ["monokai", "pro", "lime"],
    label: "Monokai Pro",
    order: 80,
    preview: {
      accent: "#ffd866",
      bg: "#2d2a2e",
      fg: "#fcfcfa",
      surface: "#36323b"
    },
    scheme: "dark"
  },
  {
    browserThemeColor: "#011627",
    group: "dark",
    id: "night-owl",
    keywords: ["night owl", "owl", "cyan"],
    label: "Night Owl",
    order: 90,
    preview: {
      accent: "#82aaff",
      bg: "#011627",
      fg: "#d6deeb",
      surface: "#0b1f33"
    },
    scheme: "dark"
  },
  {
    browserThemeColor: "#1a1b26",
    group: "dark",
    id: "tokyo-night",
    keywords: ["tokyo", "night", "blue"],
    label: "Tokyo Night",
    order: 100,
    preview: {
      accent: "#7aa2f7",
      bg: "#1a1b26",
      fg: "#c0caf5",
      surface: "#24283b"
    },
    scheme: "dark"
  },
  {
    browserThemeColor: "#1e1e2e",
    group: "dark",
    id: "catppuccin-mocha",
    keywords: ["catppuccin", "mocha", "mauve"],
    label: "Catppuccin Mocha",
    order: 110,
    preview: {
      accent: "#cba6f7",
      bg: "#1e1e2e",
      fg: "#cdd6f4",
      surface: "#313244"
    },
    scheme: "dark"
  },
  {
    browserThemeColor: "#282828",
    group: "dark",
    id: "gruvbox-dark",
    keywords: ["gruvbox", "dark", "warm"],
    label: "Gruvbox Dark",
    order: 120,
    preview: {
      accent: "#fabd2f",
      bg: "#282828",
      fg: "#ebdbb2",
      surface: "#32302f"
    },
    scheme: "dark"
  },
  {
    browserThemeColor: "#2e3440",
    group: "dark",
    id: "nord",
    keywords: ["nord", "frost", "blue"],
    label: "Nord",
    order: 130,
    preview: {
      accent: "#88c0d0",
      bg: "#2e3440",
      fg: "#eceff4",
      surface: "#3b4252"
    },
    scheme: "dark"
  },
  {
    browserThemeColor: "#292d3e",
    group: "dark",
    id: "palenight",
    keywords: ["palenight", "material", "violet"],
    label: "Palenight",
    order: 140,
    preview: {
      accent: "#c792ea",
      bg: "#292d3e",
      fg: "#d0d0e0",
      surface: "#30364a"
    },
    scheme: "dark"
  },
  {
    browserThemeColor: "#0f111a",
    group: "dark",
    id: "material-ocean",
    keywords: ["material", "ocean", "teal"],
    label: "Material Theme Ocean",
    order: 150,
    preview: {
      accent: "#80cbc4",
      bg: "#0f111a",
      fg: "#a6accd",
      surface: "#191c28"
    },
    scheme: "dark"
  },
  {
    browserThemeColor: "#002b36",
    group: "dark",
    id: "solarized-dark",
    keywords: ["solarized", "dark", "cyan"],
    label: "Solarized Dark",
    order: 160,
    preview: {
      accent: "#268bd2",
      bg: "#002b36",
      fg: "#93a1a1",
      surface: "#073642"
    },
    scheme: "dark"
  },
  {
    browserThemeColor: "#191724",
    group: "dark",
    id: "rose-pine",
    keywords: ["rose pine", "pine", "rose"],
    label: "Rose Pine",
    order: 170,
    preview: {
      accent: "#c4a7e7",
      bg: "#191724",
      fg: "#e0def4",
      surface: "#1f1d2e"
    },
    scheme: "dark"
  },
  {
    browserThemeColor: "#1f1f28",
    group: "dark",
    id: "kanagawa-wave",
    keywords: ["kanagawa", "wave", "indigo"],
    label: "Kanagawa Wave",
    order: 180,
    preview: {
      accent: "#7e9cd8",
      bg: "#1f1f28",
      fg: "#dcd7ba",
      surface: "#2a2a37"
    },
    scheme: "dark"
  },
  {
    browserThemeColor: "#ffffff",
    group: "light",
    id: "vscode-light-plus",
    keywords: ["vscode", "light plus", "microsoft"],
    label: "VS Code Light+",
    order: 190,
    preview: {
      accent: "#005fb8",
      bg: "#ffffff",
      fg: "#343434",
      surface: "#f3f3f3"
    },
    scheme: "light"
  },
  {
    browserThemeColor: "#ffffff",
    group: "light",
    id: "github-light",
    keywords: ["github", "light", "primer"],
    label: "GitHub Light",
    order: 200,
    preview: {
      accent: "#0969da",
      bg: "#ffffff",
      fg: "#1f2328",
      surface: "#f6f8fa"
    },
    scheme: "light"
  },
  {
    browserThemeColor: "#fafafa",
    group: "light",
    id: "atom-one-light",
    keywords: ["atom", "one light"],
    label: "Atom One Light",
    order: 210,
    preview: {
      accent: "#4078f2",
      bg: "#fafafa",
      fg: "#383a42",
      surface: "#f0f1f3"
    },
    scheme: "light"
  },
  {
    browserThemeColor: "#fafafa",
    group: "light",
    id: "ayu-light",
    keywords: ["ayu", "light", "orange"],
    label: "Ayu Light",
    order: 220,
    preview: {
      accent: "#e6b450",
      bg: "#fafafa",
      fg: "#5c6166",
      surface: "#f0f2f5"
    },
    scheme: "light"
  },
  {
    browserThemeColor: "#eff1f5",
    group: "light",
    id: "catppuccin-latte",
    keywords: ["catppuccin", "latte", "blue"],
    label: "Catppuccin Latte",
    order: 230,
    preview: {
      accent: "#1e66f5",
      bg: "#eff1f5",
      fg: "#4c4f69",
      surface: "#e6e9ef"
    },
    scheme: "light"
  },
  {
    browserThemeColor: "#fdf6e3",
    group: "light",
    id: "solarized-light",
    keywords: ["solarized", "light", "cyan"],
    label: "Solarized Light",
    order: 240,
    preview: {
      accent: "#268bd2",
      bg: "#fdf6e3",
      fg: "#586e75",
      surface: "#eee8d5"
    },
    scheme: "light"
  },
  {
    browserThemeColor: "#fbf1c7",
    group: "light",
    id: "gruvbox-light",
    keywords: ["gruvbox", "light", "warm"],
    label: "Gruvbox Light",
    order: 250,
    preview: {
      accent: "#b57614",
      bg: "#fbf1c7",
      fg: "#3c3836",
      surface: "#f2e5bc"
    },
    scheme: "light"
  },
  {
    browserThemeColor: "#e1e2e7",
    group: "light",
    id: "tokyo-night-day",
    keywords: ["tokyo", "night day", "light"],
    label: "Tokyo Night Day",
    order: 260,
    preview: {
      accent: "#34548a",
      bg: "#e1e2e7",
      fg: "#3760bf",
      surface: "#d5d6db"
    },
    scheme: "light"
  }
] as const satisfies readonly ThemeDefinition[];

export type ThemeId = (typeof themes)[number]["id"];

export const DEFAULT_THEME_ID: ThemeId = "zomeru";
export const orderedThemes = [...themes].sort((left, right) => left.order - right.order);

const themeIds: ReadonlySet<string> = new Set(orderedThemes.map((theme) => theme.id));
const themeById = new Map(orderedThemes.map((theme) => [theme.id, theme] as const));

export const THEME_SHORTCUT = {
  altKey: true,
  key: "t"
} as const;

export function isThemeId(value: string): value is ThemeId {
  return themeIds.has(value);
}

export function resolveThemeId(value: string | null | undefined): ThemeId {
  if (!value) {
    return DEFAULT_THEME_ID;
  }

  return isThemeId(value) ? value : DEFAULT_THEME_ID;
}

export function getThemeById(value: string | null | undefined) {
  const id = resolveThemeId(value);
  return themeById.get(id);
}

export const bootstrapThemeSnapshot = Object.fromEntries(
  orderedThemes.map((theme) => [
    theme.id,
    {
      browserThemeColor: theme.browserThemeColor,
      scheme: theme.scheme
    }
  ])
) satisfies Record<string, Pick<ThemeDefinition, "browserThemeColor" | "scheme">>;
