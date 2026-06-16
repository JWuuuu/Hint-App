import type { ReadingSummary } from "@workspace/api-client-react";
import { getAnonId, getLocalDateString } from "../../lib/identity";
import type { DailyPull } from "../home/types/home.types";

const STORAGE_KEY = "hint_local_daily_readings";
const UPDATED_EVENT = "hint:local-daily-readings-updated";

type StoredDailyReading = ReadingSummary & {
  anonId: string;
  source: "daily-pull";
};

function readAll(): StoredDailyReading[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(readings: StoredDailyReading[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(readings));
    window.dispatchEvent(new Event(UPDATED_EVENT));
  } catch {
    // Local archive is a convenience mirror; API-backed readings still work.
  }
}

export function saveLocalDailyReading(pull: DailyPull, createdAt = new Date()): ReadingSummary {
  const anonId = getAnonId();
  const today = getLocalDateString(createdAt);
  const reading: StoredDailyReading = {
    id: `daily-${today}`,
    anonId,
    source: "daily-pull",
    cardName: pull.cardName,
    whisper: pull.whisper,
    spreadType: "daily-pull",
    question: "Tonight's daily card",
    territory: "daily",
    createdAt: createdAt.toISOString(),
  };

  const withoutToday = readAll().filter(
    (item) => !(item.anonId === anonId && item.id === reading.id),
  );
  writeAll([reading, ...withoutToday].slice(0, 100));
  return reading;
}

export function listLocalDailyReadings(anonId = getAnonId()): ReadingSummary[] {
  return readAll()
    .filter((reading) => reading.anonId === anonId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export function getLocalDailyReading(id: string, anonId = getAnonId()): ReadingSummary | null {
  return readAll().find((reading) => reading.anonId === anonId && reading.id === id) ?? null;
}

export function getLocalDailyReadingForDate(date = new Date(), anonId = getAnonId()): ReadingSummary | null {
  return getLocalDailyReading(`daily-${getLocalDateString(date)}`, anonId);
}

export function getLocalDailyReadingForDateKey(dateKey: string, anonId = getAnonId()): ReadingSummary | null {
  return getLocalDailyReading(`daily-${dateKey}`, anonId);
}

export function subscribeToLocalDailyReadings(onChange: () => void): () => void {
  window.addEventListener(UPDATED_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(UPDATED_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
