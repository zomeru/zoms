"use client";

import { useMemo } from "react";

import { extractErrorMessage, processStreamChunk } from "./chatStreamHelpers";
import type { AssistantMessage } from "./chatTypes";
import { createId } from "./chatTypes";

interface UseChatStreamInput {
  blogSlug: string | undefined;
  isWorking: boolean;
  markHydrationReady: () => void;
  pathname: string;
  setError: React.Dispatch<React.SetStateAction<string | undefined>>;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsWorking: React.Dispatch<React.SetStateAction<boolean>>;
  setMessages: React.Dispatch<React.SetStateAction<AssistantMessage[]>>;
}

export function useChatStream(input: UseChatStreamInput) {
  return useMemo(
    () => ({
      async sendQuestion(question: string): Promise<void> {
        const trimmedQuestion = question.trim();

        if (trimmedQuestion.length === 0 || input.isWorking) {
          return;
        }

        const assistantMessageId = createId("assistant");

        input.setError(undefined);
        input.setIsOpen(true);
        input.setIsWorking(true);
        input.markHydrationReady();
        input.setMessages((currentMessages) => [
          ...currentMessages,
          {
            content: trimmedQuestion,
            id: createId("user"),
            role: "user"
          },
          {
            content: "",
            id: assistantMessageId,
            isPending: true,
            role: "assistant"
          }
        ]);

        try {
          const response = await fetch("/api/ai/chat", {
            body: JSON.stringify({
              blogSlug: input.blogSlug,
              pathname: input.pathname,
              question: trimmedQuestion
            }),
            headers: {
              "Content-Type": "application/json"
            },
            method: "POST"
          });

          if (!response.ok || !response.body) {
            throw new Error(
              await extractErrorMessage(response, "Unable to reach the assistant right now.")
            );
          }

          await processStreamChunk(
            {
              assistantMessageId,
              decoder: new TextDecoder(),
              reader: response.body.getReader(),
              setMessages: input.setMessages
            },
            ""
          );
        } catch (caughtError) {
          input.setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to reach the assistant right now."
          );
          input.setMessages((currentMessages) =>
            currentMessages.filter((message) => message.id !== assistantMessageId)
          );
        } finally {
          input.setIsWorking(false);
        }
      }
    }),
    [input]
  );
}
