import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("tracked path casing", () => {
  it("tracks the sections barrel with lowercase directory casing", () => {
    const trackedFiles = execFileSync("git", ["ls-files", "src/components"], {
      cwd: process.cwd(),
      encoding: "utf8"
    });

    expect(trackedFiles).toContain("src/components/sections/index.ts");
    expect(trackedFiles).not.toContain("src/components/Sections/index.ts");
  });
});
