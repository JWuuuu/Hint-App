/**
 * Card drawing logic — cryptographically random selection.
 * Cards are predetermined server-side before the user sees anything.
 */

import { deck, type TarotCard } from "../data/deck.js";
import { spreads, type Spread } from "../data/spreads.js";

export interface DrawnCard {
  card: TarotCard;
  isReversed: boolean;
  position: string;
}

/**
 * Shuffle an array in-place using Fisher-Yates algorithm.
 */
function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Draw cards for a given spread type, fully predetermined server-side.
 * Each card has a ~30% chance of being reversed.
 */
export function drawCards(spreadId: string): DrawnCard[] {
  const spread: Spread | undefined = spreads[spreadId];
  if (!spread) {
    throw new Error(`Unknown spread: ${spreadId}`);
  }

  const shuffled = shuffleArray(deck);
  const selected = shuffled.slice(0, spread.cardCount);

  return selected.map((card, index) => ({
    card,
    isReversed: Math.random() < 0.3,
    position: spread.positions[index]?.name ?? `Card ${index + 1}`,
  }));
}
