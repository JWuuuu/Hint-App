import { getAnonId, getLocalDateString } from "../../lib/identity";
import { listLocalDailyReadings } from "../../modules/readings/localDailyReadings";
import {
  listLocalTarotReadings,
  type LocalTarotReading,
} from "../../modules/readings/localTarotReadings";
import { RITUAL_TAROT_DECK } from "../../modules/tarot/logic/createHiddenDeck";
import { getTarotCardImage } from "../../modules/tarot/logic/cardImageMap";

export type CollectionSource = "daily" | "tarot" | "animal" | "reward" | "preview";

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

const LOCAL_UNLOCKS_STORAGE_KEY = "hint_local_collection_unlocks_v1";
const LOCAL_UNLOCKS_UPDATED_EVENT = "hint:local-collection-unlocks-updated";
const DAILY_REWARD_STORAGE_KEY = "hint_daily_collection_rewards_v1";
const DAILY_REWARD_UPDATED_EVENT = "hint:daily-collection-reward-updated";

type LocalCollectionUnlock = {
  anonId: string;
  cardId: string;
  source: CollectionSource;
  createdAt: string;
};

export type DailyCollectionReward = {
  anonId: string;
  dayKey: string;
  cardId: string;
  assignedAt: string;
  expiresAt: string;
  openedAt?: string;
  lastSeenAt?: string;
};

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/^the\s+/, "").replace(/[^a-z0-9]+/g, "");
}

function sourceRank(source: CollectionSource): number {
  return source === "tarot" ? 0 : source === "daily" ? 1 : source === "animal" ? 2 : source === "reward" ? 3 : 4;
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

function nextLocalMidnight(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pickDailyRewardCardId(anonId: string, dayKey: string): string {
  const rareCards = RITUAL_TAROT_DECK.filter((card) => isRare(card.cardId));
  const index = hashString(`${anonId}:${dayKey}:collection-reward`) % rareCards.length;
  return rareCards[index]?.cardId ?? RITUAL_TAROT_DECK[0]!.cardId;
}

function readLocalUnlocks(): LocalCollectionUnlock[] {
  try {
    const raw = localStorage.getItem(LOCAL_UNLOCKS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalUnlocks(unlocks: LocalCollectionUnlock[]) {
  try {
    localStorage.setItem(LOCAL_UNLOCKS_STORAGE_KEY, JSON.stringify(unlocks));
    window.dispatchEvent(new Event(LOCAL_UNLOCKS_UPDATED_EVENT));
  } catch {
    // Local reward unlocks should never block the collection view.
  }
}

function readDailyRewards(): DailyCollectionReward[] {
  try {
    const raw = localStorage.getItem(DAILY_REWARD_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeDailyRewards(rewards: DailyCollectionReward[]) {
  try {
    localStorage.setItem(DAILY_REWARD_STORAGE_KEY, JSON.stringify(rewards));
    window.dispatchEvent(new Event(DAILY_REWARD_UPDATED_EVENT));
  } catch {
    // The reward can still be shown from component state if persistence fails.
  }
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

  for (const unlock of readLocalUnlocks().filter((item) => item.anonId === anonId)) {
    addSeen(seen, unlock.cardId, unlock.source, unlock.createdAt);
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

export function saveLocalCollectionUnlock(
  cardId: string,
  source: CollectionSource = "reward",
  anonId = getAnonId(),
): LocalCollectionUnlock {
  const createdAt = new Date().toISOString();
  const unlock: LocalCollectionUnlock = {
    anonId,
    cardId,
    source,
    createdAt,
  };
  const existing = readLocalUnlocks().filter(
    (item) => !(item.anonId === anonId && item.cardId === cardId && item.source === source),
  );
  writeLocalUnlocks([unlock, ...existing].slice(0, 160));
  return unlock;
}

export function getDailyCollectionReward(anonId = getAnonId(), now = new Date()): DailyCollectionReward {
  const rewards = readDailyRewards().filter((item) => item.anonId === anonId);
  const timestamp = now.toISOString();
  const nowTime = now.getTime();
  const todayKey = getLocalDateString(now);
  const todayReward = rewards.find((item) => item.dayKey === todayKey);

  if (todayReward) {
    return todayReward;
  }

  const activeReward = rewards
    .filter((item) => new Date(item.expiresAt).getTime() > nowTime)
    .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime())[0];

  if (activeReward) {
    return activeReward;
  }

  const reward: DailyCollectionReward = {
    anonId,
    dayKey: todayKey,
    cardId: pickDailyRewardCardId(anonId, todayKey),
    assignedAt: timestamp,
    expiresAt: nextLocalMidnight(now).toISOString(),
    lastSeenAt: timestamp,
  };
  writeDailyRewards([reward, ...readDailyRewards().filter((item) => item.anonId !== anonId || item.dayKey !== todayKey)].slice(0, 90));
  return reward;
}

export function openDailyCollectionReward(cardId: string, anonId = getAnonId(), now = new Date()): DailyCollectionReward {
  const reward = getDailyCollectionReward(anonId, now);
  if (cardId !== reward.cardId) return reward;

  const timestamp = now.toISOString();
  const openedReward: DailyCollectionReward = {
    ...reward,
    cardId: reward.cardId,
    openedAt: reward.openedAt ?? timestamp,
    lastSeenAt: timestamp,
  };

  writeDailyRewards([openedReward, ...readDailyRewards().filter((item) => !(item.anonId === anonId && item.dayKey === reward.dayKey))].slice(0, 90));
  return openedReward;
}

export function subscribeToDailyCollectionReward(onChange: () => void): () => void {
  window.addEventListener(DAILY_REWARD_UPDATED_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(DAILY_REWARD_UPDATED_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function subscribeToLocalCollectionUnlocks(onChange: () => void): () => void {
  window.addEventListener(LOCAL_UNLOCKS_UPDATED_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(LOCAL_UNLOCKS_UPDATED_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
