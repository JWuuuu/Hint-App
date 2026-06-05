/**
 * History API routes — daily pulls, journal entries, saved readings, and the
 * aggregate Vault stats. All scoped to an anonymous per-user id.
 */

import { Router } from "express";
import * as z from "zod";
import { and, count, desc, eq } from "drizzle-orm";
import {
  db,
  dailyPullsTable,
  journalEntriesTable,
  readingsTable,
  profilesTable,
} from "@workspace/db";
import { drawDailyPull } from "../modules/hint/dailyPullDeck.js";

const router = Router();

function serializeDailyPull(row: typeof dailyPullsTable.$inferSelect) {
  return {
    anonId: row.anonId,
    pullDate: row.pullDate,
    cardId: row.cardId,
    cardName: row.cardName,
    whisper: row.whisper,
    isFlipped: row.isFlipped,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
  };
}

function serializeJournal(row: typeof journalEntriesTable.$inferSelect) {
  return {
    id: row.id,
    anonId: row.anonId,
    title: row.title,
    body: row.body,
    mood: row.mood,
    createdAt: row.createdAt.toISOString(),
  };
}

function serializeReading(row: typeof readingsTable.$inferSelect) {
  return {
    id: row.id,
    cardName: row.cardName,
    whisper: row.whisper,
    spreadType: row.spreadType,
    question: row.question,
    territory: row.territory,
    createdAt: row.createdAt.toISOString(),
  };
}

/* ─── POST /daily-pull (get-or-create) ─────────────────────────── */

const dailyPullRequestSchema = z.object({
  anonId: z.string().min(1).max(200),
  date: z.string().min(1).max(40),
});

router.post("/daily-pull", async (req, res) => {
  const parsed = dailyPullRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const { anonId, date } = parsed.data;

  const [existing] = await db
    .select()
    .from(dailyPullsTable)
    .where(and(eq(dailyPullsTable.anonId, anonId), eq(dailyPullsTable.pullDate, date)))
    .limit(1);

  if (existing) {
    res.json(serializeDailyPull(existing));
    return;
  }

  const card = drawDailyPull();
  const [created] = await db
    .insert(dailyPullsTable)
    .values({
      anonId,
      pullDate: date,
      cardId: card.id,
      cardName: card.name,
      whisper: card.whisper,
    })
    .onConflictDoNothing({
      target: [dailyPullsTable.anonId, dailyPullsTable.pullDate],
    })
    .returning();

  if (created) {
    res.json(serializeDailyPull(created));
    return;
  }

  // Lost a race — another request created it; read it back.
  const [row] = await db
    .select()
    .from(dailyPullsTable)
    .where(and(eq(dailyPullsTable.anonId, anonId), eq(dailyPullsTable.pullDate, date)))
    .limit(1);

  if (!row) {
    res.status(500).json({ error: "Could not draw a card tonight" });
    return;
  }

  res.json(serializeDailyPull(row));
});

/* ─── PATCH /daily-pull (flip / note) ──────────────────────────── */

const dailyPullUpdateSchema = z.object({
  anonId: z.string().min(1).max(200),
  date: z.string().min(1).max(40),
  isFlipped: z.boolean().optional(),
  note: z.string().max(2000).optional(),
});

router.patch("/daily-pull", async (req, res) => {
  const parsed = dailyPullUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const { anonId, date, isFlipped, note } = parsed.data;
  const set: Partial<typeof dailyPullsTable.$inferInsert> = {};
  if (isFlipped !== undefined) set.isFlipped = isFlipped;
  if (note !== undefined) set.note = note;

  if (Object.keys(set).length === 0) {
    res.status(400).json({ error: "Nothing to update" });
    return;
  }

  const [row] = await db
    .update(dailyPullsTable)
    .set(set)
    .where(and(eq(dailyPullsTable.anonId, anonId), eq(dailyPullsTable.pullDate, date)))
    .returning();

  if (!row) {
    res.status(404).json({ error: "No daily pull found" });
    return;
  }

  res.json(serializeDailyPull(row));
});

/* ─── GET /journal?anonId= ─────────────────────────────────────── */

router.get("/journal", async (req, res) => {
  const anonId = typeof req.query.anonId === "string" ? req.query.anonId : "";
  if (!anonId) {
    res.status(400).json({ error: "anonId is required" });
    return;
  }

  const rows = await db
    .select()
    .from(journalEntriesTable)
    .where(eq(journalEntriesTable.anonId, anonId))
    .orderBy(desc(journalEntriesTable.createdAt))
    .limit(200);

  res.json(rows.map(serializeJournal));
});

/* ─── POST /journal ────────────────────────────────────────────── */

const journalInputSchema = z.object({
  anonId: z.string().min(1).max(200),
  title: z.string().max(200).optional(),
  body: z.string().min(1).max(8000),
  mood: z.string().max(60).optional(),
});

router.post("/journal", async (req, res) => {
  const parsed = journalInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const { anonId, title, body, mood } = parsed.data;
  const [row] = await db
    .insert(journalEntriesTable)
    .values({
      anonId,
      title: title ?? null,
      body,
      mood: mood ?? null,
    })
    .returning();

  res.json(serializeJournal(row!));
});

/* ─── GET /readings?anonId= ────────────────────────────────────── */

router.get("/readings", async (req, res) => {
  const anonId = typeof req.query.anonId === "string" ? req.query.anonId : "";
  if (!anonId) {
    res.status(400).json({ error: "anonId is required" });
    return;
  }

  const rows = await db
    .select()
    .from(readingsTable)
    .where(eq(readingsTable.anonId, anonId))
    .orderBy(desc(readingsTable.createdAt))
    .limit(100);

  res.json(rows.map(serializeReading));
});

/* ─── GET /stats?anonId= ───────────────────────────────────────── */

router.get("/stats", async (req, res) => {
  const anonId = typeof req.query.anonId === "string" ? req.query.anonId : "";
  if (!anonId) {
    res.status(400).json({ error: "anonId is required" });
    return;
  }

  const [profile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.anonId, anonId))
    .limit(1);

  const [readingsCount] = await db
    .select({ value: count() })
    .from(readingsTable)
    .where(eq(readingsTable.anonId, anonId));
  const [journalsCount] = await db
    .select({ value: count() })
    .from(journalEntriesTable)
    .where(eq(journalEntriesTable.anonId, anonId));
  const [pullsCount] = await db
    .select({ value: count() })
    .from(dailyPullsTable)
    .where(eq(dailyPullsTable.anonId, anonId));

  let nights = 0;
  if (profile) {
    const ms = Date.now() - profile.createdAt.getTime();
    nights = Math.max(1, Math.floor(ms / 86_400_000) + 1);
  }

  res.json({
    nights,
    readings: readingsCount?.value ?? 0,
    journals: journalsCount?.value ?? 0,
    pulls: pullsCount?.value ?? 0,
  });
});

/* --- DELETE /history?anonId= ------------------------------------------------ */

router.delete("/history", async (req, res) => {
  const anonId = typeof req.query.anonId === "string" ? req.query.anonId : "";
  if (!anonId) {
    res.status(400).json({ error: "anonId is required" });
    return;
  }

  await db.delete(readingsTable).where(eq(readingsTable.anonId, anonId));
  await db.delete(journalEntriesTable).where(eq(journalEntriesTable.anonId, anonId));
  await db.delete(dailyPullsTable).where(eq(dailyPullsTable.anonId, anonId));
  await db.delete(profilesTable).where(eq(profilesTable.anonId, anonId));

  res.status(204).send();
});

export default router;
