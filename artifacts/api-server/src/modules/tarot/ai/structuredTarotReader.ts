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

function getSignalLanguage(signalType: StructuredTarotReading["signal_type"]) {
  switch (signalType) {
    case "opening":
      return {
        label: "a very clear positive signal",
        direction: "this is more supportive of moving forward than staying frozen, as long as the next move is steady rather than impulsive",
      };
    case "clear_signal":
    case "soft_yes":
      return {
        label: "a positive signal with a clear direction",
        direction: "the cards lean toward movement, but they want you to act from what is already visible instead of waiting for perfect reassurance",
      };
    case "blocked":
      return {
        label: "a heavy blocked signal",
        direction: "this is not a spread that supports forcing the situation right now; it asks you to stop feeding the part that is draining your judgment",
      };
    case "soft_no":
      return {
        label: "a warning signal more than a green light",
        direction: "the cards are not saying there is no chance, but they are telling you not to trust the surface version too quickly",
      };
    case "mixed_signal":
    default:
      return {
        label: "a mixed signal",
        direction: "the cards do not fully close the door, but they also do not give an easy yes; you can keep watching, but not blindly invest more before the pattern becomes clearer",
      };
  }
}

function getPositionFrame(position: string, index: number, cardCount: number) {
  const normalized = position.toLowerCase();
  if (/past|before|root|break|cause/.test(normalized)) {
    return "This shows what has been shaping the situation before this moment.";
  }
  if (/present|now|outer|you|trunk|appears|signal/.test(normalized)) {
    return "This shows the energy that is active right now.";
  }
  if (/future|next|direction|trend|gain|crown|fruit|result/.test(normalized)) {
    return "This points to where the pattern is likely to move if nothing important changes.";
  }
  if (/block|barrier|challenge|obstacle/.test(normalized)) {
    return "This names what is slowing the situation down.";
  }
  if (/advice|approach|action/.test(normalized)) {
    return "This is the card's direct guidance for how to move.";
  }
  if (/them|feeling|other|between|connection|true view/.test(normalized)) {
    return "This describes the relational thread showing up in this position.";
  }
  if (cardCount === 3 && index === 0) return "This shows the influence that brought you here.";
  if (cardCount === 3 && index === 1) return "This shows the real pressure or energy in the present.";
  if (cardCount === 3 && index === 2) return "This points to the next movement if the pattern continues.";
  return "This shows the specific part of the reading that wants attention here.";
}

export function buildLocalStructuredTarotReading(params: {
  question: string;
  emotionalContext: string | null | undefined;
  drawnCards: DrawnCard[];
  spreadType: string;
}): StructuredTarotReading {
  const { question, emotionalContext, drawnCards } = params;
  const signalType = getSignalType(drawnCards);
  const signal = getSignalLanguage(signalType);
  const cardReadings = drawnCards.map((draw, index) => {
    const orientation: "reversed" | "upright" = draw.isReversed ? "reversed" : "upright";
    const meaning = draw.isReversed ? draw.card.reversed : draw.card.upright;
    const frame = getPositionFrame(draw.position, index, drawnCards.length);

    return {
      position: draw.position,
      card_name: draw.card.name,
      orientation,
      meaning: `${frame} ${compact(meaning, 320)}`,
    };
  });

  const questionText = question.trim() || "your question";
  const storySignal = emotionalContext?.trim()
    ? "Because the story already has emotional weight, "
    : "";

  return {
    signal_type: signalType,
    cards: cardReadings,
    overall_summary: `For "${questionText}", these ${drawnCards.length} cards give ${signal.label}. ${signal.direction}.`,
    final_action_advice: `${storySignal}your next move is to follow the spread's clearest direction without turning it into an absolute command. Act on what the cards are repeatedly showing, and stop giving energy to the part that only creates more guessing.`,
    follow_up_invitation: "If you want, tell me where this is most tangled right now, and I can help you read the next step through these cards more closely.",
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
  "overall_summary": "Overall Reading: first sentence directly answers the user's question and names the whole spread trend as positive, negative/blocked, or mixed. Do not explain a single card here.",
  "cards": [
    {
      "position": "position label",
      "card_name": "card name",
      "orientation": "upright | reversed",
      "meaning": "Card Breakdown: 2 to 3 short sentences about this card in this exact position"
    }
  ],
  "final_action_advice": "Final Guidance: one clear next direction; no absolute commands and no vague depends-on-your-situation language",
  "follow_up_invitation": "Follow Up Invitation: one warm tarot-reader invitation to share more story"
}

Rules:
- Keep the cards array in the exact same order as given.
- The user's first visible sentence will be overall_summary, so it must not start by explaining the first card.
- Do not write "Short Answer" or "What does the card mean" anywhere.
- overall_summary must directly answer the user's question and name the full spread trend: clearly positive, warning/blocked, or mixed.
- overall_summary must synthesize all cards together. Do not discuss individual card meanings there.
- cards[].meaning is the second layer: explain each card through its position, such as past/before influence, now/current energy, future/next trend, block, advice, relationship thread, etc. Do not hard-code Past/Now/Future for spreads that use different labels.
- final_action_advice must give a direction from the cards. Avoid empty neutrality such as "it depends," "consider your options," or "use your judgment."
- follow_up_invitation should sound like a real tarot reader inviting more context, not customer support language.
- The overall answer should sound like a real tarot reader: clear, direct, human, and specific to the question.
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
