import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { SkySignal } from "../../lib/tarot/skyGuidedTarot";
import type { SkyCardReading } from "../../lib/readings/generateSkyCardReading";
import { SkyEvidence } from "./SkyEvidence";

type SkyCardRevealProps = {
  revealed: boolean;
  onReveal: () => void;
  cardName: string;
  cardLabel?: string;
  cardFace?: ReactNode;
  cardBack?: ReactNode;
  reading?: SkyCardReading;
  evidence?: SkySignal[];
  holdMs?: number;
};

export function SkyCardReveal({
  revealed,
  onReveal,
  cardName,
  cardLabel = "Today's Sky Card",
  cardFace,
  cardBack,
  reading,
  evidence = [],
  holdMs = 620,
}: SkyCardRevealProps) {
  const reduceMotion = useReducedMotion();
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const timeoutRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  function clearTimers() {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    timeoutRef.current = null;
    intervalRef.current = null;
  }

  function clearHold() {
    clearTimers();
    setHolding(false);
    if (!revealed) setProgress(0);
  }

  function beginHold() {
    if (revealed) return;
    clearTimers();
    setHolding(true);
    const startedAt = window.performance.now();
    intervalRef.current = window.setInterval(() => {
      const elapsed = window.performance.now() - startedAt;
      setProgress(Math.min(1, elapsed / holdMs));
    }, 48);
    timeoutRef.current = window.setTimeout(() => {
      clearTimers();
      setHolding(false);
      setProgress(1);
      onReveal();
    }, holdMs);
  }

  useEffect(() => clearHold, []);

  return (
    <div className="grid justify-items-center gap-3">
      <motion.button
        type="button"
        onPointerDown={beginHold}
        onPointerUp={clearHold}
        onPointerLeave={clearHold}
        onPointerCancel={clearHold}
        onClick={() => {
          if (reduceMotion && !revealed) onReveal();
        }}
        className="relative rounded-[22px] outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--hint-gold)_70%,white)]"
        aria-label={revealed ? `${cardLabel}: ${cardName}` : "Press and hold to reveal sky card"}
      >
        <motion.div
          className="overflow-hidden rounded-[22px]"
          animate={
            revealed
              ? { rotateY: 0, y: 0, scale: 1 }
              : { rotateY: holding ? -8 : 0, y: holding ? -8 : 0, scale: holding ? 1.035 : 1 }
          }
          transition={reduceMotion ? { duration: 0.12 } : { duration: 0.28, ease: "easeOut" }}
          style={{ transformStyle: "preserve-3d" }}
        >
          {revealed ? cardFace ?? <DefaultFace cardName={cardName} /> : cardBack ?? <DefaultBack />}
        </motion.div>
        {!revealed && (
          <span
            aria-hidden
            className="absolute inset-x-5 bottom-3 h-1 overflow-hidden rounded-full"
            style={{ background: "color-mix(in srgb, var(--hint-border) 64%, transparent)" }}
          >
            <span
              className="block h-full rounded-full transition-transform duration-75"
              style={{
                background: "var(--hint-gold, #cba866)",
                transform: `scaleX(${progress})`,
                transformOrigin: "left center",
              }}
            />
          </span>
        )}
      </motion.button>

      {revealed && reading && (
        <div className="max-w-md text-center">
          <p className="font-serif text-[24px] leading-tight" style={{ color: "var(--hint-text)" }}>
            {cardName}
          </p>
          <p className="mt-2 font-sans text-[13px] leading-relaxed" style={{ color: "var(--hint-muted)" }}>
            {reading.shortAnswer}
          </p>
        </div>
      )}

      {revealed && evidence.length > 0 && (
        <div className="w-full max-w-md">
          <SkyEvidence signals={evidence} why={reading?.whyThisCard.join(" ")} compact />
        </div>
      )}
    </div>
  );
}

function DefaultBack() {
  return (
    <div
      className="grid h-[17rem] w-[11rem] place-items-center border"
      style={{
        color: "var(--hint-gold, #cba866)",
        background: "linear-gradient(145deg, #07101c, #102842)",
        borderColor: "var(--hint-gold, #cba866)",
      }}
    >
      H
    </div>
  );
}

function DefaultFace({ cardName }: { cardName: string }) {
  return (
    <div
      className="grid h-[17rem] w-[11rem] place-items-center border p-4 text-center"
      style={{
        color: "var(--hint-text)",
        background: "linear-gradient(145deg, #fff9e9, #e8d39a)",
        borderColor: "var(--hint-gold, #cba866)",
      }}
    >
      <span className="font-serif text-[24px] leading-tight">{cardName}</span>
    </div>
  );
}
