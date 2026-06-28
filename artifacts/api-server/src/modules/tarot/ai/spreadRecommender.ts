import * as z from "zod";
import { getOpenAIClient, openaiModel } from "../../../lib/openaiConfig.js";
import { spreads } from "../data/spreads.js";
import { HINT_SYSTEM_PROMPT } from "./tarotPrompt.js";

export const spreadTypeSchema = z.enum([
  "single",
  "three",
  "relationship",
  "futureLover",
  "peachBlossom",
  "reconciliation",
  "trueHeart",
  "loveTree",
  "xRelationship",
]);

export const spreadRecommendationSchema = z.object({
  spreadType: spreadTypeSchema,
  reason: z.string().min(1).max(420),
  focusLabel: z.string().min(1).max(120),
  confidence: z.enum(["high", "medium", "low"]),
});

export type SpreadRecommendation = z.infer<typeof spreadRecommendationSchema>;
export type SpreadType = z.infer<typeof spreadTypeSchema>;

function compact(text: string, maxLength: number) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 1).trim()}…`;
}

function parseJsonObject(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return JSON.parse(trimmed);
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("Spread recommendation response did not contain JSON.");
  return JSON.parse(trimmed.slice(start, end + 1));
}

function optionLines() {
  return Object.values(spreads)
    .map((spread) => {
      const positions = spread.positions.map((position) => position.name).join(", ");
      return `- ${spread.id}: ${spread.name}, ${spread.cardCount} cards, positions: ${positions}`;
    })
    .join("\n");
}

export function buildLocalSpreadRecommendation(question: string): SpreadRecommendation {
  const lower = question.toLowerCase();

  if (/ex|reconcile|reconciliation|come back|back together|breakup|broke up|no contact|silence/.test(lower)) {
    return {
      spreadType: "reconciliation",
      focusLabel: "Reconnection",
      confidence: "high",
      reason: "This asks whether distance can repair, so Reconciliation separates the break, the barrier, the future, and the wiser approach.",
    };
  }

  if (/future lover|new love|someone new|meet|arrival|next relationship/.test(lower)) {
    return {
      spreadType: "futureLover",
      focusLabel: "Future love",
      confidence: "medium",
      reason: "This looks beyond one person, so Future Lover gives arrival, attraction, challenge, and direction without forcing one answer.",
    };
  }

  if (/they|them|him|her|love|relationship|crush|partner|feel|feeling|connection|mixed signal/.test(lower)) {
    return {
      spreadType: "trueHeart",
      focusLabel: "Inner feelings",
      confidence: "high",
      reason: "This has relational ambiguity, so True Heart separates what is shown outside from the feeling, block, truth, and possible movement underneath.",
    };
  }

  if (/choice|choose|decision|path|option|which|should i|move|job|career|work|interview|offer|business|money|school|exam/.test(lower)) {
    return {
      spreadType: "three",
      focusLabel: "Next move",
      confidence: "medium",
      reason: "This needs a clean decision shape, so Three Cards keeps the reading practical: what shaped it, what is active now, and what comes next.",
    };
  }

  if (/when|timing|soon|time|wait|now|later|right time/.test(lower)) {
    return {
      spreadType: "peachBlossom",
      focusLabel: "Timing signal",
      confidence: "medium",
      reason: "This is a timing question, so Peach Blossom helps separate what is appearing, what blocks movement, and where the trend is going.",
    };
  }

  if (/avoid|emotion|healing|fear|pattern|self|myself|truth|missing/.test(lower)) {
    return {
      spreadType: "three",
      focusLabel: "Self pattern",
      confidence: "medium",
      reason: "This is asking for a mirror, so Three Cards gives the pattern enough structure without making the reading feel heavy.",
    };
  }

  return {
    spreadType: "three",
    focusLabel: "Clear signal",
    confidence: "low",
    reason: "This is open-ended, so Three Cards gives the room a simple before-now-next shape before the cards are chosen.",
  };
}

function buildSpreadRecommendationPrompt(question: string) {
  return `Choose the best tarot spread for this user's question.

Question:
"${compact(question, 1000)}"

Available spreads:
${optionLines()}

Return JSON only:
{
  "spreadType": "one of the available spread ids",
  "reason": "one concise sentence explaining why this spread fits the question",
  "focusLabel": "2 to 4 words naming the focus of the reading",
  "confidence": "high | medium | low"
}

Rules:
- Do not answer the tarot question yet.
- Only choose the spread shape and explain why it helps.
- If the question involves a specific person's hidden feelings, prefer trueHeart.
- If the question involves an ex, breakup, no contact, or repair, prefer reconciliation.
- If the question asks about two paths, a job move, or a decision, prefer three unless a relationship-specific spread is clearly better.
- If the question is broad or unclear, choose three.
- Keep the reason grounded and app-friendly.`;
}

export async function generateSpreadRecommendation(question: string): Promise<SpreadRecommendation> {
  const response = await getOpenAIClient().chat.completions.create({
    model: openaiModel,
    max_completion_tokens: 220,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: HINT_SYSTEM_PROMPT },
      { role: "user", content: buildSpreadRecommendationPrompt(question) },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "";
  return spreadRecommendationSchema.parse(parseJsonObject(content));
}
