/**
 * AI tarot reader — calls OpenAI with the Hint persona.
 */

import OpenAI from "openai";
import type { DrawnCard } from "../logic/drawCards.js";
import {
  openaiBaseURL,
  openaiModel,
  requireOpenAIKey,
} from "../../../lib/openaiConfig.js";
import { HINT_SYSTEM_PROMPT, buildReadingPrompt } from "./tarotPrompt.js";

const openai = new OpenAI({
  apiKey: requireOpenAIKey(),
  baseURL: openaiBaseURL,
  maxRetries: 0,
  timeout: 20_000,
});

export interface TarotInterpretation {
  interpretation: string;
  emotionalQuote: string;
}

export async function generateTarotReading(params: {
  question: string;
  emotionalContext: string | null | undefined;
  drawnCards: DrawnCard[];
  spreadType: string;
}): Promise<TarotInterpretation> {
  const userPrompt = buildReadingPrompt(params);

  const response = await openai.chat.completions.create({
    model: openaiModel,
    max_completion_tokens: 1024,
    messages: [
      { role: "system", content: HINT_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });

  const fullText = response.choices[0]?.message?.content ?? "";

  // Extract the QUOTE line from the response
  const quoteMatch = fullText.match(/\nQUOTE:\s*(.+)/);
  const emotionalQuote = quoteMatch
    ? quoteMatch[1].trim().replace(/^["']|["']$/g, "")
    : extractFallbackQuote(fullText);

  // Remove the QUOTE line from the interpretation
  const interpretation = fullText.replace(/\nQUOTE:.*$/s, "").trim();

  return { interpretation, emotionalQuote };
}

/**
 * Fallback: extract the last complete sentence as the emotional quote.
 */
function extractFallbackQuote(text: string): string {
  const sentences = text.match(/[^.!?]+[.!?]/g) ?? [];
  const last = sentences[sentences.length - 1]?.trim();
  return last ?? text.slice(0, 100).trim();
}
