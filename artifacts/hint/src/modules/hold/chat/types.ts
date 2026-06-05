/**
 * Tarot chat session types — designed to map cleanly to future DB tables
 * (reading_sessions, chat_messages, redraw_events).
 *
 * No persistence is wired today. Everything lives in React state.
 * Shape stays stable so a later migration is mechanical.
 */

import type { TarotCardDraw, TarotReading } from "@workspace/api-client-react";

export type SpreadType =
  | "single"
  | "three"
  | "relationship"
  | "futureLover"
  | "peachBlossom"
  | "reconciliation"
  | "trueHeart"
  | "loveTree"
  | "xRelationship";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
}

/**
 * Snapshot of the *current* active reading in a session.
 * On redraw, a new ActiveReading replaces this one, but the parent
 * ReadingSession increments redrawCount and (optionally, later) keeps
 * a history of previous readings.
 */
export interface ActiveReading {
  readingId: string;
  cards: TarotCardDraw[];
  initialReading: string;
  emotionalQuote: string;
  spreadType: SpreadType;
  drawnAt: string;
}

/**
 * The full session a future DB row would represent.
 */
export interface ReadingSession {
  sessionId: string;
  originalQuestion: string;
  territory: string;
  emotionalContext?: string;
  spreadType: SpreadType;
  active: ActiveReading;
  messages: ChatMessage[];
  redrawCount: number;
  startedAt: string;
}

/** Helper: convert an API reading + session params into an ActiveReading. */
export function readingToActive(
  reading: TarotReading,
  spreadType: SpreadType
): ActiveReading {
  return {
    readingId: reading.id,
    cards: reading.cards,
    initialReading: reading.interpretation,
    emotionalQuote: reading.emotionalQuote,
    spreadType,
    drawnAt: reading.createdAt,
  };
}

/** Helper: stable id for ephemeral client-side messages. */
export function newMessageId(): string {
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
