import { useRef } from "react";
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
  stage: "placed" | "washing" | "gathering" | "rested";
  ritualCards: RitualCard[];
  activeVisualIds: readonly string[];
  canRest: boolean;
  washProgress?: number;
  isAutoWashing?: boolean;
  theme?: WashRitualTheme;
  onBeginWash: () => void;
  onWash: (pointer: WashPointer) => void;
  onRest: () => void;
  onWashAgain?: () => void;
  onSelectCards?: () => void;
  onFallbackWash?: () => void;
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

export function CardWashRitual({
  stage,
  ritualCards,
  canRest,
  washProgress = 0,
  isAutoWashing = false,
  theme = DEFAULT_THEME,
  onBeginWash,
  onWash,
  onRest,
  onWashAgain,
  onSelectCards,
  onFallbackWash,
  showControls = true,
}: CardWashRitualProps) {
  const tableRef = useRef<HTMLDivElement | null>(null);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const spinDirection = useRef<1 | -1>(1);
  const washing = useRef(false);

  const progress = Math.max(0, Math.min(1, washProgress));
  const washCopy = progress > 0.82
    ? ["When it feels right, let them rest."]
    : progress > 0.58
      ? ["Let the deck loosen."]
      : progress > 0.28
        ? ["Move them in circles.", "The order was set before the wash."]
        : ["The cards have already been placed.", "Their hidden order is already set.", "Move them in circles."];
  const copy =
    isAutoWashing
      ? ["Hint is washing the deck.", "The order was set before the wash.", "When the room settles, they will rest."]
    : stage === "placed"
      ? ["The cards have already been placed.", "Their hidden order is already set.", "Move them in circles."]
      : stage === "gathering" || stage === "rested"
        ? ["The deck is quiet now.", "The cards are finding their center."]
        : washCopy;

  function move(event: React.PointerEvent<HTMLDivElement>) {
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

  return (
    <section className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden px-4 py-7">
      <div className="pointer-events-none absolute inset-0" style={{ background: theme.chamberOverlay }} />
      <div className={`pointer-events-none absolute inset-0 ${theme.starClassName}`} />

      <div className="relative z-10 mb-4 max-w-lg text-center">
        {copy.map((line, index) => (
          <motion.p
            key={line}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.45, duration: 0.9 }}
            className={index === 0 ? "font-serif text-[25px] leading-tight text-[#f7ead0] md:text-[34px]" : "mt-2 font-sans text-[13px] leading-relaxed text-[#d8c7a6]/76"}
          >
            {line}
          </motion.p>
        ))}
      </div>

      <div
        ref={tableRef}
        className="relative z-10 h-[min(64vh,610px)] w-full max-w-5xl touch-none overflow-hidden rounded-[34px] border"
        style={{
          background:
            `linear-gradient(180deg, rgba(18,24,37,0.96), rgba(6,10,20,0.99)), ${theme.tableBackground}`,
          borderColor: "rgba(232,195,118,0.16)",
          boxShadow:
            "0 22px 58px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
        onPointerDown={(event) => {
          if (stage === "gathering" || stage === "rested") return;
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
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[34px] opacity-35"
          style={{
            background:
              "repeating-linear-gradient(135deg, rgba(255,255,255,0.026) 0 1px, transparent 1px 14px)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[34px]"
          style={{
            boxShadow:
              "inset 0 18px 42px rgba(255,255,255,0.026), inset 0 -38px 72px rgba(0,0,0,0.46), inset 0 0 0 12px rgba(0,0,0,0.13)",
          }}
        />
        <div className="pointer-events-none absolute inset-[11%] rounded-[28px] border opacity-35" style={{ borderColor: theme.tableRingColor }} />
        <div className="pointer-events-none absolute inset-[31%] rounded-[24px] border opacity-25" style={{ borderColor: theme.secondaryRingColor }} />
        <div className="pointer-events-none absolute inset-0">
        {ritualCards.map((card) => (
          <div
            key={card.visualId}
            className="absolute inset-0 will-change-transform"
            style={{
              zIndex: card.zIndex,
              transform: `translate3d(${card.x}%, ${card.y}%, 0)`,
              transition:
                stage === "gathering" || stage === "rested"
                  ? `transform ${stage === "gathering" ? 480 : 360}ms cubic-bezier(0.22, 0.72, 0.21, 1) ${card.gatherDelay ?? 0}s`
                  : "transform 88ms linear",
            }}
          >
            <div
              className="absolute left-0 top-0 will-change-transform"
              style={{
                transform: `translate3d(-50%, -50%, 0) rotate(${card.rotate}deg)`,
                transition:
                  stage === "gathering" || stage === "rested"
                    ? `transform ${stage === "gathering" ? 480 : 360}ms cubic-bezier(0.22, 0.72, 0.21, 1) ${card.gatherDelay ?? 0}s`
                    : "transform 88ms linear",
              }}
            >
              <TarotCardVisual
                card={card}
                compact
                active={false}
                backStyle={theme.cardBackStyle}
                className={stage === "gathering" || stage === "rested" ? "h-[90px] w-[60px] sm:h-[116px] sm:w-[78px] md:h-[132px] md:w-[88px]" : ""}
              />
            </div>
          </div>
        ))}
        </div>
        {stage === "rested" && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="absolute bottom-[10%] left-1/2 z-[220] flex -translate-x-1/2 flex-wrap items-center justify-center gap-3 rounded-full border border-[#e4c174]/22 bg-black/34 px-4 py-3 shadow-[0_12px_28px_rgba(0,0,0,0.30)]"
          >
            <button
              type="button"
              onClick={onSelectCards}
              className="rounded-full border border-[#f0ce7f]/62 bg-[#f0ce7f]/12 px-6 py-3 font-serif text-[15px] text-[#ffe8aa] transition hover:bg-[#f0ce7f]/20"
            >
              Choose cards
            </button>
            <button
              type="button"
              onClick={onWashAgain ?? onBeginWash}
              className="rounded-full border border-[#d8c7a6]/30 bg-black/18 px-6 py-3 font-serif text-[15px] text-[#eadbbd] transition hover:bg-white/[0.04]"
            >
              Wash again
            </button>
          </motion.div>
        )}
      </div>

      {showControls && stage !== "rested" && (
        <div className="relative z-20 mt-5 flex flex-wrap items-center justify-center gap-3">
          {stage === "placed" && !isAutoWashing && (
            <button
              type="button"
              onClick={onBeginWash}
              className="rounded-full border border-[#e4c174]/38 bg-black/24 px-6 py-3 font-serif text-[15px] text-[#f7ead0] shadow-[0_10px_24px_rgba(0,0,0,0.28)] transition hover:border-[#f0ce7f]/58 hover:bg-[#e4c174]/10"
            >
              Begin washing
            </button>
          )}
          {stage === "washing" && !isAutoWashing && (
            <button
              type="button"
              onClick={onRest}
              disabled={!canRest}
              className="rounded-full border border-[#e4c174]/48 bg-[#e4c174]/10 px-6 py-3 font-serif text-[15px] text-[#f7ead0] shadow-[0_10px_24px_rgba(0,0,0,0.26)] transition hover:bg-[#e4c174]/16 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Let them rest
            </button>
          )}
          {isAutoWashing && (
            <button
              type="button"
              disabled
              className="rounded-full border border-[#d8c7a6]/30 bg-black/28 px-6 py-3 font-serif text-[15px] text-[#d8c7a6]/76 shadow-[0_8px_20px_rgba(0,0,0,0.22)]"
            >
              Washing...
            </button>
          )}
          {onFallbackWash && (stage === "placed" || stage === "washing") && !isAutoWashing && (
            <button
              type="button"
              onClick={onFallbackWash}
              className="rounded-full border border-[#d8c7a6]/28 bg-black/24 px-6 py-3 font-serif text-[15px] text-[#d8c7a6]/88 shadow-[0_8px_20px_rgba(0,0,0,0.22)] transition hover:border-[#d8c7a6]/44 hover:bg-white/[0.04]"
            >
              Auto wash
            </button>
          )}
        </div>
      )}
    </section>
  );
}
