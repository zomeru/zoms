// @vitest-environment jsdom

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import BlogContent from "@/app/blog/[slug]/BlogContent";

describe("blog content", () => {
  let writeText: ReturnType<typeof vi.fn> = vi.fn(async () => undefined);

  beforeEach(() => {
    writeText = vi.fn(async () => undefined);

    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: {
        writeText
      }
    });
  });

  it("adds copy controls to highlighted blog code blocks", async () => {
    render(
      <BlogContent
        body={`<pre><code class="hljs language-ts">const answer = 42;
</code></pre>`}
      />
    );

    const copyButton = await screen.findByRole("button", { name: "Copy TypeScript code" });

    expect(screen.getByText("TypeScript")).toBeTruthy();

    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("const answer = 42;");
    });
  });

  it("defines prose list markers for blog content", () => {
    const globalsCss = readFileSync(join(process.cwd(), "src/styles/globals.css"), "utf8");

    expect(globalsCss).toContain("list-style-type: disc");
    expect(globalsCss).toContain("list-style-type: decimal");
  });

  it("resets nested pre chrome inside the custom blog code block shell", () => {
    const globalsCss = readFileSync(join(process.cwd(), "src/styles/globals.css"), "utf8");

    expect(globalsCss).toContain(".prose .blog-code-block pre");
    expect(globalsCss).toContain("margin: 0");
    expect(globalsCss).toContain("border: 0");
    expect(globalsCss).toContain("border-radius: 0");
    expect(globalsCss).toContain("background: transparent");
  });
});
