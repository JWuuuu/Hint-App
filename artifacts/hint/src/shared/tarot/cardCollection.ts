import { getAnonId } from "../../lib/identity";
import { listLocalDailyReadings } from "../../modules/readings/localDailyReadings";
import {
  listLocalTarotReadings,
  type LocalTarotReading,
} from "../../modules/readings/localTarotReadings";
import { RITUAL_TAROT_DECK } from "../../modules/tarot/logic/createHiddenDeck";
import { getTarotCardImage } from "../../modules/tarot/logic/cardImageMap";

export type CollectionSource = "daily" | "tarot" | "animal" | "preview";

export type CollectionCard = {
  cardId: string;
  name: string;
  unlocked: boolean;
  sources: CollectionSource[];
  firstSeenAt?: string;
  lastSeenAt?: string;
  count: number;
  image: string | null;
  rare: boolean;
};

export type CardCollectionSummary = {
  total: number;
  unlocked: number;
  locked: number;
  rareUnlocked: number;
  cards: CollectionCard[];
  recent: CollectionCard[];
};

const NAME_TO_ID = new Map(
  RITUAL_TAROT_DECK.map((card) => [normalizeName(card.name), card.cardId]),
);

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/^the\s+/, "").replace(/[^a-z0-9]+/g, "");
}

function sourceRank(source: CollectionSource): number {
  return source === "tarot" ? 0 : source === "daily" ? 1 : source === "animal" ? 2 : 3;
}

function isRare(cardId: string): boolean {
  return /^(?:[0-9]|1[0-9]|2[0-1])-/.test(cardId);
}

function addSeen(
  seen: Map<string, { sources: Set<CollectionSource>; dates: string[]; count: number }>,
  cardId: string | undefined,
  source: CollectionSource,
  createdAt: string,
) {
  if (!cardId) return;
  const current = seen.get(cardId) ?? { sources: new Set<CollectionSource>(), dates: [], count: 0 };
  current.sources.add(source);
  current.dates.push(createdAt);
  current.count += 1;
  seen.set(cardId, current);
}

function dailyCardId(cardName: string): string | undefined {
  return NAME_TO_ID.get(normalizeName(cardName));
}

function tarotCards(reading: LocalTarotReading) {
  return reading.cards.map((card) => ({
    cardId: card.cardId || dailyCardId(card.name),
    createdAt: reading.createdAt,
  }));
}

export function getCardCollectionSummary(anonId = getAnonId()): CardCollectionSummary {
  const seen = new Map<string, { sources: Set<CollectionSource>; dates: string[]; count: number }>();

  for (const reading of listLocalTarotReadings(anonId)) {
    for (const card of tarotCards(reading)) {
      addSeen(seen, card.cardId, "tarot", card.createdAt);
    }
  }

  for (const reading of listLocalDailyReadings(anonId)) {
    addSeen(seen, dailyCardId(reading.cardName), "daily", reading.createdAt);
  }

  const cards = RITUAL_TAROT_DECK.map((card) => {
    const record = seen.get(card.cardId);
    const dates = record?.dates.slice().sort() ?? [];
    const sources = record ? [...record.sources].sort((a, b) => sourceRank(a) - sourceRank(b)) : [];
    return {
      cardId: card.cardId,
      name: card.name,
      unlocked: Boolean(record),
      sources,
      firstSeenAt: dates[0],
      lastSeenAt: dates[dates.length - 1],
      count: record?.count ?? 0,
      image: getTarotCardImage(card.cardId, "hint-card-2") ?? getTarotCardImage(card.cardId),
      rare: isRare(card.cardId),
    };
  });

  const recent = cards
    .filter((card) => card.unlocked && card.lastSeenAt)
    .sort((a, b) => new Date(b.lastSeenAt ?? 0).getTime() - new Date(a.lastSeenAt ?? 0).getTime())
    .slice(0, 6);

  const unlocked = cards.filter((card) => card.unlocked).length;
  const rareUnlocked = cards.filter((card) => card.unlocked && card.rare).length;

  return {
    total: cards.length,
    unlocked,
    locked: cards.length - unlocked,
    rareUnlocked,
    cards,
    recent,
  };
}
