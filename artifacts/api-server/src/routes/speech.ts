import { Router } from "express";
import OpenAI from "openai";
import * as z from "zod";
import {
  openaiBaseURL,
  openaiTtsModel,
  openaiTtsVoice,
  requireOpenAIKey,
} from "../lib/openaiConfig.js";
import { consumeAiBudget } from "../lib/aiCostGuards.js";

const router = Router();

const speechInputSchema = z.object({
  text: z.string().trim().min(1).max(4096),
});

const openai = new OpenAI({
  apiKey: requireOpenAIKey(),
  baseURL: openaiBaseURL,
  maxRetries: 0,
  timeout: 20_000,
});

router.post("/speech", async (req, res) => {
  const parsed = speechInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  if (!consumeAiBudget(req, res, { feature: "speech", dailyLimit: 10 })) {
    return;
  }

  const speech = await openai.audio.speech.create({
    model: openaiTtsModel,
    voice: openaiTtsVoice,
    input: parsed.data.text,
    instructions:
      "Speak in a calm, intimate, grounded tone. Keep the delivery warm and unhurried.",
    response_format: "mp3",
  });

  const audio = Buffer.from(await speech.arrayBuffer());

  res
    .status(200)
    .set({
      "Content-Type": "audio/mpeg",
      "Content-Length": String(audio.byteLength),
      "Cache-Control": "no-store",
    })
    .send(audio);
});

export default router;
