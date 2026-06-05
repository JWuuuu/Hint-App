/**
 * Ambient Hint chat — no tarot reading required.
 * Same OpenAI integration pattern as chatReader.ts.
 */

import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import {
  openaiBaseURL,
  openaiModel,
  requireOpenAIKey,
} from "../../../lib/openaiConfig.js";
import { HINT_AMBIENT_SYSTEM_PROMPT } from "./ambientPrompt.js";

const openai = new OpenAI({
  apiKey: requireOpenAIKey(),
  baseURL: openaiBaseURL,
  maxRetries: 0,
  timeout: 20_000,
});

export interface AmbientChatTurn {
  role: "user" | "assistant";
  content: string;
}

export async function generateAmbientChatReply(params: {
  messages: AmbientChatTurn[];
  followUp: string;
}): Promise<string> {
  // Cap prior history to the last 16 turns
  const trimmed = params.messages.slice(-16);

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: HINT_AMBIENT_SYSTEM_PROMPT },
    ...trimmed.map<ChatCompletionMessageParam>((m) => ({
      role: m.role,
      content: m.content,
    })),
    { role: "user", content: params.followUp },
  ];

  const response = await openai.chat.completions.create({
    model: openaiModel,
    max_completion_tokens: 600,
    messages,
  });

  const reply = response.choices[0]?.message?.content?.trim() ?? "";
  return reply || "I'm here. Say it again, a little differently?";
}
