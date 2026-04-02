// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const router = {
  refresh: vi.fn(),
  replace: vi.fn()
};

vi.mock("next/navigation", () => ({
  useRouter: () => router
}));

describe("blog delete menu", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    router.refresh.mockReset();
    router.replace.mockReset();
  });

  it("shows delete controls for authorized browsers and deletes the selected post", async () => {
    const onDeleted = vi.fn();

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
        const url =
          typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

        if (url.includes("/api/blog/generate/auth")) {
          return new Response(JSON.stringify({ authorized: true, success: true }), {
            headers: {
              "Content-Type": "application/json"
            },
            status: 200
          });
        }

        if (url.includes("/api/blog/generated-blog-post")) {
          expect(init?.method).toBe("DELETE");

          return new Response(
            JSON.stringify({
              deleted: {
                slug: "generated-blog-post"
              },
              success: true
            }),
            {
              headers: {
                "Content-Type": "application/json"
              },
              status: 200
            }
          );
        }

        return new Response(null, { status: 404 });
      })
    );

    const { BlogDeleteMenu } = await import("@/components/blog/BlogDeleteMenu");

    render(
      <BlogDeleteMenu
        slug="generated-blog-post"
        title="Generated Blog Post"
        onDeleted={() => {
          onDeleted();
        }}
      />
    );

    const menuButton = await screen.findByRole("button", {
      name: "Blog actions for Generated Blog Post"
    });
    fireEvent.click(menuButton);
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete blog" }));

    await waitFor(() => {
      expect(onDeleted).toHaveBeenCalledTimes(1);
    });
  });
});
