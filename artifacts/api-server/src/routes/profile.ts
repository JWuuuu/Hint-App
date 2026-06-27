/**
 * Profile API routes — anonymous per-user identity (name + birth details).
 */

import { Router } from "express";
import * as z from "zod";
import { eq } from "drizzle-orm";
import { db, profilesTable } from "@workspace/db";

const router = Router();

function serialize(row: typeof profilesTable.$inferSelect) {
  return {
    anonId: row.anonId,
    name: row.name,
    birthDate: row.birthDate,
    birthTime: row.birthTime,
    birthPlace: row.birthPlace,
    createdAt: row.createdAt.toISOString(),
  };
}

/* ─── GET /profile?anonId= ─────────────────────────────────────── */

router.get("/profile", async (req, res) => {
  const anonId = typeof req.query.anonId === "string" ? req.query.anonId : "";
  if (!anonId) {
    res.status(400).json({ error: "anonId is required" });
    return;
  }

  const [row] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.anonId, anonId))
    .limit(1);

  if (!row) {
    res.status(404).json({ error: "No profile yet" });
    return;
  }

  res.json(serialize(row));
});

/* ─── POST /profile (upsert) ───────────────────────────────────── */

const profileInputSchema = z.object({
  anonId: z.string().min(1).max(200),
  name: z.string().min(1).max(120),
  birthDate: z.string().min(1).max(40),
  birthTime: z.string().max(40).optional(),
  birthPlace: z.string().max(200).optional(),
});

router.post("/profile", async (req, res) => {
  const parsed = profileInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const { anonId, name, birthDate, birthTime, birthPlace } = parsed.data;

  const [row] = await db
    .insert(profilesTable)
    .values({
      anonId,
      name,
      birthDate,
      birthTime: birthTime ?? null,
      birthPlace: birthPlace ?? null,
    })
    .onConflictDoUpdate({
      target: profilesTable.anonId,
      set: {
        name,
        birthDate,
        birthTime: birthTime ?? null,
        birthPlace: birthPlace ?? null,
        updatedAt: new Date(),
      },
    })
    .returning();

  res.json(serialize(row!));
});

export default router;
