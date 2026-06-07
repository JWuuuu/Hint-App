export type CardOrientation = "upright" | "reversed";

export type RitualCard = {
  visualId: string;
  cardId: string;
  name: string;
  orientation: CardOrientation;
  x: number;
  y: number;
  rotation: number;
  rotate: number;
  zIndex: number;
  selected: boolean;
  revealed: boolean;
  velocityX?: number;
  velocityY?: number;
  velocityRotate?: number;
  lift?: number;
  gatherDelay?: number;
  homeX?: number;
  homeY?: number;
  washLayer?: "base" | "top";
};

export type RitualDeckCard = {
  cardId: string;
  name: string;
  keywords: string[];
};
