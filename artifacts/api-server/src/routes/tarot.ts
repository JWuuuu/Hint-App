/**
 * Tarot API routes — thin handlers that delegate to the tarot module.
 * Business logic lives in src/modules/tarot, not here.
 */

import { Router } from "express";
import * as z from "zod";
import { drawCards, type DrawnCard } from "../modules/tarot/logic/drawCards.js";
import { generateTarotReading } from "../modules/tarot/ai/tarotReader.js";
import {
  buildLocalStructuredTarotReading,
  generateStructuredTarotReading,
} from "../modules/tarot/ai/structuredTarotReader.js";
import { generateTarotChatReply } from "../modules/tarot/chat/chatReader.js";
import { deck as TAROT_DECK } from "../modules/tarot/data/deck.js";
import { logger } from "../lib/logger.js";
import { consumeAiBudget } from "../lib/aiCostGuards.js";
import { db, readingsTable } from "@workspace/db";

const router = Router();

function isQuotaError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /429|quota|billing|too many requests|missing openai|credentials|api[_\s-]?key/i.test(message);
}

function firstContextLine(emotionalContext: string | null | undefined): string | null {
  const line = emotionalContext
    ?.split("\n")
    .map((part) => part.trim())
    .find(Boolean);

  return line?.replace(/^Focus:\s*/i, "") ?? null;
}

function buildLocalTarotReading({
  question,
  emotionalContext,
  drawnCards,
}: {
  question: string;
  emotionalContext: string | null | undefined;
  drawnCards: DrawnCard[];
}) {
  const context = firstContextLine(emotionalContext);
  const cardNotes = drawnCards.map((draw) => {
    const orientation = draw.isReversed ? "reversed" : "upright";
    const meaning = draw.isReversed ? draw.card.reversed : draw.card.upright;
    return `${draw.position}: ${draw.card.name}, ${orientation}\nMeaning: ${meaning}`;
  });
  const focal = drawnCards[0];
  const focalKeywords = focal?.card.keywords.slice(0, 2).join(" and ");

  return {
    interpretation: [
      "Here is the card note for your reading.",
      context ? `Focus: ${context}` : null,
      `Question: ${question}`,
      ...cardNotes,
      "Next step: read this as a mirror, not a verdict. Ask where this already feels true, then choose one honest next move.",
      "The live AI reader is unavailable right now, so this is a simpler deck-meaning reading. You can still ask a follow-up below.",
    ]
      .filter(Boolean)
      .join("\n\n"),
    emotionalQuote: focal
      ? `First hint: ${focal.card.name}${focalKeywords ? ` is about ${focalKeywords}` : ""}.`
      : "The cards are still offering a quiet mirror.",
  };
}

/* ─── POST /tarot/reading ──────────────────────────────────────── */

const readingInputSchema = z.object({
  question: z.string().min(1, "Question is required").max(1000),
  spreadType: z.enum([
    "single",
    "three",
    "relationship",
    "futureLover",
    "peachBlossom",
    "reconciliation",
    "trueHeart",
    "loveTree",
    "xRelationship",
  ]),
  emotionalContext: z.string().max(2000).nullish(),
  anonId: z.string().max(200).nullish(),
});

router.post("/tarot/reading", async (req, res) => {
  const parsed = readingInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const { question, spreadType, emotionalContext, anonId } = parsed.data;

  // Cards are predetermined server-side — before user interaction
  const drawnCards = drawCards(spreadType);

  if (!consumeAiBudget(req, res, { feature: "tarot_reading", dailyLimit: 5 })) {
    return;
  }

  let interpretation: string;
  let emotionalQuote: string;

  try {
    ({ interpretation, emotionalQuote } = await generateTarotReading({
      question,
      emotionalContext,
      drawnCards,
      spreadType,
    }));
  } catch (err) {
    logger.error({ err }, "Failed to generate tarot reading");
    if (!isQuotaError(err)) {
      res.status(502).json({
        error: "The reading service could not answer right now.",
      });
      return;
    }

    ({ interpretation, emotionalQuote } = buildLocalTarotReading({
      question,
      emotionalContext,
      drawnCards,
    }));
  }

  // Persist a lightweight summary to the user's history when we know who they
  // are. Never let a save failure break the reading itself.
  if (anonId && drawnCards[0]) {
    try {
      await db.insert(readingsTable).values({
        anonId,
        cardName: drawnCards[0].card.name,
        whisper: emotionalQuote,
        spreadType,
        question,
        territory: emotionalContext ?? null,
      });
    } catch (err) {
      logger.error({ err }, "Failed to persist reading to history");
    }
  }

  const reading = {
    id: `reading-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    cards: drawnCards.map((draw) => ({
      card: {
        id: draw.card.id,
        name: draw.card.name,
        arcana: draw.card.arcana,
        suit: draw.card.suit,
        keywords: draw.card.keywords,
        upright: draw.card.upright,
        reversed: draw.card.reversed,
      },
      isReversed: draw.isReversed,
      position: draw.position,
    })),
    interpretation,
    emotionalQuote,
    spreadType,
    createdAt: new Date().toISOString(),
  };

  res.json(reading);
});

/* ─── POST /tarot/structured-reading ───────────────────────────── */

const structuredReadingCardInputSchema = z.object({
  cardId: z.string().min(1).max(80),
  name: z.string().min(1).max(80),
  orientation: z.enum(["upright", "reversed"]),
  position: z.string().min(1).max(80),
  keywords: z.array(z.string()).optional(),
  upright: z.string().optional(),
  reversed: z.string().optional(),
  arcana: z.enum(["major", "minor"]).optional(),
  suit: z.string().nullable().optional(),
});

const structuredReadingInputSchema = z.object({
  question: z.string().min(1).max(1000),
  spreadType: z.enum([
    "single",
    "three",
    "relationship",
    "futureLover",
    "peachBlossom",
    "reconciliation",
    "trueHeart",
    "loveTree",
    "xRelationship",
  ]),
  emotionalContext: z.string().max(2000).nullish(),
  focusLabel: z.string().max(200).nullish(),
  requiredCardCount: z.number().int().min(1).max(10),
  cards: z.array(structuredReadingCardInputSchema).min(1).max(10),
});

function rehydrateStructuredCards(cards: z.infer<typeof structuredReadingCardInputSchema>[]): DrawnCard[] {
  return cards.map((card) => {
    const canonical = TAROT_DECK.find((deckCard) => deckCard.id === card.cardId);
    return {
      card: canonical ?? {
        id: card.cardId,
        name: card.name,
        arcana: card.arcana ?? (/^\d+-/.test(card.cardId) ? "major" : "minor"),
        suit: card.suit ?? null,
        keywords: card.keywords ?? [],
        upright: card.upright ?? `${card.name} asks you to read the clearest signal in this position.`,
        reversed: card.reversed ?? `${card.name} reversed asks where this signal is blocked or delayed.`,
      },
      isReversed: card.orientation === "reversed",
      position: card.position,
    };
  });
}

router.post("/tarot/structured-reading", async (req, res) => {
  const parsed = structuredReadingInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const data = parsed.data;
  if (data.cards.length !== data.requiredCardCount) {
    res.status(400).json({ error: "Selected card count does not match the spread." });
    return;
  }

  if (!consumeAiBudget(req, res, { feature: "tarot_structured_reading", dailyLimit: 10 })) {
    return;
  }

  const drawnCards = rehydrateStructuredCards(data.cards);

  try {
    const reading = await generateStructuredTarotReading({
      question: data.question,
      emotionalContext: data.emotionalContext,
      drawnCards,
      spreadType: data.spreadType,
    });
    res.json(reading);
  } catch (err) {
    logger.error({ err }, "Failed to generate structured tarot reading");
    res.json(buildLocalStructuredTarotReading({
      question: data.question,
      emotionalContext: data.emotionalContext,
      drawnCards,
      spreadType: data.spreadType,
    }));
  }
});

/* ─── POST /tarot/chat ─────────────────────────────────────────── */

const cardDrawSchema = z.object({
  card: z.object({
    id: z.string(),
    name: z.string(),
    arcana: z.string(),
    suit: z.string().nullable().optional(),
    keywords: z.array(z.string()),
    upright: z.string(),
    reversed: z.string(),
  }),
  isReversed: z.boolean(),
  position: z.string(),
});

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const chatInputSchema = z.object({
  originalQuestion: z.string().min(1).max(1000),
  territory: z.string().min(1).max(200),
  emotionalContext: z.string().max(2000).nullish(),
  spreadType: z.enum([
    "single",
    "three",
    "relationship",
    "futureLover",
    "peachBlossom",
    "reconciliation",
    "trueHeart",
    "loveTree",
    "xRelationship",
  ]),
  cards: z.array(cardDrawSchema).min(1).max(10),
  initialReading: z.string().min(1).max(8000),
  messages: z.array(chatMessageSchema).max(40),
  followUp: z.string().min(1).max(2000),
});

function buildLocalTarotChatReply(data: z.infer<typeof chatInputSchema>): string {
  const focal = data.cards[0];
  const meaning = focal
    ? focal.isReversed
      ? focal.card.reversed
      : focal.card.upright
    : null;
  const cardLine = focal
    ? `${focal.card.name}${focal.isReversed ? " reversed" : ""} points back to this: ${meaning}`
    : "The reading is still pointing you back to your original question.";

  return [
    "The live AI reader is unavailable right now, so here is the simple thread.",
    cardLine,
    `For your follow-up: ${data.followUp}`,
    "Start with what you know for sure. Then name what you are guessing, hoping, or afraid of. The useful answer is probably between those two.",
    "If you want more, add one concrete detail from the situation.",
  ].join("\n\n");
}

router.post("/tarot/chat", async (req, res) => {
  const parsed = chatInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const data = parsed.data;

  if (!consumeAiBudget(req, res, { feature: "tarot_chat", dailyLimit: 20 })) {
    return;
  }

  // Rehydrate cards into the same DrawnCard shape the AI module expects
  // by matching the id back to the canonical deck where possible.
  const drawnCards: DrawnCard[] = data.cards.map((c) => {
    const canonical = TAROT_DECK.find((d) => d.id === c.card.id);
    return {
      card: canonical ?? {
        id: c.card.id,
        name: c.card.name,
        arcana: c.card.arcana as DrawnCard["card"]["arcana"],
        suit: (c.card.suit ?? null) as DrawnCard["card"]["suit"],
        keywords: c.card.keywords,
        upright: c.card.upright,
        reversed: c.card.reversed,
      },
      isReversed: c.isReversed,
      position: c.position,
    };
  });

  let message: string;

  try {
    message = await generateTarotChatReply({
      originalQuestion: data.originalQuestion,
      territory: data.territory,
      emotionalContext: data.emotionalContext,
      spreadType: data.spreadType,
      cards: drawnCards,
      initialReading: data.initialReading,
      messages: data.messages,
      followUp: data.followUp,
    });
  } catch (err) {
    logger.error({ err }, "Failed to generate tarot chat reply");
    if (!isQuotaError(err)) {
      res.status(502).json({
        error: "The reading service could not answer right now.",
      });
      return;
    }

    message = buildLocalTarotChatReply(data);
  }

  res.json({
    message,
    createdAt: new Date().toISOString(),
  });
});

export default router;
