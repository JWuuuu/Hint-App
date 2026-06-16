import type { SpreadChoice } from "../../hold/useHoldFlow";

export function getSpreadPositionLabel(spread: SpreadChoice, index: number) {
  return spread.positionLabels[index]?.trim() || `Card ${index + 1}`;
}

export function getSpreadPositionLabels(spread: SpreadChoice, count = spread.cardCount) {
  return Array.from({ length: count }, (_, index) => getSpreadPositionLabel(spread, index));
}
