import { Router } from "express";
import * as z from "zod";
import {
  getOpenAIClient,
  openaiTtsModel,
  openaiTtsVoice,
} from "../lib/openaiConfig.js";
import { consumeAiBudget } from "../lib/aiCostGuards.js";

const router = Router();

const speechInputSchema = z.object({
  text: z.string().trim().min(1).max(4096),
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

  const speech = await getOpenAIClient().audio.speech.create({
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
