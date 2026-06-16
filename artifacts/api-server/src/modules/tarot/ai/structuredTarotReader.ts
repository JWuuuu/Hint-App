import * as z from "zod";
import type { DrawnCard } from "../logic/drawCards.js";
import { getOpenAIClient, openaiModel } from "../../../lib/openaiConfig.js";
import { HINT_SYSTEM_PROMPT } from "./tarotPrompt.js";

export const structuredTarotReadingSchema = z.object({
  signal_type: z.enum([
    "clear_signal",
    "mixed_signal",
    "opening",
    "blocked",
    "soft_yes",
    "soft_no",
  ]),
  overall_summary: z.string().min(1).max(900),
  cards: z.array(z.object({
    position: z.string().min(1).max(80),
    card_name: z.string().min(1).max(80),
    orientation: z.enum(["upright", "reversed"]),
    meaning: z.string().min(1).max(800),
  })).min(1).max(10),
  final_action_advice: z.string().min(1).max(700),
  follow_up_invitation: z.string().min(1).max(300),
});

export type StructuredTarotReading = z.infer<typeof structuredTarotReadingSchema>;

function compact(text: string, maxLength: number) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  const slice = clean.slice(0, maxLength - 1);
  const sentenceEnd = Math.max(slice.lastIndexOf("."), slice.lastIndexOf("?"), slice.lastIndexOf("!"));
  return `${slice.slice(0, sentenceEnd > 80 ? sentenceEnd + 1 : maxLength - 1).trim()}`;
}

function getSignalType(cards: readonly DrawnCard[]): StructuredTarotReading["signal_type"] {
  const reversedCount = cards.filter((card) => card.isReversed).length;
  const intenseCards = new Set(["13-death", "15-devil", "16-tower", "18-moon", "ten-swords", "five-cups"]);
  const openingCards = new Set(["0-fool", "1-magician", "17-star", "19-sun", "21-world", "ace-wands", "ace-cups"]);
  const hasIntense = cards.some((draw) => intenseCards.has(draw.card.id));
  const hasOpening = cards.some((draw) => openingCards.has(draw.card.id));

  if (reversedCount >= Math.ceil(cards.length * 0.6) || hasIntense) return "blocked";
  if (hasOpening && reversedCount === 0) return "opening";
  if (cards.length > 1 && reversedCount > 0) return "mixed_signal";
  return "clear_signal";
}

export function buildLocalStructuredTarotReading(params: {
  question: string;
  emotionalContext: string | null | undefined;
  drawnCards: DrawnCard[];
  spreadType: string;
}): StructuredTarotReading {
  const { question, emotionalContext, drawnCards } = params;
  const anchor = drawnCards[0];
  const cardReadings = drawnCards.map((draw) => {
    const orientation: "reversed" | "upright" = draw.isReversed ? "reversed" : "upright";
    const meaning = draw.isReversed ? draw.card.reversed : draw.card.upright;
    const secondSentence = draw.isReversed
      ? `In the ${draw.position} position, it asks where the pattern is blocked, delayed, or being handled from fear.`
      : `In the ${draw.position} position, it asks you to treat this signal as the part of the story that needs honest attention.`;

    return {
      position: draw.position,
      card_name: draw.card.name,
      orientation,
      meaning: `${compact(meaning, 260)} ${secondSentence}`,
    };
  });

  const questionText = question.trim() || "your question";
  const contextSignal = emotionalContext?.trim()
    ? "The story you gave matters here; the cards are not reading this in a vacuum."
    : "The cards are reading the question directly, without extra story around it.";
  const anchorLine = anchor
    ? `The strongest signal starts with ${anchor.position}: ${anchor.card.name}.`
    : "The strongest signal is to slow down and read the pattern as a whole.";

  return {
    signal_type: getSignalType(drawnCards),
    cards: cardReadings,
    overall_summary: `${anchorLine} For "${questionText}", the spread points to a clear direction rather than a guaranteed outcome: look at what is already showing itself, then respond from there.`,
    final_action_advice: `${contextSignal} Do not force a dramatic move just to feel in control. Take the smallest action that matches the clearest card, then watch what becomes easier or harder after that.`,
    follow_up_invitation: "Ask one follow-up about the part you are most afraid to name.",
  };
}

function buildStructuredPrompt(params: {
  question: string;
  emotionalContext: string | null | undefined;
  drawnCards: DrawnCard[];
  spreadType: string;
}) {
  const cardLines = params.drawnCards
    .map((draw, index) => {
      const orientation = draw.isReversed ? "reversed" : "upright";
      const meaning = draw.isReversed ? draw.card.reversed : draw.card.upright;
      return `${index + 1}. ${draw.position} - ${draw.card.name} (${orientation})
Keywords: ${draw.card.keywords.join(", ")}
Traditional meaning: ${meaning}`;
    })
    .join("\n\n");

  return `Write a compact structured tarot reading for Hint.

Question:
"${params.question}"

Spread type: ${params.spreadType}

Story/context:
${params.emotionalContext?.trim() || "No extra story was provided."}

Cards:
${cardLines}

Return JSON only with exactly this shape:
{
  "signal_type": "clear_signal | mixed_signal | opening | blocked | soft_yes | soft_no",
  "cards": [
    {
      "position": "position label",
      "card_name": "card name",
      "orientation": "upright | reversed",
      "meaning": "2 to 3 short sentences about this card in this position"
    }
  ],
  "overall_summary": "a strong, human answer to the question, not a neutral summary",
  "final_action_advice": "one grounded next direction; no guarantees, no risky commands",
  "follow_up_invitation": "one short invitation to ask more"
}

Rules:
- Keep the cards array in the exact same order as given.
- Start the reading from the card-by-card evidence, not the final answer.
- The overall answer should sound like a real tarot reader: clear, direct, human.
- Do not claim certainty, guaranteed future outcomes, or tell the user to make dangerous or high-stakes decisions.
- Do not include markdown.`;
}

function parseJsonObject(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return JSON.parse(trimmed);
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("Structured tarot response did not contain JSON.");
  return JSON.parse(trimmed.slice(start, end + 1));
}

export async function generateStructuredTarotReading(params: {
  question: string;
  emotionalContext: string | null | undefined;
  drawnCards: DrawnCard[];
  spreadType: string;
}): Promise<StructuredTarotReading> {
  const response = await getOpenAIClient().chat.completions.create({
    model: openaiModel,
    max_completion_tokens: 900,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: HINT_SYSTEM_PROMPT },
      { role: "user", content: buildStructuredPrompt(params) },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "";
  const parsed = parseJsonObject(content);
  return structuredTarotReadingSchema.parse(parsed);
}
