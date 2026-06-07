import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { RitualCard } from "../logic/createHiddenDeck";
import { TarotCardVisual } from "./TarotCardVisual";
import type { TarotCardBackStyle } from "./TarotCardVisual";

type ReadingRevealProps = {
  selectedCards: RitualCard[];
  revealedIds: readonly string[];
  backStyle?: TarotCardBackStyle;
  onContinue?: () => void;
  onReveal: (visualId: string) => void;
  onRestart: () => void;
};

function revealGridClass(count: number) {
  if (count === 1) return "grid-cols-1 max-w-sm";
  if (count === 2) return "grid-cols-1 sm:grid-cols-2 max-w-2xl";
  if (count === 3) return "grid-cols-1 sm:grid-cols-3 max-w-4xl";
  if (count <= 5) return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 max-w-5xl";
  return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 max-w-6xl";
}

export function ReadingReveal({
  selectedCards,
  revealedIds,
  backStyle = "nocturne",
  onContinue,
  onReveal,
}: ReadingRevealProps) {
  const [readyToReveal, setReadyToReveal] = useState(false);
  const allRevealed = selectedCards.every((card) => revealedIds.includes(card.visualId));
  const oneCard = selectedCards.length === 1;
  const title = allRevealed ? "The Hints are open." : "These are the cards that came through.";
  const subtitle = allRevealed
    ? "Read what they are pointing toward."
    : oneCard
      ? "Turn Hint 1 when you are ready."
      : "Turn each Hint when you are ready.";
  const gridClass = revealGridClass(selectedCards.length);

  useEffect(() => {
    setReadyToReveal(false);
    const timer = window.setTimeout(() => setReadyToReveal(true), 760);
    return () => window.clearTimeout(timer);
  }, [selectedCards]);

  return (
    <section className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden px-4 py-8 text-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_46%,rgba(226,190,116,0.17),transparent_28%),radial-gradient(circle_at_50%_72%,rgba(8,19,34,0.74),transparent_34%),linear-gradient(180deg,#050816,#010207)]" />
      <div className="pointer-events-none absolute inset-x-0 top-[22%] mx-auto h-[55%] max-w-5xl rounded-full bg-[#e4c174]/[0.045] blur-3xl" />

      <div className="relative z-10 mb-8 max-w-3xl">
        <p className="font-serif text-[34px] leading-tight text-[#f7ead0] sm:text-5xl">{title}</p>
        <p className="mt-3 font-sans text-sm text-[#d8c7a6]/78 sm:text-[15px]">{subtitle}</p>
      </div>

      <div className={`relative z-10 grid w-full ${gridClass} place-items-center gap-5 sm:gap-7`}>
        {selectedCards.map((card, index) => {
          const revealed = revealedIds.includes(card.visualId);
          const label = `Hint ${index + 1}`;
          const canReveal = !revealed && readyToReveal;
          return (
            <motion.div
              key={card.visualId}
              layoutId={`spread-card-${card.visualId}`}
              initial={{ opacity: 0, y: 34, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.08, type: "spring", stiffness: 165, damping: 23 }}
              className={`relative flex flex-col items-center gap-4 ${canReveal ? "cursor-pointer" : ""}`}
              onClick={canReveal ? () => onReveal(card.visualId) : undefined}
            >
              <motion.div
                animate={{
                  y: revealed ? [0, -10, 0] : 0,
                  scale: revealed ? [1, 1.035, 1] : 1,
                }}
                transition={{ duration: 0.92, ease: [0.2, 0.74, 0.18, 1] }}
                className="relative"
              >
                <motion.div
                  className="pointer-events-none absolute -inset-5 rounded-[20px] bg-[#e4c174]/18 blur-2xl"
                  animate={{ opacity: revealed ? 0.72 : 0.2, scale: revealed ? 1.06 : 0.86 }}
                  transition={{ duration: 0.92, ease: [0.2, 0.74, 0.18, 1] }}
                />
                <TarotCardVisual
                  card={card}
                  faceDown={!revealed}
                  revealed={revealed}
                  active={!revealed}
                  backStyle={backStyle}
                  positionLabel={label}
                  ariaLabel={revealed ? undefined : `${label}, face-down`}
                  onClick={canReveal ? () => onReveal(card.visualId) : undefined}
                />
              </motion.div>
              <p className="font-sans text-[11px] uppercase tracking-[0.22em] text-[#d8c7a6]/78">
                {label}
              </p>
            </motion.div>
          );
        })}
      </div>

      {allRevealed && (
        <button
          type="button"
          onClick={onContinue}
          className="relative z-10 mt-10 rounded-full border border-[#e4c174]/58 bg-[#e4c174]/10 px-7 py-3.5 font-sans text-xs uppercase tracking-[0.22em] text-[#ffe8aa] shadow-[0_12px_30px_rgba(0,0,0,0.35)] transition hover:bg-[#e4c174]/16"
        >
          Read the Hints
        </button>
      )}
    </section>
  );
}
