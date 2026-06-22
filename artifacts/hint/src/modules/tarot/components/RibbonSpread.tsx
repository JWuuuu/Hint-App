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
import type { WashRitualTheme } from "./CardWashRitual";
import { getSpreadPositionLabel } from "../logic/spreadLabels";

type RibbonSpreadProps = {
  finalDeckOrder: RitualCard[];
  selectedCards: RitualCard[];
  maxCards: number;
  spread: SpreadChoice;
  backStyle?: TarotCardBackStyle;
  cardArtId?: TarotCardArtId;
  theme?: Pick<WashRitualTheme, "chamberOverlay" | "starClassName" | "tableRingColor" | "secondaryRingColor">;
  question?: string;
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
        radius: size.width * 0.70,
        numberRadius: size.width * 0.70 + CARD_H_ZOOM / 2 + 20,
        startAngle: -Math.PI * 0.51,
      }
    : {
        centerX,
        centerY,
        radius: size.width * 0.64,
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
  const hidden = x < -48 || x > size.width + 64 || y < -52 || y > size.height + 18;

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

function getLabelDock(point: { x: number; y: number }, index: number, cardCount: number) {
  if (cardCount === 1) return "bottom";
  if (cardCount <= 3) return point.y < 50 ? "top" : "bottom";
  if (point.y <= 30) return "top";
  if (point.y >= 70) return "bottom";
  if (point.x <= 28) return "right";
  if (point.x >= 72) return "left";
  return index % 2 === 0 ? "bottom" : "top";
}

function constellationPoints(spread: SpreadChoice, cardCount: number) {
  return spread.layout
    .slice(0, cardCount)
    .map((point) => getSlotPoint(point, cardCount));
}

function ordinalWord(value: number) {
  const words = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth"];
  return words[value - 1] ?? `${value}th`;
}

function getQuestionSnippet(question?: string) {
  const cleaned = question?.trim().replace(/\s+/g, " ");
  if (!cleaned) return "Hold the question here while each signal is sealed.";
  return cleaned.length > 92 ? `${cleaned.slice(0, 89).trim()}...` : cleaned;
}

function getLensGuideText(label: string, index: number) {
  const normalized = label.toLowerCase();
  if (normalized.includes("you")) return "your side";
  if (normalized.includes("them")) return "their side";
  if (normalized.includes("between")) return "shared thread";
  if (normalized.includes("past")) return "what shaped this";
  if (normalized.includes("present")) return "what is active";
  if (normalized.includes("next") || normalized.includes("future")) return "what wants to move";
  if (normalized.includes("block") || normalized.includes("barrier")) return "where energy is held";
  if (normalized.includes("feeling")) return "what is felt";
  if (normalized.includes("advice")) return "how to respond";
  if (normalized.includes("message")) return "the direct signal";
  return index === 0 ? "opening signal" : `signal ${index + 1}`;
}

function lensNodeSizeClass(cardCount: number) {
  if (cardCount >= 7) return "h-12 w-12 sm:h-14 sm:w-14";
  if (cardCount >= 5) return "h-14 w-14 sm:h-16 sm:w-16";
  return "h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem]";
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
  theme,
  question,
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
  const nextPositionLabel = allSelected
    ? ""
    : getSpreadPositionLabel(spread, Math.min(selectedCards.length, maxCards - 1));
  const pageOverlay = theme?.chamberOverlay ??
    "radial-gradient(circle_at_50%_40%,rgba(116,89,255,0.18),transparent_28%),radial-gradient(circle_at_50%_56%,rgba(10,16,34,0.88),rgba(3,5,12,0.98)_64%,#010207_100%)";
  const starClassName = theme?.starClassName ??
    "opacity-35 [background-image:radial-gradient(circle_at_18%_24%,rgba(255,255,255,0.65)_0_1px,transparent_1px),radial-gradient(circle_at_74%_19%,rgba(239,205,139,0.55)_0_1px,transparent_1px),radial-gradient(circle_at_68%_76%,rgba(255,255,255,0.34)_0_1px,transparent_1px)] [background-size:132px_148px]";
  const mapPoints = constellationPoints(spread, maxCards);
  const constellationLine = mapPoints.map((point) => `${point.x},${point.y}`).join(" ");
  const questionSnippet = getQuestionSnippet(question);

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
    if (!allSelected || mode !== "spread") return undefined;
    if (autoDrawTimerRef.current) {
      window.clearTimeout(autoDrawTimerRef.current);
      autoDrawTimerRef.current = null;
    }
    const timer = window.setTimeout(() => onContinue(), 1180);
    return () => window.clearTimeout(timer);
  }, [allSelected, mode, onContinue]);

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
    }, 520);
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
      <div className="pointer-events-none absolute inset-0" style={{ background: pageOverlay }} />
      <div className={`pointer-events-none absolute inset-0 ${starClassName}`} />
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
          <div className="pointer-events-none absolute inset-x-5 top-[calc(var(--hint-safe-top)+5.15rem)] z-30">
            <p className="mx-auto w-fit rounded-full border border-[#f1b8c9]/22 bg-white/[0.07] px-3 py-1 font-sans text-[9px] font-black uppercase tracking-[0.24em] text-[#f1b8c9]/86 shadow-[0_12px_32px_rgba(31,20,64,0.18)] backdrop-blur-md">
              Signal path
            </p>
            <p className="mt-3 font-serif text-[24px] leading-tight text-[#fff2df] drop-shadow-[0_12px_28px_rgba(22,12,32,0.38)] md:text-[34px]">
              {allSelected ? "The field is sealed" : `Open the ${ordinalWord(nextCardNumber)} lens`}
            </p>
            <div className="mx-auto mt-2 flex max-w-[22rem] flex-wrap items-center justify-center gap-1.5 font-sans text-[11px] font-black uppercase tracking-[0.12em] text-[#f7ddaf]/88">
              {allSelected ? (
                <span>Reveal is opening</span>
              ) : (
                <>
                  <span>{spread.label}</span>
                  <span className="h-1 w-1 rounded-full bg-[#f1b8c9]/70" />
                  <span className="rounded-full border border-[#f7ddaf]/24 bg-[#f7ddaf]/12 px-2 py-0.5 text-[#fff3cf]">
                    {nextPositionLabel}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-[#f1b8c9]/70" />
                  <span>{nextCardNumber} of {maxCards}</span>
                </>
              )}
            </div>
          </div>

          <div className={`absolute inset-x-4 ${spreadField} z-20 mx-auto max-w-[540px]`}>
            <div
              aria-hidden
              className="absolute left-1/2 top-1/2 h-[108%] w-[108%] -translate-x-1/2 -translate-y-1/2 rounded-[38%] border border-[#f1b8c9]/12 bg-[radial-gradient(ellipse_at_50%_45%,rgba(241,184,201,0.09),transparent_34%),radial-gradient(ellipse_at_48%_70%,rgba(112,87,255,0.12),transparent_56%)] shadow-[inset_0_0_72px_rgba(241,184,201,0.055)]"
            />
            <div
              aria-hidden
              className={`pointer-events-none absolute left-1/2 z-0 w-[58%] max-w-[270px] -translate-x-1/2 rounded-full border border-[#f7ddaf]/16 bg-[#080615]/42 px-5 py-4 text-center shadow-[0_22px_58px_rgba(0,0,0,0.18),inset_0_0_36px_rgba(241,184,201,0.06)] backdrop-blur-sm ${
                maxCards === 1 ? "top-[8%]" : "top-1/2 -translate-y-1/2"
              }`}
            >
              <p className="font-sans text-[8px] font-black uppercase tracking-[0.22em] text-[#f1b8c9]/66">Question field</p>
              <p className="mt-1 line-clamp-2 font-serif text-[13px] leading-snug text-[#fff2df]/70 sm:text-[15px]">
                {questionSnippet}
              </p>
            </div>
            <svg
              aria-hidden
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-0 overflow-visible"
            >
              <defs>
                <radialGradient id="signal-node-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(247,221,175,0.92)" />
                  <stop offset="58%" stopColor="rgba(241,184,201,0.36)" />
                  <stop offset="100%" stopColor="rgba(112,87,255,0)" />
                </radialGradient>
              </defs>
              <polyline
                points={constellationLine}
                fill="none"
                stroke="rgba(247,221,175,0.22)"
                strokeWidth="0.38"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="1.4 2.8"
              />
              {mapPoints.map((point, index) => (
                index < selectedCards.length ? (
                  <line
                    key={`sealed-ray-${index + 1}`}
                    x1="50"
                    y1="50"
                    x2={point.x}
                    y2={point.y}
                    stroke="rgba(247,221,175,0.34)"
                    strokeWidth="0.34"
                    strokeLinecap="round"
                  />
                ) : null
              ))}
              {!allSelected && mapPoints[selectedCards.length] && (
                <line
                  x1="50"
                  y1="50"
                  x2={mapPoints[selectedCards.length]!.x}
                  y2={mapPoints[selectedCards.length]!.y}
                  stroke="rgba(241,184,201,0.32)"
                  strokeWidth="0.32"
                  strokeLinecap="round"
                  strokeDasharray="1.2 2.2"
                />
              )}
              {mapPoints.map((point, index) => (
                <circle
                  key={`map-dot-${index + 1}`}
                  cx={point.x}
                  cy={point.y}
                  r={index === selectedCards.length && !allSelected ? 2.25 : 1.35}
                  fill={index < selectedCards.length ? "url(#signal-node-glow)" : "rgba(151,116,255,0.52)"}
                  stroke="rgba(255,246,220,0.42)"
                  strokeWidth="0.32"
                />
              ))}
            </svg>
            {Array.from({ length: maxCards }, (_, index) => {
              const selectedCard = selectedCards[index];
              const point = spread.layout[index] ?? { n: index + 1, x: 50, y: 50 };
              const slotPoint = getSlotPoint(point, maxCards);
              const label = getSpreadPositionLabel(spread, index);
              const guide = getLensGuideText(label, index);
              const activeSlot = index === selectedCards.length && !allSelected;
              const labelDock = getLabelDock(slotPoint, index, maxCards);
              return (
                <div
                  key={`${spread.id}-slot-${index + 1}`}
                  className="absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center"
                  style={{ left: `${slotPoint.x}%`, top: `${slotPoint.y}%` }}
                >
                  <div
                    className={`pointer-events-none absolute z-20 max-w-[7.6rem] ${
                      labelDock === "right"
                        ? "left-[calc(100%+0.55rem)] top-1/2 -translate-y-1/2 text-left"
                        : labelDock === "left"
                          ? "right-[calc(100%+0.55rem)] top-1/2 -translate-y-1/2 text-right"
                          : labelDock === "top"
                            ? "bottom-[calc(100%+0.5rem)] left-1/2 -translate-x-1/2 text-center"
                            : "left-1/2 top-[calc(100%+0.5rem)] -translate-x-1/2 text-center"
                    }`}
                  >
                    <p
                      className={`inline-flex max-w-[8.4rem] items-center rounded-full border px-2.5 py-1 font-sans text-[8px] font-black uppercase tracking-[0.11em] shadow-[0_10px_22px_rgba(9,7,20,0.24)] backdrop-blur-md sm:text-[9px] ${
                        activeSlot ? "bg-[#f7ddaf]/18 text-[#fff5d9]" : "bg-[#171527]/70 text-[#fff0df]/76"
                      }`}
                      style={{
                        borderColor: activeSlot ? "rgba(247,221,175,0.38)" : "rgba(241,184,201,0.22)",
                      }}
                    >
                      <span className="mr-1.5 inline-grid h-4 w-4 shrink-0 place-items-center rounded-full bg-white/10 text-[8px] text-[#f7ddaf]">
                        {index + 1}
                      </span>
                      <span className="truncate">{label}</span>
                    </p>
                    <p className="mt-1 hidden font-sans text-[8px] font-bold uppercase tracking-[0.14em] text-[#f1b8c9]/54 sm:block">
                      {guide}
                    </p>
                  </div>

                  <div className={`relative grid place-items-center ${lensNodeSizeClass(maxCards)}`}>
                    <motion.div
                      aria-hidden
                      className="absolute inset-[-45%] rounded-full border"
                      style={{
                        borderColor: activeSlot ? "rgba(247,221,175,0.42)" : "rgba(241,184,201,0.13)",
                        boxShadow: activeSlot
                          ? "0 0 28px rgba(247,221,175,0.16), inset 0 0 24px rgba(241,184,201,0.08)"
                          : "inset 0 0 18px rgba(255,255,255,0.03)",
                      }}
                      animate={activeSlot ? { opacity: [0.36, 0.86, 0.36], scale: [0.92, 1.14, 0.92] } : { opacity: 0.48 }}
                      transition={{ duration: 2.4, repeat: activeSlot ? Infinity : 0, ease: "easeInOut" }}
                    />
                    {!selectedCard && (
                      <motion.div
                        className="absolute inset-0 rounded-full border"
                        style={{
                          borderColor: activeSlot ? "rgba(247,221,175,0.64)" : "rgba(241,184,201,0.24)",
                          background: activeSlot
                            ? "radial-gradient(circle at 50% 42%, rgba(247,221,175,0.26), rgba(241,184,201,0.12) 46%, rgba(111,85,255,0.10))"
                            : "radial-gradient(circle at 50% 42%, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
                          boxShadow: activeSlot ? "0 0 30px rgba(247,221,175,0.18)" : "none",
                        }}
                        animate={activeSlot ? { opacity: [0.68, 1, 0.68], scale: [0.96, 1.06, 0.96] } : { opacity: 0.76 }}
                        transition={{ duration: 2.2, repeat: activeSlot ? Infinity : 0, ease: "easeInOut" }}
                      >
                        <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f7ddaf]/64 shadow-[0_0_18px_rgba(247,221,175,0.42)]" />
                        <span className="absolute left-1/2 top-1/2 h-[62%] w-px -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[#fff2df]/12" />
                        <span className="absolute left-1/2 top-1/2 h-[62%] w-px -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-[#fff2df]/12" />
                      </motion.div>
                    )}
                    {selectedCard && (
                      <motion.div
                        layoutId={`draw-card-${selectedCard.visualId}`}
                        initial={
                          placingVisualId === selectedCard.visualId
                            ? { opacity: 0, x: -90, y: -104, rotate: -18, scale: 1.34, filter: "brightness(1.45)" }
                            : { opacity: 0, y: 10, scale: 0.96 }
                        }
                        animate={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1, filter: "brightness(1)" }}
                        transition={{ type: "spring", stiffness: 135, damping: 19, mass: 0.96 }}
                        className="absolute inset-0 grid place-items-center"
                      >
                        {placingVisualId === selectedCard.visualId && (
                          <motion.span
                            aria-hidden
                            className="absolute -inset-6 rounded-full border border-[#f7ddaf]/46"
                            initial={{ opacity: 0.88, scale: 0.72 }}
                            animate={{ opacity: 0, scale: 1.38 }}
                            transition={{ duration: 0.82, ease: "easeOut" }}
                          />
                        )}
                        <span className="pointer-events-none absolute inset-[-18%] rounded-full bg-[radial-gradient(circle,rgba(247,221,175,0.18),transparent_64%)]" />
                        <TarotCardVisual
                          card={selectedCard}
                          compact
                          faceDown
                          revealed={false}
                          active
                          backStyle={backStyle}
                          positionLabel={label}
                          showFrontCaption={false}
                          className={spreadSlotClass}
                          ariaLabel={`${label}, chosen face-down card`}
                        />
                        <span className="pointer-events-none absolute -bottom-5 left-1/2 -translate-x-1/2 rounded-full border border-[#f7ddaf]/22 bg-[#080615]/76 px-2 py-0.5 font-sans text-[7px] font-black uppercase tracking-[0.18em] text-[#f7ddaf]/72 backdrop-blur-sm">
                          Sealed
                        </span>
                      </motion.div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            role="status"
            aria-live="polite"
            className="absolute bottom-[calc(var(--hint-safe-bottom)+1.25rem)] left-1/2 z-50 flex min-h-14 w-[calc(100%-2rem)] max-w-[430px] -translate-x-1/2 items-center justify-center rounded-full border border-[#f1b8c9]/20 bg-white/10 px-5 py-3 font-sans text-[12px] font-bold leading-snug text-white/82 shadow-[0_18px_42px_rgba(40,28,125,0.18)] backdrop-blur-md"
          >
            {allSelected
              ? "All signals are sealed. Opening reveal..."
              : selectedCards.length === 0
                ? `Next: ${nextPositionLabel}. The wheel opens automatically; choose one face-down card.`
                : `${selectedCards.length} sealed. Next lens: ${nextPositionLabel}.`}
          </div>
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
          <div className="pointer-events-none absolute inset-0" style={{ background: pageOverlay }} />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_58%_30%,rgba(255,255,255,0.48),transparent_32%),linear-gradient(160deg,rgba(251,247,255,0.74)_0%,rgba(238,233,251,0.52)_50%,rgba(247,242,255,0.42)_100%)]" />
          <div className={`pointer-events-none absolute inset-0 ${starClassName}`} />
          <motion.div
            className="absolute inset-x-4 top-[calc(var(--hint-safe-top)+5.75rem)] z-40"
            animate={{ opacity: zoomed ? 0 : 1, y: zoomed ? -8 : 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <motion.p
              key={`${nextCardNumber}-${zoomed ? "zoomed" : "normal"}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, ease: "easeOut" }}
              className="font-serif text-[24px] leading-tight text-[#332d45] md:text-[34px]"
            >
              Lens {nextCardNumber}
            </motion.p>
            <p className="mx-auto mt-2 max-w-[20rem] font-sans text-[12px] font-black uppercase tracking-[0.12em] text-[#6b5c86]/72">
              {nextPositionLabel}
            </p>
          </motion.div>

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
                      ? "0 30px 52px rgba(54,38,143,0.44), 0 0 42px rgba(122,96,255,0.48)"
                      : "0 12px 20px rgba(35,30,82,0.22)",
                    filter: popping ? "brightness(1.14)" : undefined,
                    transition: popping
                      ? "transform 500ms cubic-bezier(0.18, 0.82, 0.18, 1), box-shadow 420ms ease, filter 360ms ease"
                      : undefined,
                    transform: `translate(${-cardWidth / 2}px, ${-cardHeight / 2}px) rotate(${layout.rotate}rad) translateY(${popping ? "-24px" : "0px"}) scale(${popping ? 1.28 : layout.scale})`,
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

          {!zoomed && (
            <div className="pointer-events-none absolute inset-x-4 bottom-[calc(var(--hint-safe-bottom)+1.25rem)] z-50 mx-auto flex max-w-[430px] flex-col gap-2">
              <div className="rounded-[18px] border border-[#d7d0eb]/70 bg-white/70 px-4 py-3 text-left font-sans text-[11px] font-bold leading-snug text-[#5d5476]/84 shadow-[0_18px_42px_rgba(70,54,142,0.16)] backdrop-blur-md">
                Open {nextPositionLabel}. Swipe the wheel to browse. Pinch open or scroll up to zoom; numbers appear above the cards.
              </div>
              <div className="rounded-full border border-[#d7d0eb]/70 bg-white/60 px-5 py-3 font-sans text-[13px] font-black text-[#5d5476]/66 shadow-[0_18px_42px_rgba(40,28,125,0.12)] backdrop-blur-md">
                {nextPositionLabel} · {selectedCards.length} / {maxCards} sealed
              </div>
            </div>
          )}
        </motion.div>
      )}
    </section>
  );
}
