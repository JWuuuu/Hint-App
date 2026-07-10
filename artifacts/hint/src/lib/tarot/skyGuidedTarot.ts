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
  source?: "daily-sky" | "natal-chart" | "history";
  element?: "Fire" | "Earth" | "Air" | "Water";
  zodiac?: string;
  themes?: TarotTheme[];
};

export type SkyCardCandidate = {
  cardId: string;
  weight: number;
  themes: TarotTheme[];
  reasons: string[];
  scoreBreakdown?: {
    sky: number;
    natal: number;
    focus: number;
    history: number;
    randomness: number;
  };
};

export type BirthDetailsForSky = {
  birthDate?: string | null;
  birthTime?: string | null;
  birthPlace?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  timezoneOffset?: number | null;
};

export type DailyCardMemory = {
  cardId?: string | null;
  cardName?: string | null;
  createdAt?: string | null;
};

export type SkyGuidedTarotResult = {
  selectedCardId: string;
  tone: SkyGuidedTone;
  seed: string;
  themes: TarotTheme[];
  themeLabels: string[];
  evidence: SkySignal[];
  personalSignals: SkySignal[];
  candidatePool: SkyCardCandidate[];
  chartDepth: "date-only" | "time-place" | "guest";
  selectionWeights: {
    dailySky: number;
    natalChart: number;
    currentFocus: number;
    history: number;
    controlledRandomness: number;
  };
  whyThisCard: string;
};

export type SkyGuidedTarotInput = {
  date?: Date;
  anonId?: string;
  birthDetails?: BirthDetailsForSky;
  signals?: SkySignal[];
  history?: DailyCardMemory[];
  focusThemes?: TarotTheme[];
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

const SIGN_ELEMENTS: Record<string, NonNullable<SkySignal["element"]>> = {
  Aries: "Fire",
  Leo: "Fire",
  Sagittarius: "Fire",
  Taurus: "Earth",
  Virgo: "Earth",
  Capricorn: "Earth",
  Gemini: "Air",
  Libra: "Air",
  Aquarius: "Air",
  Cancer: "Water",
  Scorpio: "Water",
  Pisces: "Water",
};

const ELEMENT_THEMES: Record<NonNullable<SkySignal["element"]>, TarotTheme[]> = {
  Fire: ["action", "growth", "opportunity"],
  Earth: ["boundary", "selfWorth", "attachment"],
  Air: ["communication", "truth", "confusion"],
  Water: ["healing", "emotionalFear", "relationshipTension"],
};

const SIGN_THEMES: Record<string, TarotTheme[]> = {
  Aries: ["action", "truth"],
  Taurus: ["selfWorth", "attachment"],
  Gemini: ["communication", "confusion"],
  Cancer: ["healing", "emotionalFear"],
  Leo: ["growth", "action"],
  Virgo: ["boundary", "healing"],
  Libra: ["relationshipTension", "truth"],
  Scorpio: ["attachment", "transformation"],
  Sagittarius: ["growth", "opportunity"],
  Capricorn: ["boundary", "waiting", "attachment"],
  Aquarius: ["truth", "transformation"],
  Pisces: ["confusion", "healing"],
};

const HOUSE_AREAS: Record<number, string> = {
  1: "identity zone",
  2: "self-worth zone",
  3: "communication zone",
  4: "emotional roots",
  5: "creative heart",
  6: "habit and routine zone",
  7: "relationship mirror",
  8: "shadow and attachment zone",
  9: "belief and meaning zone",
  10: "visibility and direction zone",
  11: "friendship and future zone",
  12: "dream and release zone",
};

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

function parseBirthDateTime(birthDetails?: BirthDetailsForSky): Date | null {
  const date = parseBirthDate(birthDetails?.birthDate);
  if (!date) return null;
  const time = birthDetails?.birthTime;
  if (!time || !/^\d{1,2}:\d{2}/.test(time)) return date;
  const [hour = 12, minute = 0] = time.split(":").map(Number);
  date.setHours(Number.isFinite(hour) ? hour : 12, Number.isFinite(minute) ? minute : 0, 0, 0);
  return date;
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

function themesForSign(sign: string): TarotTheme[] {
  const element = SIGN_ELEMENTS[sign];
  return uniqueThemes([...(SIGN_THEMES[sign] ?? []), ...(element ? ELEMENT_THEMES[element] : [])]);
}

function themesForSignal(signal: SkySignal): TarotTheme[] {
  const planetThemes = signal.bodies.flatMap((body) => PLANET_THEMES[body.toLowerCase()] ?? []);
  const aspectThemes = signal.aspect ? ASPECT_THEMES[signal.aspect] ?? [] : [];
  const houseThemes = signal.house ? HOUSE_THEMES[signal.house] ?? [] : [];
  const zodiacThemes = signal.zodiac ? themesForSign(signal.zodiac) : [];
  const elementThemes = signal.element ? ELEMENT_THEMES[signal.element] : [];
  return uniqueThemes([...(signal.themes ?? []), ...planetThemes, ...aspectThemes, ...houseThemes, ...zodiacThemes, ...elementThemes]);
}

function houseLabel(house: number): string {
  return `${house}${house === 1 ? "st" : house === 2 ? "nd" : house === 3 ? "rd" : "th"} house`;
}

function moonPhaseFor(date: Date): { label: string; themes: TarotTheme[]; strength: number } {
  const knownNewMoonUtc = Date.UTC(2000, 0, 6, 18, 14);
  const daysSince = (date.getTime() - knownNewMoonUtc) / 86_400_000;
  const phase = ((daysSince % 29.530588853) + 29.530588853) % 29.530588853;
  if (phase < 2.4) return { label: "New Moon opens a clean beginning", themes: ["opportunity", "growth"], strength: 72 };
  if (phase < 8.5) return { label: "Waxing Moon builds momentum", themes: ["growth", "action"], strength: 68 };
  if (phase < 16.2) return { label: "Full Moon brings the pattern into view", themes: ["truth", "emotionalFear"], strength: 78 };
  if (phase < 23.5) return { label: "Waning Moon asks for release", themes: ["transformation", "healing"], strength: 70 };
  return { label: "Balsamic Moon softens what is ready to close", themes: ["waiting", "healing"], strength: 66 };
}

function approximateRisingDegree(birthDetails: BirthDetailsForSky, birthDateTime: Date): number | null {
  if (!birthDetails.birthTime || !birthDetails.birthPlace) return null;
  const [hour = 12, minute = 0] = birthDetails.birthTime.split(":").map(Number);
  const longitudeOffset = Number.isFinite(birthDetails.longitude ?? NaN)
    ? birthDetails.longitude!
    : (hash(birthDetails.birthPlace) % 360) - 180;
  const timeDegree = ((Number.isFinite(hour) ? hour : 12) + (Number.isFinite(minute) ? minute : 0) / 60) * 15;
  const seasonalTilt = sunDegreeFor(birthDateTime) / 12;
  return normalizeDegree(timeDegree + longitudeOffset + seasonalTilt);
}

function birthdayThemes(date: Date): TarotTheme[] {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const number = String(day + month)
    .split("")
    .reduce((sum, value) => sum + Number(value), 0);
  const reduced = number > 9 ? String(number).split("").reduce((sum, value) => sum + Number(value), 0) : number;
  const map: Record<number, TarotTheme[]> = {
    1: ["action", "truth"],
    2: ["relationshipTension", "healing"],
    3: ["growth", "communication"],
    4: ["boundary", "waiting"],
    5: ["opportunity", "transformation"],
    6: ["selfWorth", "healing"],
    7: ["truth", "confusion"],
    8: ["attachment", "boundary"],
    9: ["transformation", "growth"],
  };
  return map[reduced] ?? ["truth"];
}

function getPersonalChartSignals(date: Date, birthDetails?: BirthDetailsForSky): SkySignal[] {
  const birthDateTime = parseBirthDateTime(birthDetails);
  if (!birthDateTime) return [];

  const natalSun = sunDegreeFor(birthDateTime);
  const natalSunSign = signForDegree(natalSun);
  const natalMoon = moonDegreeFor(birthDateTime, natalSun);
  const natalMoonSign = signForDegree(natalMoon);
  const risingDegree = approximateRisingDegree(birthDetails ?? {}, birthDateTime);
  const risingSign = risingDegree !== null ? signForDegree(risingDegree) : null;
  const todaySun = sunDegreeFor(date);
  const todayMoon = moonDegreeFor(date, todaySun);
  const todayVenus = bodyDegreeFor("venus", date, todaySun);
  const todayMars = bodyDegreeFor("mars", date, todaySun);
  const natalVenus = bodyDegreeFor("venus", birthDateTime, natalSun);
  const natalMars = bodyDegreeFor("mars", birthDateTime, natalSun);
  const activeHouse = risingDegree !== null ? Math.floor(normalizeDegree(todayMoon - risingDegree) / 30) + 1 : null;
  const venusAspect = closestAspect(angularDistance(todayVenus, natalVenus));
  const marsAspect = closestAspect(angularDistance(todayMars, natalMars));

  const signals: SkySignal[] = [
    {
      id: `natal-sun-${natalSunSign.toLowerCase()}`,
      label: `Your ${natalSunSign} Sun sets the personal baseline`,
      bodies: ["sun"],
      strength: 74,
      source: "natal-chart",
      zodiac: natalSunSign,
      element: SIGN_ELEMENTS[natalSunSign],
      themes: themesForSign(natalSunSign),
    },
    {
      id: `birth-number-${birthDateTime.getMonth() + 1}-${birthDateTime.getDate()}`,
      label: "Your birthday number adds a personal pattern layer",
      bodies: [],
      strength: 58,
      source: "natal-chart",
      themes: birthdayThemes(birthDateTime),
    },
  ];

  if (birthDetails?.birthTime) {
    signals.push({
      id: `natal-moon-${natalMoonSign.toLowerCase()}`,
      label: `Your ${natalMoonSign} Moon shapes the emotional filter`,
      bodies: ["moon"],
      strength: 72,
      source: "natal-chart",
      zodiac: natalMoonSign,
      element: SIGN_ELEMENTS[natalMoonSign],
      themes: themesForSign(natalMoonSign),
    });
  }

  if (risingSign && activeHouse) {
    signals.push({
      id: `rising-${risingSign.toLowerCase()}-house-${activeHouse}`,
      label: `Your ${risingSign} rising points today toward the ${HOUSE_AREAS[activeHouse] ?? houseLabel(activeHouse)}`,
      bodies: ["ascendant", "moon"],
      house: activeHouse,
      strength: 76,
      source: "natal-chart",
      zodiac: risingSign,
      element: SIGN_ELEMENTS[risingSign],
      themes: themesForSign(risingSign),
    });
  }

  if (venusAspect.exact) {
    signals.push({
      id: `venus-${venusAspect.label}-natal-venus`,
      label: `Venus highlights your self-worth and relationship pattern`,
      bodies: ["venus"],
      aspect: venusAspect.label,
      strength: strengthFromAspect(venusAspect.delta, venusAspect.orb, 70),
      source: "natal-chart",
    });
  }

  if (marsAspect.exact) {
    signals.push({
      id: `mars-${marsAspect.label}-natal-mars`,
      label: `Mars activates action, boundaries, and drive`,
      bodies: ["mars"],
      aspect: marsAspect.label,
      strength: strengthFromAspect(marsAspect.delta, marsAspect.orb, 68),
      source: "natal-chart",
    });
  }

  return signals
    .map((signal) => ({ ...signal, themes: themesForSignal(signal) }))
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 5);
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
  const moonSign = signForDegree(todayMoon);
  const sunSign = signForDegree(todaySun);
  const moonPhase = moonPhaseFor(date);
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
  const marsDegree = bodyDegreeFor("mars", date, todaySun);
  const elementCounts = [moonSign, sunSign, signForDegree(mercuryDegree), signForDegree(venusDegree), signForDegree(marsDegree)].reduce(
    (counts, sign) => {
      const element = SIGN_ELEMENTS[sign];
      counts[element] = (counts[element] ?? 0) + (sign === moonSign ? 2 : 1);
      return counts;
    },
    {} as Record<NonNullable<SkySignal["element"]>, number>,
  );
  const dominantElement = (Object.entries(elementCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Earth") as NonNullable<SkySignal["element"]>;

  const signals: SkySignal[] = [
    {
      id: `moon-house-${moonHouse}`,
      label: birthDate ? `Moon activates your ${HOUSE_AREAS[moonHouse] ?? houseLabel(moonHouse)}` : `Moon moves through ${moonSign}`,
      bodies: ["moon"],
      house: moonHouse,
      strength: 88,
      source: "daily-sky",
      zodiac: moonSign,
      element: SIGN_ELEMENTS[moonSign],
    },
    {
      id: `moon-phase-${moonPhase.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      label: moonPhase.label,
      bodies: ["moon"],
      strength: moonPhase.strength,
      source: "daily-sky",
      themes: moonPhase.themes,
    },
    {
      id: `dominant-${dominantElement.toLowerCase()}`,
      label: `${dominantElement} energy is strong today`,
      bodies: [],
      strength: 73,
      source: "daily-sky",
      element: dominantElement,
      themes: ELEMENT_THEMES[dominantElement],
    },
    sunAspect.exact
      ? {
          id: `sun-${sunAspect.label}-natal-sun`,
          label: `Sun ${sunAspect.label === "trine" ? "harmonizes with" : sunAspect.label} your natal Sun`,
          bodies: ["sun"],
          aspect: sunAspect.label,
          strength: strengthFromAspect(sunAspect.delta, sunAspect.orb, 66),
          source: "daily-sky" as const,
          zodiac: sunSign,
          element: SIGN_ELEMENTS[sunSign],
        }
      : {
          id: `sun-in-${signForDegree(todaySun).toLowerCase()}`,
          label: `Sun in ${signForDegree(todaySun)}`,
          bodies: ["sun"],
          strength: 64,
          source: "daily-sky" as const,
          zodiac: sunSign,
          element: SIGN_ELEMENTS[sunSign],
        },
    venusSaturnAspect.exact || venusSaturnAspect.delta <= venusSaturnAspect.orb + 5
      ? {
          id: `venus-${venusSaturnAspect.label}-saturn`,
          label: `Venus and Saturn highlight self-worth and patterns`,
          bodies: ["venus", "saturn"],
          aspect: venusSaturnAspect.label,
          strength: strengthFromAspect(venusSaturnAspect.delta, venusSaturnAspect.orb + 5, 72),
          source: "daily-sky" as const,
        }
      : {
          id: `mercury-in-${signForDegree(mercuryDegree).toLowerCase()}`,
          label: `Mercury sharpens ${signForDegree(mercuryDegree)} communication`,
          bodies: ["mercury"],
          strength: 64,
          source: "daily-sky" as const,
          zodiac: signForDegree(mercuryDegree),
          element: SIGN_ELEMENTS[signForDegree(mercuryDegree)],
        },
  ];

  return signals
    .map((signal) => ({ ...signal, themes: themesForSignal(signal) }))
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 5);
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

function emptyBreakdown(): NonNullable<SkyCardCandidate["scoreBreakdown"]> {
  return { sky: 0, natal: 0, focus: 0, history: 0, randomness: 0 };
}

function addThemeScores(
  map: Map<string, SkyCardCandidate>,
  themes: TarotTheme[],
  source: keyof NonNullable<SkyCardCandidate["scoreBreakdown"]>,
  multiplier: number,
) {
  themes.forEach((theme, themeIndex) => {
    const cards = THEME_TAROT_WEIGHTS[theme] ?? [];
    cards.forEach((entry) => {
      const value = (entry.weight + Math.max(0, 3 - themeIndex)) * multiplier;
      const existing = map.get(entry.cardId);
      if (existing) {
        existing.weight += value;
        existing.scoreBreakdown![source] += value;
        existing.themes = uniqueThemes([...existing.themes, theme]);
        if (!existing.reasons.includes(entry.reason)) existing.reasons.push(entry.reason);
        return;
      }
      map.set(entry.cardId, {
        cardId: entry.cardId,
        weight: value,
        themes: [theme],
        reasons: [entry.reason],
        scoreBreakdown: { ...emptyBreakdown(), [source]: value },
      });
    });
  });
}

function themesFromHistory(history: DailyCardMemory[] = []): TarotTheme[] {
  const recent = history.slice(0, 7);
  const counts = recent.reduce(
    (acc, item) => {
      const id = item.cardId?.toLowerCase() ?? "";
      const name = item.cardName?.toLowerCase() ?? "";
      const text = `${id} ${name}`;
      if (text.includes("pentacles")) acc.pentacles += 1;
      if (text.includes("cups") || text.includes("lovers") || text.includes("empress")) acc.cups += 1;
      if (text.includes("swords") || text.includes("justice") || text.includes("high priestess")) acc.swords += 1;
      if (text.includes("wands") || text.includes("chariot") || text.includes("magician")) acc.wands += 1;
      if (/\\b(13-death|16-tower|20-judgement|21-world|death|tower|judgement|world)\\b/.test(text)) acc.majorChange += 1;
      return acc;
    },
    { pentacles: 0, cups: 0, swords: 0, wands: 0, majorChange: 0 },
  );
  const themes: TarotTheme[] = [];
  if (counts.pentacles >= 2) themes.push("selfWorth", "boundary", "opportunity");
  if (counts.cups >= 2) themes.push("relationshipTension", "healing");
  if (counts.swords >= 2) themes.push("truth", "communication");
  if (counts.wands >= 2) themes.push("action", "growth");
  if (counts.majorChange >= 2) themes.push("transformation", "truth");
  return uniqueThemes(themes);
}

function cardLabelFromId(cardId: string): string {
  return cardId
    .replace(/^\d+-/, "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toneForThemes(themes: TarotTheme[]): SkyGuidedTone {
  if (themes.some((theme) => theme === "healing" || theme === "waiting" || theme === "emotionalFear")) {
    return "soft";
  }
  if (themes.some((theme) => theme === "attachment" || theme === "confusion" || theme === "relationshipTension" || theme === "transformation")) {
    return "mirror";
  }
  return "honest";
}

function scoreCandidatePool({
  skyThemes,
  natalThemes,
  focusThemes,
  historyThemes,
  history,
  seed,
}: {
  skyThemes: TarotTheme[];
  natalThemes: TarotTheme[];
  focusThemes: TarotTheme[];
  historyThemes: TarotTheme[];
  history?: DailyCardMemory[];
  seed: string;
}): SkyCardCandidate[] {
  const map = new Map<string, SkyCardCandidate>();
  addThemeScores(map, skyThemes.length ? skyThemes : ["truth"], "sky", 4);
  addThemeScores(map, natalThemes, "natal", 2.5);
  addThemeScores(map, focusThemes, "focus", 1.5);
  addThemeScores(map, historyThemes, "history", 1);

  const recentCardIds = new Set((history ?? []).slice(0, 7).map((item) => item.cardId).filter(Boolean));
  map.forEach((candidate) => {
    const randomValue = (hash(`${seed}:${candidate.cardId}`) % 1000) / 100;
    candidate.weight += randomValue;
    candidate.scoreBreakdown!.randomness = randomValue;
    if (recentCardIds.has(candidate.cardId)) {
      candidate.weight = Math.max(1, candidate.weight - 12);
      candidate.reasons.push("recent repeat softened so the message does not get stuck");
    }
  });

  const pool = [...map.values()].sort((a, b) => b.weight - a.weight || a.cardId.localeCompare(b.cardId)).slice(0, 12);
  return pool.length ? pool : buildCandidatePool(["truth", "healing", "boundary"]);
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
  history = [],
  focusThemes = [],
  tone,
  seedSalt = "daily-sky-card",
}: SkyGuidedTarotInput = {}): SkyGuidedTarotResult {
  const dailySignals = (signals?.length ? signals : getDailySkySignals({ date, birthDetails }))
    .map((signal) => ({ ...signal, themes: themesForSignal(signal) }))
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 5);
  const personalSignals = getPersonalChartSignals(date, birthDetails);
  const evidence = [...dailySignals, ...personalSignals]
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 6);
  const themes = uniqueThemes(evidence.flatMap((signal) => signal.themes ?? []));
  const dateSeed = getLocalDateString(date);
  const historyThemes = themesFromHistory(history);
  const skyThemes = uniqueThemes(dailySignals.flatMap((signal) => signal.themes ?? []));
  const natalThemes = uniqueThemes(personalSignals.flatMap((signal) => signal.themes ?? []));
  const seed = `${seedSalt}:${anonId}:${dateSeed}:${birthDetails?.birthDate ?? "guest"}:${birthDetails?.birthTime ?? "unknown-time"}:${birthDetails?.birthPlace ?? "unknown-place"}:${evidence.map((item) => item.id).join("|")}`;
  const candidatePool = scoreCandidatePool({
    skyThemes,
    natalThemes,
    focusThemes,
    historyThemes,
    history,
    seed,
  });
  const selected = weightedPick(
    candidatePool,
    seed,
  );
  const selectedTone = tone ?? toneForThemes(selected.themes);
  const primaryThemes = selected.themes.slice(0, 2);
  const strongestDailySignal = dailySignals[0]?.label ?? "today's sky";
  const strongestPersonalSignal = personalSignals[0]?.label ?? (birthDetails?.birthDate ? "your birth date pattern" : "your saved daily rhythm");
  const historyLine = historyThemes.length
    ? `Hint also noticed recent cards repeating ${historyThemes.slice(0, 2).map((theme) => THEME_LABELS[theme]).join(" and ")}.`
    : "The final turn keeps the ritual feeling alive after the card has already matched today's personal pool.";
  const whyThisCard = [
    `Today's sky points to ${strongestDailySignal}.`,
    `Your chart layer adds ${strongestPersonalSignal}.`,
    `${cardLabelFromId(selected.cardId)} rose from the personalized pool because it matched ${primaryThemes.map((theme) => THEME_LABELS[theme]).join(" and ") || "truth"}.`,
    historyLine,
  ].join(" ");
  const chartDepth: SkyGuidedTarotResult["chartDepth"] =
    birthDetails?.birthDate && birthDetails.birthTime && birthDetails.birthPlace ? "time-place" : birthDetails?.birthDate ? "date-only" : "guest";

  return {
    selectedCardId: selected.cardId,
    tone: selectedTone,
    seed: `${anonId}:${dateSeed}`,
    themes,
    themeLabels: themes.map((theme) => THEME_LABELS[theme]),
    evidence,
    personalSignals,
    candidatePool,
    chartDepth,
    selectionWeights: {
      dailySky: 40,
      natalChart: chartDepth === "guest" ? 0 : chartDepth === "date-only" ? 15 : 25,
      currentFocus: focusThemes.length ? 15 : 0,
      history: historyThemes.length ? 10 : 0,
      controlledRandomness: 10,
    },
    whyThisCard,
  };
}
