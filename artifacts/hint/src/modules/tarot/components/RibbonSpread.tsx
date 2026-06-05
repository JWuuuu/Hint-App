import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { RitualCard } from "../logic/createHiddenDeck";
import { getRibbonLayout, getRibbonWidth } from "../logic/ribbonLayout";
import { TarotCardVisual } from "./TarotCardVisual";

type RibbonSpreadProps = {
  finalDeckOrder: RitualCard[];
  selectedCards: RitualCard[];
  maxCards: number;
  onSelect: (visualId: string) => void;
};

export function RibbonSpread({
  finalDeckOrder,
  selectedCards,
  maxCards,
  onSelect,
}: RibbonSpreadProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const selectedIds = new Set(selectedCards.map((card) => card.visualId));

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
  }, []);

  return (
    <section className="relative flex h-full w-full flex-col overflow-hidden px-4 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,rgba(226,190,116,0.16),transparent_28%),linear-gradient(180deg,#050816,#010207)]" />
      <div className="relative z-10 mx-auto mb-6 max-w-2xl text-center">
        <p className="font-serif text-4xl text-[#f7ead0]">Spread the deck.</p>
        <p className="mt-3 font-sans text-sm text-[#d8c7a6]/75">
          Choose {maxCards} face-down cards. The exact cards you touch will be the cards that reveal.
        </p>
        <p className="mt-2 font-sans text-xs uppercase tracking-[0.2em] text-[#e4c174]/80">
          {selectedCards.length} / {maxCards} selected
        </p>
      </div>

      <div className="relative z-10 mx-auto flex min-h-[168px] w-full max-w-4xl justify-center gap-4">
        {selectedCards.map((card, index) => (
          <motion.div
            key={card.visualId}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex flex-col items-center gap-2"
          >
            <TarotCardVisual card={card} compact selected />
            <span className="font-sans text-[10px] uppercase tracking-[0.18em] text-[#d8c7a6]/70">
              Card {index + 1}
            </span>
          </motion.div>
        ))}
      </div>

      <div
        ref={scrollRef}
        className="relative z-10 mt-auto h-[310px] w-full overflow-x-auto overflow-y-visible rounded-[8px] border border-[#e4c174]/15 bg-black/18 px-12 py-14 shadow-[inset_0_0_70px_rgba(0,0,0,0.45)]"
      >
        <div
          className="relative h-full"
          style={{ width: getRibbonWidth(finalDeckOrder.length) }}
        >
          {finalDeckOrder.map((card, index) => {
            const layout = getRibbonLayout(index, finalDeckOrder.length);
            const selected = selectedIds.has(card.visualId);
            return (
              <motion.div
                key={card.visualId}
                className="absolute"
                initial={{ opacity: 0, y: 40, rotate: layout.rotate - 8 }}
                animate={{
                  opacity: selected ? 0.22 : 1,
                  x: layout.x,
                  y: layout.y,
                  rotate: layout.rotate,
                }}
                transition={{ delay: Math.min(index * 0.006, 0.45), type: "spring", stiffness: 160, damping: 24 }}
                style={{ zIndex: layout.zIndex }}
              >
                <TarotCardVisual
                  card={card}
                  compact
                  selected={selected}
                  onClick={selected || selectedCards.length >= maxCards ? undefined : () => onSelect(card.visualId)}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
