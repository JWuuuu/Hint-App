import { useRef } from "react";
import { motion } from "framer-motion";
import type { RitualCard } from "../logic/createHiddenDeck";
import type { WashPointer } from "../logic/washPhysics";
import { TarotCardVisual } from "./TarotCardVisual";

type CardWashRitualProps = {
  stage: "placed" | "washing" | "gathering";
  ritualCards: RitualCard[];
  activeVisualIds: readonly string[];
  canRest: boolean;
  onBeginWash: () => void;
  onWash: (pointer: WashPointer) => void;
  onRest: () => void;
};

export function CardWashRitual({
  stage,
  ritualCards,
  activeVisualIds,
  canRest,
  onBeginWash,
  onWash,
  onRest,
}: CardWashRitualProps) {
  const tableRef = useRef<HTMLDivElement | null>(null);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const washing = useRef(false);

  const copy =
    stage === "placed"
      ? ["The cards have already been placed.", "Wash them slowly."]
      : stage === "gathering"
        ? ["The deck is quiet now.", "The cards are finding their center."]
        : ["Move in circles.", "Let the cards loosen.", "When it feels right, let them rest."];

  function move(event: React.PointerEvent<HTMLDivElement>) {
    if (!washing.current || !tableRef.current) return;
    const rect = tableRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const previous = lastPoint.current ?? { x, y };
    lastPoint.current = { x, y };
    onWash({
      x,
      y,
      movementX: x - previous.x,
      movementY: y - previous.y,
      width: rect.width,
      height: rect.height,
    });
  }

  return (
    <section className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(222,178,95,0.18),transparent_28%),radial-gradient(circle_at_50%_50%,rgba(20,38,68,0.82),rgba(3,5,12,0.96)_62%,#010207_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.8)_0_1px,transparent_1px),radial-gradient(circle_at_82%_18%,rgba(239,205,139,0.9)_0_1px,transparent_1px),radial-gradient(circle_at_68%_74%,rgba(151,224,218,0.7)_0_1px,transparent_1px)] [background-size:120px_140px]" />

      <div className="relative z-10 mb-5 max-w-xl text-center">
        {copy.map((line, index) => (
          <motion.p
            key={line}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.45, duration: 0.9 }}
            className={index === 0 ? "font-serif text-3xl text-[#f7ead0] md:text-4xl" : "mt-2 font-sans text-sm text-[#d8c7a6]/78"}
          >
            {line}
          </motion.p>
        ))}
      </div>

      <div
        ref={tableRef}
        className="relative z-10 h-[min(66vh,620px)] w-full max-w-6xl touch-none overflow-hidden rounded-full border border-[#d8ba72]/20 bg-[radial-gradient(circle_at_50%_50%,rgba(35,48,72,0.76),rgba(9,13,27,0.94)_55%,rgba(2,3,8,0.98)_100%)] shadow-[0_35px_110px_rgba(0,0,0,0.72),inset_0_0_90px_rgba(226,190,116,0.09)]"
        onPointerDown={(event) => {
          if (stage === "gathering") return;
          washing.current = true;
          lastPoint.current = null;
          event.currentTarget.setPointerCapture(event.pointerId);
          onBeginWash();
          move(event);
        }}
        onPointerMove={move}
        onPointerUp={() => {
          washing.current = false;
          lastPoint.current = null;
        }}
        onPointerCancel={() => {
          washing.current = false;
          lastPoint.current = null;
        }}
      >
        <div className="pointer-events-none absolute inset-[9%] rounded-full border border-[#e3c37a]/16" />
        <div className="pointer-events-none absolute inset-[24%] rounded-full border border-[#94deda]/10" />
        {ritualCards.map((card) => (
          <motion.div
            key={card.visualId}
            className="absolute"
            animate={{
              left: `${card.x}%`,
              top: `${card.y}%`,
              rotate: card.rotate,
              x: "-50%",
              y: "-50%",
            }}
            transition={{
              type: "spring",
              stiffness: stage === "gathering" ? 70 : 180,
              damping: stage === "gathering" ? 22 : 26,
              mass: 0.7,
            }}
            style={{ zIndex: card.zIndex }}
          >
            <TarotCardVisual
              card={card}
              compact
              active={activeVisualIds.includes(card.visualId)}
            />
          </motion.div>
        ))}
      </div>

      <div className="relative z-20 mt-5 flex items-center gap-3">
        {stage === "placed" && (
          <button
            type="button"
            onClick={onBeginWash}
            className="rounded-full border border-[#e4c174]/40 px-5 py-3 font-sans text-xs uppercase tracking-[0.22em] text-[#f7ead0] shadow-[0_12px_35px_rgba(0,0,0,0.38)]"
          >
            Begin washing
          </button>
        )}
        {stage === "washing" && (
          <button
            type="button"
            onClick={onRest}
            disabled={!canRest}
            className="rounded-full border border-[#e4c174]/40 px-5 py-3 font-sans text-xs uppercase tracking-[0.22em] text-[#f7ead0] disabled:opacity-35"
          >
            Let them rest
          </button>
        )}
      </div>
    </section>
  );
}
