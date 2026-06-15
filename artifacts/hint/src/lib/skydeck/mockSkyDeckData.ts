import type { DailyTransit } from "../astro/providers/types";

export const GENERAL_SKY_TRANSITS: DailyTransit[] = [
  {
    id: "general-moon-8",
    label: "Moon in the 8th house",
    bodies: ["moon"],
    house: 8,
    strength: 82,
    themes: ["emotionalFear", "attachment", "transformation"],
  },
  {
    id: "general-venus-saturn",
    label: "Venus square Saturn",
    bodies: ["venus", "saturn"],
    aspect: "square",
    strength: 78,
    themes: ["relationshipTension", "boundary", "distance"],
  },
  {
    id: "general-mercury-truth",
    label: "Mercury asks for a cleaner answer",
    bodies: ["mercury"],
    strength: 66,
    themes: ["communication", "truth"],
  },
];

export const SKY_DECK_SCORE_LABELS = {
  love: "Love",
  wealth: "Wealth",
  career: "Career",
  study: "Study",
  people: "People",
} as const;
