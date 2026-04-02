// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ChatMessageList from "@/components/ai/ChatMessageList";
import { WELCOME_MESSAGE } from "@/components/ai/useChatAssistant";

describe("chat message list", () => {
  it("shows a history-loading placeholder while the initial conversation page is loading", () => {
    render(
      <ChatMessageList
        hasMoreHistory={false}
        isHistoryLoadingInitial={true}
        isLoadingOlderHistory={false}
        messages={[WELCOME_MESSAGE]}
      />
    );

    expect(screen.getByText("Loading conversation history...")).toBeTruthy();
  });

  it("requests older messages when the chat list is scrolled to the top", () => {
    const onLoadOlderHistory = vi.fn(async () => undefined);

    render(
      <ChatMessageList
        hasMoreHistory={true}
        isHistoryLoadingInitial={false}
        isLoadingOlderHistory={false}
        messages={[
          {
            content: "Recent question",
            id: "user-recent",
            role: "user"
          },
          {
            content: "Recent answer",
            id: "assistant-recent",
            role: "assistant"
          }
        ]}
        onLoadOlderHistory={onLoadOlderHistory}
      />
    );

    const scrollRegion = screen.getByLabelText("Chat conversation history");
    Object.defineProperty(scrollRegion, "scrollTop", {
      configurable: true,
      value: 0,
      writable: true
    });
    fireEvent.scroll(scrollRegion);

    expect(onLoadOlderHistory).toHaveBeenCalledTimes(1);
  });
});
