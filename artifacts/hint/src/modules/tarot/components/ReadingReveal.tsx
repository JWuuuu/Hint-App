import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { RitualCard } from "../logic/createHiddenDeck";
import type { TarotCardArtId } from "../logic/cardImageMap";
import type { SpreadChoice } from "../../hold/useHoldFlow";
import { TarotCardVisual } from "./TarotCardVisual";
import type { TarotCardBackStyle } from "./TarotCardVisual";
import { getSpreadPositionLabel } from "../logic/spreadLabels";

type ReadingRevealProps = {
  selectedCards: RitualCard[];
  revealedIds: readonly string[];
  spread: SpreadChoice;
  backStyle?: TarotCardBackStyle;
  cardArtId?: TarotCardArtId;
  autoReveal?: boolean;
  onContinue?: () => void;
  onReveal: (visualId: string) => void;
  onRestart: () => void;
};

function revealGridClass(count: number) {
  if (count === 1) return "grid-cols-1 max-w-sm";
  if (count === 2) return "grid-cols-1 min-[520px]:grid-cols-2 max-w-2xl";
  if (count === 3) return "grid-cols-1 min-[520px]:grid-cols-3 max-w-3xl";
  if (count <= 5) return "grid-cols-2 min-[520px]:grid-cols-3 sm:grid-cols-5 max-w-5xl";
  return "grid-cols-2 min-[520px]:grid-cols-4 lg:grid-cols-7 max-w-6xl";
}

function revealCardSizeClass(count: number) {
  if (count === 1) return "";
  if (count === 2) return "!h-[202px] !w-[124px] sm:!h-[256px] sm:!w-[156px] md:!h-[288px] md:!w-[176px]";
  if (count === 3) return "!h-[172px] !w-[106px] min-[520px]:!h-[164px] min-[520px]:!w-[100px] sm:!h-[236px] sm:!w-[144px] md:!h-[276px] md:!w-[168px]";
  if (count <= 5) return "!h-[142px] !w-[88px] sm:!h-[216px] sm:!w-[132px] md:!h-[250px] md:!w-[152px]";
  return "!h-[126px] !w-[78px] sm:!h-[184px] sm:!w-[114px] md:!h-[214px] md:!w-[130px]";
}

function revealCardShellClass(count: number) {
  if (count === 1) return "h-[218px] w-[132px] sm:h-[264px] sm:w-[160px] md:h-[294px] md:w-[178px]";
  if (count === 2) return "h-[202px] w-[124px] sm:h-[256px] sm:w-[156px] md:h-[288px] md:w-[176px]";
  if (count === 3) return "h-[172px] w-[106px] min-[520px]:h-[164px] min-[520px]:w-[100px] sm:h-[236px] sm:w-[144px] md:h-[276px] md:w-[168px]";
  if (count <= 5) return "h-[142px] w-[88px] sm:h-[216px] sm:w-[132px] md:h-[250px] md:w-[152px]";
  return "h-[126px] w-[78px] sm:h-[184px] sm:w-[114px] md:h-[214px] md:w-[130px]";
}

export function ReadingReveal({
  selectedCards,
  revealedIds,
  spread,
  backStyle = "nocturne",
  cardArtId = "original",
  autoReveal = false,
  onContinue,
  onReveal,
}: ReadingRevealProps) {
  const [readyToReveal, setReadyToReveal] = useState(false);
  const sequenceStartedRef = useRef("");
  const allRevealed = selectedCards.every((card) => revealedIds.includes(card.visualId));
  const oneCard = selectedCards.length === 1;
  const revealProgress = selectedCards.length === 0 ? 0 : revealedIds.length / selectedCards.length;
  const sequenceKey = useMemo(
    () => selectedCards.map((card) => card.visualId).join("|"),
    [selectedCards],
  );
  const title = allRevealed
    ? "The cards are open."
    : autoReveal
      ? "The cards are opening."
      : "These are the cards that came through.";
  const subtitle = allRevealed
    ? "Read what they are pointing toward."
    : autoReveal
      ? "Let the spread reveal itself in the order you selected."
      : oneCard
      ? `Turn ${getSpreadPositionLabel(spread, 0)} when you are ready.`
      : "Turn each card when you are ready.";
  const gridClass = revealGridClass(selectedCards.length);
  const cardSizeClass = revealCardSizeClass(selectedCards.length);
  const cardShellClass = revealCardShellClass(selectedCards.length);

  useEffect(() => {
    setReadyToReveal(false);
    sequenceStartedRef.current = "";
    const timer = window.setTimeout(() => setReadyToReveal(true), 760);
    return () => window.clearTimeout(timer);
  }, [sequenceKey]);

  useEffect(() => {
    if (!autoReveal || !readyToReveal || sequenceStartedRef.current === sequenceKey) return;
    sequenceStartedRef.current = sequenceKey;
    const timers = selectedCards.map((card, index) =>
      window.setTimeout(() => onReveal(card.visualId), 220 + index * 430),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [autoReveal, onReveal, readyToReveal, selectedCards, sequenceKey]);

  return (
    <section className="relative h-full w-full overflow-y-auto overflow-x-hidden px-4 py-10 text-center sm:py-12">
      <div className="absolute inset-0" style={{ background: "var(--hint-page-bg)" }} />
      <div className="pointer-events-none absolute inset-x-0 top-[18%] mx-auto h-[58%] max-w-5xl rounded-full blur-3xl" style={{ background: "color-mix(in srgb, var(--hint-rose, #f0b6cf) 12%, transparent)" }} />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[45%] h-[410px] w-[410px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
        style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--hint-aqua, #9dded9) 15%, transparent), transparent 60%)" }}
        animate={{ opacity: allRevealed ? 0.32 : [0.18, 0.42, 0.18], scale: allRevealed ? 1.02 : [0.88, 1.08, 0.88] }}
        transition={{ duration: 5.6, repeat: allRevealed ? 0 : Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[45%] h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full border"
        style={{ borderColor: "color-mix(in srgb, var(--hint-gold, #dcc383) 18%, transparent)" }}
        animate={{ opacity: [0.16, 0.46, 0.16], scale: [0.9, 1.16, 0.9] }}
        transition={{ duration: 6.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[45%] h-[180px] w-[180px] -translate-x-1/2 -translate-y-1/2 rounded-full border"
        style={{ borderColor: "color-mix(in srgb, var(--hint-aqua, #9dded9) 15%, transparent)" }}
        animate={{ opacity: [0.12, 0.38, 0.12], scale: [1.08, 0.92, 1.08] }}
        transition={{ duration: 5.4, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-30 mx-auto mb-8 max-w-3xl sm:mb-10">
        <p className="font-serif text-[30px] leading-tight sm:text-5xl" style={{ color: "var(--hint-text)" }}>{title}</p>
        <p className="mt-3 font-sans text-sm sm:text-[15px]" style={{ color: "var(--hint-muted)" }}>{subtitle}</p>
        <div className="hint-status-pill mx-auto mt-4 flex w-fit flex-wrap items-center justify-center gap-2 rounded-full border px-3 py-2 font-sans text-[10px] uppercase tracking-[0.14em] backdrop-blur-md">
          <span style={{ color: "var(--hint-gold)" }}>
            {allRevealed ? "Spread revealed" : autoReveal ? "Opening sequence" : "Manual reveal"}
          </span>
          <span className="h-1 w-1 rounded-full" style={{ background: "var(--hint-aqua)" }} />
          <span>{revealedIds.length} / {selectedCards.length}</span>
        </div>
        <div className="mx-auto mt-3 h-1 w-full max-w-[18rem] overflow-hidden rounded-full" style={{ background: "color-mix(in srgb, var(--hint-border) 62%, transparent)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, var(--hint-aqua), var(--hint-rose), var(--hint-gold))", boxShadow: "0 0 18px color-mix(in srgb, var(--hint-gold) 22%, transparent)" }}
            initial={{ width: "0%" }}
            animate={{ width: `${Math.round(revealProgress * 100)}%` }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          />
        </div>
      </div>

      <div className={`relative z-10 mx-auto grid w-full ${gridClass} place-items-center gap-x-3 gap-y-6 sm:gap-x-5 sm:gap-y-7`}>
        {selectedCards.map((card, index) => {
          const revealed = revealedIds.includes(card.visualId);
          const label = getSpreadPositionLabel(spread, index);
          const canReveal = !autoReveal && !revealed && readyToReveal;
          const isNextAutoCard = autoReveal && !revealed && revealedIds.length === index;
          return (
            <motion.div
              key={card.visualId}
              layoutId={`spread-card-${card.visualId}`}
              initial={{ opacity: 0, y: 18, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.08, type: "spring", stiffness: 165, damping: 23 }}
              className={`relative grid justify-items-center gap-4 text-center ${canReveal ? "cursor-pointer" : ""}`}
              onClick={canReveal ? () => onReveal(card.visualId) : undefined}
            >
              <motion.div
                animate={{
                  y: revealed ? [0, -10, 0] : 0,
                  scale: revealed ? [1, 1.035, 1] : 1,
                }}
                transition={{ duration: 0.92, ease: [0.2, 0.74, 0.18, 1] }}
                className={`relative grid place-items-center ${cardShellClass}`}
              >
                <motion.div
                  className="pointer-events-none absolute -inset-6 rounded-[24px] blur-2xl"
                  style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--hint-gold) 24%, transparent), color-mix(in srgb, var(--hint-aqua) 9%, transparent) 45%, transparent 72%)" }}
                  animate={{
                    opacity: revealed ? 0.82 : isNextAutoCard ? [0.28, 0.7, 0.28] : 0.24,
                    scale: revealed ? 1.08 : isNextAutoCard ? [0.86, 1.04, 0.86] : 0.86,
                  }}
                  transition={{ duration: 0.92, ease: [0.2, 0.74, 0.18, 1] }}
                />
                {!revealed && (canReveal || isNextAutoCard) && (
                  <motion.div
                    aria-hidden
                    className="pointer-events-none absolute -inset-3 rounded-[18px] border"
                    style={{ borderColor: "color-mix(in srgb, var(--hint-gold) 30%, transparent)" }}
                    animate={{ opacity: [0.22, 0.62, 0.22], scale: [0.96, 1.05, 0.96] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
                {revealed && (
                  <motion.div
                    aria-hidden
                    className="pointer-events-none absolute -inset-5 rounded-[22px] border"
                    style={{ borderColor: "color-mix(in srgb, var(--hint-aqua) 24%, transparent)" }}
                    initial={{ opacity: 0.7, scale: 0.78 }}
                    animate={{ opacity: 0, scale: 1.28 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                  />
                )}
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
                />
              </motion.div>
              <p className="max-w-[11rem] truncate font-sans text-[10px] uppercase tracking-[0.18em] sm:text-[11px] sm:tracking-[0.22em]" style={{ color: "var(--hint-muted)" }}>
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
          className="hint-soft-button hint-tap-sparkle relative z-10 mt-10 rounded-full px-7 py-3.5 font-sans text-xs uppercase tracking-[0.18em] transition-[background,transform] hover:scale-[1.02]"
        >
          Read my Hint
        </button>
      )}
    </section>
  );
}
