import type { BirthProfile } from "../../types/astrology";

export const BIRTH_PROFILE_STORAGE_KEY = "hint.birthProfile";

export type AccountProfileLike = {
  anonId?: string;
  name?: string | null;
  birthDate?: string | null;
  birthTime?: string | null;
  birthPlace?: string | null;
};

function browserStorage() {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `birth-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function numericValue(value: unknown) {
  const next = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : NaN;
  return Number.isFinite(next) ? next : undefined;
}

function parseProfile(value: unknown): BirthProfile | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Partial<BirthProfile>;
  if (!row.name || !row.birthDate || !row.birthPlace) return null;
  return {
    id: row.id || createId(),
    name: row.name,
    birthDate: row.birthDate,
    birthTime: row.birthTime || undefined,
    birthPlace: row.birthPlace,
    latitude: numericValue(row.latitude),
    longitude: numericValue(row.longitude),
    timezone: row.timezone || undefined,
    timezoneOffset: numericValue(row.timezoneOffset),
    createdAt: row.createdAt || new Date().toISOString(),
    updatedAt: row.updatedAt || new Date().toISOString(),
  };
}

export function readBirthProfile(): BirthProfile | null {
  try {
    const storage = browserStorage();
    const raw = storage?.getItem(BIRTH_PROFILE_STORAGE_KEY);
    return raw ? parseProfile(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function saveBirthProfile(input: Omit<BirthProfile, "id" | "createdAt" | "updatedAt"> & Partial<Pick<BirthProfile, "id" | "createdAt">>): BirthProfile {
  const previous = readBirthProfile();
  const now = new Date().toISOString();
  const profile: BirthProfile = {
    id: input.id || previous?.id || createId(),
    name: input.name.trim(),
    birthDate: input.birthDate,
    birthTime: input.birthTime || undefined,
    birthPlace: input.birthPlace.trim(),
    latitude: typeof input.latitude === "number" ? input.latitude : undefined,
    longitude: typeof input.longitude === "number" ? input.longitude : undefined,
    timezone: input.timezone?.trim() || Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: typeof input.timezoneOffset === "number" ? input.timezoneOffset : undefined,
    createdAt: input.createdAt || previous?.createdAt || now,
    updatedAt: now,
  };
  browserStorage()?.setItem(BIRTH_PROFILE_STORAGE_KEY, JSON.stringify(profile));
  window.dispatchEvent(new CustomEvent("hint.birthProfile.updated", { detail: profile }));
  return profile;
}

export function clearBirthProfile() {
  browserStorage()?.removeItem(BIRTH_PROFILE_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("hint.birthProfile.updated"));
}

export function useBirthProfileStorageSnapshot() {
  return readBirthProfile();
}

export function saveBirthProfileFromAccountProfile(profile: AccountProfileLike, id?: string) {
  const name = profile.name?.trim();
  const birthDate = profile.birthDate?.trim();
  const birthPlace = profile.birthPlace?.trim();
  if (!name || !birthDate || !birthPlace) return null;

  const previous = readBirthProfile();
  const samePlace = previous?.birthPlace === birthPlace;
  return saveBirthProfile({
    id: id ?? profile.anonId ?? previous?.id,
    name,
    birthDate,
    birthTime: profile.birthTime?.trim() || undefined,
    birthPlace,
    latitude: samePlace ? previous?.latitude : undefined,
    longitude: samePlace ? previous?.longitude : undefined,
    timezone: samePlace ? previous?.timezone : undefined,
    timezoneOffset: samePlace ? previous?.timezoneOffset : undefined,
    createdAt: previous?.createdAt,
  });
}

export function birthProfileToProviderInput(profile: BirthProfile) {
  return {
    userId: profile.id,
    name: profile.name,
    birthday: profile.birthDate,
    birthTime: profile.birthTime,
    birthCity: profile.birthPlace,
    latitude: profile.latitude,
    longitude: profile.longitude,
    timezone: profile.timezone,
    timezoneOffset: profile.timezoneOffset,
  };
}
