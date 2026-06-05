export type CardOrientation = "upright" | "reversed";

export type RitualCard = {
  visualId: string;
  cardId: string;
  name: string;
  orientation: CardOrientation;
  x: number;
  y: number;
  rotate: number;
  zIndex: number;
  selected: boolean;
};

export type RitualDeckCard = {
  cardId: string;
  name: string;
  keywords: string[];
};

const MAJOR_ARCANA_DATA: Array<[string, string, string[]]> = [
  ["0-fool", "The Fool", ["beginning", "risk", "trust"]],
  ["1-magician", "The Magician", ["will", "skill", "focus"]],
  ["2-high-priestess", "The High Priestess", ["intuition", "mystery", "silence"]],
  ["3-empress", "The Empress", ["growth", "care", "abundance"]],
  ["4-emperor", "The Emperor", ["structure", "order", "authority"]],
  ["5-hierophant", "The Hierophant", ["tradition", "guidance", "belief"]],
  ["6-lovers", "The Lovers", ["choice", "bond", "alignment"]],
  ["7-chariot", "The Chariot", ["direction", "drive", "control"]],
  ["8-strength", "Strength", ["courage", "patience", "heart"]],
  ["9-hermit", "The Hermit", ["solitude", "truth", "search"]],
  ["10-wheel", "Wheel of Fortune", ["cycle", "change", "timing"]],
  ["11-justice", "Justice", ["truth", "balance", "accountability"]],
  ["12-hanged-man", "The Hanged Man", ["pause", "surrender", "perspective"]],
  ["13-death", "Death", ["ending", "release", "change"]],
  ["14-temperance", "Temperance", ["balance", "healing", "blend"]],
  ["15-devil", "The Devil", ["attachment", "shadow", "pattern"]],
  ["16-tower", "The Tower", ["shock", "truth", "collapse"]],
  ["17-star", "The Star", ["hope", "renewal", "faith"]],
  ["18-moon", "The Moon", ["dream", "fear", "uncertainty"]],
  ["19-sun", "The Sun", ["clarity", "warmth", "joy"]],
  ["20-judgement", "Judgement", ["calling", "reckoning", "awakening"]],
  ["21-world", "The World", ["completion", "arrival", "wholeness"]],
];

const MAJOR_ARCANA: RitualDeckCard[] = MAJOR_ARCANA_DATA.map(
  ([cardId, name, keywords]) => ({ cardId, name, keywords }),
);

const SUITS = ["Wands", "Cups", "Swords", "Pentacles"] as const;
const RANKS = [
  "Ace",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Page",
  "Knight",
  "Queen",
  "King",
] as const;

const SUIT_KEYWORDS: Record<(typeof SUITS)[number], string[]> = {
  Wands: ["spark", "action", "desire"],
  Cups: ["feeling", "bond", "heart"],
  Swords: ["thought", "truth", "tension"],
  Pentacles: ["body", "work", "ground"],
};

const MINOR_ARCANA: RitualDeckCard[] = SUITS.flatMap((suit) =>
  RANKS.map((rank) => ({
    cardId: `${rank.toLowerCase()}-${suit.toLowerCase()}`,
    name: `${rank} of ${suit}`,
    keywords: SUIT_KEYWORDS[suit],
  })),
);

export const RITUAL_TAROT_DECK: RitualDeckCard[] = [
  ...MAJOR_ARCANA,
  ...MINOR_ARCANA,
];

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

export function scatterDeck(deck: readonly RitualCard[]): RitualCard[] {
  return deck.map((card, index) => ({
    ...card,
    x: randomBetween(12, 88),
    y: randomBetween(16, 82),
    rotate: randomBetween(-34, 34),
    zIndex: index,
    selected: false,
  }));
}

export function createHiddenDeck(): RitualCard[] {
  return shuffle(RITUAL_TAROT_DECK).map((card, index) => ({
    visualId: `visual-${index}-${Math.random().toString(36).slice(2, 9)}`,
    cardId: card.cardId,
    name: card.name,
    orientation: Math.random() > 0.22 ? "upright" : "reversed",
    x: randomBetween(12, 88),
    y: randomBetween(16, 82),
    rotate: randomBetween(-34, 34),
    zIndex: index,
    selected: false,
  }));
}

export function getCardKeywords(cardId: string): string[] {
  return (
    RITUAL_TAROT_DECK.find((card) => card.cardId === cardId)?.keywords ?? [
      "signal",
      "movement",
      "meaning",
    ]
  ).slice(0, 3);
}
