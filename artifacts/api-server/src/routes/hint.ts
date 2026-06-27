/**
 * Hint ambient chat route — standalone "Ask Hint" conversation
 * with no tarot reading attached.
 */

import { Router, type Request } from "express";
import * as z from "zod";
import { generateAmbientChatReply } from "../modules/hint/chat/ambientReader.js";
import { consumeAiBudget } from "../lib/aiCostGuards.js";
import { logger } from "../lib/logger.js";

const router = Router();
const CHAT_RATE_LIMIT_WINDOW_MS = 60_000;
const CHAT_RATE_LIMIT_MAX_REQUESTS = 8;

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const chatRateLimits = new Map<string, RateLimitBucket>();

function getClientKey(req: Request): string {
  const forwardedFor = req.header("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || req.ip || req.socket.remoteAddress || "unknown";
}

function checkChatRateLimit(clientKey: string, now = Date.now()) {
  const existing = chatRateLimits.get(clientKey);

  if (!existing || existing.resetAt <= now) {
    chatRateLimits.set(clientKey, {
      count: 1,
      resetAt: now + CHAT_RATE_LIMIT_WINDOW_MS,
    });
    return { limited: false, retryAfterSeconds: 0 };
  }

  if (existing.count >= CHAT_RATE_LIMIT_MAX_REQUESTS) {
    return {
      limited: true,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return { limited: false, retryAfterSeconds: 0 };
}

function isQuotaError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /429|quota|billing|too many requests|missing openai|credentials|api[_\s-]?key/i.test(message);
}

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const ambientChatInputSchema = z.object({
  messages: z.array(chatMessageSchema).max(40),
  followUp: z.string().min(1).max(2000),
});

function buildLocalAmbientReply({
  messages,
  followUp,
}: z.infer<typeof ambientChatInputSchema>): string {
  const lastAssistant = [...messages]
    .reverse()
    .find((message) => message.role === "assistant")?.content;

  return [
    "The live AI room is unavailable right now, but I can still help you slow the thought down.",
    lastAssistant
      ? `The last thread here was: "${lastAssistant.slice(0, 180)}${lastAssistant.length > 180 ? "..." : ""}"`
      : "Start with the plain version of what happened, without making it poetic yet.",
    `For what you just said, "${followUp}", try naming three things: what happened, what you felt first, and what you are afraid it means.`,
    "That will make the next question much easier to ask.",
  ].join("\n\n");
}

router.post("/hint/chat", async (req, res) => {
  const limit = checkChatRateLimit(getClientKey(req));
  if (limit.limited) {
    res
      .status(429)
      .set("Retry-After", String(limit.retryAfterSeconds))
      .json({ error: "Ask Hint is receiving too many messages. Try again in a moment." });
    return;
  }

  const parsed = ambientChatInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  if (!consumeAiBudget(req, res, { feature: "hint_chat", dailyLimit: 20 })) {
    return;
  }

  let message: string;

  try {
    message = await generateAmbientChatReply({
      messages: parsed.data.messages,
      followUp: parsed.data.followUp,
    });
  } catch (err) {
    logger.error({ err }, "Failed to generate ambient chat reply");
    if (!isQuotaError(err)) {
      res.status(502).json({
        error: "The AI room could not answer right now.",
      });
      return;
    }

    message = buildLocalAmbientReply(parsed.data);
  }

  res.json({
    message,
    createdAt: new Date().toISOString(),
  });
});

export default router;
