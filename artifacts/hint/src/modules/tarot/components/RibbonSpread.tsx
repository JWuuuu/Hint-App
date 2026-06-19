import {
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
  type PointerEvent,
  type TouchEvent,
  type WheelEvent,
} from "react";
import { motion } from "framer-motion";
import type { RitualCard } from "../logic/createHiddenDeck";
import type { TarotCardArtId } from "../logic/cardImageMap";
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
  cardArtId?: TarotCardArtId;
  onSelect: (visualId: string) => void;
  onContinue: () => void;
};

type PickerMode = "spread" | "fan";

type WheelGeometry = {
  centerX: number;
  centerY: number;
  radius: number;
  numberRadius: number;
  startAngle: number;
};

type StageSize = {
  width: number;
  height: number;
};

type ReactTouchList = TouchEvent<Element>["touches"];

const CARD_W_COMPACT = 94;
const CARD_H_COMPACT = 150;
const CARD_W_ZOOM = 100;
const CARD_H_ZOOM = 160;
const WHEEL_FAN_DRAG_SENSITIVITY = 0.008;

function wheelFanStep(total: number) {
  return (Math.PI * 2) / Math.max(total, 1);
}

function getWheelGeometry(zoomed: boolean, size: StageSize): WheelGeometry {
  const centerX = size.width * 1.1;
  const centerY = size.height * 0.58;
  return zoomed
    ? {
        centerX,
        centerY,
        radius: size.width * 0.66,
        numberRadius: size.width * 0.76,
        startAngle: -Math.PI * 0.51,
      }
    : {
        centerX,
        centerY,
        radius: size.width * 0.60,
        numberRadius: 0,
        startAngle: -Math.PI * 0.51,
      };
}

function getWheelFanLayout(
  index: number,
  rotation: number,
  total: number,
  geometry: WheelGeometry,
) {
  const angle = geometry.startAngle + rotation + index * wheelFanStep(total);
  const x = geometry.centerX + Math.cos(angle) * geometry.radius;
  const y = geometry.centerY + Math.sin(angle) * geometry.radius;

  return {
    x,
    y,
    rotate: angle + Math.PI / 2,
    scale: 1,
    opacity: 1,
    zIndex: Math.round(y),
    angle,
  };
}

function getWheelNumberLayout(
  index: number,
  rotation: number,
  total: number,
  geometry: WheelGeometry,
  size: StageSize,
) {
  const angle = geometry.startAngle + rotation + index * wheelFanStep(total);
  const x = geometry.centerX + Math.cos(angle) * geometry.numberRadius;
  const y = geometry.centerY + Math.sin(angle) * geometry.numberRadius;
  const hidden = y > size.height * 0.92 || x > size.width * 0.96;

  return {
    x,
    y,
    rotate: angle + Math.PI / 2,
    opacity: hidden ? 0 : 1,
    zIndex: Math.round(y) + 200,
  };
}

function spreadCardSizeClass(cardCount: number) {
  if (cardCount >= 7) return "!h-[66px] !w-[42px] min-[430px]:!h-[76px] min-[430px]:!w-[48px] sm:!h-[92px] sm:!w-[58px]";
  if (cardCount >= 5) return "!h-[82px] !w-[52px] min-[430px]:!h-[96px] min-[430px]:!w-[60px] sm:!h-[118px] sm:!w-[74px]";
  return "!h-[112px] !w-[70px] min-[430px]:!h-[126px] min-[430px]:!w-[78px] sm:!h-[150px] sm:!w-[94px]";
}

function spreadFieldClass(cardCount: number) {
  if (cardCount === 1) return "top-[30%] h-[42%]";
  if (cardCount <= 3) return "top-[28%] h-[44%]";
  if (cardCount <= 5) return "top-[26%] h-[48%]";
  return "top-[24%] h-[52%]";
}

function getSlotPoint(point: { x: number; y: number }, cardCount: number) {
  if (cardCount <= 3) {
    return {
      x: Math.min(86, Math.max(14, point.x)),
      y: Math.min(80, Math.max(20, point.y)),
    };
  }

  if (cardCount <= 5) {
    return {
      x: Math.min(84, Math.max(16, point.x)),
      y: Math.min(78, Math.max(18, point.y)),
    };
  }

  return {
    x: Math.min(88, Math.max(12, point.x)),
    y: Math.min(88, Math.max(12, point.y)),
  };
}

function getPointerDistance(points: Array<{ clientX: number; clientY: number }>) {
  if (points.length < 2) return 0;
  return Math.hypot(points[0]!.clientX - points[1]!.clientX, points[0]!.clientY - points[1]!.clientY);
}

function getTouchDistance(touches: ReactTouchList) {
  const first = touches.item(0);
  const second = touches.item(1);
  if (!first || !second) return 0;
  return Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);
}

function suppressSyntheticClick(suppressRef: MutableRefObject<boolean>) {
  suppressRef.current = true;
  window.setTimeout(() => {
    suppressRef.current = false;
  }, 80);
}

export function RibbonSpread({
  finalDeckOrder,
  selectedCards,
  maxCards,
  spread,
  backStyle = "nocturne",
  cardArtId = "original",
  onSelect,
  onContinue,
}: RibbonSpreadProps) {
  const fanRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startRotation: number;
    moved: boolean;
  } | null>(null);
  const activePointersRef = useRef(new Map<number, { clientX: number; clientY: number }>());
  const pinchStartDistanceRef = useRef<number | null>(null);
  const pinchStartZoomedRef = useRef(false);
  const touchStartDistanceRef = useRef<number | null>(null);
  const touchStartZoomedRef = useRef(false);
  const suppressNextClickRef = useRef(false);
  const popTimerRef = useRef<number | null>(null);
  const autoDrawTimerRef = useRef<number | null>(null);
  const selectedIds = new Set(selectedCards.map((card) => card.visualId));
  const allSelected = selectedCards.length === maxCards;
  const nextCardNumber = Math.min(selectedCards.length + 1, maxCards);
  const [mode, setMode] = useState<PickerMode>("spread");
  const [zoomed, setZoomed] = useState(false);
  const [placingVisualId, setPlacingVisualId] = useState<string | null>(null);
  const [poppingVisualId, setPoppingVisualId] = useState<string | null>(null);
  const [stageSize, setStageSize] = useState<StageSize>(() => ({
    width: typeof window === "undefined" ? 390 : window.innerWidth,
    height: typeof window === "undefined" ? 844 : window.innerHeight,
  }));
  const geometry = getWheelGeometry(zoomed, stageSize);
  const [fanRotation, setFanRotation] = useState(0);
  const spreadSlotClass = spreadCardSizeClass(maxCards);
  const spreadField = spreadFieldClass(maxCards);

  useEffect(() => {
    return () => {
      suppressNextClickRef.current = false;
      activePointersRef.current.clear();
      if (popTimerRef.current) window.clearTimeout(popTimerRef.current);
      if (autoDrawTimerRef.current) window.clearTimeout(autoDrawTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (mode !== "fan") return undefined;
    const element = fanRef.current;
    if (!element) return undefined;

    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setStageSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    window.addEventListener("resize", updateSize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, [mode]);

  useEffect(() => {
    if (!placingVisualId) return undefined;
    const timer = window.setTimeout(() => setPlacingVisualId(null), 900);
    return () => window.clearTimeout(timer);
  }, [placingVisualId, selectedCards.length]);

  useEffect(() => {
    if (mode !== "spread" || allSelected || poppingVisualId) return undefined;

    if (autoDrawTimerRef.current) {
      window.clearTimeout(autoDrawTimerRef.current);
      autoDrawTimerRef.current = null;
    }

    autoDrawTimerRef.current = window.setTimeout(() => {
      autoDrawTimerRef.current = null;
      enterFan();
    }, selectedCards.length === 0 ? 2200 : 1100);

    return () => {
      if (autoDrawTimerRef.current) {
        window.clearTimeout(autoDrawTimerRef.current);
        autoDrawTimerRef.current = null;
      }
    };
  }, [mode, allSelected, selectedCards.length, poppingVisualId]);

  function enterFan() {
    if (allSelected) {
      onContinue();
      return;
    }
    if (autoDrawTimerRef.current) {
      window.clearTimeout(autoDrawTimerRef.current);
      autoDrawTimerRef.current = null;
    }
    setMode("fan");
    setZoomed(false);
  }

  function selectCard(card: RitualCard) {
    if (allSelected || selectedIds.has(card.visualId) || poppingVisualId) return;
    if (popTimerRef.current) window.clearTimeout(popTimerRef.current);

    setPoppingVisualId(card.visualId);
    popTimerRef.current = window.setTimeout(() => {
      popTimerRef.current = null;
      setPlacingVisualId(card.visualId);
      onSelect(card.visualId);
      setMode("spread");
      setZoomed(false);
      setPoppingVisualId(null);
    }, 280);
  }

  function chooseCard(card: RitualCard) {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      return;
    }
    selectCard(card);
  }

  function findNearestSelectableCardAt(clientX: number, clientY: number) {
    const threshold = Math.max(88, Math.min(window.innerWidth, window.innerHeight) * (zoomed ? 0.18 : 0.22));
    let nearest: { card: RitualCard; index: number; distance: number } | null = null;

    for (let index = 0; index < finalDeckOrder.length; index += 1) {
      const card = finalDeckOrder[index];
      if (!card) continue;
      if (selectedIds.has(card.visualId)) continue;
      const layout = getWheelFanLayout(index, fanRotation, finalDeckOrder.length, geometry);
      const x = layout.x;
      const y = layout.y;
      const distance = Math.hypot(clientX - x, clientY - y);
      if (distance > threshold) continue;
      if (!nearest || distance < nearest.distance) nearest = { card, index, distance };
    }

    return nearest;
  }

  function handleFanPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (allSelected || poppingVisualId) return;
    activePointersRef.current.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startRotation: fanRotation,
      moved: false,
    };
    if (activePointersRef.current.size >= 2) {
      pinchStartDistanceRef.current = getPointerDistance(Array.from(activePointersRef.current.values()));
      pinchStartZoomedRef.current = zoomed;
      dragRef.current.moved = true;
    }
  }

  function handleFanPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (poppingVisualId) return;
    const drag = dragRef.current;
    activePointersRef.current.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });

    if (activePointersRef.current.size >= 2) {
      if (drag) drag.moved = true;
      const points = Array.from(activePointersRef.current.values());
      const startDistance = pinchStartDistanceRef.current ?? getPointerDistance(points);
      pinchStartDistanceRef.current = startDistance;
      const ratio = startDistance > 0 ? getPointerDistance(points) / startDistance : 1;
      if (ratio > 1.08 && !pinchStartZoomedRef.current) setZoomed(true);
      if (ratio < 0.92 && pinchStartZoomedRef.current) setZoomed(false);
      return;
    }

    if (!drag || drag.pointerId !== event.pointerId) return;
    if (Math.abs(event.clientX - drag.startX) > 5) {
      drag.moved = true;
    }
    const nextRotation = drag.startRotation + (event.clientX - drag.startX) * WHEEL_FAN_DRAG_SENSITIVITY;
    setFanRotation(nextRotation);
  }

  function finishFanDrag(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    activePointersRef.current.delete(event.pointerId);
    if (activePointersRef.current.size < 2) {
      pinchStartDistanceRef.current = null;
    }
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.moved) {
      suppressSyntheticClick(suppressNextClickRef);
    } else {
      const targetElement = event.target instanceof HTMLElement ? event.target : null;
      const targetButton = targetElement?.closest<HTMLButtonElement>("button[data-visual-id]");
      const visualId = targetButton?.dataset.visualId;
      const directCard = visualId ? finalDeckOrder.find((card) => card.visualId === visualId) : undefined;

      if (directCard && !selectedIds.has(directCard.visualId)) {
        suppressSyntheticClick(suppressNextClickRef);
        selectCard(directCard);
      } else {
        const nearestCard = findNearestSelectableCardAt(event.clientX, event.clientY);
        if (nearestCard) {
          suppressSyntheticClick(suppressNextClickRef);
          selectCard(nearestCard.card);
        }
      }
    }
    dragRef.current = null;
  }

  function handleFanTouchStart(event: TouchEvent<HTMLDivElement>) {
    if (event.touches.length < 2) return;
    touchStartDistanceRef.current = getTouchDistance(event.touches);
    touchStartZoomedRef.current = zoomed;
    if (dragRef.current) dragRef.current.moved = true;
  }

  function handleFanTouchMove(event: TouchEvent<HTMLDivElement>) {
    if (event.touches.length < 2 || poppingVisualId) return;
    const currentDistance = getTouchDistance(event.touches);
    const startDistance = touchStartDistanceRef.current ?? currentDistance;
    touchStartDistanceRef.current = startDistance;
    if (event.cancelable) event.preventDefault();
    const ratio = startDistance > 0 ? currentDistance / startDistance : 1;
    if (ratio > 1.06 && !touchStartZoomedRef.current) setZoomed(true);
    if (ratio < 0.94 && touchStartZoomedRef.current) setZoomed(false);
  }

  function handleFanTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (event.touches.length >= 2) return;
    touchStartDistanceRef.current = null;
  }

  function handleFanWheel(event: WheelEvent<HTMLDivElement>) {
    if (poppingVisualId || Math.abs(event.deltaY) < 2) return;
    if (event.cancelable) event.preventDefault();
    setZoomed(event.deltaY < 0);
  }

  return (
    <section className="relative h-full w-full overflow-hidden px-4 pb-[calc(var(--hint-safe-bottom)+1.25rem)] pt-[calc(var(--hint-safe-top)+1rem)] text-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(116,89,255,0.18),transparent_28%),radial-gradient(circle_at_50%_56%,rgba(10,16,34,0.88),rgba(3,5,12,0.98)_64%,#010207_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_18%_24%,rgba(255,255,255,0.65)_0_1px,transparent_1px),radial-gradient(circle_at_74%_19%,rgba(239,205,139,0.55)_0_1px,transparent_1px),radial-gradient(circle_at_68%_76%,rgba(255,255,255,0.34)_0_1px,transparent_1px)] [background-size:132px_148px]" />
      <div className="pointer-events-none absolute inset-x-[-16%] bottom-[-10%] h-[58%] bg-[radial-gradient(ellipse_at_50%_64%,rgba(116,89,255,0.20),rgba(8,18,34,0.18)_38%,transparent_72%)]" />

      <div className="relative z-30 mx-auto mt-2 flex w-full max-w-[18rem] items-center justify-center gap-2">
        {[0, 1, 2, 3].map((step) => (
          <span
            key={step}
            className="h-1.5 flex-1 rounded-full"
            style={{
              background: step <= 3 ? "linear-gradient(90deg, #7057ff, #9b6cff)" : "rgba(255,255,255,0.08)",
              boxShadow: "0 0 18px rgba(112,87,255,0.34)",
            }}
          />
        ))}
      </div>

      {mode === "spread" && (
        <motion.div
          key="spread-preview"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.34, ease: "easeOut" }}
          className="absolute inset-0 z-20"
        >
          <div className="absolute inset-x-5 top-[calc(var(--hint-safe-top)+5.75rem)] z-30">
            <p className="font-serif text-[24px] leading-tight text-[#f7ead0] md:text-[34px]">
              {allSelected ? "Cards chosen" : `Card ${nextCardNumber}`}
            </p>
            <p className="mx-auto mt-2 max-w-[20rem] font-sans text-[12px] font-semibold text-[#d8c7a6]/72">
              {spread.label}
            </p>
          </div>

          <div className={`absolute inset-x-5 ${spreadField} z-20 mx-auto max-w-[520px]`}>
            {Array.from({ length: maxCards }, (_, index) => {
              const selectedCard = selectedCards[index];
              const point = spread.layout[index] ?? { n: index + 1, x: 50, y: 50 };
              const slotPoint = getSlotPoint(point, maxCards);
              const label = getSpreadPositionLabel(spread, index);
              const activeSlot = index === selectedCards.length && !allSelected;
              return (
                <div
                  key={`${spread.id}-slot-${index + 1}`}
                  className="absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center gap-1.5"
                  style={{ left: `${slotPoint.x}%`, top: `${slotPoint.y}%` }}
                >
                  <div className={`relative grid place-items-center ${spreadSlotClass}`}>
                    {!selectedCard && (
                      <motion.div
                        className="absolute inset-0 rounded-[11px] border border-dashed"
                        style={{
                          borderColor: activeSlot ? "rgba(151,116,255,0.82)" : "rgba(151,116,255,0.34)",
                          background: activeSlot
                            ? "rgba(111,85,255,0.10)"
                            : "rgba(255,255,255,0.035)",
                          boxShadow: activeSlot ? "0 0 26px rgba(112,87,255,0.24)" : "none",
                        }}
                        animate={activeSlot ? { opacity: [0.62, 1, 0.62], scale: [0.98, 1.03, 0.98] } : { opacity: 0.78 }}
                        transition={{ duration: 2.2, repeat: activeSlot ? Infinity : 0, ease: "easeInOut" }}
                      >
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-sans text-[11px] font-black text-white/34">
                          {index + 1}
                        </span>
                      </motion.div>
                    )}
                    {selectedCard && (
                      <motion.div
                        layoutId={`draw-card-${selectedCard.visualId}`}
                        initial={
                          placingVisualId === selectedCard.visualId
                            ? { opacity: 0, x: -86, y: -96, rotate: -16, scale: 1.28 }
                            : { opacity: 0, y: 10, scale: 0.96 }
                        }
                        animate={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
                        transition={{ type: "spring", stiffness: 155, damping: 22, mass: 0.9 }}
                        className="absolute inset-0 grid place-items-center"
                      >
                        <TarotCardVisual
                          card={selectedCard}
                          compact
                          faceDown={false}
                          revealed
                          backStyle={backStyle}
                          cardArtId={cardArtId}
                          positionLabel={label}
                          showFrontCaption={false}
                          className={spreadSlotClass}
                          ariaLabel={`${label}, ${selectedCard.name}`}
                        />
                      </motion.div>
                    )}
                  </div>
                  <p className="hint-status-pill max-w-[5.8rem] truncate rounded-full border px-2.5 py-1 font-sans text-[8px] uppercase tracking-[0.12em] text-[#f3e2c4]/68 sm:max-w-[7rem] sm:text-[9px]">
                    {selectedCard ? selectedCard.name : label}
                  </p>
                </div>
              );
            })}
          </div>

          {allSelected ? (
            <button
              type="button"
              onClick={onContinue}
              className="hint-soft-button hint-tap-sparkle absolute bottom-[calc(var(--hint-safe-bottom)+1.25rem)] left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-[430px] -translate-x-1/2 items-center justify-center rounded-full px-5 py-4 font-sans text-[14px] font-black text-white shadow-[0_18px_46px_rgba(97,73,255,0.32)] active:scale-[0.99]"
              style={{
                background: "linear-gradient(135deg, #6f55ff, #8664ff)",
              }}
            >
              Continue
            </button>
          ) : (
            <div
              role="status"
              aria-live="polite"
              className="absolute bottom-[calc(var(--hint-safe-bottom)+1.25rem)] left-1/2 z-50 flex min-h-14 w-[calc(100%-2rem)] max-w-[430px] -translate-x-1/2 items-center justify-center rounded-full border border-white/10 bg-white/10 px-5 py-3 font-sans text-[12px] font-bold leading-snug text-white/76 shadow-[0_18px_42px_rgba(40,28,125,0.18)] backdrop-blur-md"
            >
              {selectedCards.length === 0
                ? "The wheel opens next. Swipe to choose; pinch or scroll up to zoom and see cards 1-78."
                : `Placed ${selectedCards.length} of ${maxCards}. Opening card ${nextCardNumber}.`}
            </div>
          )}
        </motion.div>
      )}

      {mode === "fan" && (
        <motion.div
          key="fan-picker"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.34, ease: "easeOut" }}
          className="absolute inset-0 z-20 overflow-hidden"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_58%_30%,rgba(255,255,255,0.72),transparent_32%),linear-gradient(160deg,#fbf7ff_0%,#eee9fb_50%,#f7f2ff_100%)]" />
          <div className="absolute inset-x-4 top-[calc(var(--hint-safe-top)+5.75rem)] z-40">
            <motion.p
              key={`${nextCardNumber}-${zoomed ? "zoomed" : "normal"}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, ease: "easeOut" }}
              className="font-serif text-[24px] leading-tight text-[#332d45] md:text-[34px]"
            >
              Card {nextCardNumber}
            </motion.p>
          </div>

          <div
            ref={fanRef}
            className="absolute inset-0 z-20 cursor-grab touch-none select-none overflow-hidden active:cursor-grabbing"
            onPointerDown={handleFanPointerDown}
            onPointerMove={handleFanPointerMove}
            onPointerUp={finishFanDrag}
            onPointerCancel={finishFanDrag}
            onTouchStart={handleFanTouchStart}
            onTouchMove={handleFanTouchMove}
            onTouchEnd={handleFanTouchEnd}
            onWheel={handleFanWheel}
            onDoubleClick={() => setZoomed((current) => !current)}
            aria-label="Rotating tarot deck fan"
          >
            {finalDeckOrder.map((card, index) => {
              const selected = selectedIds.has(card.visualId);
              const popping = poppingVisualId === card.visualId;
              const layout = getWheelFanLayout(index, fanRotation, finalDeckOrder.length, geometry);
              const cardWidth = zoomed ? CARD_W_ZOOM : CARD_W_COMPACT;
              const cardHeight = zoomed ? CARD_H_ZOOM : CARD_H_COMPACT;

              return (
                <button
                  key={card.visualId}
                  type="button"
                  data-visual-id={card.visualId}
                  aria-label={`Choose face-down card ${index + 1}`}
                  disabled={selected || Boolean(poppingVisualId)}
                  onClick={selected ? undefined : () => chooseCard(card)}
                  className="absolute block overflow-hidden rounded-[10px] border outline-none transition-[box-shadow,filter] duration-150"
                  style={{
                    left: layout.x,
                    top: layout.y,
                    width: cardWidth,
                    height: cardHeight,
                    zIndex: layout.zIndex + (popping ? 5000 : 0),
                    opacity: selected ? 0 : layout.opacity,
                    pointerEvents: selected ? "none" : "auto",
                    backgroundColor: "#25225a",
                    borderColor: "rgba(147,139,205,0.42)",
                    boxShadow: popping
                      ? "0 24px 38px rgba(54,38,143,0.38), 0 0 34px rgba(122,96,255,0.40)"
                      : "0 12px 20px rgba(35,30,82,0.22)",
                    filter: popping ? "brightness(1.14)" : undefined,
                    transition: popping
                      ? "transform 260ms cubic-bezier(0.18, 0.82, 0.18, 1), box-shadow 220ms ease, filter 220ms ease"
                      : undefined,
                    transform: `translate(${-cardWidth / 2}px, ${-cardHeight / 2}px) rotate(${layout.rotate}rad) scale(${popping ? 1.18 : layout.scale})`,
                  }}
                >
                  <span className="pointer-events-none absolute inset-[8px] rounded-[8px] border border-white/10" />
                  <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,0.10),transparent_30%),linear-gradient(140deg,rgba(255,255,255,0.08),transparent_42%)]" />
                </button>
              );
            })}

            {zoomed && finalDeckOrder.map((card, index) => {
              const selected = selectedIds.has(card.visualId);
              const popping = poppingVisualId === card.visualId;
              const numberLayout = getWheelNumberLayout(index, fanRotation, finalDeckOrder.length, geometry, stageSize);
              return (
                <span
                  key={`number-${card.visualId}`}
                  aria-hidden
                  className="pointer-events-none absolute h-[14px] w-[26px] text-center font-sans text-[13px] font-bold text-[#a59db8]"
                  style={{
                    left: numberLayout.x,
                    top: numberLayout.y,
                    zIndex: numberLayout.zIndex,
                    opacity: selected || popping ? 0 : numberLayout.opacity,
                    transform: `translate(-13px, -7px) rotate(${numberLayout.rotate}rad)`,
                  }}
                >
                  {index + 1}
                </span>
              );
            })}
          </div>

          <div className="pointer-events-none absolute inset-x-4 bottom-[calc(var(--hint-safe-bottom)+1.25rem)] z-50 mx-auto flex max-w-[430px] flex-col gap-2">
            <div className="rounded-[18px] border border-[#d7d0eb]/70 bg-white/70 px-4 py-3 text-left font-sans text-[11px] font-bold leading-snug text-[#5d5476]/84 shadow-[0_18px_42px_rgba(70,54,142,0.16)] backdrop-blur-md">
              {zoomed
                ? "Zoom view: numbers show card positions 1-78. Pinch closed or scroll down to return."
                : "Swipe the wheel to browse. Pinch open or scroll up to zoom; numbers appear in zoom view."}
            </div>
            <div className="rounded-full border border-[#d7d0eb]/70 bg-white/60 px-5 py-3 font-sans text-[13px] font-black text-[#5d5476]/66 shadow-[0_18px_42px_rgba(40,28,125,0.12)] backdrop-blur-md">
              {selectedCards.length} / {maxCards} selected
            </div>
          </div>
        </motion.div>
      )}
    </section>
  );
}
