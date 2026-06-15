import type { BirthProfile, ElementBalance, ModalityBalance, NatalChart, PlanetBody, PlanetPlacement, ZodiacSign } from "../../types/astrology";
import { SAMPLE_BIRTH_PROFILE, SAMPLE_CHART } from "./sampleAstroData";

export const ZODIAC_SIGNS: ZodiacSign[] = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
];

const ELEMENT_BY_SIGN: Record<ZodiacSign, ElementBalance["dominant"]> = {
  aries: "fire",
  leo: "fire",
  sagittarius: "fire",
  taurus: "earth",
  virgo: "earth",
  capricorn: "earth",
  gemini: "air",
  libra: "air",
  aquarius: "air",
  cancer: "water",
  scorpio: "water",
  pisces: "water",
};

const MODALITY_BY_SIGN: Record<ZodiacSign, ModalityBalance["dominant"]> = {
  aries: "cardinal",
  cancer: "cardinal",
  libra: "cardinal",
  capricorn: "cardinal",
  taurus: "fixed",
  leo: "fixed",
  scorpio: "fixed",
  aquarius: "fixed",
  gemini: "mutable",
  virgo: "mutable",
  sagittarius: "mutable",
  pisces: "mutable",
};

const SIGN_MEANINGS: Record<ZodiacSign, string> = {
  aries: "You move directly and need a clear yes or no.",
  taurus: "You seek stability, beauty, and something real.",
  gemini: "You understand life through language, pattern, and quick connection.",
  cancer: "You feel deeply and protect what matters.",
  leo: "You grow when warmth, courage, and visibility are allowed.",
  virgo: "You trust what can be refined, practiced, and made useful.",
  libra: "You read balance quickly and notice what a room is not saying.",
  scorpio: "You prefer truth with depth over comfort without honesty.",
  sagittarius: "You need room to name the bigger meaning and keep moving.",
  capricorn: "You respect devotion that proves itself through time.",
  aquarius: "You notice the future before everyone agrees it is possible.",
  pisces: "You absorb the room and translate feeling into intuition.",
};

const BODY_OFFSETS: Array<[PlanetBody, number]> = [
  ["sun", 0],
  ["moon", 3],
  ["rising", 5],
  ["mercury", 1],
  ["venus", 9],
  ["mars", 5],
  ["jupiter", 7],
  ["saturn", 10],
  ["uranus", 2],
  ["neptune", 8],
  ["pluto", 11],
];

const HOUSE_THEMES = [
  "identity",
  "resources",
  "communication",
  "home",
  "romance",
  "ritual",
  "partnership",
  "depth",
  "meaning",
  "direction",
  "community",
  "dream life",
];

export function hashAstroSeed(value: string) {
  let total = 0;
  for (let index = 0; index < value.length; index += 1) {
    total = (total * 31 + value.charCodeAt(index)) >>> 0;
  }
  return total;
}

function signFromBirthday(birthDate: string): ZodiacSign {
  const [, monthValue, dayValue] = birthDate.match(/^\d{4}-(\d{2})-(\d{2})$/) ?? [];
  const marker = Number(monthValue) * 100 + Number(dayValue);
  if (marker >= 321 && marker <= 419) return "aries";
  if (marker >= 420 && marker <= 520) return "taurus";
  if (marker >= 521 && marker <= 620) return "gemini";
  if (marker >= 621 && marker <= 722) return "cancer";
  if (marker >= 723 && marker <= 822) return "leo";
  if (marker >= 823 && marker <= 922) return "virgo";
  if (marker >= 923 && marker <= 1022) return "libra";
  if (marker >= 1023 && marker <= 1121) return "scorpio";
  if (marker >= 1122 && marker <= 1221) return "sagittarius";
  if (marker >= 1222 || marker <= 119) return "capricorn";
  if (marker >= 120 && marker <= 218) return "aquarius";
  return "pisces";
}

function signAt(seed: number, offset: number) {
  return ZODIAC_SIGNS[(seed + offset) % ZODIAC_SIGNS.length]!;
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function elementBalance(placements: PlanetPlacement[]): ElementBalance {
  const scores = { fire: 0, earth: 0, air: 0, water: 0 };
  for (const placement of placements) {
    if (!placement.sign) continue;
    scores[ELEMENT_BY_SIGN[placement.sign]] += placement.body === "sun" || placement.body === "moon" || placement.body === "rising" ? 2 : 1;
  }
  const dominant = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]![0] as ElementBalance["dominant"];
  const meaning = {
    fire: "You trust momentum once the next move is visible.",
    earth: "You trust what can become real.",
    air: "You trust language, pattern, and a clean conversation.",
    water: "You trust emotional truth before visible proof.",
  }[dominant];
  return { ...scores, dominant, meaning };
}

function modalityBalance(placements: PlanetPlacement[]): ModalityBalance {
  const scores = { cardinal: 0, fixed: 0, mutable: 0 };
  for (const placement of placements) {
    if (!placement.sign) continue;
    scores[MODALITY_BY_SIGN[placement.sign]] += placement.body === "sun" || placement.body === "moon" || placement.body === "rising" ? 2 : 1;
  }
  const dominant = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]![0] as ModalityBalance["dominant"];
  const meaning = {
    cardinal: "You stabilize by choosing the first clean action.",
    fixed: "You stabilize by holding the line once it matters.",
    mutable: "You stabilize by adapting without losing the thread.",
  }[dominant];
  return { ...scores, dominant, meaning };
}

export function buildMockNatalChart(profile: BirthProfile): NatalChart {
  if (profile.id === SAMPLE_BIRTH_PROFILE.id) return SAMPLE_CHART;

  const seed = hashAstroSeed(`${profile.birthDate}|${profile.birthTime ?? "12:00"}|${profile.birthPlace}|${profile.timezone ?? ""}`);
  const sun = signFromBirthday(profile.birthDate);
  const placements = BODY_OFFSETS.map(([body, offset], index): PlanetPlacement => {
    const sign = body === "sun" ? sun : signAt(seed, offset);
    return {
      body,
      sign,
      degree: (seed + offset * 11) % 30,
      house: (index % 12) + 1,
      retrograde: body !== "sun" && body !== "moon" && (seed + offset) % 7 === 0,
      meaning: SIGN_MEANINGS[sign],
    };
  });
  const elements = elementBalance(placements);
  const modalities = modalityBalance(placements);
  const moon = placements.find((item) => item.body === "moon")!;
  const rising = placements.find((item) => item.body === "rising")!;
  const venus = placements.find((item) => item.body === "venus")!;
  const mars = placements.find((item) => item.body === "mars")!;

  return {
    id: `mock-chart-${profile.id}`,
    provider: "mock",
    source: "mock",
    calculatedAt: new Date().toISOString(),
    birthProfile: profile,
    placements,
    aspects: [
      { from: "moon", to: "venus", type: "trine", orb: 2.4, meaning: "Feelings and affection can cooperate when the pace is gentle." },
      { from: "mars", to: "saturn", type: "square", orb: 4.1, meaning: "Drive becomes cleaner when limits are named instead of tested." },
      { from: "mercury", to: "rising", type: "sextile", orb: 1.8, meaning: "Your words shape the first impression faster than you think." },
      { from: "sun", to: "jupiter", type: "conjunction", orb: 5.2, meaning: "Confidence grows when the goal has room to expand." },
    ],
    houses: Array.from({ length: 12 }, (_, index) => ({
      house: index + 1,
      sign: signAt(seed, index),
      theme: HOUSE_THEMES[index]!,
    })),
    sunSign: sun,
    moonSign: moon.sign,
    risingSign: rising.sign,
    venusSign: venus.sign,
    marsSign: mars.sign,
    elementBalance: elements,
    modalityBalance: modalities,
    summary: {
      headline: `${titleCase(sun)} Sun · ${titleCase(moon.sign ?? "open")} Moon · ${titleCase(rising.sign ?? "open")} Rising`,
      short: `${titleCase(sun)} drives the center, ${titleCase(moon.sign ?? "open")} describes the inner weather, and ${titleCase(rising.sign ?? "open")} shapes the first impression.`,
      strengths: [elements.meaning, modalities.meaning, "The strongest signal is useful when it stays practical."],
      watch: ["Do not flatten the whole chart into one sign.", "Use the pattern as a mirror, not a verdict."],
    },
  };
}

export function signMeaning(sign: ZodiacSign) {
  return SIGN_MEANINGS[sign];
}
