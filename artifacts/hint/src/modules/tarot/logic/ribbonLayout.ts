export type RibbonCardLayout = {
  x: number;
  y: number;
  rotate: number;
  zIndex: number;
};

export function getRibbonLayout(index: number, total: number): RibbonCardLayout {
  const progress = total <= 1 ? 0 : index / (total - 1);
  const arc = Math.sin(progress * Math.PI);
  return {
    x: index * 34,
    y: 42 - arc * 32 + Math.sin(index * 0.65) * 4,
    rotate: -8 + progress * 16 + Math.sin(index * 1.7) * 1.5,
    zIndex: index,
  };
}

export function getRibbonWidth(total: number) {
  return Math.max(820, total * 34 + 120);
}
