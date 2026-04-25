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

function createAuthResponse(authorized: boolean): Response {
  return new Response(JSON.stringify({ authorized, success: true }), {
    headers: {
      "Content-Type": "application/json"
    },
    status: 200
  });
}

function createBlogAuthFetchMock() {
  let authorized = false;

  return vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url =
      typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const method = init?.method ?? "GET";

    if (!url.endsWith("/api/blog/generate/auth")) {
      return new Response(null, { status: 404 });
    }

    if (method === "POST") {
      authorized = true;
      return createAuthResponse(true);
    }

    if (method === "DELETE") {
      authorized = false;
      return createAuthResponse(false);
    }

    return createAuthResponse(authorized);
  });
}

describe("blog admin authorization state", () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    vi.resetModules();
    router.refresh.mockReset();
    router.replace.mockReset();

    const { clearBlogAdminAuthorization } = await import(
      "@/components/blog/useBlogAdminAuthorization"
    );
    clearBlogAdminAuthorization();
  });

  it("syncs unlock and forget actions across blog admin surfaces without a full reload", async () => {
    vi.stubGlobal("fetch", createBlogAuthFetchMock());

    const { BlogGenerateButton } = await import("@/app/blog/BlogGenerateButton");
    const { BlogDeleteMenu } = await import("@/components/blog/BlogDeleteMenu");

    render(
      <>
        <BlogGenerateButton initialAuthorized={false} />
        <BlogDeleteMenu slug="generated-blog-post" title="Generated Blog Post" />
      </>
    );

    expect(
      screen.queryByRole("button", {
        name: "Blog actions for Generated Blog Post"
      })
    ).toBeNull();

    fireEvent.change(screen.getByLabelText("Blog generation secret"), {
      target: {
        value: "super-secret"
      }
    });
    fireEvent.click(screen.getByRole("button", { name: "Enter" }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: "Blog actions for Generated Blog Post"
        })
      ).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Forget" }));

    await waitFor(() => {
      expect(
        screen.queryByRole("button", {
          name: "Blog actions for Generated Blog Post"
        })
      ).toBeNull();
    });
  });
});
