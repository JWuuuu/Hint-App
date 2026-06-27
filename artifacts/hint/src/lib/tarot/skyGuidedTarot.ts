import {
  ASPECT_THEMES,
  HOUSE_THEMES,
  PLANET_THEMES,
  THEME_LABELS,
  THEME_TAROT_WEIGHTS,
  type TarotTheme,
} from "./tarotThemeMap";

export type SkyGuidedTone = "soft" | "honest" | "mirror";

export type SkySignal = {
  id: string;
  label: string;
  bodies: string[];
  aspect?: "conjunct" | "sextile" | "square" | "trine" | "opposite";
  house?: number;
  strength: number;
  themes?: TarotTheme[];
};

export type SkyCardCandidate = {
  cardId: string;
  weight: number;
  themes: TarotTheme[];
  reasons: string[];
};

export type BirthDetailsForSky = {
  birthDate?: string | null;
  birthTime?: string | null;
  birthPlace?: string | null;
};

export type SkyGuidedTarotResult = {
  selectedCardId: string;
  tone: SkyGuidedTone;
  seed: string;
  themes: TarotTheme[];
  themeLabels: string[];
  evidence: SkySignal[];
  candidatePool: SkyCardCandidate[];
  whyThisCard: string;
};

export type SkyGuidedTarotInput = {
  date?: Date;
  anonId?: string;
  birthDetails?: BirthDetailsForSky;
  signals?: SkySignal[];
  tone?: SkyGuidedTone;
  seedSalt?: string;
};

const SIGN_LABELS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
] as const;

const ASPECTS = [
  { angle: 0, label: "conjunct", orb: 9 },
  { angle: 60, label: "sextile", orb: 7 },
  { angle: 90, label: "square", orb: 8 },
  { angle: 120, label: "trine", orb: 8 },
  { angle: 180, label: "opposite", orb: 9 },
] as const;

function hash(input: string): number {
  let value = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    value ^= input.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86_400_000);
}

function normalizeDegree(degree: number): number {
  return ((degree % 360) + 360) % 360;
}

function signForDegree(degree: number): string {
  return SIGN_LABELS[Math.floor(normalizeDegree(degree) / 30) % 12]!;
}

function sunDegreeFor(date: Date): number {
  const springEquinox = dayOfYear(new Date(date.getFullYear(), 2, 20));
  return normalizeDegree(((dayOfYear(date) - springEquinox) / 365.2425) * 360);
}

function moonDegreeFor(date: Date, sunDegree: number): number {
  const knownNewMoonUtc = Date.UTC(2000, 0, 6, 18, 14);
  const daysSince = (date.getTime() - knownNewMoonUtc) / 86_400_000;
  const phase = ((daysSince % 29.530588853) + 29.530588853) % 29.530588853;
  return normalizeDegree(sunDegree + (phase / 29.530588853) * 360);
}

function bodyDegreeFor(body: string, date: Date, sunDegree: number): number {
  const day = dayOfYear(date);
  const base: Record<string, number> = {
    mercury: 18,
    venus: 42,
    mars: 96,
    jupiter: 138,
    saturn: 232,
    neptune: 312,
    pluto: 276,
  };
  const pace: Record<string, number> = {
    mercury: 1.38,
    venus: 1.12,
    mars: 0.62,
    jupiter: 0.083,
    saturn: 0.033,
    neptune: 0.006,
    pluto: 0.004,
  };
  return normalizeDegree(sunDegree + (base[body] ?? 0) + day * (pace[body] ?? 0.5));
}

function parseBirthDate(value?: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function angularDistance(a: number, b: number): number {
  const distance = Math.abs(normalizeDegree(a - b));
  return Math.min(distance, 360 - distance);
}

function closestAspect(distance: number): { label: NonNullable<SkySignal["aspect"]>; delta: number; orb: number; exact: boolean } {
  const best = ASPECTS.map((aspect) => ({
    label: aspect.label,
    delta: Math.abs(distance - aspect.angle),
    orb: aspect.orb,
  })).sort((a, b) => a.delta - b.delta)[0]!;

  return {
    label: best.label,
    delta: best.delta,
    orb: best.orb,
    exact: best.delta <= best.orb,
  };
}

function strengthFromAspect(delta: number, orb: number, base = 62): number {
  if (delta > orb) return base;
  return Math.max(base, Math.round(96 - (delta / orb) * 24));
}

function uniqueThemes(themes: TarotTheme[]): TarotTheme[] {
  return Array.from(new Set(themes));
}

function themesForSignal(signal: SkySignal): TarotTheme[] {
  const planetThemes = signal.bodies.flatMap((body) => PLANET_THEMES[body.toLowerCase()] ?? []);
  const aspectThemes = signal.aspect ? ASPECT_THEMES[signal.aspect] ?? [] : [];
  const houseThemes = signal.house ? HOUSE_THEMES[signal.house] ?? [] : [];
  return uniqueThemes([...(signal.themes ?? []), ...planetThemes, ...aspectThemes, ...houseThemes]);
}

function houseLabel(house: number): string {
  return `${house}${house === 1 ? "st" : house === 2 ? "nd" : house === 3 ? "rd" : "th"} house`;
}

export function getDailySkySignals({
  date = new Date(),
  birthDetails,
}: {
  date?: Date;
  birthDetails?: BirthDetailsForSky;
} = {}): SkySignal[] {
  const todaySun = sunDegreeFor(date);
  const todayMoon = moonDegreeFor(date, todaySun);
  const birthDate = parseBirthDate(birthDetails?.birthDate);
  const natalSun = birthDate ? sunDegreeFor(birthDate) : normalizeDegree(hash("guest:natal-sun") % 360);
  const sunDistance = angularDistance(todaySun, natalSun);
  const sunAspect = closestAspect(sunDistance);
  const moonHouse = Math.floor(normalizeDegree(todayMoon - natalSun) / 30) + 1;
  const venusDegree = bodyDegreeFor("venus", date, todaySun);
  const saturnDegree = bodyDegreeFor("saturn", date, todaySun);
  const venusSaturnDistance = angularDistance(venusDegree, saturnDegree);
  const venusSaturnAspect = closestAspect(venusSaturnDistance);
  const mercuryDegree = bodyDegreeFor("mercury", date, todaySun);

  const signals: SkySignal[] = [
    {
      id: `moon-house-${moonHouse}`,
      label: `Moon in the ${houseLabel(moonHouse)}`,
      bodies: ["moon"],
      house: moonHouse,
      strength: 88,
    },
    sunAspect.exact
      ? {
          id: `sun-${sunAspect.label}-natal-sun`,
          label: `Sun ${sunAspect.label} natal Sun`,
          bodies: ["sun"],
          aspect: sunAspect.label,
          strength: strengthFromAspect(sunAspect.delta, sunAspect.orb, 66),
        }
      : {
          id: `sun-in-${signForDegree(todaySun).toLowerCase()}`,
          label: `Sun in ${signForDegree(todaySun)}`,
          bodies: ["sun"],
          strength: 64,
        },
    venusSaturnAspect.exact || venusSaturnAspect.delta <= venusSaturnAspect.orb + 5
      ? {
          id: `venus-${venusSaturnAspect.label}-saturn`,
          label: `Venus ${venusSaturnAspect.label} Saturn`,
          bodies: ["venus", "saturn"],
          aspect: venusSaturnAspect.label,
          strength: strengthFromAspect(venusSaturnAspect.delta, venusSaturnAspect.orb + 5, 72),
        }
      : {
          id: `mercury-in-${signForDegree(mercuryDegree).toLowerCase()}`,
          label: `Mercury in ${signForDegree(mercuryDegree)}`,
          bodies: ["mercury"],
          strength: 64,
        },
  ];

  return signals
    .map((signal) => ({ ...signal, themes: themesForSignal(signal) }))
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 3);
}

function buildCandidatePool(themes: TarotTheme[]): SkyCardCandidate[] {
  const map = new Map<string, SkyCardCandidate>();
  const safeThemes = themes.length > 0 ? themes : (["truth", "waiting"] satisfies TarotTheme[]);

  safeThemes.forEach((theme, themeIndex) => {
    THEME_TAROT_WEIGHTS[theme].forEach((entry) => {
      const existing = map.get(entry.cardId);
      const weightedValue = entry.weight + Math.max(0, 3 - themeIndex);
      if (existing) {
        existing.weight += weightedValue;
        existing.themes = uniqueThemes([...existing.themes, theme]);
        if (!existing.reasons.includes(entry.reason)) {
          existing.reasons.push(entry.reason);
        }
        return;
      }
      map.set(entry.cardId, {
        cardId: entry.cardId,
        weight: weightedValue,
        themes: [theme],
        reasons: [entry.reason],
      });
    });
  });

  return [...map.values()]
    .sort((a, b) => b.weight - a.weight || a.cardId.localeCompare(b.cardId))
    .slice(0, 9);
}

function weightedPick(pool: SkyCardCandidate[], seed: string): SkyCardCandidate {
  const total = pool.reduce((sum, item) => sum + item.weight, 0);
  const target = hash(seed) % Math.max(total, 1);
  let cursor = 0;
  for (const item of pool) {
    cursor += item.weight;
    if (target < cursor) return item;
  }
  return pool[0]!;
}

export function selectSkyGuidedTarot({
  date = new Date(),
  anonId = "guest",
  birthDetails,
  signals,
  tone = "honest",
  seedSalt = "daily-sky-card",
}: SkyGuidedTarotInput = {}): SkyGuidedTarotResult {
  const evidence = (signals?.length ? signals : getDailySkySignals({ date, birthDetails }))
    .map((signal) => ({ ...signal, themes: themesForSignal(signal) }))
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 4);
  const themes = uniqueThemes(evidence.flatMap((signal) => signal.themes ?? []));
  const candidatePool = buildCandidatePool(themes);
  const dateSeed = getLocalDateString(date);
  const selected = weightedPick(
    candidatePool,
    `${seedSalt}:${anonId}:${dateSeed}:${birthDetails?.birthDate ?? "guest"}:${evidence.map((item) => item.id).join("|")}`,
  );
  const primaryThemes = selected.themes.slice(0, 2);
  const whyThisCard = [
    `Today's sky emphasized ${primaryThemes.map((theme) => THEME_LABELS[theme]).join(" and ") || "truth"}.`,
    `${selected.cardId} rose from the narrowed pool because it matched ${selected.reasons[0] ?? "the strongest signal"}.`,
  ].join(" ");

  return {
    selectedCardId: selected.cardId,
    tone,
    seed: `${anonId}:${dateSeed}`,
    themes,
    themeLabels: themes.map((theme) => THEME_LABELS[theme]),
    evidence,
    candidatePool,
    whyThisCard,
  };
}
