// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const usePathname = vi.fn();
const useChatAssistant = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname
}));

vi.mock("@/components/ai/useChatAssistant", () => ({
  useChatAssistant
}));

vi.mock("@/components/ai/ChatLauncher", () => ({
  default: ({ onClick }: { onClick: () => void }) => (
    <button type="button" aria-label="Open chat with Zomer" onClick={onClick}>
      launcher
    </button>
  )
}));

vi.mock("@/components/ai/ChatPanel", () => ({
  default: () => <section aria-label="Chat panel">panel</section>
}));

describe("ChatAssistantShell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useChatAssistant.mockReturnValue({
      blogSlug: undefined,
      error: undefined,
      hasMoreHistory: false,
      isHistoryLoadingInitial: false,
      isLoadingOlderHistory: false,
      isOpen: false,
      isWorking: false,
      loadOlderHistory: vi.fn(),
      messages: [],
      requestTransform: vi.fn(),
      sendQuestion: vi.fn(),
      setIsOpen: vi.fn()
    });
  });

  it("does not mount the assistant shell on the admin route", async () => {
    usePathname.mockReturnValue("/admin");

    const { default: ChatAssistantShell } = await import("@/components/ai/ChatAssistantShell");

    render(<ChatAssistantShell />);

    expect(screen.queryByLabelText("Open chat with Zomer")).toBeNull();
    expect(useChatAssistant).not.toHaveBeenCalled();
  });

  it("mounts the assistant shell on public routes", async () => {
    usePathname.mockReturnValue("/");

    const { default: ChatAssistantShell } = await import("@/components/ai/ChatAssistantShell");

    render(<ChatAssistantShell />);

    expect(useChatAssistant).toHaveBeenCalledWith({ pathname: "/" });
    expect(screen.getByLabelText("Open chat with Zomer")).toBeTruthy();
  });
});
