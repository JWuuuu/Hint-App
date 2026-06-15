import type { AstroSynastryResponse, AstroTransitsResponse, BirthProfile } from "../../types/astrology";
import { apiUrl } from "../api";

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const endpoint = url.startsWith("/") ? apiUrl(url as `/${string}`) : url;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`API_${response.status}`);
  return response.json() as Promise<T>;
}

export type AstroNatalResponse = {
  source: "astrologyapi" | "fallback" | "validation";
  mode: "live" | "fallback" | "partial";
  cached: boolean;
  fetchedAt: string;
  profileHash: string;
  validation?: {
    partial: boolean;
    missing?: string[];
    message?: string | null;
  };
  chart?: {
    placements: Array<{
      body: string;
      sign?: string;
      degree?: number;
      house?: number;
      retrograde?: boolean;
      element?: string;
      modality?: string;
    }>;
    houses: Array<{ house: number; sign?: string; degree?: number; theme?: string }>;
    aspects: Array<{ from: string; to: string; type: string; orb?: number; strength?: number }>;
    elementBalance: Record<string, unknown>;
    modalityBalance: Record<string, unknown>;
    dominantElement?: string;
    dominantModality?: string;
    summary?: {
      headline: string;
      summary?: string;
      strengths?: string[];
      watchOut?: string[];
    };
  };
};

export type AstroGeoPlace = {
  label?: string;
  name: string;
  country?: string;
  countryCode?: string;
  region?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  timezoneId?: string | null;
  timezoneOffset?: number | null;
};

export type AstroGeoResponse = {
  source: "astrologyapi" | "fallback";
  mode: "live" | "fallback";
  cached: boolean;
  fetchedAt: string;
  query: string;
  results: AstroGeoPlace[];
};

export type AstroTimezoneResponse = {
  source: "astrologyapi" | "fallback";
  mode: "live" | "fallback";
  cached: boolean;
  fetchedAt: string;
  latitude: number;
  longitude: number;
  timezoneId?: string | null;
  timezoneOffset?: number | null;
};

export type AstroInterpretationResponse = {
  mode: "live" | "fallback";
  cached?: boolean;
  fetchedAt?: string;
  text?: string;
  bullets?: string[];
};

export async function getNatalChart(profile: BirthProfile) {
  return postJson<AstroNatalResponse>("/api/astro/natal", { profile });
}

export async function getTransits(profile: BirthProfile, date: string, range: "daily" | "weekly" = "daily") {
  const suffix = range === "weekly" ? "?range=weekly" : "";
  return postJson<AstroTransitsResponse>(`/api/astro/transits${suffix}`, { profile, date });
}

export async function getSynastry(userProfile: BirthProfile, partnerProfile: BirthProfile) {
  return postJson<AstroSynastryResponse>("/api/astro/synastry", { userProfile, partnerProfile });
}

export async function getGeoDetails(place: string, maxRows = 6) {
  return postJson<AstroGeoResponse>("/api/astro/geo-details", { place, maxRows });
}

export async function getTimezoneDetails(latitude: number, longitude: number, date?: string) {
  return postJson<AstroTimezoneResponse>("/api/astro/timezone", { latitude, longitude, dateISO: date });
}

export async function getAstroInterpretation(kind: "placement" | "signs" | "transit" | "synastry" | "reportPreview", data: Record<string, unknown>, tone: "warm" | "direct" | "mirror" = "warm") {
  return postJson<AstroInterpretationResponse>("/api/ai/astro-interpretation", { kind, data, tone });
}
