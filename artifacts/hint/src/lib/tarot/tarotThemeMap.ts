export type TarotTheme =
  | "relationshipTension"
  | "emotionalFear"
  | "distance"
  | "attachment"
  | "selfWorth"
  | "confusion"
  | "healing"
  | "action"
  | "waiting"
  | "truth"
  | "growth"
  | "opportunity"
  | "boundary"
  | "communication"
  | "transformation";

export type TarotCardWeight = {
  cardId: string;
  weight: number;
  reason: string;
};

export const THEME_LABELS: Record<TarotTheme, string> = {
  relationshipTension: "relationship tension",
  emotionalFear: "emotional fear",
  distance: "distance",
  attachment: "attachment",
  selfWorth: "self-worth",
  confusion: "confusion",
  healing: "healing",
  action: "action",
  waiting: "waiting",
  truth: "truth",
  growth: "growth",
  opportunity: "opportunity",
  boundary: "boundary",
  communication: "communication",
  transformation: "transformation",
};

export const PLANET_THEMES: Record<string, TarotTheme[]> = {
  sun: ["growth", "truth"],
  moon: ["emotionalFear", "healing"],
  mercury: ["communication", "truth"],
  venus: ["relationshipTension", "selfWorth", "attachment"],
  mars: ["action", "relationshipTension"],
  jupiter: ["growth", "opportunity"],
  saturn: ["boundary", "waiting", "distance"],
  uranus: ["truth", "transformation"],
  neptune: ["confusion", "healing"],
  pluto: ["attachment", "transformation"],
};

export const ASPECT_THEMES: Record<string, TarotTheme[]> = {
  conjunct: ["truth", "growth"],
  sextile: ["opportunity", "healing"],
  square: ["relationshipTension", "boundary", "confusion"],
  trine: ["growth", "healing"],
  opposite: ["distance", "relationshipTension", "truth"],
  opposition: ["distance", "relationshipTension", "truth"],
};

export const HOUSE_THEMES: Record<number, TarotTheme[]> = {
  1: ["truth", "action"],
  2: ["selfWorth", "boundary"],
  3: ["communication", "truth"],
  4: ["healing", "emotionalFear"],
  5: ["growth", "action"],
  6: ["boundary", "healing"],
  7: ["relationshipTension", "distance"],
  8: ["emotionalFear", "attachment", "transformation"],
  9: ["growth", "truth"],
  10: ["action", "opportunity"],
  11: ["communication", "growth"],
  12: ["waiting", "healing", "confusion"],
};

export const THEME_TAROT_WEIGHTS: Record<TarotTheme, TarotCardWeight[]> = {
  relationshipTension: [
    { cardId: "6-lovers", weight: 8, reason: "choice, alignment, and relationship mirrors" },
    { cardId: "two-cups", weight: 7, reason: "a bond asking for honest balance" },
    { cardId: "five-cups", weight: 7, reason: "loss, disappointment, and emotional repair" },
    { cardId: "15-devil", weight: 6, reason: "desire, control, or an old loop" },
    { cardId: "two-swords", weight: 5, reason: "a guarded choice that cannot stay frozen" },
  ],
  emotionalFear: [
    { cardId: "18-moon", weight: 9, reason: "fear, instinct, and unclear signals" },
    { cardId: "nine-swords", weight: 7, reason: "anxiety getting louder than the facts" },
    { cardId: "four-cups", weight: 6, reason: "emotional withdrawal and hesitation" },
    { cardId: "8-strength", weight: 6, reason: "courage without forcing yourself" },
    { cardId: "9-hermit", weight: 5, reason: "quiet enough to hear the real signal" },
  ],
  distance: [
    { cardId: "9-hermit", weight: 9, reason: "space, privacy, and inner truth" },
    { cardId: "four-swords", weight: 7, reason: "rest before contact" },
    { cardId: "six-swords", weight: 7, reason: "moving away from noise" },
    { cardId: "eight-cups", weight: 6, reason: "stepping back from what is not feeding you" },
    { cardId: "14-temperance", weight: 5, reason: "a calmer middle distance" },
  ],
  attachment: [
    { cardId: "15-devil", weight: 9, reason: "attachment, compulsion, or a repeating loop" },
    { cardId: "four-pentacles", weight: 7, reason: "holding too tightly for safety" },
    { cardId: "18-moon", weight: 6, reason: "uncertainty feeding projection" },
    { cardId: "13-death", weight: 6, reason: "release that changes the pattern" },
    { cardId: "five-cups", weight: 5, reason: "grief that still wants a place" },
  ],
  selfWorth: [
    { cardId: "3-empress", weight: 8, reason: "receiving, care, and enoughness" },
    { cardId: "nine-pentacles", weight: 8, reason: "self-possession and value" },
    { cardId: "queen-pentacles", weight: 6, reason: "steady care without shrinking" },
    { cardId: "6-lovers", weight: 5, reason: "choosing what matches your values" },
    { cardId: "11-justice", weight: 5, reason: "fairness to yourself" },
  ],
  confusion: [
    { cardId: "18-moon", weight: 9, reason: "unclear facts and dream logic" },
    { cardId: "seven-cups", weight: 8, reason: "too many options or fantasies" },
    { cardId: "two-swords", weight: 7, reason: "a decision held in suspension" },
    { cardId: "12-hanged-man", weight: 6, reason: "a new angle before action" },
    { cardId: "2-high-priestess", weight: 5, reason: "inner knowing before proof" },
  ],
  healing: [
    { cardId: "14-temperance", weight: 9, reason: "balance, patience, and integration" },
    { cardId: "17-star", weight: 8, reason: "renewal after strain" },
    { cardId: "six-swords", weight: 7, reason: "leaving the harsher current" },
    { cardId: "four-swords", weight: 6, reason: "rest as medicine" },
    { cardId: "8-strength", weight: 5, reason: "gentleness as strength" },
  ],
  action: [
    { cardId: "7-chariot", weight: 9, reason: "direction and movement" },
    { cardId: "knight-wands", weight: 8, reason: "fast creative momentum" },
    { cardId: "ace-wands", weight: 8, reason: "a clean spark to act on" },
    { cardId: "1-magician", weight: 7, reason: "using the tools already present" },
    { cardId: "4-emperor", weight: 5, reason: "structure that makes action usable" },
  ],
  waiting: [
    { cardId: "12-hanged-man", weight: 9, reason: "pause and perspective" },
    { cardId: "four-swords", weight: 8, reason: "rest before the next move" },
    { cardId: "9-hermit", weight: 7, reason: "quiet signal before public action" },
    { cardId: "seven-pentacles", weight: 6, reason: "patience with what is still growing" },
    { cardId: "14-temperance", weight: 5, reason: "not forcing the timing" },
  ],
  truth: [
    { cardId: "11-justice", weight: 9, reason: "truth and clean accountability" },
    { cardId: "2-high-priestess", weight: 8, reason: "knowing what cannot be proven yet" },
    { cardId: "20-judgement", weight: 8, reason: "a wake-up call from the pattern" },
    { cardId: "ace-swords", weight: 7, reason: "one clean thought cutting through" },
    { cardId: "king-swords", weight: 5, reason: "honest language without drama" },
  ],
  growth: [
    { cardId: "17-star", weight: 7, reason: "renewal and faith" },
    { cardId: "19-sun", weight: 7, reason: "clarity that opens the day" },
    { cardId: "3-empress", weight: 7, reason: "slow growth that deserves care" },
    { cardId: "21-world", weight: 6, reason: "integration after a cycle" },
    { cardId: "10-wheel", weight: 5, reason: "a cycle turning forward" },
  ],
  opportunity: [
    { cardId: "10-wheel", weight: 8, reason: "timing and a turning point" },
    { cardId: "1-magician", weight: 7, reason: "resources becoming usable" },
    { cardId: "ace-pentacles", weight: 7, reason: "a practical opening" },
    { cardId: "ace-wands", weight: 6, reason: "a spark worth testing" },
    { cardId: "7-chariot", weight: 5, reason: "momentum that needs steering" },
  ],
  boundary: [
    { cardId: "4-emperor", weight: 8, reason: "structure and a firm line" },
    { cardId: "11-justice", weight: 7, reason: "fairness and consequences" },
    { cardId: "queen-swords", weight: 7, reason: "clear speech without overexplaining" },
    { cardId: "four-pentacles", weight: 6, reason: "protection and limits" },
    { cardId: "8-strength", weight: 5, reason: "kindness with a spine" },
  ],
  communication: [
    { cardId: "ace-swords", weight: 8, reason: "a simple clear message" },
    { cardId: "page-swords", weight: 7, reason: "curiosity and direct questions" },
    { cardId: "1-magician", weight: 6, reason: "words becoming action" },
    { cardId: "2-high-priestess", weight: 5, reason: "listening before speaking" },
    { cardId: "three-cups", weight: 5, reason: "conversation and shared support" },
  ],
  transformation: [
    { cardId: "13-death", weight: 9, reason: "an ending that changes the shape" },
    { cardId: "16-tower", weight: 7, reason: "truth breaking an unstable pattern" },
    { cardId: "20-judgement", weight: 7, reason: "a call to outgrow the old role" },
    { cardId: "21-world", weight: 6, reason: "completion and integration" },
    { cardId: "six-swords", weight: 5, reason: "crossing into a cleaner current" },
  ],
};
