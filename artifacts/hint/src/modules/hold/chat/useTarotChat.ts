/**
 * Chat state hook — owns the message list + the send action for one
 * active reading session. Lives inside TarotChatRoom.
 */

import { useCallback, useState } from "react";
import { useSendTarotChatMessage } from "@workspace/api-client-react";
import type { ReadingSession, ChatMessage } from "./types";
import { newMessageId } from "./types";
import { buildChatPayload } from "./buildChatContext";
import { useLanguage } from "../../../lib/i18n";
import { trackEvent } from "../../../lib/analytics";

export interface UseTarotChatResult {
  messages: ChatMessage[];
  isThinking: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  clear: () => void;
}

export function useTarotChat(
  session: ReadingSession,
  onMessagesChange: (next: ChatMessage[]) => void
): UseTarotChatResult {
  const { t } = useLanguage();
  const [error, setError] = useState<string | null>(null);
  const mutation = useSendTarotChatMessage({
    mutation: {
      retry: false,
    },
  });

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setError(null);
      trackEvent("follow_up_sent", {
        readingId: session.active.readingId,
        source: "tarot-reading",
        spreadType: session.spreadType,
        textLength: trimmed.length,
      });

      const userMessage: ChatMessage = {
        id: newMessageId(),
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
      };
      const withUser = [...session.messages, userMessage];
      onMessagesChange(withUser);

      try {
        // Build payload from the in-flight session (with user's turn already pushed)
        const payload = buildChatPayload(
          { ...session, messages: withUser },
          trimmed
        );
        // The API expects only prior messages, not the new followUp duplicated
        const apiPayload = {
          ...payload,
          messages: payload.messages.slice(0, -1),
        };
        const reply = await mutation.mutateAsync({ data: apiPayload });

        const assistantMessage: ChatMessage = {
          id: newMessageId(),
          role: "assistant",
          content: reply.message,
          createdAt: reply.createdAt,
        };
        onMessagesChange([...withUser, assistantMessage]);
      } catch (e) {
        const msg = e instanceof Error ? e.message : t("chat.error.quiet");
        setError(msg);
        // Roll the user message back out so they can retry without a stranded turn
        onMessagesChange(session.messages);
      }
    },
    [session, mutation, onMessagesChange, t]
  );

  const clear = useCallback(() => {
    onMessagesChange([]);
    setError(null);
  }, [onMessagesChange]);

  return {
    messages: session.messages,
    isThinking: mutation.isPending,
    error,
    sendMessage,
    clear,
  };
}
