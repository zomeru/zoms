import { beforeEach, describe, expect, it, vi } from "vitest";

const runSiteReindex = vi.fn();
const log = {
  error: vi.fn(),
  info: vi.fn()
};

vi.mock("@/lib/ingestion/reindex", () => ({
  runSiteReindex
}));

vi.mock("@/lib/logger", () => ({
  default: log
}));

describe("blog reindex scheduling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("defers targeted reindex work to the provided post-response scheduler", async () => {
    let scheduledCallback: () => void | Promise<void> = () => {
      throw new Error("Expected scheduleBlogReindex to register a callback.");
    };
    const { scheduleBlogReindex } = await import("@/lib/blogReindex");

    scheduleBlogReindex("generated-blog-post", (callback) => {
      scheduledCallback = callback;
    });

    expect(runSiteReindex).not.toHaveBeenCalled();

    await scheduledCallback();

    expect(runSiteReindex).toHaveBeenCalledWith({ documentId: "blog:generated-blog-post" });
    expect(log.info).toHaveBeenCalledWith("Targeted blog reindex completed after generation", {
      documentId: "blog:generated-blog-post",
      slug: "generated-blog-post"
    });
  });

  it("logs errors instead of throwing when background reindex fails", async () => {
    let scheduledCallback: () => void | Promise<void> = () => {
      throw new Error("Expected scheduleBlogReindex to register a callback.");
    };
    runSiteReindex.mockRejectedValueOnce(new Error("Upstash unavailable"));
    const { scheduleBlogReindex } = await import("@/lib/blogReindex");

    scheduleBlogReindex("generated-blog-post", (callback) => {
      scheduledCallback = callback;
    });

    await expect(scheduledCallback()).resolves.toBeUndefined();
    expect(log.error).toHaveBeenCalledWith("Targeted blog reindex failed after generation", {
      documentId: "blog:generated-blog-post",
      error: "Upstash unavailable",
      slug: "generated-blog-post"
    });
  });
});
