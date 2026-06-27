import crypto from "node:crypto";

export type ZodiacSign =
  | "aries"
  | "taurus"
  | "gemini"
  | "cancer"
  | "leo"
  | "virgo"
  | "libra"
  | "scorpio"
  | "sagittarius"
  | "capricorn"
  | "aquarius"
  | "pisces";

export type AstrologyBody =
  | "sun"
  | "moon"
  | "rising"
  | "mercury"
  | "venus"
  | "mars"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune"
  | "pluto";

export type AstrologyElement = "fire" | "earth" | "air" | "water";
export type AstrologyModality = "cardinal" | "fixed" | "mutable";

export type BirthProfileInput = {
  userId?: string;
  name?: string;
  birthday: string;
  birthTime?: string;
  birthCity?: string;
  birthCountry?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string | number;
};

export type AstrologyPlacement = {
  body: AstrologyBody;
  sign?: ZodiacSign;
  degree?: number;
  house?: number;
  retrograde?: boolean;
  element?: AstrologyElement;
  modality?: AstrologyModality;
};

export type NormalizedBirthChart = {
  provider: "astrologyapi" | "fallback";
  calculatedAt: string;
  input: BirthProfileInput;
  placements: AstrologyPlacement[];
  sunSign?: ZodiacSign;
  moonSign?: ZodiacSign;
  risingSign?: ZodiacSign;
  venusSign?: ZodiacSign;
  marsSign?: ZodiacSign;
  dominantElement?: AstrologyElement;
  dominantModality?: AstrologyModality;
  moonPhase?: {
    name: string;
    illumination?: number;
    sign?: ZodiacSign;
  };
  natalWheel?: {
    svg?: string;
    base64?: string;
    source?: "api" | "symbolic";
  };
  aspects?: Array<{
    from: string;
    to: string;
    type: string;
    orb?: number;
    strength?: number;
  }>;
  houses?: Array<{
    house: number;
    sign?: ZodiacSign;
    degree?: number;
  }>;
  chartSummary: {
    headline: string;
    summary: string;
    strengths: string[];
    watchOut: string[];
  };
  source: "api" | "fallback";
  approximate?: boolean;
};

export type AstrologyStatus = {
  configured: boolean;
  provider: "astrologyapi";
  baseUrlConfigured: boolean;
  capabilities: {
    birthChart: boolean;
    westernAstrology: boolean;
    indianAstrology: boolean;
    horoscope: boolean;
    tarot: boolean;
    pdfReports: boolean;
    compatibility: boolean;
    transits: boolean;
  };
};

const ZODIAC_SIGNS: ZodiacSign[] = [
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

const ELEMENT_BY_SIGN: Record<ZodiacSign, AstrologyElement> = {
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

const MODALITY_BY_SIGN: Record<ZodiacSign, AstrologyModality> = {
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

const BODY_NAMES: Record<string, AstrologyBody> = {
  asc: "rising",
  ascendant: "rising",
  rising: "rising",
  sun: "sun",
  moon: "moon",
  mercury: "mercury",
  venus: "venus",
  mars: "mars",
  jupiter: "jupiter",
  saturn: "saturn",
  uranus: "uranus",
  neptune: "neptune",
  pluto: "pluto",
};

type CityCoordinate = {
  latitude: number;
  longitude: number;
  timeZone: string;
};

const CITY_COORDINATES: Record<string, CityCoordinate> = {
  phoenix: { latitude: 33.4484, longitude: -112.074, timeZone: "America/Phoenix" },
  tempe: { latitude: 33.4255, longitude: -111.94, timeZone: "America/Phoenix" },
  mesa: { latitude: 33.4152, longitude: -111.8315, timeZone: "America/Phoenix" },
  scottsdale: { latitude: 33.4942, longitude: -111.9261, timeZone: "America/Phoenix" },
  "los angeles": { latitude: 34.0522, longitude: -118.2437, timeZone: "America/Los_Angeles" },
  "san francisco": { latitude: 37.7749, longitude: -122.4194, timeZone: "America/Los_Angeles" },
  seattle: { latitude: 47.6062, longitude: -122.3321, timeZone: "America/Los_Angeles" },
  "new york": { latitude: 40.7128, longitude: -74.006, timeZone: "America/New_York" },
  boston: { latitude: 42.3601, longitude: -71.0589, timeZone: "America/New_York" },
  miami: { latitude: 25.7617, longitude: -80.1918, timeZone: "America/New_York" },
  chicago: { latitude: 41.8781, longitude: -87.6298, timeZone: "America/Chicago" },
  dallas: { latitude: 32.7767, longitude: -96.797, timeZone: "America/Chicago" },
  houston: { latitude: 29.7604, longitude: -95.3698, timeZone: "America/Chicago" },
  denver: { latitude: 39.7392, longitude: -104.9903, timeZone: "America/Denver" },
  "las vegas": { latitude: 36.1699, longitude: -115.1398, timeZone: "America/Los_Angeles" },
  atlanta: { latitude: 33.749, longitude: -84.388, timeZone: "America/New_York" },
  london: { latitude: 51.5072, longitude: -0.1276, timeZone: "Europe/London" },
  paris: { latitude: 48.8566, longitude: 2.3522, timeZone: "Europe/Paris" },
  toronto: { latitude: 43.6532, longitude: -79.3832, timeZone: "America/Toronto" },
  vancouver: { latitude: 49.2827, longitude: -123.1207, timeZone: "America/Vancouver" },
  beijing: { latitude: 39.9042, longitude: 116.4074, timeZone: "Asia/Shanghai" },
  shanghai: { latitude: 31.2304, longitude: 121.4737, timeZone: "Asia/Shanghai" },
  guangzhou: { latitude: 23.1291, longitude: 113.2644, timeZone: "Asia/Shanghai" },
  shenzhen: { latitude: 22.5431, longitude: 114.0579, timeZone: "Asia/Shanghai" },
  "hong kong": { latitude: 22.3193, longitude: 114.1694, timeZone: "Asia/Hong_Kong" },
  taipei: { latitude: 25.033, longitude: 121.5654, timeZone: "Asia/Taipei" },
  singapore: { latitude: 1.3521, longitude: 103.8198, timeZone: "Asia/Singapore" },
  tokyo: { latitude: 35.6762, longitude: 139.6503, timeZone: "Asia/Tokyo" },
  seoul: { latitude: 37.5665, longitude: 126.978, timeZone: "Asia/Seoul" },
  sydney: { latitude: -33.8688, longitude: 151.2093, timeZone: "Australia/Sydney" },
  melbourne: { latitude: -37.8136, longitude: 144.9631, timeZone: "Australia/Melbourne" },
};

const chartCache = new Map<string, NormalizedBirthChart>();

function envValue(key: string) {
  return process.env[key]?.trim() ?? "";
}

function providerConfig() {
  const apiKey = envValue("ASTROLOGYAPI_API_KEY") || envValue("ASTROLOGY_API_KEY");
  const userId = envValue("ASTROLOGYAPI_USER_ID") || envValue("ASTROLOGY_API_USER_ID");
  const baseUrl = envValue("ASTROLOGYAPI_BASE_URL") || envValue("ASTROLOGY_API_BASE_URL") || "https://json.astrologyapi.com/v1";
  return {
    apiKey,
    userId,
    baseUrl: baseUrl.replace(/\/+$/, ""),
    configured: Boolean(apiKey && (userId || apiKey.startsWith("ak-"))),
    hasBasicAuth: Boolean(userId && apiKey),
  };
}

export function getAstrologyStatus(): AstrologyStatus {
  const config = providerConfig();
  return {
    configured: config.configured,
    provider: "astrologyapi",
    baseUrlConfigured: Boolean(config.baseUrl),
    capabilities: {
      birthChart: config.configured,
      westernAstrology: config.configured,
      indianAstrology: false,
      horoscope: false,
      tarot: false,
      pdfReports: false,
      compatibility: config.configured,
      transits: config.configured,
    },
  };
}

function hash(value: string) {
  let total = 0;
  for (let index = 0; index < value.length; index += 1) {
    total = (total * 31 + value.charCodeAt(index)) >>> 0;
  }
  return total;
}

function cacheKey(input: BirthProfileInput) {
  return JSON.stringify({
    userId: input.userId ?? "",
    name: input.name ?? "",
    birthday: input.birthday,
    birthTime: input.birthTime ?? "",
    birthCity: input.birthCity ?? "",
    birthCountry: input.birthCountry ?? "",
    latitude: input.latitude ?? "",
    longitude: input.longitude ?? "",
    timezone: input.timezone ?? "",
  });
}

function normalizeSign(value: unknown): ZodiacSign | undefined {
  if (typeof value === "number") return ZODIAC_SIGNS[(value - 1 + 12) % 12];
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase().replace(/[^a-z]/g, "");
  return ZODIAC_SIGNS.find((sign) => sign === normalized);
}

function signFromBirthday(birthday: string): ZodiacSign | undefined {
  const match = birthday.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return undefined;
  const month = Number(match[2]);
  const day = Number(match[3]);
  const marker = month * 100 + day;
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

function parseBirthday(birthday: string) {
  const match = birthday.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function parseBirthTime(time?: string) {
  const match = time?.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return { hour: 12, min: 0 };
  return {
    hour: Math.max(0, Math.min(23, Number(match[1]))),
    min: Math.max(0, Math.min(59, Number(match[2]))),
  };
}

function ianaTimezoneOffset(timezone: string, input: Pick<BirthProfileInput, "birthday" | "birthTime">) {
  const birthday = parseBirthday(input.birthday);
  if (!birthday) return undefined;
  const time = parseBirthTime(input.birthTime);
  try {
    const utcDate = new Date(Date.UTC(birthday.year, birthday.month - 1, birthday.day, time.hour, time.min, 0));
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const parts = Object.fromEntries(formatter.formatToParts(utcDate).map((part) => [part.type, part.value]));
    const localAsUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    );
    return Math.round(((localAsUtc - utcDate.getTime()) / 36e5) * 100) / 100;
  } catch {
    return undefined;
  }
}

function parseTimezoneOffset(timezone: string | number | undefined, input: Pick<BirthProfileInput, "birthday" | "birthTime">) {
  if (!timezone) return undefined;
  if (typeof timezone === "number") return Number.isFinite(timezone) ? timezone : undefined;
  const numeric = Number(timezone);
  if (Number.isFinite(numeric)) return numeric;
  const match = timezone.match(/UTC\s*([+-]\d{1,2})(?::?(\d{2}))?/i);
  if (!match) return ianaTimezoneOffset(timezone, input);
  const hour = Number(match[1]);
  const minute = Number(match[2] ?? "0") / 60;
  return hour < 0 ? hour - minute : hour + minute;
}

function cityKey(value?: string) {
  return value?.toLowerCase().replace(/\([^)]*\)/g, "").replace(/,\s*(usa?|united states|china|canada|uk|united kingdom|japan|korea|australia)$/i, "").replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();
}

function cityCoordinate(input: BirthProfileInput) {
  const key = cityKey(input.birthCity);
  return key ? CITY_COORDINATES[key] : undefined;
}

function enrichPlacement(body: AstrologyBody, sign?: ZodiacSign, degree?: number, house?: number, retrograde?: boolean): AstrologyPlacement {
  return {
    body,
    sign,
    degree,
    house,
    retrograde,
    element: sign ? ELEMENT_BY_SIGN[sign] : undefined,
    modality: sign ? MODALITY_BY_SIGN[sign] : undefined,
  };
}

function countMostCommon<T extends string>(values: Array<T | undefined>): T | undefined {
  const counts = new Map<T, number>();
  for (const value of values) {
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
}

function moonPhaseName(seed: number) {
  return ["New Moon", "Waxing Moon", "First Quarter", "Full Moon", "Waning Moon"][seed % 5]!;
}

function chartSummaryFor(placements: AstrologyPlacement[], approximate: boolean): NormalizedBirthChart["chartSummary"] {
  const sun = placements.find((placement) => placement.body === "sun");
  const moon = placements.find((placement) => placement.body === "moon");
  const rising = placements.find((placement) => placement.body === "rising");
  const element = countMostCommon(placements.map((placement) => placement.element)) ?? "air";
  const modality = countMostCommon(placements.map((placement) => placement.modality)) ?? "mutable";

  const headline = sun?.sign && moon?.sign
    ? `${titleCase(sun.sign)} core, ${titleCase(moon.sign)} instinct`
    : "Personal signal pending";

  return {
    headline,
    summary: rising?.sign
      ? `${titleCase(sun?.sign ?? "air")} drives the center, ${titleCase(moon?.sign ?? "water")} shows the inner weather, and ${titleCase(rising.sign)} shapes the first impression.`
      : `${titleCase(element)} is the strongest available tone. Add birth time and location for a sharper rising and house read.`,
    strengths: [
      `${titleCase(element)} dominant: this chart notices ${element === "fire" ? "movement" : element === "earth" ? "what is practical" : element === "air" ? "patterns and language" : "emotional signal"} quickly.`,
      `${titleCase(modality)} rhythm: it adapts by ${modality === "cardinal" ? "starting cleanly" : modality === "fixed" ? "holding steady" : "adjusting in motion"}.`,
      approximate ? "Even in preview mode, the same birth profile keeps the same seal." : "Birth time and location make the chart more specific.",
    ],
    watchOut: approximate
      ? ["Rising, houses, and timing may shift until birth time and location are precise."]
      : ["Do not flatten the whole chart into one sign; the pattern matters."],
  };
}

function titleCase(sign: string) {
  return sign.charAt(0).toUpperCase() + sign.slice(1);
}

function buildFallbackChart(input: BirthProfileInput, reason: "missing-location" | "provider-unavailable" | "provider-error" = "provider-unavailable"): NormalizedBirthChart {
  const seed = hash([
    input.birthday,
    input.birthTime ?? "unknown-time",
    input.birthCity ?? "unknown-city",
    input.birthCountry ?? "unknown-country",
    input.timezone ?? "unknown-zone",
  ].join("|"));
  const sun = signFromBirthday(input.birthday) ?? signAt(seed, 0);
  const bodyDefs: Array<[AstrologyBody, ZodiacSign, number]> = [
    ["sun", sun, 1],
    ["moon", signAt(seed, 3), 2],
    ["rising", signAt(seed, 5), 3],
    ["mercury", signAt(seed, 7), 4],
    ["venus", signAt(seed, 9), 5],
    ["mars", signAt(seed, 11), 6],
    ["jupiter", signAt(seed, 13), 7],
    ["saturn", signAt(seed, 15), 8],
    ["uranus", signAt(seed, 17), 9],
    ["neptune", signAt(seed, 19), 10],
    ["pluto", signAt(seed, 21), 11],
  ];
  const placements = bodyDefs.map(([body, sign, offset]) =>
    enrichPlacement(body, sign, (seed + offset * 17) % 30, offset <= 10 ? offset : undefined, (seed + offset) % 7 === 0),
  );
  const approximate = reason !== "provider-unavailable" || !input.birthTime || input.latitude === undefined || input.longitude === undefined;
  const summary = chartSummaryFor(placements, approximate);
  const dominantElement = countMostCommon(placements.map((placement) => placement.element));
  const dominantModality = countMostCommon(placements.map((placement) => placement.modality));

  return {
    provider: "fallback",
    calculatedAt: new Date().toISOString(),
    input,
    placements,
    sunSign: sun,
    moonSign: placements.find((placement) => placement.body === "moon")?.sign,
    risingSign: placements.find((placement) => placement.body === "rising")?.sign,
    venusSign: placements.find((placement) => placement.body === "venus")?.sign,
    marsSign: placements.find((placement) => placement.body === "mars")?.sign,
    dominantElement,
    dominantModality,
    moonPhase: {
      name: moonPhaseName(seed),
      illumination: (seed % 100) / 100,
      sign: placements.find((placement) => placement.body === "moon")?.sign,
    },
    natalWheel: { source: "symbolic" },
    aspects: buildFallbackAspects(placements, seed),
    houses: Array.from({ length: 12 }, (_, index) => {
      const placement = placements[index % placements.length];
      return {
        house: index + 1,
        sign: placement?.sign ?? signAt(seed, index),
        degree: placement?.degree,
      };
    }),
    chartSummary: summary,
    source: "fallback",
    approximate,
  };
}

function buildFallbackAspects(placements: AstrologyPlacement[], seed: number) {
  return placements.slice(0, 5).map((placement, index) => {
    const to = placements[(index + 2) % placements.length]!;
    return {
      from: placement.body,
      to: to.body,
      type: ["trine", "square", "sextile", "opposition", "conjunction"][(seed + index) % 5]!,
      orb: ((seed + index * 3) % 8) + 1,
      strength: 50 + ((seed + index * 11) % 44),
    };
  });
}

function providerHeaders(config: ReturnType<typeof providerConfig>) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (config.hasBasicAuth) {
    headers.authorization = `Basic ${Buffer.from(`${config.userId}:${config.apiKey}`).toString("base64")}`;
  } else {
    headers["x-astrologyapi-key"] = config.apiKey;
  }
  return headers;
}

async function providerPost(endpoint: string, payload: Record<string, unknown>) {
  const config = providerConfig();
  const response = await fetch(`${config.baseUrl}/${endpoint.replace(/^\/+/, "")}`, {
    method: "POST",
    headers: providerHeaders(config),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`ASTROLOGY_PROVIDER_${response.status}`);
  }

  return response.json() as Promise<unknown>;
}

function buildProviderPayload(input: BirthProfileInput) {
  const birthday = parseBirthday(input.birthday);
  const city = cityCoordinate(input);
  const latitude = input.latitude ?? city?.latitude;
  const longitude = input.longitude ?? city?.longitude;
  const timezone = typeof input.timezone === "number" ? input.timezone : city?.timeZone ?? input.timezone;
  const tzone = parseTimezoneOffset(timezone, input);
  if (!birthday || latitude === undefined || longitude === undefined || tzone === undefined) return null;
  const time = parseBirthTime(input.birthTime);
  return {
    day: birthday.day,
    month: birthday.month,
    year: birthday.year,
    hour: time.hour,
    min: time.min,
    lat: latitude,
    lon: longitude,
    tzone,
    house_type: envValue("HOUSE_SYSTEM") || "placidus",
  };
}

function normalizeBody(value: unknown): AstrologyBody | undefined {
  if (typeof value !== "string") return undefined;
  return BODY_NAMES[value.trim().toLowerCase().replace(/[^a-z]/g, "")];
}

function readNumber(value: unknown): number | undefined {
  const numeric = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(numeric) ? numeric : undefined;
}

function readBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return undefined;
}

function readProviderPlacements(payload: unknown): AstrologyPlacement[] {
  const root = payload as Record<string, unknown>;
  const candidate = root["planets"] ?? root["planet"] ?? root["planets_position"] ?? payload;
  const items = Array.isArray(candidate) ? candidate : [];
  const placements: AstrologyPlacement[] = [];

  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const body = normalizeBody(row["name"] ?? row["planet"] ?? row["body"]);
    if (!body) continue;
    const sign = normalizeSign(row["sign"] ?? row["signName"] ?? row["sign_name"] ?? row["zodiac"]);
    const fullDegree = readNumber(row["fullDegree"] ?? row["full_degree"]);
    const degree = readNumber(row["normDegree"] ?? row["norm_degree"] ?? row["degree"]) ?? (fullDegree !== undefined ? fullDegree % 30 : undefined);
    const house = readNumber(row["house"]);
    const retrogradeValue = row["isRetro"] ?? row["is_retro"] ?? row["retrograde"];
    placements.push(enrichPlacement(body, sign, degree, house, readBoolean(retrogradeValue)));
  }

  return placements;
}

function normalizeAspectType(value: unknown): "conjunction" | "sextile" | "square" | "trine" | "opposition" | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase().replace(/[^a-z]/g, "");
  if (normalized === "conj" || normalized === "conjunction") return "conjunction";
  if (normalized === "sextile") return "sextile";
  if (normalized === "square") return "square";
  if (normalized === "trine") return "trine";
  if (normalized === "opp" || normalized === "opposition") return "opposition";
  return undefined;
}

function readProviderHouses(payload: unknown): NonNullable<NormalizedBirthChart["houses"]> {
  const root = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const candidate = root.houses ?? root.house ?? root.house_cusps ?? root.houses_position ?? root.cusps;
  const rows = Array.isArray(candidate) ? candidate : [];
  const houses: NonNullable<NormalizedBirthChart["houses"]> = [];
  rows.forEach((item, index) => {
    if (!item || typeof item !== "object") return;
    const row = item as Record<string, unknown>;
    const house = readNumber(row.house ?? row.house_id ?? row.id ?? row.number) ?? index + 1;
    const sign = normalizeSign(row.sign ?? row.sign_name ?? row.zodiac);
    const fullDegree = readNumber(row.fullDegree ?? row.full_degree ?? row.start_degree);
    const degree = readNumber(row.normDegree ?? row.norm_degree ?? row.degree ?? row.cusp) ?? (fullDegree !== undefined ? fullDegree % 30 : undefined);
    if (house < 1 || house > 12) return;
    houses.push({ house, sign, degree });
  });
  return houses.sort((a, b) => a.house - b.house);
}

function readProviderAspects(payload: unknown): NonNullable<NormalizedBirthChart["aspects"]> {
  const root = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const candidate = root.aspects ?? root.aspect ?? root.planet_aspects ?? root.natal_aspects;
  const rows = Array.isArray(candidate) ? candidate : [];
  const aspects: NonNullable<NormalizedBirthChart["aspects"]> = [];
  for (const item of rows) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const from = normalizeBody(row.from ?? row.planet1 ?? row.p1 ?? row.aspecting_planet ?? row.source);
    const to = normalizeBody(row.to ?? row.planet2 ?? row.p2 ?? row.aspected_planet ?? row.target);
    const type = normalizeAspectType(row.type ?? row.aspect ?? row.aspect_name);
    if (!from || !to || !type) continue;
    const orb = readNumber(row.orb ?? row.orb_value ?? row.diff);
    const strength = readNumber(row.strength ?? row.score ?? row.power);
    aspects.push({ from, to, type, orb, strength });
  }
  return aspects;
}

function normalizeProviderChart(input: BirthProfileInput, planetsPayload: unknown, chartPayload?: unknown): NormalizedBirthChart {
  const providerPlacements = readProviderPlacements(planetsPayload);
  if (!providerPlacements.length) {
    throw new Error("ASTROLOGY_PROVIDER_EMPTY_PLACEMENTS");
  }

  const chart = chartPayload && typeof chartPayload === "object" ? (chartPayload as Record<string, unknown>) : {};
  const svg = typeof chart["svg"] === "string" ? chart["svg"] : typeof chart["chart_svg"] === "string" ? chart["chart_svg"] : undefined;
  const base64 = typeof chart["base64"] === "string" ? chart["base64"] : typeof chart["chart"] === "string" ? chart["chart"] : undefined;
  const providerHouses = readProviderHouses(chartPayload);
  const providerAspects = readProviderAspects(chartPayload);
  const fallback = buildFallbackChart(input, "provider-unavailable");
  const houseOne = providerHouses.find((house) => house.house === 1);
  const byBody = new Map(providerPlacements.map((placement) => [placement.body, placement]));
  const placements = fallback.placements.map((fallbackPlacement) => {
    if (fallbackPlacement.body === "rising" && houseOne?.sign) {
      return enrichPlacement("rising", houseOne.sign, houseOne.degree, 1, false);
    }
    return byBody.get(fallbackPlacement.body) ?? fallbackPlacement;
  });
  const dominantElement = countMostCommon(placements.map((placement) => placement.element));
  const dominantModality = countMostCommon(placements.map((placement) => placement.modality));
  const summary = chartSummaryFor(placements, false);

  return {
    provider: "astrologyapi",
    calculatedAt: new Date().toISOString(),
    input,
    placements,
    sunSign: placements.find((placement) => placement.body === "sun")?.sign,
    moonSign: placements.find((placement) => placement.body === "moon")?.sign,
    risingSign: placements.find((placement) => placement.body === "rising")?.sign,
    venusSign: placements.find((placement) => placement.body === "venus")?.sign,
    marsSign: placements.find((placement) => placement.body === "mars")?.sign,
    dominantElement,
    dominantModality,
    moonPhase: fallback.moonPhase,
    natalWheel: svg || base64 ? { svg, base64, source: "api" } : { source: "symbolic" },
    aspects: providerAspects.length ? providerAspects : fallback.aspects,
    houses: providerHouses.length ? providerHouses : fallback.houses,
    chartSummary: summary,
    source: "api",
    approximate: false,
  };
}

export async function calculateBirthChart(input: BirthProfileInput, options: { force?: boolean } = {}) {
  const key = cacheKey(input);
  if (!options.force) {
    const cached = chartCache.get(key);
    if (cached) return cached;
  }

  const config = providerConfig();
  const providerPayload = buildProviderPayload(input);
  let chart: NormalizedBirthChart;

  if (!config.configured || !providerPayload) {
    chart = buildFallbackChart(input, providerPayload ? "provider-unavailable" : "missing-location");
  } else {
    try {
      const planetsPayload = await providerPost("planets/tropical", providerPayload);
      let chartPayload: unknown;
      try {
        chartPayload = await providerPost("western_chart_data", providerPayload);
      } catch {
        chartPayload = undefined;
      }
      chart = normalizeProviderChart(input, planetsPayload, chartPayload);
    } catch {
      chart = buildFallbackChart(input, "provider-error");
    }
  }

  chartCache.set(key, chart);
  return chart;
}

export type CompatibilityScores = {
  overall: number;
  attraction: number;
  communication: number;
  emotionalRhythm: number;
  stability: number;
  tension: number;
};

export type CompatibilityResult = {
  id: string;
  source: "api" | "preview";
  calculatedAt: string;
  people: {
    user: {
      name?: string;
      chart: NormalizedBirthChart;
    };
    friend: {
      name?: string;
      chart: NormalizedBirthChart;
    };
  };
  scores: CompatibilityScores;
  highlights: {
    strongestLink: string;
    easyPart: string;
    frictionPoint: string;
    advice: string;
  };
  sharedSeal?: string;
};

function distance(a?: ZodiacSign, b?: ZodiacSign) {
  if (!a || !b) return 6;
  const diff = Math.abs(ZODIAC_SIGNS.indexOf(a) - ZODIAC_SIGNS.indexOf(b));
  return Math.min(diff, 12 - diff);
}

function pairScore(a?: ZodiacSign, b?: ZodiacSign, weight = 1) {
  const d = distance(a, b);
  const base = [88, 76, 82, 58, 84, 62, 70][d] ?? 66;
  const elementBonus = a && b && ELEMENT_BY_SIGN[a] === ELEMENT_BY_SIGN[b] ? 8 : 0;
  return Math.max(28, Math.min(96, Math.round((base + elementBonus) * weight)));
}

export function buildCompatibilityResult(userChart: NormalizedBirthChart, friendChart: NormalizedBirthChart): CompatibilityResult {
  const attraction = pairScore(userChart.venusSign, friendChart.marsSign);
  const communication = pairScore(
    userChart.placements.find((placement) => placement.body === "mercury")?.sign,
    friendChart.placements.find((placement) => placement.body === "mercury")?.sign,
  );
  const emotionalRhythm = pairScore(userChart.moonSign, friendChart.moonSign);
  const stability = pairScore(userChart.sunSign, friendChart.risingSign, 0.95);
  const tension = Math.max(18, Math.min(88, 100 - pairScore(userChart.marsSign, friendChart.moonSign)));
  const overall = Math.round((attraction + communication + emotionalRhythm + stability + (100 - tension)) / 5);
  const strongest = [
    ["attraction", attraction],
    ["communication", communication],
    ["emotional rhythm", emotionalRhythm],
    ["stability", stability],
  ].sort((a, b) => Number(b[1]) - Number(a[1]))[0]![0];

  return {
    id: crypto.randomUUID(),
    source: "preview",
    calculatedAt: new Date().toISOString(),
    people: {
      user: { name: userChart.input.name, chart: userChart },
      friend: { name: friendChart.input.name, chart: friendChart },
    },
    scores: {
      overall,
      attraction,
      communication,
      emotionalRhythm,
      stability,
      tension,
    },
    highlights: {
      strongestLink: `The clearest link is ${strongest}; that is where the connection may feel easiest to read.`,
      easyPart: "The shared chart works best when both people name what is true before trying to solve it.",
      frictionPoint: tension > 58 ? "Mars and Moon signals may heat up quickly, so pace matters." : "The friction signal is manageable if the conversation stays specific.",
      advice: "Use the chart as a mirror, not a verdict. Ask one direct question and watch the pattern.",
    },
    sharedSeal: hash(`${userChart.sunSign}:${friendChart.sunSign}:${overall}`).toString(16),
  };
}
