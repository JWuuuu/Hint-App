import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { PanInfo } from "framer-motion";
import type { TarotReading } from "@workspace/api-client-react";
import type { TarotRoomSetup } from "../useHoldFlow";
import { IVORY, GOLD, TEXT_HALO } from "../atmosphere";
import { CardSigil } from "./CardSigil";
import { useLanguage } from "../../../lib/i18n";

/**
 * TarotRitual — a tactile, deliberate card ceremony that replaces the
 * "draw" moment inside the immersive Hold flow. Five states:
 *
 *   SCATTERED → GATHERED → CUT → FANNED → DRAWN
 *
 * The ceremony uses 22 mock Major Arcana card-backs for the physical
 * ritual. The final DRAWN reveal flips to the REAL reading card, then
 * the caller advances to the AI interpretation + chat.
 */

type RitualState = "SCATTERED" | "GATHERED" | "CUT" | "FANNED" | "DRAWN";

interface Props {
  reading: TarotReading | null;
  roomSetup?: TarotRoomSetup | null;
  onComplete: () => void;
}

interface DeckVisual {
  back: string;
  front: string;
  border: string;
  innerBorder: string;
  stroke: string;
  bloom: string;
  shadow: string;
}

const CARD_COUNT = 22;
const W = 64;
const H = 100;
const HW = W / 2;
const HH = H / 2;

const RITUAL_PHASES: Array<{ state: RitualState; labelKey: string }> = [
  { state: "SCATTERED", labelKey: "tarot.ritual.phase.shuffle" },
  { state: "GATHERED", labelKey: "tarot.ritual.phase.gather" },
  { state: "CUT", labelKey: "tarot.ritual.phase.cut" },
  { state: "FANNED", labelKey: "tarot.ritual.phase.draw" },
  { state: "DRAWN", labelKey: "tarot.ritual.phase.reveal" },
];

/* Pile boundaries: left 0–6 (7), center 7–13 (7), right 14–21 (8). */
function pileOf(i: number): 0 | 1 | 2 {
  if (i < 7) return 0;
  if (i < 14) return 1;
  return 2;
}
function pileIndices(p: 0 | 1 | 2): number[] {
  const out: number[] = [];
  for (let i = 0; i < CARD_COUNT; i++) if (pileOf(i) === p) out.push(i);
  return out;
}

function haptic(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

interface Scatter {
  ox: number;
  oy: number;
  rot: number;
}

interface Target {
  x: number;
  y: number;
  rotate: number;
  scale: number;
  opacity: number;
}

const MAJOR_ARCANA = [
  "The Fool", "The Magician", "The High Priestess", "The Empress",
  "The Emperor", "The Hierophant", "The Lovers", "The Chariot",
  "Strength", "The Hermit", "Wheel of Fortune", "Justice",
  "The Hanged Man", "Death", "Temperance", "The Devil",
  "The Tower", "The Star", "The Moon", "The Sun",
  "Judgement", "The World",
];

function makeWashScatter(pass = 0): Scatter[] {
  return Array.from({ length: CARD_COUNT }, (_, i) => {
    const side = i % 2 === 0 ? -1 : 1;
    const lane = i % 11;
    const angle = ((i * 37 + pass * 53) * Math.PI) / 180;
    const radiusX = 86 + (i % 5) * 12;
    const radiusY = 62 + (i % 4) * 14;

    return {
      ox: side * 44 + Math.cos(angle) * radiusX + (lane - 5) * 5,
      oy: Math.sin(angle) * radiusY + Math.cos(angle * 0.65) * 28,
      rot: ((i * 29 + pass * 47) % 126) - 63,
    };
  });
}

/* ─── Card faces ─────────────────────────────────────────────── */

function getDeckVisual(setup?: TarotRoomSetup | null): DeckVisual {
  switch (setup?.deckStyleId) {
    case "ivory":
      return {
        back: "linear-gradient(155deg, #fff8ea 0%, #eadcbf 56%, #f7f1e6 100%)",
        front: "linear-gradient(160deg, #fffaf0 0%, #f3e8d4 55%, #fbf7ee 100%)",
        border: "rgba(73,55,35,0.16)",
        innerBorder: "rgba(175,124,54,0.45)",
        stroke: "rgba(117,82,42,0.78)",
        bloom: "rgba(206,169,89,0.28)",
        shadow: "drop-shadow(0 16px 22px rgba(92,61,32,0.28))",
      };
    case "rose":
      return {
        back: "linear-gradient(155deg, #ffe4ef 0%, #c9b5ff 55%, #3a2546 100%)",
        front: "linear-gradient(160deg, #fff0f7 0%, #eadfff 58%, #f9f1f8 100%)",
        border: "rgba(82,43,79,0.2)",
        innerBorder: "rgba(186,117,184,0.55)",
        stroke: "rgba(92,44,104,0.78)",
        bloom: "rgba(220,148,214,0.3)",
        shadow: "drop-shadow(0 16px 22px rgba(61,31,82,0.42))",
      };
    default:
      return {
        back: "linear-gradient(155deg, #0e1422 0%, #070b14 52%, #0b1019 100%)",
        front: "linear-gradient(160deg, #12161f 0%, #070a10 55%, #0c1018 100%)",
        border: "rgba(255,255,255,0.08)",
        innerBorder: GOLD.edge,
        stroke: GOLD.stroke,
        bloom: GOLD.bloom,
        shadow: "drop-shadow(0 16px 22px rgba(0,0,0,0.6))",
      };
  }
}

function getRoomOverlay(setup?: TarotRoomSetup | null): string {
  switch (setup?.backgroundId) {
    case "dawn":
      return "radial-gradient(circle at 18% 16%, rgba(255,226,177,0.26), transparent 32%), radial-gradient(circle at 82% 22%, rgba(124,204,195,0.18), transparent 34%), linear-gradient(180deg, rgba(255,248,232,0.10), rgba(255,255,255,0.02))";
    case "sea":
      return "radial-gradient(circle at 18% 18%, rgba(64,224,208,0.15), transparent 30%), radial-gradient(circle at 76% 20%, rgba(189,132,210,0.14), transparent 34%), linear-gradient(180deg, rgba(2,20,23,0.24), rgba(8,2,13,0.18))";
    default:
      return "radial-gradient(circle at 24% 18%, rgba(228,198,138,0.12), transparent 30%), radial-gradient(circle at 82% 18%, rgba(64,224,208,0.10), transparent 34%)";
  }
}

function CardBack({ visual }: { visual: DeckVisual }) {
  return (
    <div
      className="absolute inset-0 [backface-visibility:hidden] rounded-[6px] overflow-hidden"
      style={{
        background: visual.back,
      }}
    >
      <div
        className="absolute inset-0 rounded-[6px] border"
        style={{ borderColor: visual.border }}
      />
      <div
        className="absolute inset-[4px] rounded-[3px]"
        style={{
          border: `0.5px solid ${visual.innerBorder}`,
          boxShadow: `inset 0 0 14px ${visual.bloom}`,
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          width="78%"
          height="78%"
          viewBox="-22 -34 44 68"
          fill="none"
          stroke={visual.stroke}
          strokeWidth="0.5"
          strokeLinecap="round"
        >
          {[
            [-17, -29, 135],
            [17, -29, -135],
            [-17, 29, 45],
            [17, 29, -45],
          ].map(([x, y, r], i) => (
            <g key={i} transform={`translate(${x},${y}) rotate(${r})`} fill={visual.stroke}>
              <path d="M 0 -1.5 L 1.5 0 L 0 1.5 L -1.5 0 Z" />
              <line x1="0" y1="1.5" x2="0" y2="3.6" stroke={visual.stroke} />
            </g>
          ))}
          <path d="M 0 -20 L 13 0 L 0 20 L -13 0 Z" />
          <path d="M 0 -11 L 7 0 L 0 11 L -7 0 Z" />
          <g fill={visual.stroke} stroke="none">
            <circle cx="0" cy="0" r="1.3" />
            <circle cx="0" cy="-20" r="0.7" />
            <circle cx="13" cy="0" r="0.7" />
            <circle cx="0" cy="20" r="0.7" />
            <circle cx="-13" cy="0" r="0.7" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function CardFront({
  card,
  visual,
}: {
  card: TarotReading["cards"][number] | null;
  visual: DeckVisual;
}) {
  return (
    <div
      className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-[6px] overflow-hidden"
      style={{
        background: visual.front,
      }}
    >
      <div
        className="absolute inset-0 rounded-[6px] border"
        style={{ borderColor: visual.border }}
      />
      {card && <CardSigil cardId={card.card.id} reversed={card.isReversed} />}
    </div>
  );
}

/* ─── Single ceremonial card ─────────────────────────────────── */

interface RitualCardProps {
  index: number;
  state: RitualState;
  target: Target;
  zIndex: number;
  draggable: boolean;
  clickable: boolean;
  flipped: boolean;
  isDrawn: boolean;
  readingCard: TarotReading["cards"][number] | null;
  visual: DeckVisual;
  dragConstraints: React.RefObject<HTMLDivElement | null>;
  transition: object;
  onDragEnd: (offsetX: number, offsetY: number) => void;
  onClick: () => void;
}

function RitualCard({
  state,
  target,
  zIndex,
  draggable,
  clickable,
  flipped,
  isDrawn,
  readingCard,
  visual,
  dragConstraints,
  transition,
  onDragEnd,
  onClick,
}: RitualCardProps) {
  return (
    <motion.div
      className="absolute top-1/2 left-1/2"
      style={{
        width: W,
        height: H,
        zIndex,
        cursor: clickable ? "pointer" : draggable ? "grab" : "default",
        WebkitTapHighlightColor: "transparent",
        filter: visual.shadow,
      }}
      initial={false}
      animate={{
        x: target.x,
        y: target.y,
        rotate: target.rotate,
        scale: target.scale,
        opacity: target.opacity,
      }}
      transition={transition}
      drag={draggable}
      dragConstraints={dragConstraints}
      dragMomentum={false}
      dragElastic={0.55}
      whileDrag={{ scale: 1.12, zIndex: 80, cursor: "grabbing" }}
      whileHover={
        state === "SCATTERED"
          ? { scale: 1.07, rotate: target.rotate + 4 }
          : clickable
            ? { scale: 1.06 }
            : undefined
      }
      onDragEnd={(_e: unknown, info: PanInfo) => onDragEnd(info.offset.x, info.offset.y)}
      onClick={clickable ? onClick : undefined}
    >
      <div
        className="relative w-full h-full"
        style={{ perspective: 1000 }}
      >
        <motion.div
          className="w-full h-full [transform-style:preserve-3d]"
          animate={{ rotateY: isDrawn && flipped ? 180 : 0 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        >
          <CardBack visual={visual} />
          {isDrawn && <CardFront card={readingCard} visual={visual} />}
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ─── Prompt + button helpers ────────────────────────────────── */

function Prompt({ text }: { text: string }) {
  return (
    <motion.p
      key={text}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className="mx-auto max-w-[34rem] px-6 text-center font-sans text-[15px] font-medium leading-relaxed select-none md:text-[16px]"
      style={{ color: IVORY.body, textShadow: TEXT_HALO.soft }}
    >
      {text}
    </motion.p>
  );
}

function RitualButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      onClick={onClick}
      className="min-h-11 rounded-[999px] border px-5 py-2 font-sans text-[13px] font-medium transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]"
      style={{
        color: IVORY.primary,
        background: "rgba(255, 240, 210, 0.08)",
        borderColor: "rgba(255, 240, 210, 0.22)",
        boxShadow: "0 12px 28px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.08)",
        textShadow: TEXT_HALO.soft,
      }}
    >
      {children}
    </motion.button>
  );
}

function PhaseRail({ state }: { state: RitualState }) {
  const { t } = useLanguage();
  const active = RITUAL_PHASES.findIndex((phase) => phase.state === state);

  return (
    <div className="absolute left-1/2 top-6 z-[75] flex w-[min(92vw,34rem)] -translate-x-1/2 items-center gap-2 rounded-[999px] border px-3 py-2 backdrop-blur-md"
      style={{
        background: "rgba(5, 5, 10, 0.34)",
        borderColor: "rgba(255, 240, 210, 0.14)",
      }}
    >
      {RITUAL_PHASES.map((phase, index) => {
        const done = index < active;
        const current = index === active;
        return (
          <div key={phase.state} className="flex min-w-0 flex-1 items-center gap-2">
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-sans text-[11px] font-medium"
              style={{
                color: current || done ? "#08070B" : IVORY.dim,
                background: current || done
                  ? "linear-gradient(145deg, rgba(243,212,144,0.98), rgba(122,226,214,0.92))"
                  : "rgba(255,255,255,0.06)",
              }}
            >
              {index + 1}
            </span>
            <span
              className="hidden truncate font-sans text-[11px] font-medium sm:inline"
              style={{ color: current ? IVORY.primary : IVORY.mute }}
            >
              {t(phase.labelKey)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── The ritual ─────────────────────────────────────────────── */

export function TarotRitual({ reading, roomSetup, onComplete }: Props) {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<RitualState>("SCATTERED");
  const [selectedPile, setSelectedPile] = useState<0 | 1 | 2 | null>(null);
  const [drawnIndex, setDrawnIndex] = useState<number | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [, setWashPass] = useState(0);

  const [scatter, setScatter] = useState<Scatter[]>(() => makeWashScatter());

  const selectedIdx = useMemo(
    () => (selectedPile === null ? [] : pileIndices(selectedPile)),
    [selectedPile]
  );
  const visual = useMemo(() => getDeckVisual(roomSetup), [roomSetup]);
  const roomOverlay = useMemo(() => getRoomOverlay(roomSetup), [roomSetup]);

  // Card chosen from the ceremony reveals the reading's focal card.
  const readingCard = reading?.cards[0] ?? null;
  const meaning = readingCard
    ? readingCard.isReversed
      ? readingCard.card.reversed
      : readingCard.card.upright
    : "";

  // DRAWN: lift + flip, then surface the title/meaning.
  useEffect(() => {
    if (state !== "DRAWN") return;
    const t1 = setTimeout(() => {
      setFlipped(true);
      haptic([14, 22, 34]);
    }, 620);
    const t2 = setTimeout(() => setRevealed(true), 1500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [state]);

  const washDeck = () => {
    haptic([8, 18, 8]);
    setWashPass((pass) => {
      const next = pass + 1;
      setScatter(makeWashScatter(next));
      return next;
    });
  };
  const gather = () => {
    haptic(10);
    setState("GATHERED");
  };
  const cut = () => {
    haptic([8, 12]);
    setState("CUT");
  };
  const choosePile = (p: 0 | 1 | 2) => {
    haptic(12);
    setSelectedPile(p);
    setState("FANNED");
  };
  const drawCard = (i: number) => {
    haptic(16);
    setDrawnIndex(i);
    setState("DRAWN");
  };

  const targetFor = (i: number): Target => {
    switch (state) {
      case "SCATTERED": {
        const s = scatter[i];
        return { x: s.ox - HW, y: s.oy - HH, rotate: s.rot, scale: 1, opacity: 1 };
      }
      case "GATHERED": {
        const d = i - (CARD_COUNT - 1) / 2;
        return {
          x: -HW + d * 0.5,
          y: -HH + Math.abs(d) * 0.3,
          rotate: d * 0.6,
          scale: 1,
          opacity: 1,
        };
      }
      case "CUT": {
        const p = pileOf(i);
        const baseX = p === 0 ? -120 : p === 2 ? 120 : 0;
        const k = pileIndices(p).indexOf(i);
        return {
          x: baseX - HW + k * 0.5,
          y: -HH + k * 0.4,
          rotate: 0,
          scale: 1,
          opacity: 1,
        };
      }
      case "FANNED": {
        if (pileOf(i) !== selectedPile)
          return { x: -HW, y: -HH + 10, rotate: 0, scale: 0.5, opacity: 0 };
        const n = selectedIdx.length;
        const j = selectedIdx.indexOf(i);
        const mid = (n - 1) / 2;
        return {
          x: (j - mid) * 30 - HW,
          y: Math.abs(j - mid) * 7 - HH + 24,
          rotate: (j - mid) * 5,
          scale: 1,
          opacity: 1,
        };
      }
      case "DRAWN": {
        if (i !== drawnIndex)
          return { x: -HW, y: -HH, rotate: 0, scale: 0.4, opacity: 0 };
        return { x: -HW, y: -HH - 46, rotate: 0, scale: 1.65, opacity: 1 };
      }
    }
  };

  const transitionFor = (i: number): object => {
    switch (state) {
      case "GATHERED":
        return { type: "spring", stiffness: 200, damping: 24 };
      case "CUT":
        return { type: "spring", stiffness: 150, damping: 20 };
      case "FANNED":
        return {
          delay: Math.max(0, selectedIdx.indexOf(i)) * 0.05,
          type: "spring",
          stiffness: 170,
          damping: 20,
        };
      case "DRAWN":
        return { type: "spring", stiffness: 120, damping: 18 };
      default:
        return { type: "spring", stiffness: 120, damping: 20 };
    }
  };

  const zFor = (i: number): number => {
    if (state === "DRAWN") return i === drawnIndex ? 60 : 0;
    if (state === "FANNED") return Math.max(0, selectedIdx.indexOf(i)) + 1;
    if (state === "CUT" || state === "GATHERED") return i;
    return i;
  };

  const prompt =
    state === "SCATTERED"
      ? t("tarot.ritual.prompt.scatter")
      : state === "GATHERED"
        ? t("tarot.ritual.prompt.gathered")
        : state === "CUT"
          ? t("tarot.ritual.prompt.cut")
          : state === "FANNED"
            ? t("tarot.ritual.prompt.fanned")
            : "";

  const pileHitbox = (p: 0 | 1 | 2) => {
    const baseX = p === 0 ? -120 : p === 2 ? 120 : 0;
    return (
      <button
        key={p}
        onClick={() => choosePile(p)}
        aria-label={`Choose ${p === 0 ? "left" : p === 1 ? "center" : "right"} pile`}
        className="absolute top-1/2 left-1/2 z-[70]"
        style={{
          width: W + 36,
          height: H + 36,
          transform: `translate(calc(-50% + ${baseX}px), -50%)`,
          background: "transparent",
          WebkitTapHighlightColor: "transparent",
          cursor: "pointer",
        }}
      />
    );
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.4, ease: "easeInOut" }}
      className="absolute inset-0 overflow-hidden select-none touch-none"
    >
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ background: roomOverlay }}
      />

      {/* Top prompt */}
      <PhaseRail state={state} />

      <div className="absolute top-[13%] left-0 right-0 flex justify-center">
        <AnimatePresence mode="wait">
          {prompt && <Prompt key={prompt} text={prompt} />}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {(state === "FANNED" || state === "DRAWN") && (
          <motion.div
            key="ribbon"
            aria-hidden
            initial={{ opacity: 0, scaleX: 0.2 }}
            animate={{ opacity: state === "FANNED" ? 0.9 : 0.45, scaleX: 1 }}
            exit={{ opacity: 0, scaleX: 0.2 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="absolute left-1/2 top-1/2 h-[2px] w-[min(76vw,26rem)] origin-center -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(243,212,144,0.92), rgba(122,226,214,0.72), transparent)",
              boxShadow: "0 0 24px rgba(243,212,144,0.28), 0 0 40px rgba(122,226,214,0.18)",
            }}
          />
        )}
      </AnimatePresence>

      {/* Card field */}
      {Array.from({ length: CARD_COUNT }).map((_, i) => (
        <RitualCard
          key={i}
          index={i}
          state={state}
          target={targetFor(i)}
          transition={transitionFor(i)}
          zIndex={zFor(i)}
          draggable={state === "SCATTERED"}
          clickable={state === "FANNED" && pileOf(i) === selectedPile}
          flipped={flipped}
          isDrawn={i === drawnIndex}
          readingCard={readingCard}
          visual={visual}
          dragConstraints={containerRef}
          onDragEnd={(dx, dy) =>
            setScatter((prev) =>
              prev.map((s, idx) =>
                idx === i ? { ...s, ox: s.ox + dx, oy: s.oy + dy } : s
              )
            )
          }
          onClick={() => drawCard(i)}
        />
      ))}

      {/* Tap-to-cut hitbox over the gathered stack */}
      {state === "GATHERED" && (
        <button
          onClick={cut}
          aria-label={t("tarot.ritual.cutAria")}
          className="absolute top-1/2 left-1/2 z-[70]"
          style={{
            width: W + 44,
            height: H + 44,
            transform: "translate(-50%, -50%)",
            background: "transparent",
            WebkitTapHighlightColor: "transparent",
            cursor: "pointer",
          }}
        />
      )}

      {/* Pile hitboxes */}
      {state === "CUT" && ([0, 1, 2] as const).map((p) => pileHitbox(p))}

      {/* Reveal: real card title + meaning */}
      <AnimatePresence>
        {state === "DRAWN" && revealed && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            className="absolute left-0 right-0 bottom-[12%] flex flex-col items-center gap-3 px-10 text-center"
          >
            {readingCard ? (
              <>
                <p
                  className="font-serif text-[10px] uppercase tracking-[0.34em]"
                  style={{ color: IVORY.mute }}
                >
                  {readingCard.position}
                  {readingCard.isReversed ? ` · ${t("tarot.ritual.reversed")}` : ""}
                </p>
                <p
                  className="font-serif text-2xl md:text-3xl font-light tracking-[0.04em]"
                  style={{ color: IVORY.primary, textShadow: TEXT_HALO.strong }}
                >
                  {readingCard.card.name}
                </p>
                <p
                  className="font-serif italic text-sm md:text-base font-light leading-relaxed max-w-xs"
                  style={{ color: IVORY.body, textShadow: TEXT_HALO.soft }}
                >
                  {meaning}
                </p>
                <RitualButton onClick={onComplete}>{t("tarot.ritual.listen")}</RitualButton>
              </>
            ) : (
              <motion.p
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                className="font-serif italic text-sm"
                style={{ color: IVORY.body }}
              >
                {t("tarot.ritual.waiting")}
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom control — Gather */}
      <div className="absolute left-0 right-0 bottom-[8%] z-[80] flex justify-center px-5">
        <AnimatePresence>
          {state === "SCATTERED" && (
            <motion.div
              key="wash-gather"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-wrap items-center justify-center gap-3"
            >
              <RitualButton onClick={washDeck}>{t("tarot.ritual.wash")}</RitualButton>
              <RitualButton onClick={gather}>{t("tarot.ritual.gather")}</RitualButton>
            </motion.div>
          )}
          {state === "GATHERED" && (
            <motion.div
              key="cut"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <RitualButton onClick={cut}>{t("tarot.ritual.cut")}</RitualButton>
            </motion.div>
          )}
          {state === "CUT" && (
            <motion.div
              key="choose-pile"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-wrap items-center justify-center gap-3"
            >
              <RitualButton onClick={() => choosePile(0)}>{t("tarot.ritual.leftPile")}</RitualButton>
              <RitualButton onClick={() => choosePile(1)}>{t("tarot.ritual.centerPile")}</RitualButton>
              <RitualButton onClick={() => choosePile(2)}>{t("tarot.ritual.rightPile")}</RitualButton>
            </motion.div>
          )}
          {state === "FANNED" && (
            <motion.p
              key="pick-card"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-[999px] border px-4 py-2 font-sans text-[13px] font-medium backdrop-blur-md"
              style={{
                color: IVORY.body,
                background: "rgba(5, 5, 10, 0.32)",
                borderColor: "rgba(255, 240, 210, 0.14)",
              }}
            >
              {t("tarot.ritual.tapCard")}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Hidden mock arcana names — semantic completeness for the 22 deck */}
      <span className="sr-only">{MAJOR_ARCANA.join(", ")}</span>
    </motion.div>
  );
}
