import type { AstroNatalResponse } from "./astroClient";
import type { Aspect, BirthProfile, ElementBalance, ModalityBalance, NatalChart, PlanetBody, PlanetPlacement, ZodiacSign } from "../../types/astrology";

const SIGN_MEANINGS: Record<ZodiacSign, string> = {
  aries: "You move directly and need a clear yes or no.",
  taurus: "You seek stability, beauty, and something real.",
  gemini: "You understand life through language, pattern, and quick connection.",
  cancer: "You feel deeply and protect what matters.",
  leo: "You enter rooms with warmth, presence, and quiet magnetism.",
  virgo: "You trust what can be refined, practiced, and made useful.",
  libra: "You read balance quickly and notice what a room is not saying.",
  scorpio: "You prefer truth with depth over comfort without honesty.",
  sagittarius: "You need room to name the bigger meaning and keep moving.",
  capricorn: "You respect devotion that proves itself through time.",
  aquarius: "You notice the future before everyone agrees it is possible.",
  pisces: "You absorb the room and translate feeling into intuition.",
};

const BODIES: PlanetBody[] = ["sun", "moon", "rising", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];
const SIGNS: ZodiacSign[] = ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"];
const ASPECTS = ["conjunction", "sextile", "square", "trine", "opposition"] as const;

function isSign(value: unknown): value is ZodiacSign {
  return typeof value === "string" && SIGNS.includes(value as ZodiacSign);
}

function isBody(value: unknown): value is PlanetBody {
  return typeof value === "string" && BODIES.includes(value as PlanetBody);
}

function elementBalance(value: Record<string, unknown> | undefined): ElementBalance {
  const dominant = ["fire", "earth", "air", "water"].includes(String(value?.dominant)) ? String(value?.dominant) as ElementBalance["dominant"] : "earth";
  return {
    fire: Number(value?.fire ?? 0),
    earth: Number(value?.earth ?? 0),
    air: Number(value?.air ?? 0),
    water: Number(value?.water ?? 0),
    dominant,
    meaning: String(value?.meaning ?? "You trust what can become real."),
  };
}

function modalityBalance(value: Record<string, unknown> | undefined): ModalityBalance {
  const dominant = ["cardinal", "fixed", "mutable"].includes(String(value?.dominant)) ? String(value?.dominant) as ModalityBalance["dominant"] : "fixed";
  return {
    cardinal: Number(value?.cardinal ?? 0),
    fixed: Number(value?.fixed ?? 0),
    mutable: Number(value?.mutable ?? 0),
    dominant,
    meaning: String(value?.meaning ?? "You stabilize by holding the line once it matters."),
  };
}

export function normalizeClientNatal(profile: BirthProfile, response: AstroNatalResponse): NatalChart | null {
  if (!response.chart) return null;
  const placements: PlanetPlacement[] = response.chart.placements
    .filter((placement) => isBody(placement.body))
    .map((placement) => {
      const sign = isSign(placement.sign) ? placement.sign : undefined;
      return {
        body: placement.body as PlanetBody,
        sign,
        degree: placement.degree,
        house: placement.house,
        retrograde: placement.retrograde,
        element: placement.element as PlanetPlacement["element"],
        modality: placement.modality as PlanetPlacement["modality"],
        meaning: sign ? SIGN_MEANINGS[sign] : "This point needs more birth data to read precisely.",
      };
    });
  const aspects: Aspect[] = response.chart.aspects
    .filter((aspect) => ASPECTS.includes(aspect.type as Aspect["type"]))
    .map((aspect) => ({
      from: aspect.from,
      to: aspect.to,
      type: aspect.type as Aspect["type"],
      orb: aspect.orb ?? 0,
      strength: aspect.strength,
      meaning: "This aspect describes how two chart points exchange pressure, ease, or focus.",
    }));
  const sunSign = placements.find((placement) => placement.body === "sun")?.sign;
  const moonSign = placements.find((placement) => placement.body === "moon")?.sign;
  const risingSign = placements.find((placement) => placement.body === "rising")?.sign;
  const venusSign = placements.find((placement) => placement.body === "venus")?.sign;
  const marsSign = placements.find((placement) => placement.body === "mars")?.sign;

  return {
    id: response.profileHash,
    provider: response.source === "astrologyapi" ? "astrologyapi" : "fallback",
    source: response.source === "astrologyapi" ? "astrologyapi" : "fallback",
    mode: response.mode,
    calculatedAt: response.fetchedAt,
    birthProfile: profile,
    placements,
    aspects,
    houses: response.chart.houses.map((house) => ({
      ...house,
      sign: isSign(house.sign) ? house.sign : undefined,
    })),
    sunSign,
    moonSign,
    risingSign,
    venusSign,
    marsSign,
    elementBalance: elementBalance(response.chart.elementBalance),
    modalityBalance: modalityBalance(response.chart.modalityBalance),
    validation: response.validation,
    summary: {
      headline: response.chart.summary?.headline ?? "Personal chart",
      short: response.chart.summary?.summary ?? "Your personal chart is ready.",
      strengths: response.chart.summary?.strengths ?? [],
      watch: response.chart.summary?.watchOut ?? [],
    },
  };
}
