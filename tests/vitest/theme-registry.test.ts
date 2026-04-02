import { describe, expect, it } from "vitest";

describe("theme registry", () => {
  it("keeps Zomeru pinned first and exposes a broad built-in theme catalog", async () => {
    const { orderedThemes } = await import("@/lib/theme/registry");

    expect(orderedThemes[0]?.id).toBe("zomeru");
    expect(orderedThemes[0]?.label).toBe("Zomeru");
    expect(orderedThemes.length).toBeGreaterThanOrEqual(27);

    const ids = orderedThemes.map((theme) => theme.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(orderedThemes.some((theme) => theme.scheme === "dark")).toBe(true);
    expect(orderedThemes.some((theme) => theme.scheme === "light")).toBe(true);
  });

  it("resolves unknown values back to the default theme", async () => {
    const { DEFAULT_THEME_ID, getThemeById, resolveThemeId } = await import("@/lib/theme/registry");

    expect(resolveThemeId("github-light")).toBe("github-light");
    expect(resolveThemeId("not-a-theme")).toBe(DEFAULT_THEME_ID);
    expect(getThemeById(DEFAULT_THEME_ID)?.label).toBe("Zomeru");
  });
});
