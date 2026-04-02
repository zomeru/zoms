// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

function ThemeHarness() {
  return (
    <div>
      <p>Theme harness</p>
    </div>
  );
}

describe("theme system behaviors", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.style.colorScheme = "";
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";

    const existingMeta = document.querySelector('meta[name="theme-color"]');
    if (existingMeta) {
      existingMeta.remove();
    }

    const meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    meta.setAttribute("content", "#0a0a0f");
    document.head.append(meta);
  });

  it("applies a stored theme to the document on mount", async () => {
    const [{ ThemeProvider }, { THEME_STORAGE_KEY }] = await Promise.all([
      import("@/components/theme/ThemeProvider"),
      import("@/lib/theme/storage")
    ]);

    window.localStorage.setItem(THEME_STORAGE_KEY, "github-light");

    render(
      <ThemeProvider>
        <ThemeHarness />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe("github-light");
      expect(document.documentElement.style.colorScheme).toBe("light");
    });
  });

  it("opens the selector from the global shortcut and commits the chosen theme", async () => {
    const [{ ThemeProvider }, { ThemeRail }, { ThemeSelector }, { THEME_STORAGE_KEY }] =
      await Promise.all([
        import("@/components/theme/ThemeProvider"),
        import("@/components/theme/ThemeRail"),
        import("@/components/theme/ThemeSelector"),
        import("@/lib/theme/storage")
      ]);

    render(
      <ThemeProvider>
        <ThemeRail />
        <ThemeSelector />
        <ThemeHarness />
      </ThemeProvider>
    );

    fireEvent.keyDown(window, {
      altKey: true,
      ctrlKey: true,
      key: "t"
    });

    expect(await screen.findByRole("dialog", { name: "Theme selector" })).toBeTruthy();

    const search = screen.getByLabelText("Search themes");
    fireEvent.change(search, { target: { value: "github light" } });

    const option = await screen.findByRole("option", { name: /GitHub Light/i });
    fireEvent.click(option);

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe("github-light");
      expect(document.documentElement.style.colorScheme).toBe("light");
      expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("github-light");
    });
  }, 10000);

  it("previews a theme and restores the committed theme when cancelled", async () => {
    const [{ ThemeProvider }, { ThemeRail }, { ThemeSelector }] = await Promise.all([
      import("@/components/theme/ThemeProvider"),
      import("@/components/theme/ThemeRail"),
      import("@/components/theme/ThemeSelector")
    ]);

    render(
      <ThemeProvider>
        <ThemeRail />
        <ThemeSelector />
        <ThemeHarness />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: /open theme selector/i }));

    const draculaOption = await screen.findByRole("option", { name: /Dracula/i });
    const zomeruOption = screen.getByRole("option", { name: /Zomeru/i });

    expect(within(zomeruOption).getByText("Selected")).toBeTruthy();
    expect(within(draculaOption).queryByText("Selected")).toBeNull();

    fireEvent.mouseEnter(draculaOption);

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe("dracula");
    });

    expect(within(zomeruOption).getByText("Selected")).toBeTruthy();
    expect(within(draculaOption).queryByText("Selected")).toBeNull();

    fireEvent.keyDown(window, { key: "Escape" });

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe("zomeru");
    });
  }, 10000);

  it("scrolls the selected theme into view when the selector opens", async () => {
    const [{ ThemeProvider }, { ThemeRail }, { ThemeSelector }, { THEME_STORAGE_KEY }] =
      await Promise.all([
        import("@/components/theme/ThemeProvider"),
        import("@/components/theme/ThemeRail"),
        import("@/components/theme/ThemeSelector"),
        import("@/lib/theme/storage")
      ]);

    const originalScrollIntoViewDescriptor = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "scrollIntoView"
    );
    const scrolledElements: HTMLElement[] = [];

    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value(this: HTMLElement) {
        scrolledElements.push(this);
      }
    });

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, "tokyo-night-day");

      render(
        <ThemeProvider>
          <ThemeRail />
          <ThemeSelector />
          <ThemeHarness />
        </ThemeProvider>
      );

      fireEvent.click(screen.getByRole("button", { name: /open theme selector/i }));
      await screen.findByRole("dialog", { name: "Theme selector" });

      const selectedOption = await screen.findByRole("option", { name: /Tokyo Night Day/i });
      const hoverOption = screen.getByRole("option", { name: /Dracula/i });

      await waitFor(() => {
        expect(scrolledElements).toContain(selectedOption);
      });

      const scrollCountAfterOpen = scrolledElements.length;
      fireEvent.mouseEnter(hoverOption);

      await waitFor(() => {
        expect(document.documentElement.dataset.theme).toBe("dracula");
      });

      expect(scrolledElements).toHaveLength(scrollCountAfterOpen);
    } finally {
      if (originalScrollIntoViewDescriptor) {
        Object.defineProperty(
          HTMLElement.prototype,
          "scrollIntoView",
          originalScrollIntoViewDescriptor
        );
      } else {
        Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
      }
    }
  }, 10000);

  it("locks page scrolling while the theme selector is open and restores it on close", async () => {
    const [{ ThemeProvider }, { ThemeRail }, { ThemeSelector }] = await Promise.all([
      import("@/components/theme/ThemeProvider"),
      import("@/components/theme/ThemeRail"),
      import("@/components/theme/ThemeSelector")
    ]);

    document.documentElement.style.overflow = "clip";
    document.body.style.overflow = "auto";

    render(
      <ThemeProvider>
        <ThemeRail />
        <ThemeSelector />
        <ThemeHarness />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: /open theme selector/i }));

    await screen.findByRole("dialog", { name: "Theme selector" });

    expect(document.documentElement.style.overflow).toBe("hidden");
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.keyDown(window, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Theme selector" })).toBeNull();
    });

    expect(document.documentElement.style.overflow).toBe("clip");
    expect(document.body.style.overflow).toBe("auto");
  });
});
