import type { Request, Response } from "express";

type Bucket = {
  count: number;
  resetAt: number;
};

type AiBudgetOptions = {
  feature: string;
  maxRequestsPerWindow?: number;
  windowMs?: number;
  dailyLimit?: number;
};

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 6;
const DEFAULT_DAILY_LIMIT = 20;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const rateLimitBuckets = new Map<string, Bucket>();
const dailyLimitBuckets = new Map<string, Bucket>();

function readPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getClientKey(req: Request): string {
  const anonId = typeof req.body?.anonId === "string" ? req.body.anonId.trim() : "";
  if (anonId) return `anon:${anonId.slice(0, 200)}`;

  const forwardedFor = req.header("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwardedFor || req.ip || req.socket.remoteAddress || "unknown";
  return `ip:${ip}`;
}

function consumeBucket(
  buckets: Map<string, Bucket>,
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
) {
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { limited: false, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return {
      limited: true,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return { limited: false, retryAfterSeconds: 0 };
}

export function consumeAiBudget(
  req: Request,
  res: Response,
  {
    feature,
    maxRequestsPerWindow = DEFAULT_MAX_REQUESTS,
    windowMs = DEFAULT_WINDOW_MS,
    dailyLimit = DEFAULT_DAILY_LIMIT,
  }: AiBudgetOptions,
): boolean {
  const envPrefix = `AI_LIMIT_${feature.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`;
  const perWindowLimit = readPositiveInt(
    process.env[`${envPrefix}_PER_MINUTE`],
    maxRequestsPerWindow,
  );
  const perDayLimit = readPositiveInt(process.env[`${envPrefix}_PER_DAY`], dailyLimit);
  const clientKey = getClientKey(req);
  const scopedKey = `${feature}:${clientKey}`;

  const rateLimit = consumeBucket(rateLimitBuckets, scopedKey, perWindowLimit, windowMs);
  if (rateLimit.limited) {
    res
      .status(429)
      .set("Retry-After", String(rateLimit.retryAfterSeconds))
      .json({ error: "Too many AI requests. Try again in a moment." });
    return false;
  }

  const dailyLimitResult = consumeBucket(dailyLimitBuckets, scopedKey, perDayLimit, ONE_DAY_MS);
  if (dailyLimitResult.limited) {
    res
      .status(429)
      .set("Retry-After", String(dailyLimitResult.retryAfterSeconds))
      .json({ error: "Free AI limit reached for today. Try again later." });
    return false;
  }

  return true;
}
