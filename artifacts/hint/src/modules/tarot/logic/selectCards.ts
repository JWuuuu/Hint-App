import type { RitualCard } from "./createHiddenDeck";

export function selectCardByVisualId(
  finalDeckOrder: readonly RitualCard[],
  selectedCards: readonly RitualCard[],
  visualId: string,
  maxCards: number,
): RitualCard[] {
  if (selectedCards.length >= maxCards) return [...selectedCards];
  if (selectedCards.some((card) => card.visualId === visualId)) return [...selectedCards];

  const selected = finalDeckOrder.find((card) => card.visualId === visualId);
  return selected ? [...selectedCards, { ...selected, selected: true }] : [...selectedCards];
}
