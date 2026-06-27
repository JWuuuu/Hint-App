import type { BirthProfileInput } from "../../modules/astrology/types";
import { getDailyPullById } from "../../modules/home/data/dailyPulls";
import type { DailyPull, DailyScoreKey } from "../../modules/home/types/home.types";
import { getAstroProvider } from "../astro/getAstroProvider";
import type { DailyTransit } from "../astro/providers/types";
import { transitsToSkySignals } from "../astro/normalizeTransits";
import { generateSkyCardReading, type SkyCardReading } from "../readings/generateSkyCardReading";
import { selectSkyGuidedTarot, type SkyGuidedTone, type SkyGuidedTarotResult } from "../tarot/skyGuidedTarot";
import { GENERAL_SKY_TRANSITS } from "./mockSkyDeckData";
import { createSkyDeckSeed, seededScore, toISODate } from "./skyDeckSeed";

export type SkyDeckScore = {
  key: DailyScoreKey;
  label: string;
  score: number;
};

export type DailySkyDeck = {
  seed: string;
  date: string;
  scores: {
    overall: number;
    love: number;
    wealth: number;
    career: number;
    study: number;
    people: number;
  };
  scoreBars: SkyDeckScore[];
  dailyCard: DailyPull;
  sky: SkyGuidedTarotResult;
  reading: SkyCardReading;
  evidence: DailyTransit[];
  shortInterpretation: string;
};

function scoreBars(seed: string, transits: DailyTransit[]): SkyDeckScore[] {
  const boost = transits.reduce((total, item) => total + item.strength, 0) % 17;
  const rows: Array<{ key: DailyScoreKey; label: string; offset: number }> = [
    { key: "love", label: "Love", offset: 3 },
    { key: "wealth", label: "Wealth", offset: 11 },
    { key: "career", label: "Career", offset: 19 },
    { key: "study", label: "Study", offset: 29 },
    { key: "people", label: "People", offset: 37 },
  ];

  return rows.map((row) => ({
    key: row.key,
    label: row.label,
    score: Math.max(1, Math.min(99, seededScore(seed, row.key, 52, 90) + ((boost + row.offset) % 9) - 4)),
  }));
}

export async function generateDailySkyDeck({
  userId = "guest",
  date = new Date(),
  birthProfile = null,
  tone = "honest",
  cardIdOverride,
}: {
  userId?: string;
  date?: Date | string;
  birthProfile?: BirthProfileInput | null;
  tone?: SkyGuidedTone;
  cardIdOverride?: string | null;
} = {}): Promise<DailySkyDeck> {
  const isoDate = toISODate(date);
  const birthProfileId = birthProfile?.userId ?? birthProfile?.birthday ?? "general";
  const { seed } = createSkyDeckSeed({ userId, isoDate, birthProfileId });
  const provider = getAstroProvider();
  const transits = birthProfile ? await provider.getDailyTransits(birthProfile, new Date(`${isoDate}T12:00:00`)) : GENERAL_SKY_TRANSITS;
  const evidence = transits.length > 0 ? transits : GENERAL_SKY_TRANSITS;
  const sky = selectSkyGuidedTarot({
    anonId: userId,
    date: new Date(`${isoDate}T12:00:00`),
    birthDetails: birthProfile
      ? {
          birthDate: birthProfile.birthday,
          birthTime: birthProfile.birthTime,
          birthPlace: [birthProfile.birthCity, birthProfile.birthCountry].filter(Boolean).join(", "),
        }
      : undefined,
    signals: transitsToSkySignals(evidence),
    tone,
    seedSalt: seed,
  });
  const selectedCardId = cardIdOverride ?? sky.selectedCardId;
  const lockedSky = cardIdOverride
    ? {
        ...sky,
        selectedCardId,
        whyThisCard: `${sky.whyThisCard} Server daily receipt locked this card for today.`,
      }
    : sky;
  const dailyCard = {
    ...getDailyPullById(selectedCardId, "en"),
    skyGuided: lockedSky,
  };
  const reading = generateSkyCardReading({
    cardId: dailyCard.cardId,
    cardName: dailyCard.cardName,
    cardWhisper: dailyCard.whisper,
    sky: lockedSky,
    tone,
  });
  const bars = scoreBars(seed, evidence);
  const overall = Math.round(bars.reduce((total, item) => total + item.score, 0) / bars.length);

  return {
    seed,
    date: isoDate,
    scores: {
      overall,
      love: bars.find((item) => item.key === "love")?.score ?? overall,
      wealth: bars.find((item) => item.key === "wealth")?.score ?? overall,
      career: bars.find((item) => item.key === "career")?.score ?? overall,
      study: bars.find((item) => item.key === "study")?.score ?? overall,
      people: bars.find((item) => item.key === "people")?.score ?? overall,
    },
    scoreBars: bars,
    dailyCard,
    sky: lockedSky,
    reading,
    evidence,
    shortInterpretation: reading.shortAnswer,
  };
}
