import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { RitualCard } from "../logic/createHiddenDeck";
import type { TarotCardArtId } from "../logic/cardImageMap";
import type { TarotCardBackId, TarotCardBackStyle } from "../logic/cardBacks";
import type { SpreadChoice } from "../../hold/useHoldFlow";
import { TarotCardVisual } from "./TarotCardVisual";
import type { WashRitualTheme } from "./CardWashRitual";
import { getSpreadPositionLabel } from "../logic/spreadLabels";

const REVEAL_EASE = [0.18, 0.78, 0.18, 1] as const;
const AUTO_REVEAL_INITIAL_DELAY_MS = 520;
const AUTO_REVEAL_CARD_INTERVAL_MS = 1650;
const AUTO_REVEAL_ADVANCE_DELAY_MS = 1180;
const MANUAL_REVEAL_ADVANCE_DELAY_MS = 560;

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
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const thumbnailRef = useRef<HTMLDivElement | null>(null);
  const carouselSyncFrameRef = useRef<number | null>(null);
  const carouselLockTimerRef = useRef<number | null>(null);
  const carouselTargetIndexRef = useRef<number | null>(null);
  const sequenceStartedRef = useRef("");
  const onRevealRef = useRef(onReveal);
  const allRevealed =
    selectedCards.length > 0 &&
    selectedCards.every((card) => revealedIds.includes(card.visualId));
  const oneCard = selectedCards.length === 1;
  const revealProgress = selectedCards.length === 0 ? 0 : revealedIds.length / selectedCards.length;
  const sequenceKey = useMemo(
    () => selectedCards.map((card) => card.visualId).join("|"),
    [selectedCards],
  );
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
    : oneCard
      ? getSpreadPositionLabel(spread, 0)
      : "";
  const title = allRevealed
    ? "Your spread is open."
    : autoReveal
      ? "Opening the spread."
      : activeRevealed
        ? "Card is open."
        : "Let the card turn.";
  const subtitle = allRevealed
    ? "Your full reading is ready."
    : autoReveal
      ? `${activeLabel || "The next card"} is coming into focus.`
      : activeCard
        ? `${activeLabel} - ${activeRevealed ? activeCard.name : "tap the center card when you are ready."}`
        : "The spread is preparing.";
  const modeLabel = allRevealed ? "Ready to read" : autoReveal ? "Opening" : "Reveal";
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

  useEffect(
    () => () => {
      if (carouselSyncFrameRef.current !== null) {
        window.cancelAnimationFrame(carouselSyncFrameRef.current);
      }
      if (carouselLockTimerRef.current !== null) {
        window.clearTimeout(carouselLockTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    setReadyToReveal(false);
    sequenceStartedRef.current = "";
    setActiveIndex(0);
    const timer = window.setTimeout(
      () => setReadyToReveal(true),
      reducedMotion ? 80 : 360,
    );
    return () => window.clearTimeout(timer);
  }, [reducedMotion, sequenceKey]);

  useEffect(() => {
    let latestRevealedIndex = -1;
    selectedCards.forEach((card, index) => {
      if (revealedIds.includes(card.visualId)) latestRevealedIndex = index;
    });

    let advanceTimer: number | undefined;

    if (!allRevealed && latestRevealedIndex >= 0) {
      const nextIndexAfterReveal = Math.min(
        latestRevealedIndex + 1,
        selectedCards.length - 1,
      );
      advanceTimer = window.setTimeout(
        () => setActiveIndex(nextIndexAfterReveal),
        reducedMotion
          ? 0
          : autoReveal
            ? AUTO_REVEAL_ADVANCE_DELAY_MS
            : MANUAL_REVEAL_ADVANCE_DELAY_MS,
      );
      return () => {
        if (advanceTimer !== undefined) window.clearTimeout(advanceTimer);
      };
    }

    if (latestRevealedIndex >= 0) {
      setActiveIndex(latestRevealedIndex);
    }

    return undefined;
  }, [allRevealed, autoReveal, reducedMotion, revealedIds, selectedCards]);

  useEffect(() => {
    if (!autoReveal || !readyToReveal || sequenceStartedRef.current === sequenceKey) return;
    sequenceStartedRef.current = sequenceKey;
    const timers = selectedCards.map((card, index) =>
      window.setTimeout(
        () => onRevealRef.current(card.visualId),
        reducedMotion
          ? 40 + index * 90
          : AUTO_REVEAL_INITIAL_DELAY_MS + index * AUTO_REVEAL_CARD_INTERVAL_MS,
      ),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [autoReveal, readyToReveal, reducedMotion, selectedCards, sequenceKey]);

  useEffect(() => {
    const track = carouselRef.current;
    if (!track || selectedCards.length === 0) return;
    const target = track.querySelector<HTMLElement>(
      `[data-reveal-card-index="${safeActiveIndex}"]`,
    );
    if (!target) return;

    const nextLeft = Math.max(
      0,
      target.offsetLeft - (track.clientWidth - target.clientWidth) / 2,
    );
    carouselTargetIndexRef.current = safeActiveIndex;
    track.scrollTo({
      left: nextLeft,
      behavior: reducedMotion ? "auto" : "smooth",
    });

    if (carouselLockTimerRef.current !== null) {
      window.clearTimeout(carouselLockTimerRef.current);
    }
    carouselLockTimerRef.current = window.setTimeout(
      () => {
        carouselTargetIndexRef.current = null;
        carouselLockTimerRef.current = null;
      },
      reducedMotion ? 60 : 540,
    );
  }, [reducedMotion, safeActiveIndex, selectedCards.length]);

  useEffect(() => {
    const rail = thumbnailRef.current;
    if (!rail || selectedCards.length === 0) return;
    const target = rail.querySelector<HTMLElement>(
      `[data-reveal-thumb-index="${safeActiveIndex}"]`,
    );
    if (!target) return;

    const nextLeft = Math.max(
      0,
      target.offsetLeft - (rail.clientWidth - target.clientWidth) / 2,
    );
    rail.scrollTo({
      left: nextLeft,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }, [reducedMotion, safeActiveIndex, selectedCards.length]);

  function syncActiveIndexFromCarousel() {
    if (carouselTargetIndexRef.current !== null) return;
    const track = carouselRef.current;
    if (!track) return;
    if (carouselSyncFrameRef.current !== null) {
      window.cancelAnimationFrame(carouselSyncFrameRef.current);
    }
    carouselSyncFrameRef.current = window.requestAnimationFrame(() => {
      carouselSyncFrameRef.current = null;
      const cards = Array.from(
        track.querySelectorAll<HTMLElement>("[data-reveal-card-index]"),
      );
      const center = track.scrollLeft + track.clientWidth / 2;
      let closestIndex = safeActiveIndex;
      let closestDistance = Number.POSITIVE_INFINITY;

      cards.forEach((card) => {
        const index = Number(card.dataset.revealCardIndex ?? 0);
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const distance = Math.abs(cardCenter - center);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setActiveIndex((current) =>
        current === closestIndex ? current : closestIndex,
      );
    });
  }

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
        className="relative z-30 mx-auto w-full max-w-[22rem] shrink-0 rounded-[28px] border border-white/14 bg-white/[0.075] p-4 text-left shadow-[0_18px_54px_rgba(0,0,0,0.12)] backdrop-blur-md"
        initial={reducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.52, ease: REVEAL_EASE }}
      >
        <div className="flex items-center justify-between gap-3">
          <p
            className="text-[10px] font-black uppercase tracking-[0.18em]"
            style={{ color: revealLabelColor }}
          >
            {modeLabel}
          </p>
          <span
            className="rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]"
            style={{
              background: revealPillBackground,
              borderColor: revealPillBorder,
              color: revealLabelColor,
            }}
          >
            {revealedIds.length} / {selectedCards.length}
          </span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${title}-${safeActiveIndex}-${activeRevealed}`}
            initial={reducedMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: reducedMotion ? 0 : 0.28, ease: REVEAL_EASE }}
          >
            <p
              className="mt-2 font-serif text-[25px] leading-tight"
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
          </motion.div>
        </AnimatePresence>
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full" style={{ background: "color-mix(in srgb, var(--hint-border) 62%, transparent)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, var(--hint-aqua), var(--hint-rose), var(--hint-gold))", boxShadow: "0 0 18px color-mix(in srgb, var(--hint-gold) 22%, transparent)" }}
            initial={{ width: "0%" }}
            animate={{ width: `${Math.round(revealProgress * 100)}%` }}
            transition={{ duration: reducedMotion ? 0 : 0.72, ease: REVEAL_EASE }}
          />
        </div>
      </motion.div>

      <div className="relative z-20 mx-auto mt-4 flex min-h-0 w-full max-w-[22rem] flex-1 flex-col items-center">
        <div className="relative min-h-0 w-full flex-1">
          <div
            ref={carouselRef}
            className="no-scrollbar flex h-full min-h-0 w-full snap-x snap-mandatory touch-pan-x scroll-smooth overflow-x-auto overscroll-x-contain [scrollbar-width:none]"
            onScroll={syncActiveIndexFromCarousel}
            aria-label="Revealed tarot cards"
          >
            {selectedCards.map((card, index) => {
              const revealed = revealedIds.includes(card.visualId);
              const active = index === safeActiveIndex;
              const label = getSpreadPositionLabel(spread, index);
              const canReveal = !autoReveal && !revealed && readyToReveal;

              return (
                <motion.div
                  key={card.visualId}
                  data-reveal-card-index={index}
                  className="flex min-w-full snap-center flex-col items-center justify-center px-2"
                  style={{ scrollSnapStop: "always" }}
                  initial={
                    reducedMotion
                      ? false
                      : { opacity: 0, y: 22, scale: 0.94, rotate: index % 2 === 0 ? -1.6 : 1.6 }
                  }
                  animate={{
                    opacity: active ? 1 : 0.46,
                    y: 0,
                    scale: active ? 1 : 0.91,
                    rotate: active ? 0 : index < safeActiveIndex ? -1.8 : 1.8,
                  }}
                  transition={{
                    duration: reducedMotion ? 0 : 0.54,
                    delay: reducedMotion ? 0 : Math.min(index, 4) * 0.035,
                    ease: REVEAL_EASE,
                  }}
                >
                  <motion.div
                    className="relative grid place-items-center rounded-[38px] border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.06))] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.22)] backdrop-blur-md"
                    animate={{
                      boxShadow: active
                        ? "0 28px 76px rgba(0,0,0,0.25), 0 0 38px color-mix(in srgb, var(--hint-gold) 16%, transparent)"
                        : "0 18px 44px rgba(0,0,0,0.14)",
                    }}
                    transition={{ duration: reducedMotion ? 0 : 0.42, ease: REVEAL_EASE }}
                  >
                    <motion.div
                      className="pointer-events-none absolute -inset-7 rounded-[34px] blur-2xl"
                      style={{
                        background:
                          "radial-gradient(circle, color-mix(in srgb, var(--hint-gold) 24%, transparent), color-mix(in srgb, var(--hint-aqua) 9%, transparent) 45%, transparent 72%)",
                      }}
                      animate={{
                        opacity: active
                          ? revealed
                            ? 0.82
                            : [0.26, 0.58, 0.26]
                          : 0.16,
                        scale: active
                          ? revealed
                            ? 1.04
                            : [0.9, 1.03, 0.9]
                          : 0.92,
                      }}
                      transition={{
                        duration: 2.6,
                        repeat: reducedMotion || revealed || !active ? 0 : Infinity,
                        ease: "easeInOut",
                      }}
                    />
                    <button
                      type="button"
                      disabled={!canReveal}
                      onClick={() => {
                        if (canReveal) onReveal(card.visualId);
                      }}
                      tabIndex={active ? 0 : -1}
                      className={`group relative grid place-items-center rounded-[30px] border border-white/16 bg-white/8 px-4 py-4 shadow-[0_18px_48px_rgba(0,0,0,0.16)] backdrop-blur-sm transition active:scale-[0.985] ${
                        canReveal ? "cursor-pointer" : "cursor-default"
                      }`}
                      aria-label={
                        revealed ? `${label}, ${card.name}` : `Reveal ${label}`
                      }
                    >
                      <motion.div
                        layoutId={`pick-card-${card.visualId}`}
                        transition={{
                          type: "spring",
                          stiffness: 130,
                          damping: 20,
                          mass: 0.85,
                        }}
                      >
                        <TarotCardVisual
                          card={card}
                          faceDown={!revealed}
                          revealed={revealed}
                          active={!revealed && active}
                          backStyle={backStyle}
                          cardBackId={cardBackId}
                          cardArtId={cardArtId}
                          positionLabel={label}
                          ariaLabel={revealed ? undefined : `${label}, face-down`}
                          showFrontCaption={false}
                          className="!h-[266px] !w-[164px]"
                        />
                      </motion.div>
                      <AnimatePresence>
                        {active && !revealed && !autoReveal && readyToReveal ? (
                          <motion.span
                            className="pointer-events-none absolute bottom-3 rounded-full bg-[#fff8ec]/92 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#3c3047] shadow-[0_8px_22px_rgba(0,0,0,0.18)]"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            transition={{ duration: 0.24 }}
                          >
                            Tap to open
                          </motion.span>
                        ) : null}
                      </AnimatePresence>
                    </button>
                  </motion.div>

                  <div className="mt-3 grid min-h-[54px] justify-items-center gap-1">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`${card.visualId}-${revealed ? "open" : "closed"}-${active ? "active" : "idle"}`}
                        className="grid justify-items-center gap-1"
                        initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
                        transition={{ duration: reducedMotion ? 0 : 0.26, ease: REVEAL_EASE }}
                      >
                        <p
                          className="hint-status-pill max-w-[17rem] truncate rounded-full border px-3 py-1.5 font-sans text-[10px] uppercase tracking-[0.14em]"
                          style={{
                            background: revealPillBackground,
                            borderColor: revealPillBorder,
                            color: revealLabelColor,
                          }}
                        >
                          {index + 1} / {selectedCards.length} · {label}
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
                          {revealed
                            ? card.name
                            : autoReveal
                              ? active
                                ? "Opening now"
                                : "Waiting"
                              : "Tap to reveal"}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-4 left-0 z-10 w-8"
            style={{
              background: theme
                ? "linear-gradient(90deg, rgba(11,8,27,0.34), transparent)"
                : "linear-gradient(90deg, rgba(255,244,250,0.38), transparent)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-4 right-0 z-10 w-8"
            style={{
              background: theme
                ? "linear-gradient(270deg, rgba(11,8,27,0.34), transparent)"
                : "linear-gradient(270deg, rgba(255,244,250,0.38), transparent)",
            }}
          />
        </div>

        <div className="mt-4 w-full shrink-0">
          <div
            aria-hidden
            className="mx-auto mb-3 flex h-2 max-w-[14rem] items-center justify-center gap-1.5 overflow-hidden"
          >
            {selectedCards.map((card, index) => {
              const revealed = revealedIds.includes(card.visualId);
              const active = index === safeActiveIndex;
              return (
                <span
                  key={card.visualId}
                  className={`h-1.5 rounded-full transition-[width,opacity,background] duration-300 ${
                    active ? "w-5 opacity-100" : "w-1.5"
                  }`}
                  style={{
                    background: active
                      ? "linear-gradient(90deg, var(--hint-aqua), var(--hint-gold))"
                      : revealed
                        ? "color-mix(in srgb, var(--hint-gold) 62%, transparent)"
                        : "color-mix(in srgb, var(--hint-border) 72%, transparent)",
                    opacity: active ? 1 : revealed ? 0.72 : 0.42,
                  }}
                />
              );
            })}
          </div>
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
          <div
            ref={thumbnailRef}
            className={`no-scrollbar mt-2 flex snap-x snap-mandatory gap-2 touch-pan-x scroll-smooth overflow-x-auto overscroll-x-contain [scrollbar-width:none] ${
              allRevealed ? "pb-[4.35rem]" : "pb-1"
            }`}
          >
            {selectedCards.map((card, index) => {
              const revealed = revealedIds.includes(card.visualId);
              const active = index === safeActiveIndex;
              const label = getSpreadPositionLabel(spread, index);
              const queued = !revealed && index === nextIndex;

              return (
                <button
                  key={card.visualId}
                  type="button"
                  data-reveal-thumb-index={index}
                  aria-current={active ? "true" : undefined}
                  onClick={() => {
                    setActiveIndex(index);
                    if (!autoReveal && !revealed && readyToReveal) {
                      onReveal(card.visualId);
                    }
                  }}
                  className={`relative grid w-[3.8rem] shrink-0 snap-center justify-items-center gap-1 rounded-[16px] border px-1.5 py-1.5 text-center transition active:scale-[0.97] ${
                    active
                      ? "border-[#f1d390]/70 bg-white/18"
                      : "border-white/10 bg-white/[0.045]"
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
                    className="!h-[66px] !w-[41px]"
                  />
                  <span
                    className="max-w-[3.25rem] truncate text-[7.5px] font-black uppercase tracking-[0.08em]"
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

      {allRevealed && onContinue ? (
        <motion.div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex justify-center bg-gradient-to-t from-black/42 via-black/18 to-transparent px-4 pb-[calc(var(--hint-safe-bottom)+0.7rem)] pt-8"
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: reducedMotion ? 0 : 0.46, ease: REVEAL_EASE }}
        >
          <button
            type="button"
            onClick={onContinue}
            className="hint-soft-button hint-tap-sparkle pointer-events-auto w-full max-w-[19rem] rounded-full px-7 py-3.5 font-sans text-xs uppercase tracking-[0.18em] shadow-[0_18px_46px_rgba(0,0,0,0.24)] backdrop-blur-xl transition-[background,transform] active:scale-[0.985]"
          >
            Read my Hint
          </button>
        </motion.div>
      ) : null}
    </motion.section>
  );
}
