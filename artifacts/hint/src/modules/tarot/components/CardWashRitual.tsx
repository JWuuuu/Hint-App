import { useEffect, useRef, useState, type PointerEvent } from "react";
import { motion } from "framer-motion";
import type { RitualCard } from "../logic/createHiddenDeck";
import type { WashPointer } from "../logic/washPhysics";
import {
  getDefaultTarotCardBackForStyle,
  getTarotCardBackImage,
  type TarotCardBackId,
  type TarotCardBackStyle,
} from "../logic/cardBacks";

export type WashRitualTheme = {
  chamberOverlay: string;
  starClassName: string;
  tableBackground: string;
  tableBorderColor: string;
  tableShadow: string;
  tableRingColor: string;
  secondaryRingColor: string;
  cardBackStyle: TarotCardBackStyle;
  cardBackId: TarotCardBackId;
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

type IntroStep = "stack" | "spread" | "closing" | "gather";

const DEFAULT_THEME: WashRitualTheme = {
  chamberOverlay:
    "linear-gradient(180deg, rgba(255,237,246,0.12), rgba(12,8,26,0.04) 28%, rgba(220,196,255,0.08) 62%, rgba(4,3,12,0.98) 100%), radial-gradient(ellipse at 50% 36%, rgba(246,187,207,0.24), transparent 30%), radial-gradient(circle at 50% 52%, rgba(26,19,50,0.94), rgba(7,6,18,0.98) 65%, #020106 100%)",
  starClassName:
    "opacity-44 [background-image:radial-gradient(circle_at_20%_30%,rgba(255,238,246,0.86)_0_1px,transparent_1px),radial-gradient(circle_at_82%_18%,rgba(248,214,152,0.82)_0_1px,transparent_1px),radial-gradient(circle_at_68%_74%,rgba(219,199,255,0.66)_0_1px,transparent_1px)] [background-size:120px_140px]",
  tableBackground:
    "radial-gradient(circle at 48% 42%, rgba(255,236,244,0.18), transparent 30%), radial-gradient(circle at 50% 54%, rgba(45,37,78,0.82), rgba(14,11,30,0.95) 58%, rgba(4,3,12,0.99) 100%)",
  tableBorderColor: "rgba(238,188,205,0.28)",
  tableShadow:
    "0 35px 110px rgba(0,0,0,0.68), 0 0 46px rgba(221,180,255,0.10), inset 0 0 92px rgba(246,187,207,0.13)",
  tableRingColor: "rgba(246,187,207,0.22)",
  secondaryRingColor: "rgba(248,214,152,0.14)",
  cardBackStyle: "nocturne",
  cardBackId: getDefaultTarotCardBackForStyle("nocturne"),
};

function RitualBackCard({
  cardBackId,
  className = "",
}: {
  cardBackId: TarotCardBackId;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[10px] border border-[#d7bd7c]/62 bg-[#182139] shadow-[0_8px_18px_rgba(0,0,0,0.22)] ${className}`}
      style={{
        backgroundImage: `url("${getTarotCardBackImage(cardBackId)}")`,
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <span className="pointer-events-none absolute inset-[5px] rounded-[7px] border border-white/12" />
    </div>
  );
}

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
    x: 50 + offset * 0.05 + wave * 0.1,
    y: 50 + offset * 0.028 + Math.cos(index * 0.91) * 0.06,
    rotate: depth * 3.4 + wave * 0.28,
    zIndex: index,
  };
}

function getIntroCircleTransform(index: number, total: number, step: IntroStep) {
  const progress = total <= 1 ? 0 : index / (total - 1);
  const clockDegrees = step === "stack" ? 0 : step === "closing" ? 360 : progress * 360;

  return {
    x: 50,
    y: 50,
    rotate: 0,
    zIndex: (step === "stack" ? 1800 : 1000) + index,
    outerTransform: `translate3d(50%, 50%, 0) rotate(${clockDegrees}deg) translate3d(0, -34%, 0)`,
  };
}

function getIntroDeckTransform(index: number, total: number, step: IntroStep) {
  if (step === "stack" || step === "closing") {
    return getIntroCircleTransform(index, total, step);
  }

  if (step !== "spread") return getFullDeckTransform(index, total);

  return getIntroCircleTransform(index, total, step);
}

function getIntroTransition(index: number, total: number, step: IntroStep) {
  if (step === "spread") {
    return `transform 1280ms cubic-bezier(0.18, 0.86, 0.2, 1) ${index * 0.0038}s`;
  }

  if (step === "closing") {
    return `transform 1220ms cubic-bezier(0.2, 0.82, 0.2, 1) ${index * 0.0032}s`;
  }

  if (step === "gather") {
    return `transform 1080ms cubic-bezier(0.24, 0.76, 0.18, 1) ${(total - index) * 0.0014}s`;
  }

  return `transform 820ms cubic-bezier(0.2, 0.78, 0.2, 1) ${index * 0.0012}s`;
}

export function CardWashRitual({
  stage,
  ritualCards,
  washProgress = 0,
  theme = DEFAULT_THEME,
  onBeginWash,
  onWash,
  onWashRelease,
}: CardWashRitualProps) {
  const tableRef = useRef<HTMLDivElement | null>(null);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const spinDirection = useRef<1 | -1>(1);
  const washing = useRef(false);
  const washDistance = useRef(0);
  const lastWashPush = useRef(0);
  const releaseTriggered = useRef(false);
  const beginWashCallback = useRef(onBeginWash);
  const washReleaseCallback = useRef(onWashRelease);
  const [introStep, setIntroStep] = useState<IntroStep>("stack");
  const [washIntroSettled, setWashIntroSettled] = useState(false);

  const progress = Math.max(0, Math.min(1, washProgress));
  const introReady = stage !== "placed";
  const title =
    stage === "placed"
      ? "Full deck"
      : stage === "gathering"
        ? "Gathering"
        : stage === "cutReady" || stage === "cutting"
          ? "Cut the deck"
          : progress > 0.72
            ? "Ready to cut"
            : "Wash deck";
  const helperCopy =
    stage === "placed"
      ? "Watch the deck open clockwise, close, then wash by touch."
      : stage === "washing"
        ? "Move the deck in slow circles, then release to cut."
        : stage === "cutting"
          ? "The deck is being cut and squared for your question."
        : "";
  const isDeckStackStage = stage === "gathering" || stage === "cutReady" || stage === "cutting";
  const isFullDeckStage = stage === "placed";
  const cardTransitionMs = stage === "gathering" ? 560 : stage === "cutting" ? 620 : 86;
  const cardTransitionEase = stage === "gathering"
    ? "cubic-bezier(0.2, 0.82, 0.16, 1)"
    : stage === "cutting"
      ? "cubic-bezier(0.22, 0.78, 0.14, 1)"
      : "linear";

  useEffect(() => {
    beginWashCallback.current = onBeginWash;
  }, [onBeginWash]);

  useEffect(() => {
    washReleaseCallback.current = onWashRelease;
  }, [onWashRelease]);

  useEffect(() => {
    if (stage !== "placed") return undefined;
    releaseTriggered.current = false;
    washDistance.current = 0;
    setIntroStep("stack");
    const spreadTimer = window.setTimeout(() => setIntroStep("spread"), 340);
    const closingTimer = window.setTimeout(() => setIntroStep("closing"), 3080);
    const gatherTimer = window.setTimeout(() => setIntroStep("gather"), 4620);
    const washTimer = window.setTimeout(() => beginWashCallback.current(), 6100);

    return () => {
      window.clearTimeout(spreadTimer);
      window.clearTimeout(closingTimer);
      window.clearTimeout(gatherTimer);
      window.clearTimeout(washTimer);
    };
  }, [stage]);

  useEffect(() => {
    if (stage !== "washing") {
      setWashIntroSettled(false);
      return undefined;
    }

    setWashIntroSettled(false);
    const settleTimer = window.setTimeout(() => setWashIntroSettled(true), 760);
    return () => window.clearTimeout(settleTimer);
  }, [stage]);

  function triggerWashRelease() {
    if (releaseTriggered.current) return;
    releaseTriggered.current = true;
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
    washDistance.current += Math.hypot(x - previous.x, y - previous.y);
    if (Math.abs(turn) > 18) {
      spinDirection.current = turn >= 0 ? 1 : -1;
    }
    lastPoint.current = { x, y };
    const now = performance.now();
    if (now - lastWashPush.current < 24) return;
    lastWashPush.current = now;
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
    const movedEnoughToCut = washDistance.current >= 42;
    washing.current = false;
    lastPoint.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (movedEnoughToCut) {
      triggerWashRelease();
    }
  }

  return (
    <section
      data-ritual-stage={stage}
      data-intro-step={isFullDeckStage ? introStep : ""}
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden px-4 pb-[calc(var(--hint-safe-bottom)+5.25rem)] pt-[calc(var(--hint-safe-top)+1rem)]"
    >
      <div className="pointer-events-none absolute inset-0" style={{ background: theme.chamberOverlay }} />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        animate={{ opacity: [0.52, 0.74, 0.58] }}
        transition={{ duration: 6.5, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        style={{
          background:
            "linear-gradient(135deg, rgba(255,220,233,0.10), transparent 30%, rgba(222,203,255,0.08) 58%, rgba(255,228,170,0.08))",
        }}
      />
      <div className={`pointer-events-none absolute inset-0 ${theme.starClassName}`} />
      <div className="pointer-events-none absolute left-1/2 top-[50%] h-[min(112vw,560px)] w-[min(112vw,560px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#f6bbcf]/14 shadow-[inset_0_0_74px_rgba(246,187,207,0.10),0_0_64px_rgba(221,180,255,0.08)]" />

      <div className="relative z-20 mt-2 flex w-full max-w-[18rem] items-center justify-center gap-2">
        {[0, 1, 2, 3].map((step) => (
          <span
            key={step}
            className="h-1.5 flex-1 rounded-full"
            style={{
              background: step <= STAGE_INDEX[stage]
                ? "linear-gradient(90deg, #f1b8c9, #d9b8ff 52%, #ffe3a6)"
                : "rgba(255,244,250,0.11)",
              boxShadow: step <= STAGE_INDEX[stage] ? "0 0 20px rgba(241,184,201,0.26), 0 0 28px rgba(217,184,255,0.18)" : "none",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mt-8 text-center">
        <motion.p
          key={title}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.46, ease: [0.2, 0.76, 0.2, 1] }}
          className="font-serif text-[24px] leading-tight text-[#fff0df] drop-shadow-[0_10px_24px_rgba(25,12,25,0.34)] md:text-[34px]"
        >
          {title}
        </motion.p>
        {helperCopy ? (
          <motion.p
            key={helperCopy}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.44, ease: [0.2, 0.76, 0.2, 1] }}
            className="mx-auto mt-2 max-w-[22rem] px-3 font-sans text-[12px] font-semibold leading-snug text-[#ead7dc]/82"
          >
            {helperCopy}
          </motion.p>
        ) : null}
      </div>

      <div
        ref={tableRef}
        className={`relative z-10 mt-3 touch-none overflow-hidden ${
          isDeckStackStage
            ? "h-[min(44vh,460px)] w-[min(118vw,560px)]"
            : isFullDeckStage
              ? "h-[min(90vw,500px)] w-[min(90vw,500px)]"
              : "h-[min(62vh,620px)] w-[min(124vw,640px)]"
        }`}
        style={{
          filter: isFullDeckStage ? "drop-shadow(0 24px 36px rgba(0,0,0,0.38))" : undefined,
        }}
        onPointerDown={(event) => {
          if (stage === "gathering" || stage === "cutReady" || stage === "cutting") return;
          if (stage === "placed" && !introReady) return;
          washing.current = true;
          washDistance.current = 0;
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
          className="pointer-events-none absolute inset-x-[14%] top-[18%] h-[72%] rounded-full opacity-45"
          style={{
            background:
              isFullDeckStage
                ? "radial-gradient(ellipse at 50% 54%, rgba(255,225,236,0.14), rgba(220,196,255,0.12) 34%, transparent 64%)"
                : `radial-gradient(circle at 50% 44%, rgba(255,238,246,0.14), transparent 32%), ${theme.tableBackground}`,
          }}
        />
        {(isFullDeckStage || !isDeckStackStage) && (
          <>
            <div className="pointer-events-none absolute inset-[9%] rounded-full border opacity-45" style={{ borderColor: theme.tableRingColor, boxShadow: "inset 0 0 42px rgba(255,225,236,0.05)" }} />
            <div className="pointer-events-none absolute inset-[27%] rounded-full border opacity-32" style={{ borderColor: theme.secondaryRingColor }} />
          </>
        )}
        <div className="pointer-events-none absolute inset-0">
        {ritualCards.map((card, index) => {
          const fullDeck = getIntroDeckTransform(index, ritualCards.length, introStep);
          const introCardsAreSmall = introStep === "stack" || introStep === "spread" || introStep === "closing";
          const x = isFullDeckStage ? fullDeck.x : card.x;
          const y = isFullDeckStage ? fullDeck.y : card.y;
          const rotate = isFullDeckStage ? fullDeck.rotate : card.rotate;
          const zIndex = isFullDeckStage ? fullDeck.zIndex : card.zIndex;
          const outerTransform = isFullDeckStage && "outerTransform" in fullDeck && typeof fullDeck.outerTransform === "string"
            ? fullDeck.outerTransform
            : `translate3d(${x}%, ${y}%, 0)`;
          const cardClassName = isFullDeckStage
            ? `${
              introCardsAreSmall
                ? "h-[104px] w-[66px] min-[430px]:h-[118px] min-[430px]:w-[74px] sm:h-[132px] sm:w-[84px]"
                : "h-[192px] w-[122px] min-[430px]:h-[226px] min-[430px]:w-[144px] sm:h-[252px] sm:w-[160px]"
            } transition-[height,width] duration-700 ease-out`
            : stage === "cutReady" || stage === "cutting"
              ? "h-[148px] w-[94px] sm:h-[166px] sm:w-[106px] md:h-[184px] md:w-[118px]"
            : isDeckStackStage
              ? "h-[94px] w-[62px] sm:h-[116px] sm:w-[78px] md:h-[132px] md:w-[88px]"
              : "h-[116px] w-[76px] sm:h-[132px] sm:w-[86px]";
          return (
          <div
            key={card.visualId}
            data-intro-card-index={index}
            className="absolute inset-0 will-change-transform"
            style={{
              zIndex,
              transform: outerTransform,
              transformOrigin: isFullDeckStage ? "0 0" : undefined,
              transition:
                isFullDeckStage
                  ? getIntroTransition(index, ritualCards.length, introStep)
                  : isDeckStackStage
                    ? `transform ${cardTransitionMs}ms ${cardTransitionEase} ${Math.min(card.gatherDelay ?? 0, 0.08)}s`
                    : stage === "washing" && !washIntroSettled
                      ? `transform 760ms cubic-bezier(0.22, 0.78, 0.18, 1) ${Math.min(index, 22) * 0.004}s`
                      : "transform 70ms linear",
            }}
          >
            <div
              className="absolute left-0 top-0 will-change-transform"
              style={{
                transform: `translate3d(-50%, -50%, 0) rotate(${rotate}deg)`,
                transition:
                  isFullDeckStage
                    ? getIntroTransition(index, ritualCards.length, introStep)
                    : isDeckStackStage
                      ? `transform ${cardTransitionMs}ms ${cardTransitionEase} ${Math.min(card.gatherDelay ?? 0, 0.08)}s`
                      : stage === "washing" && !washIntroSettled
                        ? `transform 760ms cubic-bezier(0.22, 0.78, 0.18, 1) ${Math.min(index, 22) * 0.004}s`
                        : `transform ${cardTransitionMs}ms linear`,
              }}
            >
              <RitualBackCard cardBackId={theme.cardBackId} className={cardClassName} />
            </div>
          </div>
        );
        })}
        </div>
      </div>
    </section>
  );
}
