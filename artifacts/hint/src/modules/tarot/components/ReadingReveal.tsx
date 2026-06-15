import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { RitualCard } from "../logic/createHiddenDeck";
import type { TarotCardArtId } from "../logic/cardImageMap";
import { TarotCardVisual } from "./TarotCardVisual";
import type { TarotCardBackStyle } from "./TarotCardVisual";

type ReadingRevealProps = {
  selectedCards: RitualCard[];
  revealedIds: readonly string[];
  backStyle?: TarotCardBackStyle;
  cardArtId?: TarotCardArtId;
  autoReveal?: boolean;
  onContinue?: () => void;
  onReveal: (visualId: string) => void;
  onRestart: () => void;
};

function revealGridClass(count: number) {
  if (count === 1) return "grid-cols-1 max-w-sm";
  if (count === 2) return "grid-cols-1 sm:grid-cols-2 max-w-2xl";
  if (count === 3) return "grid-cols-3 max-w-3xl";
  if (count <= 5) return "grid-cols-3 sm:grid-cols-5 max-w-5xl";
  return "grid-cols-3 sm:grid-cols-5 xl:grid-cols-9 max-w-6xl";
}

function revealCardSizeClass(count: number) {
  if (count === 1) return "";
  if (count === 2) return "!h-[202px] !w-[124px] sm:!h-[256px] sm:!w-[156px] md:!h-[288px] md:!w-[176px]";
  if (count === 3) return "!h-[164px] !w-[100px] sm:!h-[236px] sm:!w-[144px] md:!h-[276px] md:!w-[168px]";
  if (count <= 5) return "!h-[146px] !w-[90px] sm:!h-[216px] sm:!w-[132px] md:!h-[250px] md:!w-[152px]";
  return "!h-[126px] !w-[78px] sm:!h-[188px] sm:!w-[116px] md:!h-[224px] md:!w-[136px]";
}

export function ReadingReveal({
  selectedCards,
  revealedIds,
  backStyle = "nocturne",
  cardArtId = "original",
  autoReveal = false,
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
  const cardSizeClass = revealCardSizeClass(selectedCards.length);

  useEffect(() => {
    setReadyToReveal(false);
    const timer = window.setTimeout(() => setReadyToReveal(true), 760);
    return () => window.clearTimeout(timer);
  }, [selectedCards]);

  useEffect(() => {
    if (!autoReveal) return;
    const timers = selectedCards
      .filter((card) => !revealedIds.includes(card.visualId))
      .map((card, index) =>
        window.setTimeout(() => onReveal(card.visualId), 260 + index * 120),
      );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [autoReveal, onReveal, revealedIds, selectedCards]);

  return (
    <section className="relative h-full w-full overflow-y-auto overflow-x-hidden px-4 py-10 text-center sm:py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_46%,rgba(226,190,116,0.17),transparent_28%),radial-gradient(circle_at_50%_72%,rgba(8,19,34,0.74),transparent_34%),linear-gradient(180deg,#050816,#010207)]" />
      <div className="pointer-events-none absolute inset-x-0 top-[22%] mx-auto h-[55%] max-w-5xl rounded-full bg-[#e4c174]/[0.045] blur-3xl" />

      <div className="relative z-30 mx-auto mb-10 max-w-3xl sm:mb-12">
        <p className="font-serif text-[34px] leading-tight text-[#f7ead0] sm:text-5xl">{title}</p>
        <p className="mt-3 font-sans text-sm text-[#d8c7a6]/78 sm:text-[15px]">{subtitle}</p>
      </div>

      <div className={`relative z-10 mx-auto grid w-full ${gridClass} place-items-center gap-3 sm:gap-7`}>
        {selectedCards.map((card, index) => {
          const revealed = revealedIds.includes(card.visualId);
          const label = `Hint ${index + 1}`;
          const canReveal = !autoReveal && !revealed && readyToReveal;
          return (
            <motion.div
              key={card.visualId}
              layoutId={`spread-card-${card.visualId}`}
              initial={{ opacity: 0, y: 18, scale: 0.94 }}
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
                  cardArtId={cardArtId}
                  positionLabel={label}
                  ariaLabel={revealed ? undefined : `${label}, face-down`}
                  showFrontCaption={false}
                  className={cardSizeClass}
                  onClick={canReveal ? () => onReveal(card.visualId) : undefined}
                />
              </motion.div>
              <p className="max-w-[11rem] truncate font-sans text-[10px] uppercase tracking-[0.18em] text-[#d8c7a6]/78 sm:text-[11px] sm:tracking-[0.22em]">
                {revealed ? card.name : label}
              </p>
            </motion.div>
          );
        })}
      </div>

      {allRevealed && (
        <button
          type="button"
          onClick={onContinue}
          className="relative z-10 mt-10 rounded-full border border-[#e4c174]/58 bg-[#e4c174]/10 px-7 py-3.5 font-sans text-xs uppercase tracking-[0.22em] text-[#ffe8aa] shadow-[0_12px_30px_rgba(0,0,0,0.35)] transition-colors hover:bg-[#e4c174]/16"
        >
          Read my Hint
        </button>
      )}
    </section>
  );
}
