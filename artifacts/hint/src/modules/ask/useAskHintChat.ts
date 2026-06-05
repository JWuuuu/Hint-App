/**
 * Standalone ambient-chat hook — no tarot reading attached.
 * Mirrors useTarotChat in shape but talks to /hint/chat.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useSendAmbientChatMessage } from "@workspace/api-client-react";
import type { ChatMessage } from "../hold/chat/types";
import { newMessageId } from "../hold/chat/types";
import { useLanguage } from "../../lib/i18n";

export interface UseAskHintChatResult {
  messages: ChatMessage[];
  isThinking: boolean;
  isLimited: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
}

function readStatus(error: unknown): number | null {
  return typeof error === "object" && error ? (error as { status?: number }).status ?? null : null;
}

function readRetryAfter(error: unknown): number {
  if (!error || typeof error !== "object") return 0;

  const headers = (error as { headers?: Headers }).headers;
  const retryAfter = headers?.get("retry-after");
  if (!retryAfter) return 0;

  const seconds = Number(retryAfter);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);

  const retryAt = Date.parse(retryAfter);
  return Number.isNaN(retryAt) ? 0 : Math.max(0, retryAt - Date.now());
}

export function useAskHintChat(): UseAskHintChatResult {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [limitedUntil, setLimitedUntil] = useState(0);
  const inFlightRef = useRef(false);
  const mutation = useSendAmbientChatMessage({
    mutation: {
      retry: false,
    },
  });

  useEffect(() => {
    if (limitedUntil <= Date.now()) return;

    const timeout = window.setTimeout(
      () => setLimitedUntil(0),
      Math.max(0, limitedUntil - Date.now()),
    );

    return () => window.clearTimeout(timeout);
  }, [limitedUntil]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      if (inFlightRef.current || mutation.isPending) return;

      if (limitedUntil > Date.now()) {
        setError(t("ask.error.limit"));
        return;
      }

      inFlightRef.current = true;
      setError(null);

      const userMessage: ChatMessage = {
        id: newMessageId(),
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
      };
      const withUser = [...messages, userMessage];
      setMessages(withUser);

      try {
        const reply = await mutation.mutateAsync({
          data: {
            messages: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            followUp: trimmed,
          },
        });

        const assistantMessage: ChatMessage = {
          id: newMessageId(),
          role: "assistant",
          content: reply.message,
          createdAt: reply.createdAt,
        };
        setMessages([...withUser, assistantMessage]);
      } catch (e) {
        const status = readStatus(e);
        const msg = e instanceof Error ? e.message : String(e ?? "");
        if (status === 429) {
          setLimitedUntil(Date.now() + Math.max(readRetryAfter(e), 10_000));
          setError(t("ask.error.limit"));
        } else {
          setError(
            /quota|billing|too many requests/i.test(msg)
              ? t("ask.error.quota")
              : t("ask.error.quiet"),
          );
        }
        // Roll the user message back out so the user can retry without a stranded turn
        setMessages(messages);
      } finally {
        inFlightRef.current = false;
      }
    },
    [limitedUntil, messages, mutation, t]
  );

  return {
    messages,
    isThinking: mutation.isPending,
    isLimited: limitedUntil > Date.now(),
    error,
    sendMessage,
  };
}
