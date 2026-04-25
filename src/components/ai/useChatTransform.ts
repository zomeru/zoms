"use client";

import type { TransformMode } from "@/lib/ai/schemas";

import type { AssistantMessage } from "./chatTypes";
import { createId, isTransformResult } from "./chatTypes";

interface UseChatTransformInput {
  blogSlug: string | undefined;
  isWorking: boolean;
  markHydrationReady: () => void;
  setError: React.Dispatch<React.SetStateAction<string | undefined>>;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsWorking: React.Dispatch<React.SetStateAction<boolean>>;
  setMessages: React.Dispatch<React.SetStateAction<AssistantMessage[]>>;
}

export function useChatTransform(input: UseChatTransformInput) {
  async function requestTransform(mode: TransformMode): Promise<void> {
    if (!input.blogSlug || input.isWorking) {
      return;
    }

    input.setError(undefined);
    input.setIsWorking(true);
    input.markHydrationReady();

    try {
      const response = await fetch("/api/ai/transform", {
        body: JSON.stringify({
          mode,
          postSlug: input.blogSlug
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("Unable to transform this post right now.");
      }

      const payload: unknown = await response.json();

      if (!isTransformResult(payload)) {
        throw new Error("Unable to transform this post right now.");
      }

      const transform = payload;
      input.setMessages((currentMessages) => [
        ...currentMessages,
        {
          content: transform.transformedText,
          id: createId("assistant-transform"),
          role: "assistant",
          transform
        }
      ]);
      input.setIsOpen(true);
    } catch (caughtError) {
      input.setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to transform this post right now."
      );
    } finally {
      input.setIsWorking(false);
    }
  }

  return { requestTransform };
}
