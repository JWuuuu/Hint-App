import crypto from "node:crypto";
import { getOpenAIClient, openaiApiKey, openaiModel } from "../../lib/openaiConfig.js";
import { calculateBirthChart, getAstrologyStatus, type BirthProfileInput, type NormalizedBirthChart } from "./astrologyApiClient.js";

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

type AstroProfile = {
  id?: string;
  name?: string;
  birthDate: string;
  birthTime?: string;
  birthPlace: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  timezoneOffset?: number;
};

type GeoPlace = {
  label?: string;
  name: string;
  country?: string;
  countryCode?: string;
  region?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  timezoneId?: string;
  timezoneOffset?: number;
};

type InterpretationKind = "placement" | "signs" | "transit" | "synastry" | "reportPreview";
type InterpretationTone = "warm" | "direct" | "mirror";
type TimezoneResult = {
  timezoneId: string | null;
  timezoneOffset: number | null;
};

const PARTIAL_CHART_MESSAGE = "Sun and planet signs can be previewed. Rising sign and houses need birth time and location.";
const DAY = 86_400_000;
const natalCache = new Map<string, CacheEntry<any>>();
const transitCache = new Map<string, CacheEntry<any>>();
const synastryCache = new Map<string, CacheEntry<any>>();
const nasaCache = new Map<string, CacheEntry<any>>();
const gptCache = new Map<string, CacheEntry<any>>();
const geoCache = new Map<string, CacheEntry<any>>();
const timezoneCache = new Map<string, CacheEntry<any>>();

const FALLBACK_PLACES: GeoPlace[] = [
  { name: "Phoenix", region: "Arizona", country: "United States", latitude: 33.4484, longitude: -112.074, timezone: "America/Phoenix", timezoneOffset: -7 },
  { name: "Los Angeles", region: "California", country: "United States", latitude: 34.0522, longitude: -118.2437, timezone: "America/Los_Angeles", timezoneOffset: -8 },
  { name: "San Francisco", region: "California", country: "United States", latitude: 37.7749, longitude: -122.4194, timezone: "America/Los_Angeles", timezoneOffset: -8 },
  { name: "New York", region: "New York", country: "United States", latitude: 40.7128, longitude: -74.006, timezone: "America/New_York", timezoneOffset: -5 },
  { name: "Chicago", region: "Illinois", country: "United States", latitude: 41.8781, longitude: -87.6298, timezone: "America/Chicago", timezoneOffset: -6 },
  { name: "London", country: "United Kingdom", latitude: 51.5072, longitude: -0.1276, timezone: "Europe/London", timezoneOffset: 0 },
  { name: "Taipei", country: "Taiwan", latitude: 25.033, longitude: 121.5654, timezone: "Asia/Taipei", timezoneOffset: 8 },
  { name: "Tokyo", country: "Japan", latitude: 35.6762, longitude: 139.6503, timezone: "Asia/Tokyo", timezoneOffset: 9 },
  { name: "Singapore", country: "Singapore", latitude: 1.3521, longitude: 103.8198, timezone: "Asia/Singapore", timezoneOffset: 8 },
  { name: "Sydney", region: "New South Wales", country: "Australia", latitude: -33.8688, longitude: 151.2093, timezone: "Australia/Sydney", timezoneOffset: 10 },
];

function envValue(key: string) {
  return process.env[key]?.trim() ?? "";
}

function cacheGet<T>(cache: Map<string, CacheEntry<T>>, key: string) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function cacheSet<T>(cache: Map<string, CacheEntry<T>>, key: string, value: T, ttlMs: number) {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function hash(value: unknown) {
  return crypto.createHash("sha256").update(stableJson(value)).digest("hex").slice(0, 24);
}

function parsedDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

function astrologyApiDate(value?: string) {
  if (!value) return undefined;
  const parsed = parsedDate(value);
  if (!parsed) return value;
  return `${String(parsed.month).padStart(2, "0")}-${String(parsed.day).padStart(2, "0")}-${parsed.year}`;
}

function parsedTime(value?: string) {
  const match = value?.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return { hour: 12, min: 0 };
  return { hour: Number(match[1]), min: Number(match[2]) };
}

function readNumber(value: unknown): number | undefined {
  const numeric = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(numeric) ? numeric : undefined;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizedAspect(value: unknown) {
  return String(value ?? "").toLowerCase().replace(/\s+/g, "_");
}

function placeLabel(place: GeoPlace) {
  return place.label ?? [place.name, place.region, place.country].filter(Boolean).join(", ");
}

function fallbackGeoPlaces(query: string, maxRows: number) {
  const terms = query.toLowerCase().split(/[,\s]+/).filter(Boolean);
  if (!terms.length) return [];
  const matches = FALLBACK_PLACES.filter((place) => {
    const label = placeLabel(place).toLowerCase();
    return terms.every((term) => label.includes(term));
  });
  return (matches.length ? matches : FALLBACK_PLACES.filter((place) => place.name.toLowerCase().includes(terms[0]!))).slice(0, maxRows);
}

function timezoneOffsetForZone(timezone: string | undefined, date?: string) {
  if (!timezone) return undefined;
  try {
    const marker = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T12:00:00Z` : new Date().toISOString();
    const utcDate = new Date(marker);
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

function nearestFallbackPlace(latitude: number, longitude: number) {
  return FALLBACK_PLACES.slice().sort((a, b) => {
    const aDistance = (a.latitude - latitude) ** 2 + (a.longitude - longitude) ** 2;
    const bDistance = (b.latitude - latitude) ** 2 + (b.longitude - longitude) ** 2;
    return aDistance - bDistance;
  })[0];
}

function providerConfigured() {
  const userId = envValue("ASTROLOGYAPI_USER_ID") || envValue("ASTROLOGY_API_USER_ID");
  const apiKey = envValue("ASTROLOGYAPI_API_KEY") || envValue("ASTROLOGY_API_KEY");
  return Boolean(apiKey && (userId || apiKey.startsWith("ak-")));
}

function nasaApiKey() {
  return envValue("NASA_API_KEY");
}

function providerHeaders() {
  const userId = envValue("ASTROLOGYAPI_USER_ID") || envValue("ASTROLOGY_API_USER_ID");
  const apiKey = envValue("ASTROLOGYAPI_API_KEY") || envValue("ASTROLOGY_API_KEY");
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (userId && apiKey) {
    headers.authorization = `Basic ${Buffer.from(`${userId}:${apiKey}`).toString("base64")}`;
  } else {
    headers["x-astrologyapi-key"] = apiKey;
  }
  return headers;
}

function providerBaseUrl() {
  return (envValue("ASTROLOGYAPI_BASE_URL") || envValue("ASTROLOGY_API_BASE_URL") || "https://json.astrologyapi.com/v1").replace(/\/+$/, "");
}

function toProviderInput(profile: AstroProfile): BirthProfileInput {
  return {
    userId: profile.id,
    name: profile.name,
    birthday: profile.birthDate,
    birthTime: profile.birthTime,
    birthCity: profile.birthPlace,
    latitude: profile.latitude,
    longitude: profile.longitude,
    timezone: profile.timezoneOffset ?? profile.timezone,
  };
}

function fullChartValidation(profile: AstroProfile) {
  const missing: string[] = [];
  if (!profile.birthTime) missing.push("birthTime");
  if (profile.latitude === undefined) missing.push("latitude");
  if (profile.longitude === undefined) missing.push("longitude");
  if (profile.timezoneOffset === undefined) missing.push("timezoneOffset");
  return missing;
}

function elementMeaning(value?: string) {
  return {
    fire: "You trust momentum once the next move is visible.",
    earth: "You trust what can become real.",
    air: "You trust language, pattern, and a clean conversation.",
    water: "You trust emotional truth before visible proof.",
  }[value ?? ""] ?? "You read the whole pattern before naming the next move.";
}

function modalityMeaning(value?: string) {
  return {
    cardinal: "You stabilize by choosing the first clean action.",
    fixed: "You stabilize by holding the line once it matters.",
    mutable: "You stabilize by adapting without losing the thread.",
  }[value ?? ""] ?? "You move between starting, holding, and adapting.";
}

function dominantCount<T extends string>(counts: Record<T, number>) {
  return Object.entries(counts).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] as T | undefined;
}

function normalizeNatalResponse(chart: NormalizedBirthChart, profile: AstroProfile, mode: "live" | "fallback" | "partial", cached: boolean) {
  const profileHash = hash(profile);
  const source = mode === "partial" || chart.source === "api" ? "astrologyapi" : "fallback";
  const partial = mode === "partial";
  const elementCounts = { fire: 0, earth: 0, air: 0, water: 0 };
  const modalityCounts = { cardinal: 0, fixed: 0, mutable: 0 };
  for (const placement of chart.placements) {
    if (placement.element) elementCounts[placement.element] += 1;
    if (placement.modality) modalityCounts[placement.modality] += 1;
  }

  return {
    source,
    mode,
    cached,
    fetchedAt: chart.calculatedAt,
    profileHash,
    validation: {
      partial,
      missing: [] as string[],
      message: partial ? PARTIAL_CHART_MESSAGE : null,
    },
    chart: {
      placements: chart.placements.map((placement) => ({
        body: placement.body,
        sign: placement.sign,
        degree: placement.degree,
        house: placement.house,
        retrograde: placement.retrograde,
        element: placement.element,
        modality: placement.modality,
      })),
      houses: chart.houses ?? [],
      aspects: (chart.aspects ?? []).map((aspect) => ({
        from: aspect.from,
        to: aspect.to,
        type: aspect.type,
        orb: aspect.orb,
        strength: aspect.strength,
      })),
      elementBalance: { ...elementCounts, dominant: chart.dominantElement, meaning: elementMeaning(chart.dominantElement) },
      modalityBalance: { ...modalityCounts, dominant: chart.dominantModality, meaning: modalityMeaning(chart.dominantModality) },
      dominantElement: chart.dominantElement,
      dominantModality: chart.dominantModality,
      summary: chart.chartSummary,
      natalWheel: chart.natalWheel,
    },
  };
}

export async function getNatalProxy(profile: AstroProfile) {
  const missing = fullChartValidation(profile);
  if (missing.length) {
    const fallbackInput = {
      ...toProviderInput(profile),
      birthCity: undefined,
      latitude: undefined,
      longitude: undefined,
      timezone: undefined,
    };
    const fallback = await calculateBirthChart(fallbackInput, { force: true });
    const response = normalizeNatalResponse(fallback, profile, "partial", false);
    response.validation = { partial: true, missing, message: PARTIAL_CHART_MESSAGE };
    response.chart.houses = [];
    response.chart.placements = response.chart.placements.map((placement) => ({
      ...placement,
      sign: placement.body === "rising" ? undefined : placement.sign,
      degree: placement.body === "rising" ? undefined : placement.degree,
      house: undefined,
      element: placement.body === "rising" ? undefined : placement.element,
      modality: placement.body === "rising" ? undefined : placement.modality,
    }));
    response.chart.aspects = response.chart.aspects.filter((aspect) => aspect.from !== "rising" && aspect.to !== "rising");
    const elementCounts = { fire: 0, earth: 0, air: 0, water: 0 };
    const modalityCounts = { cardinal: 0, fixed: 0, mutable: 0 };
    for (const placement of response.chart.placements) {
      if (placement.element) elementCounts[placement.element] += 1;
      if (placement.modality) modalityCounts[placement.modality] += 1;
    }
    const dominantElement = dominantCount(elementCounts);
    const dominantModality = dominantCount(modalityCounts);
    response.chart.elementBalance = { ...elementCounts, dominant: dominantElement, meaning: elementMeaning(dominantElement) };
    response.chart.modalityBalance = { ...modalityCounts, dominant: dominantModality, meaning: modalityMeaning(dominantModality) };
    response.chart.dominantElement = dominantElement;
    response.chart.dominantModality = dominantModality;
    response.chart.summary = {
      headline: "Partial astrology preview",
      summary: PARTIAL_CHART_MESSAGE,
      strengths: ["Sun and planet signs can be previewed from the saved date.", "Houses stay hidden until time and location are complete."],
      watchOut: [PARTIAL_CHART_MESSAGE],
    };
    return response;
  }

  const key = hash({ kind: "natal", profile, houseSystem: envValue("HOUSE_SYSTEM") || "placidus" });
  const cached = cacheGet<ReturnType<typeof normalizeNatalResponse>>(natalCache, key);
  if (cached) return { ...cached, cached: true };

  const input = toProviderInput(profile);
  const chart = await calculateBirthChart(input, { force: false });
  const response = normalizeNatalResponse(chart, profile, chart.source === "api" ? "live" : "fallback", false);
  cacheSet(natalCache, key, response, 30 * DAY);
  return response;
}

function sampleTransit(date: string) {
  return {
    id: `sample-transit-${date}`,
    title: "Venus square Saturn",
    transitPlanet: "Venus",
    natalPlanet: "Saturn",
    aspect: "square",
    orb: 1.2,
    area: ["Love", "Self-worth"],
    theme: ["boundaries", "distance", "commitment"],
    startDate: date,
    peakDate: date,
    endDate: date,
    action: "Tell the truth without asking for a reward.",
    why: "Venus themes touch Saturn pressure, so closeness may feel serious today.",
    evidence: ["Transit Venus square natal Saturn", "Orb: 1.2", `Peak: ${date}`],
    strength: 96,
  };
}

function sampleTransits(date: string) {
  return [
    sampleTransit(date),
    {
      id: `sample-moon-trine-venus-${date}`,
      title: "Moon trine Venus",
      transitPlanet: "Moon",
      natalPlanet: "Venus",
      aspect: "trine",
      orb: 2.4,
      area: ["Love", "Mood"],
      theme: ["ease", "softness"],
      startDate: date,
      peakDate: date,
      endDate: date,
      action: "Let the simple kind thing count.",
      why: "Moon and Venus support emotional warmth without forcing a big story.",
      evidence: ["Transit Moon trine natal Venus", "Orb: 2.4", `Peak: ${date}`],
      strength: 78,
    },
    {
      id: `sample-mercury-sextile-mars-${date}`,
      title: "Mercury sextile Mars",
      transitPlanet: "Mercury",
      natalPlanet: "Mars",
      aspect: "sextile",
      orb: 3.1,
      area: ["Work", "Energy"],
      theme: ["clarity", "directness"],
      startDate: date,
      peakDate: date,
      endDate: date,
      action: "Say the next step plainly.",
      why: "Mercury helps Mars turn pressure into a usable action.",
      evidence: ["Transit Mercury sextile natal Mars", "Orb: 3.1", `Peak: ${date}`],
      strength: 72,
    },
  ];
}

function rankTransit(row: Record<string, unknown>) {
  const aspect = normalizedAspect(row.aspect ?? row.type ?? row.aspect_type);
  const transitPlanet = String(row.transitPlanet ?? row.transit_planet ?? row.planet ?? "");
  const natalPlanet = String(row.natalPlanet ?? row.natal_planet ?? row.natal ?? "");
  const orb = Number(row.orb ?? 9);
  const major = ["conjunction", "opposition", "square", "trine", "sextile"].includes(aspect) ? 30 : 0;
  const personal = /sun|moon|mercury|venus|mars/i.test(`${transitPlanet} ${natalPlanet}`) ? 22 : 0;
  const angle = /asc|mc|midheaven/i.test(`${transitPlanet} ${natalPlanet}`) ? 18 : 0;
  const intense = /saturn|pluto|neptune/i.test(`${transitPlanet}`) ? 12 : 0;
  const love = /venus|mars|moon/i.test(`${transitPlanet} ${natalPlanet}`) ? 8 : 0;
  return major + personal + angle + intense + love + Math.max(0, 20 - orb * 2);
}

function normalizeTransitRows(payload: unknown, date: string) {
  const root = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const candidate = root.transit_relation ?? root.transits ?? root.transit ?? root.data ?? payload;
  const rows = Array.isArray(candidate) ? candidate : [];
  const normalized = rows
    .filter((row): row is Record<string, unknown> => Boolean(row && typeof row === "object"))
    .map((row) => {
      const transitPlanet = String(row.transitPlanet ?? row.transit_planet ?? row.planet ?? "Transit");
      const natalPlanet = String(row.natalPlanet ?? row.natal_planet ?? row.natal ?? "Natal point");
      const aspect = normalizedAspect(row.aspect ?? row.type ?? row.aspect_type ?? "aspect");
      const orb = readNumber(row.orb);
      const peakDate = String(row.peakDate ?? row.peak_date ?? row.exact_time ?? row.date ?? root.transit_date ?? date);
      return {
        id: String(row.id ?? row.transit_id ?? hash(row)),
        title: String(row.title ?? row.name ?? `${transitPlanet} ${aspect.replace(/_/g, " ")} ${natalPlanet}`).trim(),
        transitPlanet,
        natalPlanet,
        aspect,
        orb: orb ?? 0,
        area: ["Self", "Energy"],
        theme: ["timing", "attention"],
        startDate: String(row.startDate ?? row.start_date ?? row.start_time ?? row.date ?? date),
        peakDate,
        endDate: String(row.endDate ?? row.end_date ?? row.end_time ?? row.date ?? date),
        action: "Name the pattern before you act on it.",
        why: "This transit is ranked from aspect type, timing, and personal planet involvement.",
        evidence: [orb !== undefined ? `Orb: ${orb}` : `Exact: ${peakDate}`, `Peak: ${peakDate}`],
        strength: rankTransit(row),
      };
    })
    .sort((a, b) => b.strength - a.strength);

  return normalized.length ? normalized.slice(0, 6) : sampleTransits(date);
}

async function astrologyProviderPost(endpoint: string, payload: Record<string, unknown>) {
  const response = await fetch(`${providerBaseUrl()}/${endpoint}`, {
    method: "POST",
    headers: providerHeaders(),
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`ASTROLOGYAPI_${response.status}`);
  return response.json() as Promise<unknown>;
}

function normalizeGeoRows(payload: unknown, query: string, maxRows: number): GeoPlace[] {
  const root = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const candidate = root.geonames ?? root.results ?? root.result ?? root.data ?? root.places ?? payload;
  const rows = Array.isArray(candidate) ? candidate : [];
  const places: GeoPlace[] = [];

  for (const item of rows) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const latitude = readNumber(row.latitude ?? row.lat);
    const longitude = readNumber(row.longitude ?? row.lon ?? row.lng);
    if (latitude === undefined || longitude === undefined) continue;
    const timezone = readString(row.timezone ?? row.timezone_id ?? row.timezoneId ?? row.zoneName);
    const countryCode = readString(row.country_code ?? row.countryCode);
    places.push({
      name: readString(row.name ?? row.place_name ?? row.city ?? row.locality) ?? query,
      region: readString(row.region ?? row.state ?? row.admin1_name ?? row.adminName1),
      country: readString(row.country ?? row.country_name ?? row.countryName ?? row.country_code),
      countryCode,
      latitude,
      longitude,
      timezone,
      timezoneId: timezone,
      timezoneOffset: readNumber(row.timezoneOffset ?? row.timezone_offset ?? row.tzone ?? row.gmtOffset),
    });
  }

  const normalizedQuery = query.trim().toLowerCase();
  return places
    .sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      const aScore = aName === normalizedQuery ? 0 : aName.startsWith(normalizedQuery) ? 1 : 2;
      const bScore = bName === normalizedQuery ? 0 : bName.startsWith(normalizedQuery) ? 1 : 2;
      return aScore - bScore || a.name.localeCompare(b.name);
    })
    .slice(0, maxRows);
}

function normalizeTimezonePayload(payload: unknown, latitude: number, longitude: number, date?: string) {
  const root = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const timezoneId = readString(root.timezoneId ?? root.timezone_id ?? root.timezone ?? root.zoneName ?? root.zone_name);
  const rawOffset = readNumber(root.timezoneOffset ?? root.timezone_offset ?? root.timezone ?? root.tzone ?? root.offset ?? root.gmtOffset ?? root.rawOffset ?? root.timezone_in_ms);
  const timezoneOffset =
    rawOffset !== undefined && Math.abs(rawOffset) > 100_000
      ? Math.round((rawOffset / 3_600_000) * 100) / 100
      : rawOffset !== undefined && Math.abs(rawOffset) > 14
        ? Math.round((rawOffset / 3600) * 100) / 100
        : rawOffset;
  const fallback = nearestFallbackPlace(latitude, longitude);
  const nextTimezoneId = timezoneId ?? fallback?.timezone;
  return {
    timezoneId: nextTimezoneId ?? null,
    timezoneOffset: timezoneOffset ?? timezoneOffsetForZone(nextTimezoneId, date) ?? fallback?.timezoneOffset ?? null,
  };
}

export async function getGeoDetailsProxy(place: string, maxRows = 6) {
  const query = place.trim();
  const safeMaxRows = Math.max(1, Math.min(12, maxRows));
  const key = hash({ kind: "geo-details", query, maxRows: safeMaxRows });
  const cached = cacheGet<Record<string, unknown>>(geoCache, key);
  if (cached) return { ...cached, cached: true };

  let results: GeoPlace[] = [];
  let mode: "live" | "fallback" = "fallback";
  let source = "fallback";

  if (providerConfigured()) {
    try {
      const payload = await astrologyProviderPost("geo_details", { place: query, maxRows: safeMaxRows, max_rows: safeMaxRows });
      const liveResults = normalizeGeoRows(payload, query, safeMaxRows);
      if (liveResults.length) {
        results = liveResults;
        mode = "live";
        source = "astrologyapi";
      }
    } catch {
      results = [];
    }
  }
  if (!results.length) results = fallbackGeoPlaces(query, safeMaxRows);

  const response = { source, mode, cached: false, fetchedAt: new Date().toISOString(), query, results };
  response.results = response.results.map((place) => ({
    ...place,
    label: placeLabel(place),
    timezoneId: place.timezoneId ?? place.timezone,
    countryCode: place.countryCode ?? (place.country && place.country.length <= 3 ? place.country : undefined),
  }));
  cacheSet(geoCache, key, response, DAY);
  return response;
}

export async function getTimezoneProxy(latitude: number, longitude: number, date?: string) {
  const key = hash({ kind: "timezone", latitude, longitude, date });
  const cached = cacheGet<Record<string, unknown>>(timezoneCache, key);
  if (cached) return { ...cached, cached: true };

  const fallback: TimezoneResult = { timezoneId: null, timezoneOffset: null };
  let mode: "live" | "fallback" = "fallback";
  let source = "fallback";
  let timezone: TimezoneResult = fallback;

  if (providerConfigured()) {
    try {
      const payload = await astrologyProviderPost("timezone_with_dst", { latitude, longitude, date: astrologyApiDate(date) });
      timezone = normalizeTimezonePayload(payload, latitude, longitude, date);
      mode = "live";
      source = "astrologyapi";
    } catch {
      timezone = fallback;
    }
  }

  const response = { source, mode, cached: false, fetchedAt: new Date().toISOString(), latitude, longitude, ...timezone };
  cacheSet(timezoneCache, key, response, 30 * DAY);
  return response;
}

function astrologyPayload(profile: AstroProfile) {
  const birthday = parsedDate(profile.birthDate);
  const birthTime = parsedTime(profile.birthTime);
  if (!birthday || profile.latitude === undefined || profile.longitude === undefined || profile.timezoneOffset === undefined) return null;
  return {
    day: birthday.day,
    month: birthday.month,
    year: birthday.year,
    hour: birthTime.hour,
    min: birthTime.min,
    lat: profile.latitude,
    lon: profile.longitude,
    tzone: profile.timezoneOffset,
    house_type: envValue("HOUSE_SYSTEM") || "placidus",
  };
}

function synastryPayload(userProfile: AstroProfile, partnerProfile: AstroProfile) {
  const userBirthday = parsedDate(userProfile.birthDate);
  const partnerBirthday = parsedDate(partnerProfile.birthDate);
  if (!userBirthday || !partnerBirthday) return null;
  if (
    userProfile.latitude === undefined ||
    userProfile.longitude === undefined ||
    userProfile.timezoneOffset === undefined ||
    partnerProfile.latitude === undefined ||
    partnerProfile.longitude === undefined ||
    partnerProfile.timezoneOffset === undefined
  ) {
    return null;
  }
  const userTime = parsedTime(userProfile.birthTime);
  const partnerTime = parsedTime(partnerProfile.birthTime);
  return {
    p_day: userBirthday.day,
    p_month: userBirthday.month,
    p_year: userBirthday.year,
    p_hour: userTime.hour,
    p_min: userTime.min,
    p_lat: userProfile.latitude,
    p_lon: userProfile.longitude,
    p_tzone: userProfile.timezoneOffset,
    s_day: partnerBirthday.day,
    s_month: partnerBirthday.month,
    s_year: partnerBirthday.year,
    s_hour: partnerTime.hour,
    s_min: partnerTime.min,
    s_lat: partnerProfile.latitude,
    s_lon: partnerProfile.longitude,
    s_tzone: partnerProfile.timezoneOffset,
  };
}

export async function getTransitsProxy(profile: AstroProfile, date: string, range: "daily" | "weekly") {
  const key = hash({ kind: "transits", profile, date, range });
  const cached = cacheGet<Record<string, unknown>>(transitCache, key);
  if (cached) return { ...cached, cached: true };

  const missing = fullChartValidation(profile);
  const payload = astrologyPayload(profile);
  let transits = sampleTransits(date);
  let mode: "live" | "fallback" = "fallback";
  let source = "fallback";

  if (!missing.length && providerConfigured() && payload) {
    try {
      const endpoint = range === "weekly" ? "natal_transits/weekly" : "natal_transits/daily";
      transits = normalizeTransitRows(await astrologyProviderPost(endpoint, payload), date);
      mode = "live";
      source = "astrologyapi";
    } catch {
      transits = sampleTransits(date);
    }
  }

  const response = {
    source,
    mode,
    cached: false,
    fetchedAt: new Date().toISOString(),
    date,
    strongestTransit: transits[0],
    transits,
    validation: missing.length
      ? { partial: true, missing, message: PARTIAL_CHART_MESSAGE }
      : { partial: false, missing: [], message: null },
  };
  cacheSet(transitCache, key, response, 12 * 60 * 60 * 1000);
  return response;
}

function tier(index: number) {
  return ["Soft", "Magnetic", "Grounding", "Challenging", "Intense", "Unclear"][index % 6]!;
}

function readSynastryRows(payload: unknown) {
  const root = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const synastry = root.synastry && typeof root.synastry === "object" ? (root.synastry as Record<string, unknown>) : null;
  const data = root.data && typeof root.data === "object" ? (root.data as Record<string, unknown>) : null;
  const response = root.response && typeof root.response === "object" ? (root.response as Record<string, unknown>) : null;
  const candidates = [
    root.aspects,
    root.synastry_aspects,
    synastry?.aspects,
    data?.aspects,
    response?.aspects,
    Array.isArray(root.synastry) ? root.synastry : undefined,
    Array.isArray(root.data) ? root.data : undefined,
    Array.isArray(root.response) ? root.response : undefined,
    Array.isArray(payload) ? payload : undefined,
  ];
  return candidates.find(Array.isArray) ?? [];
}

function normalizeSynastryAspects(payload: unknown, seed: number) {
  const aspects = readSynastryRows(payload)
    .filter((row): row is Record<string, unknown> => Boolean(row && typeof row === "object"))
    .map((row, index) => {
      const from = readString(row.from ?? row.first ?? row.p_planet ?? row.planet1 ?? row.aspecting_planet ?? row.primary_planet) ?? "Planet";
      const to = readString(row.to ?? row.second ?? row.s_planet ?? row.planet2 ?? row.aspected_planet ?? row.secondary_planet) ?? "Point";
      const type = normalizedAspect(row.type ?? row.aspect ?? row.aspect_name ?? row.aspect_type).replace(/_/g, " ") || "aspect";
      const orb = readNumber(row.orb ?? row.orb_value ?? row.diff);
      const majorAspect = /conjunction|opposition|square|trine|sextile/i.test(type) ? 10 : 0;
      const personalPlanet = /sun|moon|venus|mars|mercury|ascendant/i.test(`${from} ${to}`) ? 8 : 0;
      const strength = Math.max(42, Math.min(98, 88 + majorAspect + personalPlanet - (orb ?? index + 2) * 7));
      return {
        from,
        to,
        type,
        tier: tier(seed + index),
        meaning: `${from} ${type} ${to}${orb !== undefined ? ` within ${orb} degrees` : ""}.`,
        strength,
      };
    })
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 6);

  return aspects.length
    ? aspects
    : [
        { from: "Moon", to: "Venus", type: "trine", tier: tier(seed + 1), meaning: "Comfort grows when affection has room to stay simple.", strength: 88 },
        { from: "Mars", to: "Saturn", type: "square", tier: tier(seed + 4), meaning: "Pressure becomes useful when expectations are named early.", strength: 78 },
        { from: "Mercury", to: "Moon", type: "sextile", tier: tier(seed + 2), meaning: "Conversation helps feelings become less abstract.", strength: 72 },
      ];
}

export async function getSynastryProxy(userProfile: AstroProfile, partnerProfile: AstroProfile) {
  const key = hash({ kind: "synastry", userProfile, partnerProfile });
  const cached = cacheGet<Record<string, unknown>>(synastryCache, key);
  if (cached) return { ...cached, cached: true };
  const seed = Number.parseInt(hash({ userProfile, partnerProfile }).slice(0, 8), 16);
  let mode: "live" | "fallback" = "fallback";
  let source = "fallback";

  if (providerConfigured() && !fullChartValidation(userProfile).length && !fullChartValidation(partnerProfile).length) {
    try {
      const payload = synastryPayload(userProfile, partnerProfile);
      if (payload) {
        const providerPayload = await astrologyProviderPost("synastry_horoscope", payload);
        const aspects = normalizeSynastryAspects(providerPayload, seed);
        const response = {
          source: "astrologyapi",
          mode: "live",
          cached: false,
          fetchedAt: new Date().toISOString(),
          summary: {
            comfort: tier(seed),
            tension: tier(seed + 4),
            communication: tier(seed + 2),
            attraction: tier(seed + 1),
            growth: tier(seed + 3),
          },
          aspects,
          plainEnglish: {
            main: "This relationship map is built from both birth profiles and the provider synastry call.",
            comfort: "The easiest part is where both people feel safe being specific.",
            tension: "The tension asks for pacing and consent before interpretation.",
            advice: "Ask one clean question before turning the chart into a story.",
          },
        };
        cacheSet(synastryCache, key, response, 30 * DAY);
        return response;
      }
    } catch {
      mode = "fallback";
    }
  }

  const response = {
    source,
    mode,
    cached: false,
    fetchedAt: new Date().toISOString(),
    summary: {
      comfort: tier(seed),
      tension: tier(seed + 4),
      communication: tier(seed + 2),
      attraction: tier(seed + 1),
      growth: tier(seed + 3),
    },
    aspects: normalizeSynastryAspects(null, seed),
    plainEnglish: {
      main: "This relationship map is a conversation prompt, not a verdict.",
      comfort: "The easiest part is where both people feel safe being specific.",
      tension: "The tension asks for pacing and consent before interpretation.",
      advice: "Ask one clean question before turning the chart into a story.",
    },
  };
  cacheSet(synastryCache, key, response, 30 * DAY);
  return response;
}

async function fetchNasaApod(apiKey: string, date?: string) {
    const params = new URLSearchParams({ api_key: apiKey, thumbs: "true" });
    if (date) params.set("date", date);
    const response = await fetch(`https://api.nasa.gov/planetary/apod?${params.toString()}`);
    if (!response.ok) throw new Error(`NASA_${response.status}`);
    const data = (await response.json()) as Record<string, unknown>;
    const mediaType = String(data.media_type ?? "image");
    const normalized = {
      source: "NASA APOD",
      mode: "live",
      title: String(data.title ?? ""),
      date: String(data.date ?? ""),
      imageUrl: mediaType === "image" && typeof data.url === "string" ? data.url : typeof data.thumbnail_url === "string" ? data.thumbnail_url : typeof data.url === "string" ? data.url : null,
      hdImageUrl: typeof data.hdurl === "string" ? data.hdurl : null,
      mediaType,
      explanation: String(data.explanation ?? ""),
      copyright: typeof data.copyright === "string" ? data.copyright : "",
      cached: false,
      fetchedAt: new Date().toISOString(),
    };
    return normalized;
}

export async function getNasaApodProxy(date?: string) {
  const key = hash({ kind: "nasa-apod", date: date ?? "today" });
  const cached = cacheGet<Record<string, unknown>>(nasaCache, key);
  if (cached) return { ...cached, cached: true };
  const apiKey = nasaApiKey();
  if (!apiKey) {
    return { source: "NASA APOD", mode: "fallback", imageUrl: null, title: "NASA visual unavailable", cached: false, fetchedAt: new Date().toISOString() };
  }

  try {
    const normalized = await fetchNasaApod(apiKey, date);
    cacheSet(nasaCache, key, normalized, DAY);
    return normalized;
  } catch {
    if (date) {
      try {
        const normalized = await fetchNasaApod(apiKey);
        cacheSet(nasaCache, key, normalized, DAY);
        return normalized;
      } catch {
        // Fall through to the local fallback below.
      }
    }
    return { source: "NASA APOD", mode: "fallback", imageUrl: null, title: "NASA visual unavailable", cached: false, fetchedAt: new Date().toISOString() };
  }
}

function localInterpretation(kind: InterpretationKind) {
  if (kind === "transit") return { text: "Name the pressure clearly, then choose the smallest honest action.", mode: "fallback" };
  if (kind === "synastry") return { text: "Use the chart as a mirror for consent, pacing, and clearer questions.", mode: "fallback" };
  if (kind === "reportPreview") return { bullets: ["Pattern first, prediction last.", "Evidence stays visible.", "Reflection stays practical."], mode: "fallback" };
  return { text: "The strongest signal becomes useful when it stays grounded in evidence.", mode: "fallback" };
}

export async function getAstroInterpretationProxy(input: { kind: InterpretationKind; data: unknown; tone?: InterpretationTone }) {
  const key = hash({ kind: "gpt", input });
  const cached = cacheGet<Record<string, unknown>>(gptCache, key);
  if (cached) return { ...cached, cached: true };
  if (!openaiApiKey) return localInterpretation(input.kind);

  try {
    const response = await getOpenAIClient().chat.completions.create({
      model: openaiModel,
      temperature: 0.25,
      max_completion_tokens: input.kind === "reportPreview" ? 120 : 180,
      messages: [
        {
          role: "system",
          content:
            "Write short premium astrology interpretation copy. Do not decide placements, transits, aspects, scores, cards, or compatibility. No guarantees. Sentence first, evidence second.",
        },
        {
          role: "user",
          content: JSON.stringify({
            kind: input.kind,
            tone: input.tone ?? "warm",
            limits:
              "one-line card max 22 words; transit action max 18 words; transit why max 45 words; report preview 3 bullets max 12 words each; detailed drawer max 180 words",
            data: input.data,
          }),
        },
      ],
    });
    const fallback = localInterpretation(input.kind);
    const text = response.choices[0]?.message?.content?.trim() || ("text" in fallback && typeof fallback.text === "string" ? fallback.text : (fallback.bullets ?? []).join("\n"));
    const normalized = { mode: "live", text, cached: false, fetchedAt: new Date().toISOString() };
    cacheSet(gptCache, key, normalized, 30 * DAY);
    return normalized;
  } catch {
    return localInterpretation(input.kind);
  }
}

export function getAstroProxyStatus() {
  const astrology = getAstrologyStatus();
  return {
    astrology: {
      configured: providerConfigured() || astrology.configured,
      provider: "astrologyapi",
      mode: providerConfigured() || astrology.configured ? "configured" : "fallback",
    },
    nasa: { configured: Boolean(nasaApiKey()), mode: nasaApiKey() ? "configured" : "fallback" },
    gpt: { configured: Boolean(openaiApiKey), mode: openaiApiKey ? "configured" : "fallback" },
  };
}
