import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { RitualCard } from "../logic/createHiddenDeck";
import type { SpreadChoice } from "../../hold/useHoldFlow";
import { TarotCardVisual } from "./TarotCardVisual";
import type { TarotCardBackStyle } from "./TarotCardVisual";

type RibbonSpreadProps = {
  finalDeckOrder: RitualCard[];
  selectedCards: RitualCard[];
  maxCards: number;
  spread: SpreadChoice;
  backStyle?: TarotCardBackStyle;
  onSelect: (visualId: string) => void;
};

function getFanLayout(index: number, total: number) {
  const progress = total <= 1 ? 0.5 : index / (total - 1);
  const centered = progress - 0.5;
  const angle = -42 + progress * 84;
  const edgeLift = Math.pow(Math.abs(centered) * 2, 1.35);

  return {
    x: 50 + centered * 78,
    y: 51 + edgeLift * 11 - Math.cos(centered * Math.PI) * 8,
    rotate: angle,
    centerOffsetX: -centered * 640,
    centerOffsetY: 132 + edgeLift * 32,
    spreadDelay: Math.abs(centered) * 0.24 + Math.min(index * 0.0015, 0.08),
    zIndex: index,
  };
}

function slotSizeClass(cardCount: number) {
  if (cardCount >= 7) return "h-[74px] w-[48px] sm:h-[86px] sm:w-[56px] md:h-[94px] md:w-[62px]";
  if (cardCount >= 5) return "h-[82px] w-[54px] sm:h-[94px] sm:w-[62px] md:h-[104px] md:w-[68px]";
  return "h-[92px] w-[60px] sm:h-[108px] sm:w-[70px] md:h-[120px] md:w-[78px]";
}

function slotGridClass(cardCount: number) {
  if (cardCount === 1) return "grid-cols-1 max-w-[12rem]";
  if (cardCount === 3) return "grid-cols-3 max-w-2xl";
  if (cardCount <= 5) return "grid-cols-3 sm:grid-cols-5 max-w-4xl";
  return "grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 max-w-5xl";
}

export function RibbonSpread({
  finalDeckOrder,
  selectedCards,
  maxCards,
  spread,
  backStyle = "nocturne",
  onSelect,
}: RibbonSpreadProps) {
  const fanRef = useRef<HTMLDivElement | null>(null);
  const selectedIds = new Set(selectedCards.map((card) => card.visualId));
  const availableCards = finalDeckOrder.filter((card) => !selectedIds.has(card.visualId));
  const slots = Array.from({ length: maxCards }, (_, index) => index);
  const cardSizeClass = slotSizeClass(maxCards);
  const gridClass = slotGridClass(maxCards);

  useEffect(() => {
    if (fanRef.current) {
      fanRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
  }, []);

  return (
    <section className="relative flex h-full w-full flex-col overflow-hidden px-4 py-6 text-center sm:px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_54%,rgba(226,190,116,0.10),transparent_34%),linear-gradient(180deg,#050816,#010207_54%,#03040c)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%] bg-[radial-gradient(ellipse_at_50%_100%,rgba(221,184,105,0.16),transparent_60%)]" />

      <div className="relative z-10 mx-auto mb-3 max-w-2xl">
        <p className="font-serif text-[32px] leading-tight text-[#f7ead0] sm:text-4xl">Spread the deck.</p>
        <p className="mt-2 font-sans text-sm text-[#d8c7a6]/75">
          Choose {maxCards} face-down {maxCards === 1 ? "card" : "cards"} for {spread.label}.
        </p>
        <p className="mt-2 font-sans text-xs uppercase tracking-[0.2em] text-[#e4c174]/80">
          {selectedCards.length} / {maxCards} selected
        </p>
      </div>

      <div className="relative z-10 mx-auto flex min-h-[178px] w-full max-w-6xl flex-col justify-end rounded-[18px] border border-[#e4c174]/14 bg-black/22 px-3 pb-4 pt-5 shadow-[inset_0_0_62px_rgba(0,0,0,0.44)] sm:min-h-[208px] sm:px-5">
        <div className="mb-3 text-center">
          <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-[#e4c174]/70">Selected Hints</p>
        </div>

        <div className={`mx-auto grid w-full ${gridClass} items-end justify-items-center gap-3 sm:gap-4`}>
          {slots.map((slotIndex) => {
            const index = slotIndex;
            const selectedCard = selectedCards[index];
            const label = `Hint ${index + 1}`;
            return (
              <div
                key={`${spread.id}-hint-${index + 1}`}
                className="flex min-w-0 flex-col items-center gap-1.5"
              >
                <div className="relative">
                  <div
                    className={`relative ${cardSizeClass} rounded-[10px] border border-dashed border-[#e4c174]/48 bg-[#e4c174]/[0.045] shadow-[inset_0_0_22px_rgba(228,193,116,0.08)]`}
                  >
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-sans text-[10px] uppercase tracking-[0.18em] text-[#e4c174]/64">
                      {label}
                    </span>
                  </div>
                  {selectedCard && (
                    <motion.div
                      layoutId={`spread-card-${selectedCard.visualId}`}
                      initial={{ opacity: 0, y: 128, scale: 1.12, rotate: 12 }}
                      animate={{
                        opacity: [0, 1, 1],
                        y: [104, -26, 0],
                        scale: [1.1, 1.18, 1],
                        rotate: [10, -4, 0],
                      }}
                      transition={{
                        duration: 0.86,
                        times: [0, 0.58, 1],
                        ease: [0.18, 0.78, 0.2, 1],
                      }}
                      className="absolute left-0 top-0"
                    >
                      <motion.div
                        aria-hidden
                        initial={{ opacity: 0.62, scale: 0.76 }}
                        animate={{ opacity: 0, scale: 1.65 }}
                        transition={{ duration: 0.72, ease: "easeOut" }}
                        className="pointer-events-none absolute -inset-5 rounded-[20px] bg-[#e4c174]/24 blur-xl"
                      />
                      <TarotCardVisual
                        card={selectedCard}
                        compact
                        backStyle={backStyle}
                        ariaLabel={`${label}, face-down`}
                        className={cardSizeClass}
                      />
                    </motion.div>
                  )}
                </div>
                <p className="max-w-[7rem] truncate font-sans text-[9px] uppercase tracking-[0.14em] text-[#d8c7a6]/72">
                  {selectedCard ? `${label} selected` : label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div
        ref={fanRef}
        className="relative z-10 mt-2 h-[42vh] min-h-[325px] w-full overflow-hidden"
      >
        <div className="absolute inset-x-0 bottom-0 mx-auto h-full max-w-6xl">
          <div className="absolute left-1/2 top-[79%] h-[48px] w-[78%] -translate-x-1/2 rounded-full bg-black/36 blur-xl" />
          {availableCards.map((card, index) => {
            const layout = getFanLayout(index, availableCards.length);
            return (
              <div
                key={card.visualId}
                className="absolute"
                style={{
                  left: `${layout.x}%`,
                  top: `${layout.y}%`,
                  zIndex: layout.zIndex,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <motion.div
                  layoutId={`spread-card-${card.visualId}`}
                  initial={{
                    opacity: 0,
                    x: layout.centerOffsetX,
                    y: layout.centerOffsetY,
                    rotate: 0,
                    scale: 0.86,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    y: 0,
                    rotate: layout.rotate,
                    scale: 1,
                  }}
                  transition={{
                    delay: layout.spreadDelay,
                    type: "spring",
                    stiffness: 145,
                    damping: 24,
                    mass: 0.9,
                  }}
                  style={{ transformOrigin: "50% 96%" }}
                >
                  <TarotCardVisual
                    card={card}
                    compact
                    backStyle={backStyle}
                    className="drop-shadow-[0_12px_18px_rgba(0,0,0,0.34)]"
                    onClick={selectedCards.length >= maxCards ? undefined : () => onSelect(card.visualId)}
                  />
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
