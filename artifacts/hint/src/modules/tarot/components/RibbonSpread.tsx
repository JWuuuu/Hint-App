import { type PointerEvent, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { RitualCard } from "../logic/createHiddenDeck";
import type { SpreadChoice } from "../../hold/useHoldFlow";
import { TarotCardVisual } from "./TarotCardVisual";
import type { TarotCardBackStyle } from "./TarotCardVisual";
import { getSpreadPositionLabel } from "../logic/spreadLabels";

type RibbonSpreadProps = {
  finalDeckOrder: RitualCard[];
  selectedCards: RitualCard[];
  maxCards: number;
  spread: SpreadChoice;
  backStyle?: TarotCardBackStyle;
  onSelect: (visualId: string) => void;
  onContinue: () => void;
};

function getFanLayout(index: number, total: number) {
  const progress = total <= 1 ? 0.5 : index / (total - 1);
  const angle = -66 + progress * 132;
  const radians = (angle * Math.PI) / 180;
  const edge = Math.abs(progress - 0.5) * 2;

  return {
    x: 50 + Math.sin(radians) * 39.5,
    y: 72 - Math.cos(radians) * 37 + Math.pow(edge, 1.6) * 3,
    rotate: angle * 0.62,
    centerOffsetX: -Math.sin(radians) * 350,
    centerOffsetY: 124 + Math.cos(radians) * 34,
    spreadDelay: Math.abs(progress - 0.5) * 0.1 + Math.min(index * 0.00055, 0.04),
    zIndex: Math.round(1200 - edge * 130 + index * 0.02),
  };
}

function slotSizeClass(cardCount: number) {
  if (cardCount >= 7) return "!h-[46px] !w-[30px] min-[430px]:!h-[56px] min-[430px]:!w-[36px] sm:!h-[68px] sm:!w-[44px] lg:!h-[82px] lg:!w-[54px]";
  if (cardCount >= 5) return "!h-[66px] !w-[42px] min-[430px]:!h-[78px] min-[430px]:!w-[50px] sm:!h-[98px] sm:!w-[64px] lg:!h-[124px] lg:!w-[80px]";
  return "!h-[96px] !w-[60px] min-[430px]:!h-[108px] min-[430px]:!w-[68px] sm:!h-[128px] sm:!w-[82px] lg:!h-[154px] lg:!w-[98px]";
}

function slotFieldClass(cardCount: number) {
  if (cardCount === 1) return "top-[56%] h-[24%] sm:top-[54%] sm:h-[25%]";
  if (cardCount === 3) return "top-[51%] h-[31%] sm:top-[50%] sm:h-[31%]";
  if (cardCount <= 5) return "top-[47%] h-[38%] sm:top-[46%] sm:h-[38%]";
  return "top-[43%] h-[43%] sm:top-[43%] sm:h-[43%]";
}

function fanCardSizeClass() {
  return "!h-[66px] !w-[42px] sm:!h-[92px] sm:!w-[58px] md:!h-[110px] md:!w-[70px] lg:!h-[120px] lg:!w-[76px]";
}

function getSlotPoint(
  point: { x: number; y: number },
  cardCount: number,
) {
  if (cardCount <= 3) {
    return {
      x: point.x,
      y: Math.min(82, Math.max(18, point.y)),
    };
  }

  if (cardCount <= 5) {
    return {
      x: Math.min(82, Math.max(18, point.x)),
      y: Math.min(78, Math.max(18, point.y)),
    };
  }

  return {
    x: Math.min(88, Math.max(12, point.x)),
    y: Math.min(88, Math.max(12, point.y)),
  };
}

function getSelectedPositionLabel(spread: SpreadChoice, index: number, cardCount: number) {
  if (cardCount === 1) return "The Message";
  return getSpreadPositionLabel(spread, index);
}

function SelectedSpreadCard({
  card,
  label,
  backStyle,
  cardSizeClass,
}: {
  card: RitualCard;
  label: string;
  backStyle: TarotCardBackStyle;
  cardSizeClass: string;
}) {
  return (
    <TarotCardVisual
      card={card}
      compact
      faceDown
      revealed={false}
      backStyle={backStyle}
      positionLabel={label}
      showFrontCaption={false}
      ariaLabel={`${label}, selected face-down`}
      className={cardSizeClass}
    />
  );
}

export function RibbonSpread({
  finalDeckOrder,
  selectedCards,
  maxCards,
  spread,
  backStyle = "nocturne",
  onSelect,
  onContinue,
}: RibbonSpreadProps) {
  const reduceMotion = useReducedMotion();
  const fanRef = useRef<HTMLDivElement | null>(null);
  const hoverFrameRef = useRef<number | null>(null);
  const hoverPointerRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const hoveredVisualIdRef = useRef<string | null>(null);
  const previewSettleTimerRef = useRef<number | null>(null);
  const [hoveredVisualId, setHoveredVisualId] = useState<string | null>(null);
  const selectedIds = new Set(selectedCards.map((card) => card.visualId));
  const slots = Array.from({ length: maxCards }, (_, index) => index);
  const cardSizeClass = slotSizeClass(maxCards);
  const slotField = slotFieldClass(maxCards);
  const fanCardClass = fanCardSizeClass();
  const allSelected = selectedCards.length === maxCards;

  useEffect(() => {
    if (fanRef.current) {
      fanRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    hoveredVisualIdRef.current = hoveredVisualId;
  }, [hoveredVisualId]);

  useEffect(() => {
    return () => {
      if (hoverFrameRef.current !== null) {
        window.cancelAnimationFrame(hoverFrameRef.current);
      }
      if (previewSettleTimerRef.current !== null) {
        window.clearTimeout(previewSettleTimerRef.current);
      }
    };
  }, []);

  function schedulePreviewSettle() {
    if (previewSettleTimerRef.current !== null) {
      window.clearTimeout(previewSettleTimerRef.current);
    }
    previewSettleTimerRef.current = window.setTimeout(() => {
      setHoveredCard(null);
      previewSettleTimerRef.current = null;
    }, 180);
  }

  function findNearestCard(clientX: number, clientY: number, intent: "preview" | "select" = "select") {
    const rect = fanRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    let nearestCard: RitualCard | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const [index, card] of finalDeckOrder.entries()) {
      if (selectedIds.has(card.visualId)) continue;
      const layout = getFanLayout(index, finalDeckOrder.length);
      const cardX = rect.width * (layout.x / 100);
      const cardY = rect.height * (layout.y / 100);
      const distance = Math.hypot(x - cardX, (y - cardY) * 0.82);
      if (distance < nearestDistance) {
        nearestCard = card;
        nearestDistance = distance;
      }
    }

    const hitRadius = intent === "preview"
      ? rect.width < 500 ? 42 : 58
      : rect.width < 500 ? 108 : 148;
    if (!nearestCard || nearestDistance > hitRadius) return null;
    return nearestCard;
  }

  function setHoveredCard(nextVisualId: string | null) {
    if (hoveredVisualIdRef.current === nextVisualId) return;
    hoveredVisualIdRef.current = nextVisualId;
    setHoveredVisualId(nextVisualId);
  }

  function cancelHoverFrame() {
    if (hoverFrameRef.current === null) return;
    window.cancelAnimationFrame(hoverFrameRef.current);
    hoverFrameRef.current = null;
  }

  function handleFanPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (selectedCards.length >= maxCards || event.pointerType !== "mouse") return;
    hoverPointerRef.current = { clientX: event.clientX, clientY: event.clientY };
    if (hoverFrameRef.current !== null) return;
    hoverFrameRef.current = window.requestAnimationFrame(() => {
      hoverFrameRef.current = null;
      const pointer = hoverPointerRef.current;
      if (!pointer) return;
      setHoveredCard(findNearestCard(pointer.clientX, pointer.clientY, "preview")?.visualId ?? null);
      schedulePreviewSettle();
    });
  }

  function handleFanPointerLeave() {
    hoverPointerRef.current = null;
    cancelHoverFrame();
    setHoveredCard(null);
    if (previewSettleTimerRef.current !== null) {
      window.clearTimeout(previewSettleTimerRef.current);
      previewSettleTimerRef.current = null;
    }
  }

  function handleFanPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (selectedCards.length >= maxCards) return;
    const nearestCard = findNearestCard(event.clientX, event.clientY, "select");
    if (!nearestCard) return;

    if (previewSettleTimerRef.current !== null) {
      window.clearTimeout(previewSettleTimerRef.current);
      previewSettleTimerRef.current = null;
    }
    setHoveredCard(null);
    onSelect(nearestCard.visualId);
  }

  const activePreviewVisualId = hoveredVisualId;
  const selectedSectionLabel = maxCards === 1 ? "Selected Card" : "Selected Cards";
  const instruction = allSelected
    ? maxCards === 1
      ? "Your card has been chosen. Reveal the message when you're ready."
      : "Your cards have been chosen. Reveal the message when you're ready."
    : `Choose ${maxCards} face-down ${maxCards === 1 ? "card" : "cards"} from the arc.`;

  return (
    <section className="relative h-full w-full overflow-hidden px-4 py-5 text-center sm:px-6">
      <div className="pointer-events-none absolute inset-0" style={{ background: "var(--hint-page-bg)" }} />
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_18%_24%,rgba(255,255,255,0.65)_0_1px,transparent_1px),radial-gradient(circle_at_74%_19%,rgba(239,205,139,0.55)_0_1px,transparent_1px),radial-gradient(circle_at_68%_76%,rgba(255,255,255,0.34)_0_1px,transparent_1px)] [background-size:132px_148px]" />
      <div className="pointer-events-none absolute inset-x-[-10%] bottom-[-8%] h-[60%] bg-[radial-gradient(ellipse_at_50%_64%,rgba(78,117,145,0.28),rgba(8,18,34,0.24)_38%,transparent_70%)]" />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[19%] h-[180px] w-[180px] -translate-x-1/2 rounded-full border"
        style={{ borderColor: "color-mix(in srgb, var(--hint-gold, #dcc383) 18%, transparent)" }}
        animate={{ opacity: [0.18, 0.48, 0.18], scale: [0.92, 1.12, 0.92] }}
        transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-30 mx-auto max-w-3xl">
        <p className="font-serif text-[30px] leading-tight sm:text-4xl" style={{ color: "var(--hint-text)" }}>Spread the deck.</p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 font-sans text-[10px] uppercase tracking-[0.16em]" style={{ color: "var(--hint-gold)" }}>
          <span className="hint-status-pill rounded-full border px-2.5 py-1">
            {spread.label} spread
          </span>
          <span className="hint-status-pill rounded-full border px-2.5 py-1">
            {selectedCards.length} / {maxCards} selected
          </span>
        </div>
        <p className="mt-2 font-sans text-sm" style={{ color: "var(--hint-muted)" }}>
          {instruction}
        </p>
      </div>

      <div className={`pointer-events-none absolute inset-x-4 ${slotField} z-20 mx-auto max-w-6xl sm:inset-x-8`}>
        <p className="absolute left-1/2 top-0 z-50 -translate-x-1/2 font-sans text-[10px] uppercase tracking-[0.22em]" style={{ color: "var(--hint-gold)" }}>
          {selectedSectionLabel}
        </p>

        {slots.map((slotIndex) => {
          const index = slotIndex;
          const selectedCard = selectedCards[index];
          const point = spread.layout[index] ?? { n: index + 1, x: 50, y: 50 };
          const slotPoint = getSlotPoint(point, maxCards);
          const label = getSelectedPositionLabel(spread, index, maxCards);
          const showOuterLabel = Boolean(selectedCard) || maxCards <= 3;
          return (
            <div
              key={`${spread.id}-hint-${index + 1}`}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5"
              style={{ left: `${slotPoint.x}%`, top: `${slotPoint.y}%` }}
            >
              <div className={`relative grid place-items-center ${cardSizeClass}`}>
                <span className="hint-status-pill pointer-events-none absolute -right-2 -top-2 z-40 grid h-5 w-5 place-items-center rounded-full border font-sans text-[9px] uppercase tracking-[0.04em]" style={{ color: "var(--hint-gold)" }}>
                  {index + 1}
                </span>
                <div
                  className="absolute inset-0 rounded-[10px] border border-dashed"
                  style={{
                    borderColor: "color-mix(in srgb, var(--hint-gold) 42%, var(--hint-border))",
                    background: "radial-gradient(circle at 50% 44%, color-mix(in srgb, var(--hint-gold) 11%, transparent), color-mix(in srgb, var(--hint-aqua) 5%, transparent) 42%, transparent)",
                    boxShadow: "inset 0 0 22px color-mix(in srgb, var(--hint-gold) 8%, transparent), 0 0 18px color-mix(in srgb, var(--hint-aqua) 6%, transparent)",
                  }}
                />
                {selectedCard && (
                  <motion.div
                    layoutId={`spread-card-${selectedCard.visualId}`}
                    initial={reduceMotion ? { opacity: 0, scale: 0.98 } : { opacity: 0, y: -24, scale: 1.025, rotate: 1 }}
                    animate={reduceMotion
                      ? { opacity: 1, scale: 1, rotate: 0 }
                      : {
                          opacity: 1,
                          y: 0,
                          scale: 1,
                          rotate: 0,
                        }}
                    transition={reduceMotion
                      ? { duration: 0.22, ease: "easeOut" }
                      : { type: "spring", stiffness: 132, damping: 24, mass: 0.82 }}
                    className="absolute inset-0 z-30 grid place-items-center will-change-transform"
                  >
                    {!reduceMotion && (
                      <motion.div
                        aria-hidden="true"
                        className="pointer-events-none absolute -inset-3 rounded-[16px]"
                        style={{ background: "color-mix(in srgb, var(--hint-gold) 18%, transparent)" }}
                        initial={{ opacity: 0.7, scale: 0.84 }}
                        animate={{ opacity: 0, scale: 1.3 }}
                        transition={{ duration: 0.44, ease: "easeOut" }}
                      />
                    )}
                    <SelectedSpreadCard
                      card={selectedCard}
                      backStyle={backStyle}
                      label={label}
                      cardSizeClass={cardSizeClass}
                    />
                  </motion.div>
                )}
              </div>
              {showOuterLabel && (
                <p className="max-w-[5.8rem] truncate font-sans text-[8px] uppercase tracking-[0.1em] sm:max-w-[7rem] sm:text-[9px] sm:tracking-[0.14em]" style={{ color: "var(--hint-muted)" }}>
                  {label}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div
        ref={fanRef}
        onPointerMove={handleFanPointerMove}
        onPointerLeave={handleFanPointerLeave}
        onPointerDown={handleFanPointerDown}
        className="absolute inset-x-0 top-[16%] z-10 h-[32vh] min-h-[240px] w-full cursor-pointer touch-none overflow-visible sm:top-[15%] sm:h-[35vh] sm:min-h-[280px] lg:top-[15%]"
      >
        <div className="absolute inset-x-3 top-0 mx-auto h-full max-w-[88rem] sm:inset-x-6">
          <div className="pointer-events-none absolute left-1/2 top-[76%] h-[30px] w-[72%] -translate-x-1/2 rounded-full blur-xl" style={{ background: "color-mix(in srgb, var(--hint-plum, #271d38) 18%, transparent)" }} />
          {finalDeckOrder.map((card, index) => {
            const selectedInFan = selectedIds.has(card.visualId);
            const activePreview = activePreviewVisualId === card.visualId && !selectedInFan;
            const layout = getFanLayout(index, finalDeckOrder.length);
            return (
              <div
                key={card.visualId}
                className="absolute"
                style={{
                  left: `${layout.x}%`,
                  top: `${layout.y}%`,
                  zIndex: activePreview ? layout.zIndex + 18 : layout.zIndex,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <motion.div
                  layoutId={selectedInFan ? undefined : `spread-card-${card.visualId}`}
                  initial={{
                    opacity: 0,
                    x: layout.centerOffsetX,
                    y: layout.centerOffsetY,
                    rotate: 0,
                    scale: 0.86,
                  }}
                  animate={{
                    opacity: selectedInFan ? 0 : 1,
                    x: 0,
                    y: activePreview ? -4 : 0,
                    rotate: layout.rotate,
                    scale: 1,
                  }}
                  transition={
                    activePreview
                      ? { duration: reduceMotion ? 0.08 : 0.16, ease: "easeOut" }
                      : {
                          delay: reduceMotion ? 0 : layout.spreadDelay,
                          type: reduceMotion ? "tween" : "spring",
                          duration: reduceMotion ? 0.18 : undefined,
                          stiffness: 145,
                          damping: 24,
                          mass: 0.9,
                        }
                  }
                  className="relative"
                  style={{
                    pointerEvents: "none",
                    transformOrigin: "50% 104%",
                    willChange: "transform, opacity",
                  }}
                >
                  {activePreview && (
                    <motion.div
                      aria-hidden="true"
                      initial={{ opacity: 0, y: 2 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: reduceMotion ? 0.06 : 0.1, ease: "easeOut" }}
                      className="hint-status-pill pointer-events-none absolute left-1/2 top-[-34px] z-[70] flex min-w-[44px] -translate-x-1/2 items-center justify-center rounded-full border px-2 py-1 font-sans text-[9px] uppercase tracking-[0.08em] backdrop-blur-sm"
                    >
                      <span>{index + 1}</span>
                      <span className="mx-1 opacity-55">/</span>
                      <span className="opacity-75">{finalDeckOrder.length}</span>
                    </motion.div>
                  )}
                  <div className="pointer-events-none">
                    <TarotCardVisual
                      card={card}
                      compact
                      subtleBack
                      backStyle={backStyle}
                      className={`${fanCardClass} drop-shadow-[0_7px_12px_rgba(0,0,0,0.22)]`}
                    />
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>

      {allSelected && (
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          onClick={onContinue}
          className="hint-soft-button hint-tap-sparkle absolute bottom-4 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-[22rem] -translate-x-1/2 items-center justify-center gap-2 overflow-hidden rounded-full px-5 py-3.5 font-sans text-[10px] uppercase tracking-[0.16em] backdrop-blur-md transition-[background,transform] hover:scale-[1.015] sm:bottom-5 sm:w-auto sm:max-w-none sm:px-6 sm:text-[11px] sm:tracking-[0.2em]"
        >
          <motion.span
            aria-hidden
            className="absolute inset-y-0 left-[-35%] w-[32%] skew-x-[-18deg] bg-white/16 blur-sm"
            animate={{ left: ["-35%", "118%"] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="relative h-1.5 w-1.5 rounded-full" style={{ background: "var(--hint-aqua)", boxShadow: "0 0 14px color-mix(in srgb, var(--hint-aqua) 70%, transparent)" }} />
          <span className="relative">Reveal the Reading</span>
        </motion.button>
      )}
    </section>
  );
}
