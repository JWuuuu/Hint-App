import type { RitualCard, RitualDeckCard } from "../types/ritual.types";

export type { CardOrientation, RitualCard, RitualDeckCard } from "../types/ritual.types";

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

function randomTablePoint() {
  const clusters = [
    { x: 50, y: 52, weight: 0.42, spreadX: 24, spreadY: 17 },
    { x: 42, y: 49, weight: 0.2, spreadX: 18, spreadY: 12 },
    { x: 58, y: 55, weight: 0.2, spreadX: 18, spreadY: 12 },
    { x: 51, y: 43, weight: 0.18, spreadX: 20, spreadY: 11 },
  ];
  const roll = Math.random();
  let cursor = 0;
  const cluster = clusters.find((item) => {
    cursor += item.weight;
    return roll <= cursor;
  }) ?? clusters[0]!;
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.pow(Math.random(), 0.72);
  return {
    x: cluster.x + Math.cos(angle) * radius * randomBetween(4, cluster.spreadX),
    y: cluster.y + Math.sin(angle) * radius * randomBetween(3, cluster.spreadY),
  };
}

function getWashLayer(index: number): RitualCard["washLayer"] {
  return index % 2 === 0 ? "base" : "top";
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
  return deck.map((card, index) => {
    const rotation = randomBetween(-34, 34);
    const point = randomTablePoint();
    const washLayer = card.washLayer ?? getWashLayer(index);
    return {
      ...card,
      x: point.x,
      y: point.y,
      homeX: point.x,
      homeY: point.y,
      washLayer,
      rotate: rotation,
      rotation,
      zIndex: washLayer === "base" ? index : 120 + index,
      selected: false,
      revealed: false,
      velocityX: 0,
      velocityY: 0,
      velocityRotate: 0,
      lift: 0,
      gatherDelay: 0,
    };
  });
}

export function createHiddenDeck(): RitualCard[] {
  return shuffle(RITUAL_TAROT_DECK).map((card, index) => {
    const rotation = randomBetween(-34, 34);
    const point = randomTablePoint();
    const washLayer = getWashLayer(index);
    return {
      visualId: `visual-${index}-${Math.random().toString(36).slice(2, 9)}`,
      cardId: card.cardId,
      name: card.name,
      orientation: Math.random() > 0.22 ? "upright" : "reversed",
      x: point.x,
      y: point.y,
      homeX: point.x,
      homeY: point.y,
      washLayer,
      rotate: rotation,
      rotation,
      zIndex: washLayer === "base" ? index : 120 + index,
      selected: false,
      revealed: false,
      velocityX: 0,
      velocityY: 0,
      velocityRotate: 0,
      lift: 0,
      gatherDelay: 0,
    };
  });
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
