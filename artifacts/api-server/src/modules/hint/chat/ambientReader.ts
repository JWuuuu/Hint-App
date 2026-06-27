/**
 * Ambient Hint chat — no tarot reading required.
 * Same OpenAI integration pattern as chatReader.ts.
 */

import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import {
  getOpenAIClient,
  openaiModel,
} from "../../../lib/openaiConfig.js";
import { HINT_AMBIENT_SYSTEM_PROMPT } from "./ambientPrompt.js";

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

  const response = await getOpenAIClient().chat.completions.create({
    model: openaiModel,
    max_completion_tokens: 600,
    messages,
  });

  const reply = response.choices[0]?.message?.content?.trim() ?? "";
  return reply || "I'm here. Say it again, a little differently?";
}
