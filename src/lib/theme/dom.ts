import { getThemeById, resolveThemeId, type ThemeId } from './registry';

export const THEME_CHANGE_EVENT = 'zoms-theme-change';
const THEME_SWITCH_ATTRIBUTE = 'data-theme-switching';

function ensureThemeColorMeta(documentRef: Document): HTMLMetaElement {
  const existing = documentRef.querySelector<HTMLMetaElement>('meta[name="theme-color"]');

  if (existing) {
    return existing;
  }

  const meta = documentRef.createElement('meta');
  meta.name = 'theme-color';
  documentRef.head.append(meta);

  return meta;
}

function suppressThemeTransitions(root: HTMLElement, themeId: ThemeId) {
  root.setAttribute(THEME_SWITCH_ATTRIBUTE, 'true');

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (root.dataset.theme === themeId) {
        root.removeAttribute(THEME_SWITCH_ATTRIBUTE);
      }
    });
  });
}

function isThemeDocumentStateUnchanged(
  root: HTMLElement,
  meta: HTMLMetaElement,
  theme: {
    id: ThemeId;
    scheme: string;
    browserThemeColor: string;
  }
) {
  return (
    root.dataset.theme === theme.id &&
    root.style.colorScheme === theme.scheme &&
    meta.content === theme.browserThemeColor
  );
}

export function applyThemeToDocument(
  value: string | null | undefined,
  options?: {
    documentRef?: Document;
    dispatchEvent?: boolean;
    suppressTransitions?: boolean;
  }
): ThemeId {
  const resolvedThemeId = resolveThemeId(value);
  const documentRef = options?.documentRef ?? document;
  const theme = getThemeById(resolvedThemeId);

  if (!theme) {
    throw new Error(`Unable to resolve theme "${resolvedThemeId}".`);
  }

  const root = documentRef.documentElement;
  const meta = ensureThemeColorMeta(documentRef);

  if (
    isThemeDocumentStateUnchanged(root, meta, {
      id: resolvedThemeId,
      scheme: theme.scheme,
      browserThemeColor: theme.browserThemeColor
    })
  ) {
    return resolvedThemeId;
  }

  if (options?.suppressTransitions !== false) {
    suppressThemeTransitions(root, resolvedThemeId);
  }

  root.dataset.theme = resolvedThemeId;
  root.style.colorScheme = theme.scheme;
  meta.content = theme.browserThemeColor;

  if (options?.dispatchEvent !== false && typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(THEME_CHANGE_EVENT, {
        detail: {
          themeId: resolvedThemeId
        }
      })
    );
  }

  return resolvedThemeId;
}

export function getThemeFromDocument(documentRef?: Document): ThemeId {
  const root = (documentRef ?? document).documentElement;
  return resolveThemeId(root.dataset.theme);
}

function parseHexColor(value: string): [number, number, number] | null {
  const hex = value.trim().replace('#', '');

  if (![3, 6].includes(hex.length)) {
    return null;
  }

  const normalizedHex =
    hex.length === 3
      ? hex
          .split('')
          .map((character) => `${character}${character}`)
          .join('')
      : hex;
  const numeric = Number.parseInt(normalizedHex, 16);

  if (Number.isNaN(numeric)) {
    return null;
  }

  return [(numeric >> 16) & 255, (numeric >> 8) & 255, numeric & 255];
}

function parseRgbColor(value: string): [number, number, number] | null {
  const matches = value.match(/\d+(?:\.\d+)?/g);

  if (!matches || matches.length < 3) {
    return null;
  }

  const [red, green, blue] = matches;

  if (!red || !green || !blue) {
    return null;
  }

  return [Number.parseInt(red, 10), Number.parseInt(green, 10), Number.parseInt(blue, 10)];
}

export function parseCssColor(value: string): [number, number, number] | null {
  if (value.startsWith('#')) {
    return parseHexColor(value);
  }

  if (value.startsWith('rgb')) {
    return parseRgbColor(value);
  }

  return null;
}

export function readThemeVisualTokens(documentRef?: Document) {
  const styles = getComputedStyle((documentRef ?? document).documentElement);
  const read = (propertyName: string) => styles.getPropertyValue(propertyName).trim();
  const nodeLink = read('--color-node-link');
  const nodeHub1 = read('--color-node-hub-1');
  const nodeHub2 = read('--color-node-hub-2');
  const nodeHub3 = read('--color-node-hub-3');

  return {
    nodeLink,
    nodeLinkRgb: parseCssColor(nodeLink) ?? [148, 163, 184],
    nodeHub1,
    nodeHub1Rgb: parseCssColor(nodeHub1) ?? [56, 189, 248],
    nodeHub2,
    nodeHub2Rgb: parseCssColor(nodeHub2) ?? [99, 102, 241],
    nodeHub3,
    nodeHub3Rgb: parseCssColor(nodeHub3) ?? [124, 58, 237],
    particle1: read('--color-particle-1'),
    particle2: read('--color-particle-2'),
    particle3: read('--color-particle-3'),
    syntaxBracket: read('--color-syntax-bracket'),
    syntaxKeyword: read('--color-syntax-keyword'),
    syntaxOperator: read('--color-syntax-plain'),
    syntaxProperty: read('--color-syntax-property'),
    syntaxString: read('--color-syntax-string'),
    syntaxVariable: read('--color-syntax-variable'),
    terminalGreen: read('--color-terminal-green')
  };
}
