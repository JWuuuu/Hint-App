import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { RitualCard } from "../logic/createHiddenDeck";
import type { TarotCardArtId } from "../logic/cardImageMap";
import type { TarotCardBackId, TarotCardBackStyle } from "../logic/cardBacks";
import type { SpreadChoice } from "../../hold/useHoldFlow";
import { TarotCardVisual } from "./TarotCardVisual";
import type { WashRitualTheme } from "./CardWashRitual";
import { getSpreadPositionLabel } from "../logic/spreadLabels";

const REVEAL_EASE = [0.18, 0.78, 0.18, 1] as const;

type ReadingRevealProps = {
  selectedCards: RitualCard[];
  revealedIds: readonly string[];
  spread: SpreadChoice;
  backStyle?: TarotCardBackStyle;
  cardBackId?: TarotCardBackId;
  cardArtId?: TarotCardArtId;
  theme?: Pick<WashRitualTheme, "chamberOverlay" | "starClassName" | "tableRingColor" | "secondaryRingColor">;
  autoReveal?: boolean;
  onContinue?: () => void;
  onReveal: (visualId: string) => void;
  onRestart: () => void;
};

export function ReadingReveal({
  selectedCards,
  revealedIds,
  spread,
  backStyle = "nocturne",
  cardBackId,
  cardArtId = "original",
  theme,
  autoReveal = false,
  onContinue,
  onReveal,
}: ReadingRevealProps) {
  const reducedMotion = useReducedMotion();
  const [readyToReveal, setReadyToReveal] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const sequenceStartedRef = useRef("");
  const onRevealRef = useRef(onReveal);
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
  const pageOverlay = theme?.chamberOverlay ?? "var(--hint-page-bg)";
  const starClassName = theme?.starClassName ?? "";
  const safeActiveIndex = Math.min(
    Math.max(activeIndex, 0),
    Math.max(selectedCards.length - 1, 0),
  );
  const activeCard = selectedCards[safeActiveIndex];
  const activeRevealed = activeCard
    ? revealedIds.includes(activeCard.visualId)
    : false;
  const activeLabel = activeCard
    ? getSpreadPositionLabel(spread, safeActiveIndex)
    : "";
  const nextUnrevealedIndex = selectedCards.findIndex(
    (card) => !revealedIds.includes(card.visualId),
  );
  const nextIndex =
    nextUnrevealedIndex >= 0 ? nextUnrevealedIndex : safeActiveIndex;
  const revealTextColor = theme ? "#fff0df" : "var(--hint-text)";
  const revealMutedColor = theme
    ? "rgba(244,222,229,0.82)"
    : "var(--hint-muted)";
  const revealLabelColor = theme
    ? "rgba(255,240,223,0.78)"
    : "var(--hint-muted)";
  const revealPillBackground = theme
    ? "rgba(255,244,250,0.13)"
    : "transparent";
  const revealPillBorder = theme
    ? "rgba(255,244,250,0.18)"
    : "var(--hint-border)";

  useEffect(() => {
    onRevealRef.current = onReveal;
  }, [onReveal]);

  useEffect(() => {
    setReadyToReveal(false);
    sequenceStartedRef.current = "";
    setActiveIndex(0);
    const timer = window.setTimeout(
      () => setReadyToReveal(true),
      reducedMotion ? 80 : 460,
    );
    return () => window.clearTimeout(timer);
  }, [reducedMotion, sequenceKey]);

  useEffect(() => {
    let latestRevealedIndex = -1;
    selectedCards.forEach((card, index) => {
      if (revealedIds.includes(card.visualId)) latestRevealedIndex = index;
    });

    if (!allRevealed && latestRevealedIndex >= 0) {
      setActiveIndex(Math.min(latestRevealedIndex + 1, selectedCards.length - 1));
      return;
    }

    if (latestRevealedIndex >= 0) {
      setActiveIndex(latestRevealedIndex);
    }
  }, [allRevealed, revealedIds, selectedCards]);

  useEffect(() => {
    if (!autoReveal || !readyToReveal || sequenceStartedRef.current === sequenceKey) return;
    sequenceStartedRef.current = sequenceKey;
    const timers = selectedCards.map((card, index) =>
      window.setTimeout(
        () => onRevealRef.current(card.visualId),
        reducedMotion ? 40 + index * 90 : 240 + index * 390,
      ),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [autoReveal, readyToReveal, reducedMotion, selectedCards, sequenceKey]);

  return (
    <motion.section
      className="relative flex h-full w-full flex-col overflow-hidden px-4 pb-[calc(var(--hint-safe-bottom)+1.1rem)] pt-6 text-center"
      initial={reducedMotion ? false : { opacity: 0.96 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.48, ease: REVEAL_EASE }}
    >
      <div className="absolute inset-0" style={{ background: pageOverlay }} />
      <div className={`pointer-events-none absolute inset-0 ${starClassName}`} />
      <div className="pointer-events-none absolute inset-x-0 top-[18%] mx-auto h-[58%] max-w-5xl rounded-full blur-3xl" style={{ background: "color-mix(in srgb, var(--hint-rose, #f0b6cf) 12%, transparent)" }} />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[45%] h-[410px] w-[410px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
        style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--hint-aqua, #9dded9) 15%, transparent), transparent 60%)" }}
        animate={
          reducedMotion
            ? { opacity: allRevealed ? 0.28 : 0.22, scale: 1 }
            : { opacity: allRevealed ? 0.32 : [0.18, 0.42, 0.18], scale: allRevealed ? 1.02 : [0.88, 1.08, 0.88] }
        }
        transition={{ duration: 5.6, repeat: reducedMotion || allRevealed ? 0 : Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[45%] h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full border"
        style={{ borderColor: "color-mix(in srgb, var(--hint-gold, #dcc383) 18%, transparent)" }}
        animate={reducedMotion ? { opacity: 0.24, scale: 1 } : { opacity: [0.16, 0.46, 0.16], scale: [0.9, 1.16, 0.9] }}
        transition={{ duration: 6.2, repeat: reducedMotion ? 0 : Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[45%] h-[180px] w-[180px] -translate-x-1/2 -translate-y-1/2 rounded-full border"
        style={{ borderColor: "color-mix(in srgb, var(--hint-aqua, #9dded9) 15%, transparent)" }}
        animate={reducedMotion ? { opacity: 0.18, scale: 1 } : { opacity: [0.12, 0.38, 0.12], scale: [1.08, 0.92, 1.08] }}
        transition={{ duration: 5.4, repeat: reducedMotion ? 0 : Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="relative z-30 mx-auto w-full max-w-[22rem] shrink-0"
        initial={reducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.52, ease: REVEAL_EASE }}
      >
        <p
          className="font-serif text-[24px] leading-tight"
          style={{
            color: revealTextColor,
            textShadow: theme ? "0 12px 30px rgba(0,0,0,0.34)" : undefined,
          }}
        >
          {title}
        </p>
        <p
          className="mt-2 font-sans text-[12.5px] leading-snug"
          style={{ color: revealMutedColor }}
        >
          {subtitle}
        </p>
        <div
          className="hint-status-pill mx-auto mt-3 flex w-fit flex-wrap items-center justify-center gap-2 rounded-full border px-3 py-2 font-sans text-[10px] uppercase tracking-[0.14em] backdrop-blur-md"
          style={{
            background: revealPillBackground,
            borderColor: revealPillBorder,
            color: revealLabelColor,
          }}
        >
          <span style={{ color: "var(--hint-gold)" }}>
            {allRevealed ? "Spread revealed" : autoReveal ? "Opening sequence" : "Manual reveal"}
          </span>
          <span className="h-1 w-1 rounded-full" style={{ background: "var(--hint-aqua)" }} />
          <span>{revealedIds.length} / {selectedCards.length}</span>
        </div>
        <div className="mx-auto mt-3 h-1 w-full max-w-[17rem] overflow-hidden rounded-full" style={{ background: "color-mix(in srgb, var(--hint-border) 62%, transparent)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, var(--hint-aqua), var(--hint-rose), var(--hint-gold))", boxShadow: "0 0 18px color-mix(in srgb, var(--hint-gold) 22%, transparent)" }}
            initial={{ width: "0%" }}
            animate={{ width: `${Math.round(revealProgress * 100)}%` }}
            transition={{ duration: reducedMotion ? 0 : 0.64, ease: REVEAL_EASE }}
          />
        </div>
      </motion.div>

      <div className="relative z-20 mx-auto mt-4 flex min-h-0 w-full max-w-[22rem] flex-1 flex-col items-center">
        {activeCard ? (
          <motion.div
            key={activeCard.visualId}
            className="flex min-h-0 w-full flex-1 flex-col items-center justify-center"
            initial={reducedMotion ? false : { opacity: 0, y: 18, scale: 0.965 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: reducedMotion ? 0 : 0.54, ease: REVEAL_EASE }}
          >
            <button
              type="button"
              disabled={autoReveal || activeRevealed || !readyToReveal}
              onClick={() => onReveal(activeCard.visualId)}
              className={`group relative grid place-items-center rounded-[28px] border border-white/14 bg-white/8 px-6 py-5 shadow-[0_22px_58px_rgba(0,0,0,0.18)] backdrop-blur-sm transition active:scale-[0.985] ${
                activeRevealed || autoReveal || !readyToReveal
                  ? "cursor-default"
                  : "cursor-pointer"
              }`}
              aria-label={
                activeRevealed
                  ? `${activeLabel}, ${activeCard.name}`
                  : `Reveal ${activeLabel}`
              }
            >
              <motion.div
                className="pointer-events-none absolute -inset-7 rounded-[34px] blur-2xl"
                style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--hint-gold) 24%, transparent), color-mix(in srgb, var(--hint-aqua) 9%, transparent) 45%, transparent 72%)" }}
                animate={{
                  opacity: activeRevealed ? 0.82 : [0.26, 0.58, 0.26],
                  scale: activeRevealed ? 1.04 : [0.9, 1.03, 0.9],
                }}
                transition={{ duration: 2.6, repeat: reducedMotion || activeRevealed ? 0 : Infinity, ease: "easeInOut" }}
              />
              <TarotCardVisual
                card={activeCard}
                faceDown={!activeRevealed}
                revealed={activeRevealed}
                active={!activeRevealed}
                backStyle={backStyle}
                cardBackId={cardBackId}
                cardArtId={cardArtId}
                positionLabel={activeLabel}
                ariaLabel={activeRevealed ? undefined : `${activeLabel}, face-down`}
                showFrontCaption={false}
                className="!h-[254px] !w-[156px]"
              />
            </button>

            <div className="mt-4 grid justify-items-center gap-1.5">
              <p
                className="hint-status-pill max-w-[17rem] truncate rounded-full border px-3 py-1.5 font-sans text-[10px] uppercase tracking-[0.14em]"
                style={{
                  background: revealPillBackground,
                  borderColor: revealPillBorder,
                  color: revealLabelColor,
                }}
              >
                {safeActiveIndex + 1} / {selectedCards.length} · {activeLabel}
              </p>
              <p
                className="max-w-[19rem] truncate font-serif text-[21px] leading-tight"
                style={{
                  color: revealTextColor,
                  textShadow: theme
                    ? "0 10px 24px rgba(0,0,0,0.32)"
                    : undefined,
                }}
              >
                {activeRevealed ? activeCard.name : "Tap to reveal"}
              </p>
            </div>
          </motion.div>
        ) : null}

        <div className="mt-4 w-full shrink-0">
          <div className="flex items-center justify-between px-1">
            <p
              className="text-[9px] font-black uppercase tracking-[0.16em]"
              style={{ color: revealLabelColor }}
            >
              Spread cards
            </p>
            <p
              className="text-[9px] font-black uppercase tracking-[0.16em]"
              style={{ color: revealLabelColor }}
            >
              {selectedCards.length} total
            </p>
          </div>
          <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto overscroll-x-contain pb-1">
            {selectedCards.map((card, index) => {
              const revealed = revealedIds.includes(card.visualId);
              const active = index === safeActiveIndex;
              const label = getSpreadPositionLabel(spread, index);
              const queued = !revealed && index === nextIndex;

              return (
                <button
                  key={card.visualId}
                  type="button"
                  onClick={() => {
                    setActiveIndex(index);
                    if (!autoReveal && !revealed && readyToReveal) {
                      onReveal(card.visualId);
                    }
                  }}
                  className={`relative grid w-[4.3rem] shrink-0 justify-items-center gap-1 rounded-[18px] border px-2 py-2 text-center transition active:scale-[0.97] ${
                    active
                      ? "border-[#f1d390]/70 bg-white/18"
                      : "border-white/14 bg-white/7"
                  }`}
                  style={{
                    boxShadow: active
                      ? "0 12px 30px rgba(0,0,0,0.20), 0 0 24px rgba(241,211,144,0.16)"
                      : undefined,
                  }}
                >
                  {queued ? (
                    <span className="absolute -right-0.5 -top-0.5 z-10 h-2.5 w-2.5 rounded-full bg-[#ffe0a3] shadow-[0_0_12px_rgba(255,224,163,0.62)]" />
                  ) : null}
                  <TarotCardVisual
                    card={card}
                    faceDown={!revealed}
                    revealed={revealed}
                    active={!revealed}
                    backStyle={backStyle}
                    cardBackId={cardBackId}
                    cardArtId={cardArtId}
                    positionLabel={label}
                    ariaLabel={revealed ? undefined : `${label}, face-down`}
                    showFrontCaption={false}
                    className="!h-[78px] !w-[48px]"
                  />
                  <span
                    className="max-w-[3.75rem] truncate text-[8px] font-black uppercase tracking-[0.1em]"
                    style={{ color: revealLabelColor }}
                  >
                    {index + 1}. {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {allRevealed && (
        <motion.div
          className="pointer-events-none absolute inset-x-4 bottom-[calc(var(--hint-safe-bottom)+0.7rem)] z-40 flex justify-center"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: reducedMotion ? 0 : 0.46, ease: REVEAL_EASE }}
          >
          <button
            type="button"
            onClick={onContinue}
            className="hint-soft-button hint-tap-sparkle pointer-events-auto rounded-full px-7 py-3.5 font-sans text-xs uppercase tracking-[0.18em] shadow-[0_18px_46px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-[background,transform] hover:scale-[1.02]"
          >
            Read my Hint
          </button>
        </motion.div>
      )}
    </motion.section>
  );
}
