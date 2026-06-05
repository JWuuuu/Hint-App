/**
 * Tarot chat reader — handles follow-up turns in an ongoing reading session.
 * Same OpenAI integration pattern as tarotReader.ts.
 */

import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import {
  openaiBaseURL,
  openaiModel,
  requireOpenAIKey,
} from "../../../lib/openaiConfig.js";
import type { DrawnCard } from "../logic/drawCards.js";
import {
  HINT_CHAT_SYSTEM_PROMPT,
  buildSessionContextBlock,
} from "./chatPrompt.js";

const openai = new OpenAI({
  apiKey: requireOpenAIKey(),
  baseURL: openaiBaseURL,
  maxRetries: 0,
  timeout: 20_000,
});

export interface TarotChatTurn {
  role: "user" | "assistant";
  content: string;
}

export async function generateTarotChatReply(params: {
  originalQuestion: string;
  territory: string;
  emotionalContext: string | null | undefined;
  spreadType: string;
  cards: DrawnCard[];
  initialReading: string;
  messages: TarotChatTurn[];
  followUp: string;
}): Promise<string> {
  const sessionContext = buildSessionContextBlock({
    originalQuestion: params.originalQuestion,
    territory: params.territory,
    emotionalContext: params.emotionalContext,
    spreadType: params.spreadType,
    cards: params.cards,
    initialReading: params.initialReading,
  });

  // Cap prior history to the last 12 turns to keep context bounded.
  const trimmed = params.messages.slice(-12);

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: HINT_CHAT_SYSTEM_PROMPT },
    { role: "system", content: sessionContext },
    ...trimmed.map<ChatCompletionMessageParam>((m) => ({
      role: m.role,
      content: m.content,
    })),
    { role: "user", content: params.followUp },
  ];

  const response = await openai.chat.completions.create({
    model: openaiModel,
    max_completion_tokens: 700,
    messages,
  });

  const reply = response.choices[0]?.message?.content?.trim() ?? "";
  return reply || "I'm still with you. Could you say that again, a little differently?";
}
