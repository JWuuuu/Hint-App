import { Router } from "express";
import * as z from "zod";
import {
  DAILY_RECEIPT_FEATURES,
  getOrCreateDailyReceipt,
  openDailyReceipt,
  serializeDailyReceipt,
} from "../modules/hint/dailyReceipts.js";

const router = Router();

const featureSchema = z.enum(DAILY_RECEIPT_FEATURES);

const dailyReceiptRequestSchema = z.object({
  anonId: z.string().min(1).max(200).optional(),
  anonymousDeviceId: z.string().min(1).max(200).optional(),
  userId: z.string().min(1).max(200).optional(),
  featureType: featureSchema,
});

function getDeviceId(data: z.infer<typeof dailyReceiptRequestSchema>): string | null {
  return data.anonymousDeviceId ?? data.anonId ?? null;
}

router.post("/daily-receipts/get-or-create", async (req, res) => {
  const parsed = dailyReceiptRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const anonymousDeviceId = getDeviceId(parsed.data);
  if (!anonymousDeviceId) {
    res.status(400).json({ error: "anonymousDeviceId is required" });
    return;
  }

  const now = new Date();
  const receipt = await getOrCreateDailyReceipt({
    anonymousDeviceId,
    userId: parsed.data.userId ?? null,
    featureType: parsed.data.featureType,
    now,
  });

  res.json(serializeDailyReceipt(receipt, now));
});

router.patch("/daily-receipts/open", async (req, res) => {
  const parsed = dailyReceiptRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const anonymousDeviceId = getDeviceId(parsed.data);
  if (!anonymousDeviceId) {
    res.status(400).json({ error: "anonymousDeviceId is required" });
    return;
  }

  const now = new Date();
  const receipt = await openDailyReceipt({
    anonymousDeviceId,
    userId: parsed.data.userId ?? null,
    featureType: parsed.data.featureType,
    now,
  });

  res.json(serializeDailyReceipt(receipt, now));
});

export default router;
