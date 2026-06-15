import { getAnonId } from "../../lib/identity";
import type { TarotCardArtId } from "../tarot/logic/cardImageMap";

const STORAGE_KEY = "hint_local_tarot_readings_v1";
const UPDATED_EVENT = "hint:local-tarot-readings-updated";
const MAX_ITEMS = 80;

export type LocalTarotReadingCard = {
  cardId: string;
  name: string;
  orientation: "upright" | "reversed";
  positionLabel: string;
  keywords: string[];
};

export type LocalTarotReading = {
  id: string;
  anonId: string;
  source: "tarot";
  spreadType: string;
  spreadLabel: string;
  question?: string;
  story?: string;
  focusLabel?: string;
  cardArtId?: TarotCardArtId;
  shortAnswer: string;
  questionMeaning: string;
  cardMeanings: string[];
  cards: LocalTarotReadingCard[];
  createdAt: string;
};

function readAll(): LocalTarotReading[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(items: LocalTarotReading[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(UPDATED_EVENT));
  } catch {
    // Local archive should never block a reading.
  }
}

export function saveLocalTarotReading(
  input: Omit<LocalTarotReading, "id" | "anonId" | "source" | "createdAt"> & {
    id?: string;
    anonId?: string;
    createdAt?: string;
  },
): LocalTarotReading {
  const anonId = input.anonId ?? getAnonId();
  const createdAt = input.createdAt ?? new Date().toISOString();
  const id = input.id ?? `tarot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const reading: LocalTarotReading = {
    id,
    anonId,
    source: "tarot",
    spreadType: input.spreadType,
    spreadLabel: input.spreadLabel,
    question: input.question,
    story: input.story,
    focusLabel: input.focusLabel,
    cardArtId: input.cardArtId,
    shortAnswer: input.shortAnswer,
    questionMeaning: input.questionMeaning,
    cardMeanings: input.cardMeanings,
    cards: input.cards,
    createdAt,
  };

  writeAll([reading, ...readAll().filter((item) => item.id !== id)].slice(0, MAX_ITEMS));
  return reading;
}

export function listLocalTarotReadings(anonId = getAnonId()): LocalTarotReading[] {
  return readAll()
    .filter((item) => item.anonId === anonId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getLocalTarotReading(id: string, anonId = getAnonId()): LocalTarotReading | null {
  return readAll().find((item) => item.anonId === anonId && item.id === id) ?? null;
}

export function subscribeToLocalTarotReadings(onChange: () => void): () => void {
  window.addEventListener(UPDATED_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(UPDATED_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
