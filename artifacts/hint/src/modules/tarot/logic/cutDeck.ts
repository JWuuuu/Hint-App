import type { RitualCard } from "./createHiddenDeck";

export type CutPileId = "A" | "B" | "C";

export type CutPile = {
  id: CutPileId;
  label: string;
  cards: RitualCard[];
};

export function cutDeck(hiddenDeckOrder: readonly RitualCard[]): CutPile[] {
  const cut1 = Math.floor(hiddenDeckOrder.length / 3);
  const cut2 = Math.floor((hiddenDeckOrder.length / 3) * 2);

  return [
    { id: "A", label: "Pile 1", cards: hiddenDeckOrder.slice(0, cut1) },
    { id: "B", label: "Pile 2", cards: hiddenDeckOrder.slice(cut1, cut2) },
    { id: "C", label: "Pile 3", cards: hiddenDeckOrder.slice(cut2) },
  ];
}

export function stackPiles(
  cutPiles: readonly CutPile[],
  pileOrder: readonly CutPileId[],
): RitualCard[] {
  return pileOrder.flatMap((id) => cutPiles.find((pile) => pile.id === id)?.cards ?? []);
}
