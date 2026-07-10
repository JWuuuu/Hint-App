import type { AstrologyReport } from "../../types/astrology";

export const MOCK_ASTROLOGY_REPORTS: AstrologyReport[] = [
  {
    id: "monthly-pattern",
    title: "Monthly Pattern",
    subtitle: "The emotional rhythm of the next 30 days.",
    status: "locked",
    unlockHint: "Requires a saved birth profile and full transit window.",
    previewBullets: ["Peak transits ranked by date", "Emotional weather by week", "Practical reflection prompts"],
  },
  {
    id: "year-ahead-2026",
    title: "2026 Year Ahead",
    subtitle: "Major themes, pressure points, and clean openings for the year.",
    status: "locked",
    unlockHint: "Built from annual transits and natal house emphasis.",
    previewBullets: ["Quarter-by-quarter timing", "Growth and restraint patterns", "Clean openings to watch"],
  },
  {
    id: "relationship-deep-dive",
    title: "Relationship Deep Dive",
    subtitle: "Two charts, one shared pattern, and the questions worth asking with consent.",
    status: "locked",
    unlockHint: "Requires consent from both people.",
    previewBullets: ["Shared aspects without scoring", "Communication and tension cues", "Consent-first conversation prompts"],
  },
  {
    id: "career-direction",
    title: "Career Direction",
    subtitle: "Work rhythm, public signal, and where discipline becomes useful.",
    status: "locked",
    unlockHint: "Prepared from houses, midheaven patterns, and active transits.",
    previewBullets: ["Public signal and timing", "Skill-building pressure points", "Where consistency pays off"],
  },
  {
    id: "shadow-pattern",
    title: "Shadow Pattern",
    subtitle: "Repeating defenses, private fears, and how to work with them.",
    status: "locked",
    unlockHint: "A reflective report, not a prediction.",
    previewBullets: ["Defensive loops by placement", "Private pressure patterns", "Reflection without fatalism"],
  },
];
