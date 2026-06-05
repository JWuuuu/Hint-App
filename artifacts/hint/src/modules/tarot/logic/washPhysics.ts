import type { RitualCard } from "./createHiddenDeck";

export type WashPointer = {
  x: number;
  y: number;
  movementX: number;
  movementY: number;
  width: number;
  height: number;
};

export type WashResult = {
  cards: RitualCard[];
  activeVisualIds: string[];
  movementScore: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function applyWashForce(
  ritualCards: readonly RitualCard[],
  pointer: WashPointer,
): WashResult {
  const activeVisualIds: string[] = [];
  let movementScore = 0;
  const pointerSpeed = Math.hypot(pointer.movementX, pointer.movementY);
  const direction = Math.atan2(pointer.movementY || 0.001, pointer.movementX || 0.001);

  const cards = ritualCards.map((card) => {
    const cardX = (card.x / 100) * pointer.width;
    const cardY = (card.y / 100) * pointer.height;
    const distance = Math.hypot(cardX - pointer.x, cardY - pointer.y);

    if (distance > 190) return card;

    const near = distance <= 80;
    const strength = near
      ? 8 + Math.random() * 16
      : 3 + Math.random() * 7 * (1 - (distance - 80) / 110);
    const swirl = direction + Math.PI / 2 + (Math.random() - 0.5) * 0.9;
    const dx = Math.cos(swirl) * strength;
    const dy = Math.sin(swirl) * strength;
    const rotateDelta = (near ? 2 + Math.random() * 8 : 0.8 + Math.random() * 3) * (Math.random() > 0.5 ? 1 : -1);

    activeVisualIds.push(card.visualId);
    movementScore += near ? 1.2 : 0.4;

    return {
      ...card,
      x: clamp(card.x + (dx / pointer.width) * 100, 5, 95),
      y: clamp(card.y + (dy / pointer.height) * 100, 8, 92),
      rotate: clamp(card.rotate + rotateDelta + pointerSpeed * 0.02, -48, 48),
    };
  });

  return { cards, activeVisualIds, movementScore };
}

export function gatherDeckToCenter(ritualCards: readonly RitualCard[]): RitualCard[] {
  return ritualCards.map((card, index) => ({
    ...card,
    x: 50 + (Math.random() - 0.5) * 4,
    y: 52 + (Math.random() - 0.5) * 3,
    rotate: (Math.random() - 0.5) * 12,
    zIndex: index,
  }));
}

export function squareDeckAtCenter(ritualCards: readonly RitualCard[]): RitualCard[] {
  return ritualCards.map((card, index) => ({
    ...card,
    x: 50 + (index % 6) * 0.08,
    y: 52 - (index % 8) * 0.08,
    rotate: (index % 5 - 2) * 0.45,
    zIndex: index,
  }));
}
