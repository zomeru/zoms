"use client";

import { useEffect, useRef, useState } from "react";

import type { AssistantMessage } from "./chatTypes";
import { CHAT_HISTORY_PAGE_SIZE, isChatHistoryResponse } from "./chatTypes";

interface UseChatHistoryInput {
  isOpen: boolean;
  messages: AssistantMessage[];
  setMessages: React.Dispatch<React.SetStateAction<AssistantMessage[]>>;
}

export function useChatHistory(input: UseChatHistoryInput) {
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [historyHydrationState, setHistoryHydrationState] = useState<
    "checking" | "empty" | "loading" | "ready"
  >("checking");
  const [isLoadingOlderHistory, setIsLoadingOlderHistory] = useState(false);
  const hasHydratedHistory = useRef(false);
  const shouldIgnoreHydrationResult = useRef(false);

  const isHistoryLoadingInitial =
    (historyHydrationState === "checking" || historyHydrationState === "loading") &&
    input.messages.length === 0;

  function markHydrationReady(): void {
    shouldIgnoreHydrationResult.current = true;
    hasHydratedHistory.current = true;
    setHistoryHydrationState("ready");
  }

  useEffect(() => {
    if (hasHydratedHistory.current || input.messages.length > 0 || !input.isOpen) {
      return;
    }

    let cancelled = false;

    async function hydrateHistory() {
      setHistoryHydrationState("loading");

      try {
        const response = await fetch(`/api/ai/chat?limit=${CHAT_HISTORY_PAGE_SIZE}&offset=0`);

        if (!response.ok) {
          if (!cancelled) {
            hasHydratedHistory.current = true;
            setHasMoreHistory(false);
            setHistoryHydrationState("empty");
          }
          return;
        }

        const payload: unknown = await response.json();

        if (!isChatHistoryResponse(payload) || cancelled || shouldIgnoreHydrationResult.current) {
          return;
        }

        hasHydratedHistory.current = true;
        input.setMessages(payload.messages);
        setHasMoreHistory(payload.hasMore);
        setHistoryHydrationState(payload.messages.length > 0 ? "ready" : "empty");
      } catch {
        if (!cancelled) {
          hasHydratedHistory.current = true;
          setHasMoreHistory(false);
          setHistoryHydrationState("empty");
        }
      }
    }

    hydrateHistory().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [input.isOpen, input.messages.length, input.setMessages]);

  async function loadOlderHistory(): Promise<void> {
    if (
      !hasHydratedHistory.current ||
      !hasMoreHistory ||
      isLoadingOlderHistory ||
      isHistoryLoadingInitial
    ) {
      return;
    }

    setIsLoadingOlderHistory(true);

    try {
      const response = await fetch(
        `/api/ai/chat?limit=${CHAT_HISTORY_PAGE_SIZE}&offset=${input.messages.length}`
      );

      if (!response.ok) {
        return;
      }

      const payload: unknown = await response.json();

      if (!isChatHistoryResponse(payload) || payload.messages.length === 0) {
        setHasMoreHistory(false);
        return;
      }

      input.setMessages((currentMessages) => [...payload.messages, ...currentMessages]);
      setHasMoreHistory(payload.hasMore);
    } finally {
      setIsLoadingOlderHistory(false);
    }
  }

  return {
    hasMoreHistory,
    historyHydrationState,
    isHistoryLoadingInitial,
    isLoadingOlderHistory,
    loadOlderHistory,
    markHydrationReady
  };
}
