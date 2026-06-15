import { getAnonId, getLocalDateString } from "../../../lib/identity";

const STORAGE_KEY = "hint_local_ritual_progress_v1";
const UPDATED_EVENT = "hint:local-ritual-progress-updated";
const RITUAL_CYCLE_DAYS = 7;
const CREDITS_PER_WEEK = 10;
const DAYS_PER_STAR = 30;

type StoredRitualProgress = {
  anonId: string;
  completedDates: string[];
  taskCompletions?: Record<string, number[]>;
  updatedAt: string;
};

export type RitualWeekDay = {
  date: string;
  label: string;
  completed: boolean;
  today: boolean;
};

export type RitualProgressSnapshot = {
  completedDates: string[];
  todayTaskCompletions: number[];
  currentStreak: number;
  longestStreak: number;
  starLevel: number;
  readingCredits: number;
  todayCompleted: boolean;
  daysUntilCredit: number;
  progressPercent: number;
  week: RitualWeekDay[];
};

function readAll(): StoredRitualProgress[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(progress: StoredRitualProgress[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    window.dispatchEvent(new Event(UPDATED_EVENT));
  } catch {
    // Ritual progress is a local convenience; the UI falls back gracefully.
  }
}

function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(value: string, amount: number): string {
  const date = parseLocalDate(value);
  date.setDate(date.getDate() + amount);
  return getLocalDateString(date);
}

function isNextDate(previous: string, current: string): boolean {
  return addDays(previous, 1) === current;
}

function normalizeDates(dates: string[]): string[] {
  return Array.from(new Set(dates.filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date)))).sort();
}

function currentStreakFor(dates: Set<string>, today: string): number {
  let streak = 0;
  let cursor = today;
  while (dates.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function longestStreakFor(dates: string[]): number {
  if (dates.length === 0) return 0;

  let longest = 1;
  let current = 1;
  for (let index = 1; index < dates.length; index += 1) {
    if (isNextDate(dates[index - 1], dates[index])) {
      current += 1;
    } else {
      current = 1;
    }
    longest = Math.max(longest, current);
  }
  return longest;
}

function weekFor(dates: Set<string>, today: string): RitualWeekDay[] {
  const labels = ["M", "T", "W", "T", "F", "S", "S"];

  return Array.from({ length: RITUAL_CYCLE_DAYS }, (_, index) => {
    const date = addDays(today, index);
    const dateDay = parseLocalDate(date).getDay();
    return {
      date,
      label: index === 0 ? "Today" : labels[(dateDay + 6) % 7],
      completed: dates.has(date),
      today: date === today,
    };
  });
}

function toSnapshot(stored: StoredRitualProgress, today = getLocalDateString()): RitualProgressSnapshot {
  const completedDates = normalizeDates(stored.completedDates);
  const completedSet = new Set(completedDates);
  const currentStreak = currentStreakFor(completedSet, today);
  const cycleDays = currentStreak % RITUAL_CYCLE_DAYS;
  const daysUntilCredit =
    currentStreak > 0 && cycleDays === 0 ? 0 : RITUAL_CYCLE_DAYS - cycleDays;

  return {
    completedDates,
    todayTaskCompletions: Array.from(new Set(stored.taskCompletions?.[today] ?? [])).filter((index) => index >= 0 && index < 3),
    currentStreak,
    longestStreak: longestStreakFor(completedDates),
    starLevel: Math.floor(currentStreak / DAYS_PER_STAR),
    readingCredits: Math.floor(completedDates.length / RITUAL_CYCLE_DAYS) * CREDITS_PER_WEEK,
    todayCompleted: completedSet.has(today),
    daysUntilCredit,
    progressPercent:
      currentStreak > 0 && cycleDays === 0
        ? 100
        : Math.round((cycleDays / RITUAL_CYCLE_DAYS) * 100),
    week: weekFor(completedSet, today),
  };
}

function emptyProgress(anonId = getAnonId()): StoredRitualProgress {
  return {
    anonId,
    completedDates: [],
    taskCompletions: {},
    updatedAt: new Date().toISOString(),
  };
}

export function getRitualProgress(anonId = getAnonId()): RitualProgressSnapshot {
  const stored = readAll().find((item) => item.anonId === anonId) ?? emptyProgress(anonId);
  return toSnapshot(stored);
}

export function recordRitualCompletion(date = getLocalDateString(), anonId = getAnonId()): RitualProgressSnapshot {
  const all = readAll();
  const existing = all.find((item) => item.anonId === anonId) ?? emptyProgress(anonId);
  const completedDates = normalizeDates([...existing.completedDates, date]);
  const next: StoredRitualProgress = {
    ...existing,
    completedDates,
    updatedAt: new Date().toISOString(),
  };

  writeAll([next, ...all.filter((item) => item.anonId !== anonId)]);
  return toSnapshot(next, date);
}

export function toggleRitualTask(index: number, date = getLocalDateString(), anonId = getAnonId()): RitualProgressSnapshot {
  const all = readAll();
  const existing = all.find((item) => item.anonId === anonId) ?? emptyProgress(anonId);
  const taskCompletions = { ...(existing.taskCompletions ?? {}) };
  const current = new Set(taskCompletions[date] ?? []);

  if (current.has(index)) {
    current.delete(index);
  } else {
    current.add(index);
  }

  const nextTasks = Array.from(current).filter((value) => value >= 0 && value < 3).sort();
  if (nextTasks.length > 0) {
    taskCompletions[date] = nextTasks;
  } else {
    delete taskCompletions[date];
  }

  const completedDates = normalizeDates(
    nextTasks.length === 3
      ? [...existing.completedDates, date]
      : existing.completedDates.filter((completedDate) => completedDate !== date),
  );

  const next: StoredRitualProgress = {
    ...existing,
    completedDates,
    taskCompletions,
    updatedAt: new Date().toISOString(),
  };

  writeAll([next, ...all.filter((item) => item.anonId !== anonId)]);
  return toSnapshot(next, date);
}

export function subscribeToRitualProgress(onChange: () => void): () => void {
  window.addEventListener(UPDATED_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(UPDATED_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
