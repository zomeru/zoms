"use client";

import { useMemo, useState } from "react";

import {
  type AssistantMessage,
  getBlogSlugFromPathname,
  WELCOME_MESSAGE,
  WELCOME_MESSAGE_ID
} from "./chatTypes";
import { useChatHistory } from "./useChatHistory";
import { useChatStream } from "./useChatStream";
import { useChatTransform } from "./useChatTransform";

export type { AssistantMessage };
// Re-export for consumers
export { getBlogSlugFromPathname, WELCOME_MESSAGE, WELCOME_MESSAGE_ID };

export function useChatAssistant(input: { pathname: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [error, setError] = useState<string | undefined>();

  const blogSlug = useMemo(() => getBlogSlugFromPathname(input.pathname), [input.pathname]);
  const history = useChatHistory({
    isOpen,
    messages,
    setMessages
  });
  const { sendQuestion } = useChatStream({
    blogSlug,
    isWorking,
    markHydrationReady: history.markHydrationReady,
    pathname: input.pathname,
    setError,
    setIsOpen,
    setIsWorking,
    setMessages
  });
  const { requestTransform } = useChatTransform({
    blogSlug,
    isWorking,
    markHydrationReady: history.markHydrationReady,
    setError,
    setIsOpen,
    setIsWorking,
    setMessages
  });
  const shouldShowWelcomeMessage =
    history.historyHydrationState === "empty" || history.historyHydrationState === "ready";
  const displayedMessages = useMemo(() => {
    if (!shouldShowWelcomeMessage) {
      return messages;
    }

    if (messages.some((message) => message.id === WELCOME_MESSAGE_ID)) {
      return messages;
    }

    return [WELCOME_MESSAGE, ...messages];
  }, [messages, shouldShowWelcomeMessage]);

  return {
    blogSlug,
    error,
    hasMoreHistory: history.hasMoreHistory,
    isHistoryLoadingInitial: history.isHistoryLoadingInitial,
    isLoadingOlderHistory: history.isLoadingOlderHistory,
    isOpen,
    isWorking,
    loadOlderHistory: history.loadOlderHistory,
    messages: displayedMessages,
    requestTransform,
    sendQuestion,
    setIsOpen
  };
}
