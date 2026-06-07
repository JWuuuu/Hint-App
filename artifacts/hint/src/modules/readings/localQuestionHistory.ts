import { getAnonId } from "../../lib/identity";
import type { SpreadType } from "../hold/chat/types";

const STORAGE_KEY = "hint_local_question_history_v1";
const UPDATED_EVENT = "hint:local-question-history-updated";
const MAX_ITEMS = 50;

export interface QuestionHistoryItem {
  id: string;
  anonId: string;
  question: string;
  focus: string;
  spreadType: SpreadType;
  readingId?: string;
  createdAt: string;
}

function readAll(): QuestionHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(items: QuestionHistoryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(UPDATED_EVENT));
  } catch {
    // Question history is a local convenience; reading flow should continue.
  }
}

export function saveLocalQuestionHistory(input: {
  question: string;
  focus: string;
  spreadType: SpreadType;
  readingId?: string;
  createdAt?: string;
  anonId?: string;
}): QuestionHistoryItem {
  const anonId = input.anonId ?? getAnonId();
  const createdAt = input.createdAt ?? new Date().toISOString();
  const question = input.question.trim();
  const item: QuestionHistoryItem = {
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    anonId,
    question,
    focus: input.focus,
    spreadType: input.spreadType,
    readingId: input.readingId,
    createdAt,
  };

  const lowerQuestion = question.toLowerCase();
  const withoutDuplicate = readAll().filter(
    (stored) =>
      !(
        stored.anonId === anonId &&
        stored.question.trim().toLowerCase() === lowerQuestion &&
        stored.spreadType === input.spreadType
      ),
  );

  writeAll([item, ...withoutDuplicate].slice(0, MAX_ITEMS));
  return item;
}

export function listLocalQuestionHistory(anonId = getAnonId()): QuestionHistoryItem[] {
  return readAll()
    .filter((item) => item.anonId === anonId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export function subscribeToLocalQuestionHistory(onChange: () => void): () => void {
  window.addEventListener(UPDATED_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(UPDATED_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
