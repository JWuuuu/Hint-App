/**
 * Build the API payload for /tarot/chat from the current session state.
 * Single source of truth for what the backend sees on every follow-up turn.
 */

import type { TarotChatInput } from "@workspace/api-client-react";
import type { ReadingSession, ChatMessage } from "./types";

/** Strip ids/timestamps — the API only wants role + content. */
export function messagesForApi(
  messages: ChatMessage[]
): { role: "user" | "assistant"; content: string }[] {
  return messages.map((m) => ({ role: m.role, content: m.content }));
}

export function buildChatPayload(
  session: ReadingSession,
  followUp: string
): TarotChatInput {
  return {
    originalQuestion: session.originalQuestion,
    territory: session.territory,
    emotionalContext: session.emotionalContext,
    spreadType: session.spreadType,
    cards: session.active.cards,
    initialReading: session.active.initialReading,
    messages: messagesForApi(session.messages),
    followUp,
  };
}
