import { describe, expect, it } from "vitest";

import { generatePrompt } from "@/lib/blog-generator/helpers";

describe("blog generator prompt", () => {
  it("requires natural title openings and excludes suffixation-based starters", () => {
    const prompt = generatePrompt();

    expect(prompt).toContain(
      'Start titles naturally with clear, concrete subjects. Avoid title-opening words formed through suffixation; do not use abstract or gerund-heavy openings, including words ending in "ing", "ic", "istic", "tion", or "able" (for example, "Optimizing", "Architecting", or "Deterministic").'
    );
  });

  it("keeps the generated content separate from the title", () => {
    const prompt = generatePrompt();

    expect(prompt).toContain(
      "Return body content only: do not repeat the title or include an H1 heading in `content`; use H2–H3 headings for the article structure"
    );
  });

  it("lets the model select a topic from its own knowledge", () => {
    const prompt = generatePrompt();

    expect(prompt).toContain("Optional topic inspiration (broad, non-exhaustive categories):");
    expect(prompt).toContain(
      "First use your own knowledge to identify a specific, practical engineering topic worth writing about"
    );
    expect(prompt).toContain(
      "Treat the selected domains only as optional inspiration, not a whitelist or required scope; you may choose a better domain or topic that is not listed"
    );
    expect(prompt).toContain("do not assume access to live internet research");
  });
});
