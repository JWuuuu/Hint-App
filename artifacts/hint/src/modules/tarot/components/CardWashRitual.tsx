import { useEffect, useRef, type PointerEvent } from "react";
import { motion } from "framer-motion";
import type { RitualCard } from "../logic/createHiddenDeck";
import type { WashPointer } from "../logic/washPhysics";
import { TarotCardVisual } from "./TarotCardVisual";
import type { TarotCardBackStyle } from "./TarotCardVisual";

export type WashRitualTheme = {
  chamberOverlay: string;
  starClassName: string;
  tableBackground: string;
  tableBorderColor: string;
  tableShadow: string;
  tableRingColor: string;
  secondaryRingColor: string;
  cardBackStyle: TarotCardBackStyle;
};

type CardWashRitualProps = {
  stage: "placed" | "washing" | "gathering" | "cutReady" | "cutting";
  ritualCards: RitualCard[];
  washProgress?: number;
  theme?: WashRitualTheme;
  onBeginWash: () => void;
  onWash: (pointer: WashPointer) => void;
  onWashRelease: () => void;
  onCutDeck: () => void;
  onContinue?: () => void;
  showControls?: boolean;
};

const DEFAULT_THEME: WashRitualTheme = {
  chamberOverlay:
    "radial-gradient(circle at 50% 48%, rgba(222,178,95,0.18), transparent 28%), radial-gradient(circle at 50% 50%, rgba(20,38,68,0.82), rgba(3,5,12,0.96) 62%, #010207 100%)",
  starClassName:
    "opacity-40 [background-image:radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.8)_0_1px,transparent_1px),radial-gradient(circle_at_82%_18%,rgba(239,205,139,0.9)_0_1px,transparent_1px),radial-gradient(circle_at_68%_74%,rgba(151,224,218,0.7)_0_1px,transparent_1px)] [background-size:120px_140px]",
  tableBackground:
    "radial-gradient(circle at 50% 50%, rgba(35,48,72,0.76), rgba(9,13,27,0.94) 55%, rgba(2,3,8,0.98) 100%)",
  tableBorderColor: "rgba(216,186,114,0.20)",
  tableShadow:
    "0 35px 110px rgba(0,0,0,0.72), inset 0 0 90px rgba(226,190,116,0.09)",
  tableRingColor: "rgba(227,195,122,0.16)",
  secondaryRingColor: "rgba(148,222,218,0.10)",
  cardBackStyle: "nocturne",
};

const STAGE_INDEX: Record<CardWashRitualProps["stage"], number> = {
  placed: 0,
  washing: 1,
  gathering: 2,
  cutReady: 2,
  cutting: 2,
};

function getFullDeckTransform(index: number, total: number) {
  const midpoint = Math.max(1, (total - 1) / 2);
  const offset = index - midpoint;
  const depth = offset / midpoint;
  const wave = Math.sin(index * 1.37);

  return {
    x: 50 + offset * 0.055 + wave * 0.14,
    y: 50 + offset * 0.032 + Math.cos(index * 0.91) * 0.08,
    rotate: depth * 5 + wave * 0.45,
    zIndex: index,
  };
}

export function CardWashRitual({
  stage,
  ritualCards,
  washProgress = 0,
  theme = DEFAULT_THEME,
  onBeginWash,
  onWash,
  onWashRelease,
  showControls = true,
}: CardWashRitualProps) {
  const tableRef = useRef<HTMLDivElement | null>(null);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const spinDirection = useRef<1 | -1>(1);
  const washing = useRef(false);
  const releaseTriggered = useRef(false);
  const autoReleaseTimer = useRef<number | null>(null);
  const washReleaseCallback = useRef(onWashRelease);

  const progress = Math.max(0, Math.min(1, washProgress));
  const title =
    stage === "placed"
      ? "Full deck"
      : stage === "gathering"
        ? "Gathering"
        : stage === "cutReady" || stage === "cutting"
          ? "Cut the deck"
          : progress > 0.72
            ? "Ready to cut"
            : "Wash the deck";
  const primaryLabel = "Wash deck";
  const showPrimaryControls = showControls && stage === "placed";
  const isDeckStackStage = stage === "gathering" || stage === "cutReady" || stage === "cutting";
  const isFullDeckStage = stage === "placed";
  const cardTransitionMs = stage === "gathering" ? 760 : stage === "cutting" ? 540 : 70;
  const cardTransitionEase = stage === "gathering"
    ? "cubic-bezier(0.18, 0.82, 0.18, 1)"
    : stage === "cutting"
      ? "cubic-bezier(0.24, 0.72, 0.22, 1)"
      : "linear";

  useEffect(() => {
    washReleaseCallback.current = onWashRelease;
  }, [onWashRelease]);

  useEffect(() => {
    if (autoReleaseTimer.current) {
      window.clearTimeout(autoReleaseTimer.current);
      autoReleaseTimer.current = null;
    }

    if (stage === "placed") {
      releaseTriggered.current = false;
    }

    if (stage !== "washing" || washing.current) return undefined;

    autoReleaseTimer.current = window.setTimeout(() => {
      triggerWashRelease();
    }, 900);

    return () => {
      if (autoReleaseTimer.current) {
        window.clearTimeout(autoReleaseTimer.current);
        autoReleaseTimer.current = null;
      }
    };
  }, [stage]);

  function triggerWashRelease() {
    if (releaseTriggered.current) return;
    releaseTriggered.current = true;
    if (autoReleaseTimer.current) {
      window.clearTimeout(autoReleaseTimer.current);
      autoReleaseTimer.current = null;
    }
    washReleaseCallback.current();
  }

  function move(event: PointerEvent<HTMLDivElement>) {
    if (!washing.current || !tableRef.current) return;
    const rect = tableRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const previous = lastPoint.current ?? { x, y };
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const previousVectorX = previous.x - centerX;
    const previousVectorY = previous.y - centerY;
    const currentVectorX = x - centerX;
    const currentVectorY = y - centerY;
    const turn = previousVectorX * currentVectorY - previousVectorY * currentVectorX;
    if (Math.abs(turn) > 18) {
      spinDirection.current = turn >= 0 ? 1 : -1;
    }
    lastPoint.current = { x, y };
    onWash({
      x,
      y,
      movementX: x - previous.x,
      movementY: y - previous.y,
      width: rect.width,
      height: rect.height,
      spinDirection: spinDirection.current,
    });
  }

  function finishPointerWash(event: PointerEvent<HTMLDivElement>) {
    if (!washing.current) return;
    washing.current = false;
    lastPoint.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    triggerWashRelease();
  }

  return (
    <section className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden px-4 pb-[calc(var(--hint-safe-bottom)+5.25rem)] pt-[calc(var(--hint-safe-top)+1rem)]">
      <div className="pointer-events-none absolute inset-0" style={{ background: theme.chamberOverlay }} />
      <div className={`pointer-events-none absolute inset-0 ${theme.starClassName}`} />
      <div className="pointer-events-none absolute left-1/2 top-[50%] h-[min(112vw,560px)] w-[min(112vw,560px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#e8c777]/10 shadow-[inset_0_0_70px_rgba(232,199,119,0.08)]" />

      <div className="relative z-20 mt-2 flex w-full max-w-[18rem] items-center justify-center gap-2">
        {[0, 1, 2, 3].map((step) => (
          <span
            key={step}
            className="h-1.5 flex-1 rounded-full"
            style={{
              background: step <= STAGE_INDEX[stage]
                ? "linear-gradient(90deg, #7057ff, #9b6cff)"
                : "rgba(255,255,255,0.08)",
              boxShadow: step <= STAGE_INDEX[stage] ? "0 0 18px rgba(112,87,255,0.34)" : "none",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mt-8 text-center">
        <motion.p
          key={title}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36, ease: "easeOut" }}
          className="font-serif text-[24px] leading-tight text-[#f7ead0] md:text-[34px]"
        >
          {title}
        </motion.p>
      </div>

      <div
        ref={tableRef}
        className={`relative z-10 mt-3 w-[min(118vw,560px)] touch-none overflow-hidden ${isDeckStackStage ? "h-[min(44vh,460px)]" : isFullDeckStage ? "h-[min(46vh,430px)]" : "h-[min(58vh,560px)]"}`}
        style={{
          filter: isFullDeckStage ? "drop-shadow(0 24px 36px rgba(0,0,0,0.38))" : undefined,
        }}
        onPointerDown={(event) => {
          if (stage === "gathering" || stage === "cutReady" || stage === "cutting") return;
          washing.current = true;
          lastPoint.current = null;
          event.currentTarget.setPointerCapture(event.pointerId);
          onBeginWash();
          move(event);
        }}
        onPointerMove={move}
        onPointerUp={finishPointerWash}
        onPointerCancel={finishPointerWash}
        onLostPointerCapture={(event) => {
          if (stage === "washing") finishPointerWash(event);
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-[14%] top-[18%] h-[72%] rounded-full opacity-35"
          style={{
            background:
              isFullDeckStage
                ? "radial-gradient(ellipse at 50% 54%, rgba(244,214,144,0.11), rgba(20,38,68,0.20) 34%, transparent 64%)"
                : `radial-gradient(circle at 50% 44%, rgba(255,246,219,0.10), transparent 32%), ${theme.tableBackground}`,
          }}
        />
        {(isFullDeckStage || !isDeckStackStage) && (
          <>
            <div className="pointer-events-none absolute inset-[9%] rounded-full border opacity-35" style={{ borderColor: theme.tableRingColor }} />
            <div className="pointer-events-none absolute inset-[27%] rounded-full border opacity-25" style={{ borderColor: theme.secondaryRingColor }} />
          </>
        )}
        <div className="pointer-events-none absolute inset-0">
        {ritualCards.map((card, index) => {
          const fullDeck = getFullDeckTransform(index, ritualCards.length);
          const x = isFullDeckStage ? fullDeck.x : card.x;
          const y = isFullDeckStage ? fullDeck.y : card.y;
          const rotate = isFullDeckStage ? fullDeck.rotate : card.rotate;
          const zIndex = isFullDeckStage ? fullDeck.zIndex : card.zIndex;
          return (
          <div
            key={card.visualId}
            className="absolute inset-0 will-change-transform"
            style={{
              zIndex,
              transform: `translate3d(${x}%, ${y}%, 0)`,
              transition:
                isFullDeckStage
                  ? `transform 620ms cubic-bezier(0.18, 0.82, 0.18, 1) ${index * 0.002}s`
                  : isDeckStackStage
                    ? `transform ${cardTransitionMs}ms ${cardTransitionEase} ${card.gatherDelay ?? 0}s`
                    : "transform 70ms linear",
            }}
          >
            <div
              className="absolute left-0 top-0 will-change-transform"
              style={{
                transform: `translate3d(-50%, -50%, 0) rotate(${rotate}deg)`,
                transition:
                  isFullDeckStage
                    ? `transform 620ms cubic-bezier(0.18, 0.82, 0.18, 1) ${index * 0.002}s`
                    : isDeckStackStage
                      ? `transform ${cardTransitionMs}ms ${cardTransitionEase} ${card.gatherDelay ?? 0}s`
                      : "transform 70ms linear",
              }}
            >
              <TarotCardVisual
                card={card}
                compact
                active={false}
                backStyle={theme.cardBackStyle}
                className={
                  isFullDeckStage
                    ? "h-[192px] w-[122px] min-[430px]:h-[226px] min-[430px]:w-[144px] sm:h-[252px] sm:w-[160px]"
                    : isDeckStackStage
                      ? "h-[94px] w-[62px] sm:h-[116px] sm:w-[78px] md:h-[132px] md:w-[88px]"
                      : "h-[116px] w-[76px] sm:h-[132px] sm:w-[86px]"
                }
              />
            </div>
          </div>
        );
        })}
        </div>
      </div>

      {showPrimaryControls && (
        <div className="relative z-20 mt-auto flex w-full max-w-[430px] flex-col items-center justify-center gap-2 px-4">
          <button
            type="button"
            onClick={onBeginWash}
            className="min-h-12 w-full rounded-full border border-[#806cff]/70 bg-[#6d4dff] px-8 py-3 font-sans text-[15px] font-black text-white shadow-[0_18px_42px_rgba(40,28,125,0.34),0_0_34px_rgba(116,89,255,0.24)] transition enabled:hover:scale-[1.012] enabled:active:scale-[0.99] disabled:border-white/8 disabled:bg-white/10 disabled:text-white/28"
          >
            {primaryLabel}
          </button>
        </div>
      )}
    </section>
  );
}
