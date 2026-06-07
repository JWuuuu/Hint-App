import type { ReactNode } from "react";

/** Top-level taxonomy used by the home rail and the All Rooms library. */
export type SectionKey =
  | "reflection"
  | "tarot"
  | "relationships"
  | "astrology"
  | "inner-self"
  | "growth";

export interface SectionDefinition {
  key: SectionKey;
  /** Eyebrow label rendered above the section grid. */
  label: string;
  /** Single italic intro line under the eyebrow. */
  intro: string;
}

export interface ModuleDefinition {
  id: string;
  title: string;
  /** Short evocative line under the title. One line. */
  hint: string;
  /** Where this tile navigates. Null if locked. */
  href: string | null;
  /** When locked, this is shown in lowercase instead of "PREMIUM". */
  lockedNote?: string;
  /** Small monoline SVG glyph rendered inside a 32x32 box. */
  sigil: () => ReactNode;
  /** Section this module belongs to in the library. */
  section: SectionKey;
}

export type DimensionKey = "love" | "wealth" | "work" | "mind" | "people";

export interface DimensionScore {
  key: DimensionKey;
  /** Short label rendered under the bar. */
  label: string;
  /** 0–100 deterministic score for tonight. */
  score: number;
}

export interface EmotionalWeather {
  /** Short banner like "Liminal hours" / "Golden hour". */
  label: string;
  /** A one-line emotional read of right now. */
  line: string;
  /** A quieter follow-up sentence that grounds the top line. */
  subline: string;
  /** Deterministic 0–100 "clarity" score for tonight. */
  clarityScore: number;
  /** Five life-area scores (love, wealth, work, mind, people). */
  dimensions: DimensionScore[];
  /** Hour-of-day 0–23 used to compute this. */
  hour: number;
  /** ISO date string (yyyy-mm-dd) used as the daily seed. */
  date: string;
}

export interface DailyPull {
  cardId: string;
  cardName: string;
  /** One upright card from the full 78-card tarot deck. */
  whisper: string;
  arcana?: "major" | "minor";
  suit?: "wands" | "cups" | "swords" | "pentacles";
  orientation?: "upright";
  keyword?: string;
  do?: string;
  avoid?: string;
  love?: string;
  work?: string;
  self?: string;
  themeNote?: string;
}

export type DailyScoreKey =
  | "love"
  | "resources"
  | "work"
  | "focus"
  | "connection";

export interface DailyScore {
  key: DailyScoreKey;
  label: string;
  score: number;
  tone: string;
}

export interface DailyLuckyItem {
  key: "color" | "hour" | "direction" | "number";
  label: string;
  value: string;
  hint: string;
}

export interface DailyTask {
  text: string;
  reason: string;
}

export interface DailyReport {
  date: string;
  overallScore: number;
  title: string;
  summary: string;
  card: DailyPull;
  scores: DailyScore[];
  lucky: DailyLuckyItem[];
  suggestion: string;
  avoid: string;
  tasks: DailyTask[];
}
