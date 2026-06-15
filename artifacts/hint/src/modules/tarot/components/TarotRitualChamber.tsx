import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Home } from "lucide-react";
import { Link } from "wouter";
import type { RitualCard } from "../types/ritual.types";
import { createHiddenDeck, scatterDeck } from "../logic/createHiddenDeck";
import {
  applyAutoWashWave,
  applyTableCurrent,
  gatherDeckToCenter,
  loosenDeckForWash,
  quickCutDeckAtCenter,
  settleWashedDeck,
  squareDeckAtCenter,
} from "../logic/washPhysics";
import { applyWashForce } from "../logic/washPhysics";
import type { WashPointer } from "../logic/washPhysics";
import { selectCardByVisualId } from "../logic/selectCards";
import { CardWashRitual } from "./CardWashRitual";
import type { WashRitualTheme } from "./CardWashRitual";
import { ReadingReveal } from "./ReadingReveal";
import { RibbonSpread } from "./RibbonSpread";
import { TarotHintReadingChat } from "./TarotHintReadingChat";
import { SPREAD_CHOICES } from "../../hold/useHoldFlow";
import type { TarotRoomSetup } from "../../hold/useHoldFlow";

type RitualStage = "placed" | "washing" | "gathering" | "cutting" | "rested" | "selecting" | "reveal" | "reading";

type ChamberDeckState = {
  hiddenDeckOrder: RitualCard[];
  ritualCards: RitualCard[];
};

const BACKGROUND_THEMES: Record<TarotRoomSetup["backgroundId"], Pick<WashRitualTheme, "chamberOverlay" | "starClassName" | "tableBackground" | "tableBorderColor" | "tableShadow" | "tableRingColor" | "secondaryRingColor">> = {
  stars: {
    chamberOverlay:
      "radial-gradient(circle at 50% 42%, rgba(227,190,116,0.16), transparent 24%), radial-gradient(circle at 50% 50%, rgba(11,24,44,0.92), rgba(3,5,12,0.98) 62%, #010207 100%)",
    starClassName:
      "opacity-40 [background-image:radial-gradient(circle_at_18%_24%,rgba(255,255,255,0.85)_0_1px,transparent_1px),radial-gradient(circle_at_78%_16%,rgba(239,205,139,0.88)_0_1px,transparent_1px),radial-gradient(circle_at_68%_76%,rgba(255,255,255,0.55)_0_1px,transparent_1px)] [background-size:132px_148px]",
    tableBackground:
      "radial-gradient(circle at 50% 50%, rgba(35,48,72,0.78), rgba(9,13,27,0.94) 55%, rgba(2,3,8,0.98) 100%)",
    tableBorderColor: "rgba(216,186,114,0.22)",
    tableShadow:
      "0 35px 110px rgba(0,0,0,0.72), inset 0 0 92px rgba(226,190,116,0.12)",
    tableRingColor: "rgba(227,195,122,0.18)",
    secondaryRingColor: "rgba(148,222,218,0.10)",
  },
  dawn: {
    chamberOverlay:
      "radial-gradient(circle at 50% 38%, rgba(234,205,143,0.34), transparent 27%), radial-gradient(circle at 50% 54%, rgba(222,241,236,0.92), rgba(88,117,128,0.48) 64%, rgba(12,20,34,0.88) 100%)",
    starClassName:
      "opacity-24 [background-image:radial-gradient(circle_at_18%_24%,rgba(255,255,255,0.8)_0_1px,transparent_1px),radial-gradient(circle_at_78%_16%,rgba(187,146,68,0.62)_0_1px,transparent_1px)] [background-size:142px_152px]",
    tableBackground:
      "radial-gradient(circle at 50% 48%, rgba(255,248,232,0.72), rgba(136,178,178,0.58) 58%, rgba(18,35,50,0.84) 100%)",
    tableBorderColor: "rgba(174,132,56,0.26)",
    tableShadow:
      "0 35px 100px rgba(49,61,64,0.38), inset 0 0 92px rgba(255,242,199,0.20)",
    tableRingColor: "rgba(174,132,56,0.22)",
    secondaryRingColor: "rgba(83,139,139,0.18)",
  },
  sea: {
    chamberOverlay:
      "radial-gradient(circle at 48% 42%, rgba(229,154,190,0.14), transparent 24%), radial-gradient(circle at 50% 52%, rgba(12,55,65,0.92), rgba(5,14,24,0.98) 64%, #020409 100%)",
    starClassName:
      "opacity-32 [background-image:radial-gradient(circle_at_18%_24%,rgba(235,255,246,0.65)_0_1px,transparent_1px),radial-gradient(circle_at_78%_16%,rgba(244,196,214,0.70)_0_1px,transparent_1px),radial-gradient(circle_at_68%_76%,rgba(103,218,209,0.62)_0_1px,transparent_1px)] [background-size:132px_148px]",
    tableBackground:
      "radial-gradient(circle at 50% 50%, rgba(21,67,72,0.80), rgba(8,21,35,0.95) 56%, rgba(4,5,14,0.99) 100%)",
    tableBorderColor: "rgba(229,154,190,0.24)",
    tableShadow:
      "0 35px 110px rgba(0,0,0,0.70), inset 0 0 92px rgba(229,154,190,0.12)",
    tableRingColor: "rgba(229,154,190,0.18)",
    secondaryRingColor: "rgba(103,218,209,0.12)",
  },
};

const DECK_BACKS: Record<TarotRoomSetup["deckStyleId"], WashRitualTheme["cardBackStyle"]> = {
  nocturne: "nocturne",
  ivory: "ivory",
  rose: "rose",
};

function getTheme(setup?: TarotRoomSetup | null): WashRitualTheme {
  const background = BACKGROUND_THEMES[setup?.backgroundId ?? "stars"];
  return {
    ...background,
    cardBackStyle: DECK_BACKS[setup?.deckStyleId ?? "nocturne"],
  };
}

export function TarotRitualChamber({
  setup,
}: {
  setup?: TarotRoomSetup | null;
  onComplete?: () => void;
}) {
  const theme = getTheme(setup);
  const cardArtId = setup?.cardFaceId ?? "hint-classic";
  const selectedSpread = SPREAD_CHOICES.find((spread) => spread.id === setup?.spreadType) ?? SPREAD_CHOICES[0]!;
  const maxSelectedCards = selectedSpread.cardCount;
  const [deckState, setDeckState] = useState<ChamberDeckState>(() => {
    const hiddenDeckOrder = createHiddenDeck();
    return {
      hiddenDeckOrder,
      ritualCards: hiddenDeckOrder,
    };
  });
  const [stage, setStage] = useState<RitualStage>("placed");
  const [activeVisualIds, setActiveVisualIds] = useState<string[]>([]);
  const [washScore, setWashScore] = useState(0);
  const [restAvailable, setRestAvailable] = useState(false);
  const [autoWashing, setAutoWashing] = useState(false);
  const [washDirection, setWashDirection] = useState<1 | -1>(1);
  const [selectedCards, setSelectedCards] = useState<RitualCard[]>([]);
  const [revealedIds, setRevealedIds] = useState<string[]>([]);
  const gatherTimers = useRef<number[]>([]);
  const autoWashStartedAt = useRef(0);

  const washProgress = Math.min(1, washScore / 56);

  useEffect(() => {
    if (!activeVisualIds.length) return;
    const timer = window.setTimeout(() => setActiveVisualIds([]), 520);
    return () => window.clearTimeout(timer);
  }, [activeVisualIds]);

  useEffect(() => {
    if (stage !== "washing") return;
    const restTimer = window.setTimeout(() => setRestAvailable(true), 3200);
    const progressTimer = window.setInterval(() => {
      setWashScore((score) => {
        const nextScore = score + 0.45;
        if (nextScore > 42) setRestAvailable(true);
        return nextScore;
      });
    }, 420);
    return () => {
      window.clearTimeout(restTimer);
      window.clearInterval(progressTimer);
    };
  }, [stage]);

  useEffect(() => {
    if (!autoWashing) return;
    const timer = window.setTimeout(() => {
      finishAutoWash();
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [autoWashing]);

  useEffect(() => {
    if (stage !== "placed" && stage !== "washing") return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      if (now - last > 32) {
        last = now;
        if (autoWashing) {
          const elapsed = now - autoWashStartedAt.current;
          setDeckState((current) => ({
            ...current,
            ritualCards: applyAutoWashWave(current.ritualCards, elapsed),
          }));
          setWashScore(Math.min(56, 30 + elapsed / 14));
          if (elapsed >= 980) {
            finishAutoWash();
          }
          frame = window.requestAnimationFrame(tick);
          return;
        }
        setDeckState((current) => ({
          ...current,
          ritualCards: applyTableCurrent(
            settleWashedDeck(current.ritualCards),
            now,
            stage === "placed" ? 0.20 : 0.55,
            washDirection,
          ),
        }));
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [autoWashing, stage, washDirection]);

  useEffect(() => {
    return () => {
      clearGatherTimers();
    };
  }, []);

  function clearGatherTimers() {
    gatherTimers.current.forEach((timer) => window.clearTimeout(timer));
    gatherTimers.current = [];
  }

  function enterSelectCards() {
    setActiveVisualIds([]);
    setAutoWashing(false);
    setStage("selecting");
  }

  function finishAutoWash() {
    setAutoWashing(false);
    setRestAvailable(true);
    setWashScore(56);
    setActiveVisualIds([]);
    setStage("gathering");
    setDeckState((current) => ({
      ...current,
      ritualCards: gatherDeckToCenter(current.ritualCards),
    }));
    clearGatherTimers();
    gatherTimers.current = [
      window.setTimeout(() => {
        setStage("cutting");
        setDeckState((current) => ({
          ...current,
          ritualCards: quickCutDeckAtCenter(current.ritualCards),
        }));
      }, 360),
      window.setTimeout(() => {
        setDeckState((current) => ({
          ...current,
          ritualCards: squareDeckAtCenter(current.ritualCards),
        }));
      }, 690),
      window.setTimeout(() => {
        enterSelectCards();
      }, 1080),
    ];
  }

  function beginWash() {
    setStage((current) => current === "placed" ? "washing" : current);
    setDeckState((current) => {
      if (stage !== "placed") return current;
      return {
        ...current,
        ritualCards: loosenDeckForWash(current.ritualCards),
      };
    });
    setWashScore((score) => Math.max(score, 10));
  }

  function wash(pointer: WashPointer) {
    setStage((current) => current === "placed" ? "washing" : current);
    if (autoWashing) setAutoWashing(false);
    setWashDirection(pointer.spinDirection);
    setDeckState((current) => {
      const result = applyWashForce(current.ritualCards, pointer);
      setActiveVisualIds(result.activeVisualIds);
      setWashScore((score) => {
        const nextScore = score + result.movementScore + 0.35;
        if (nextScore > 42) setRestAvailable(true);
        return nextScore;
      });
      return {
        ...current,
        ritualCards: result.cards,
      };
    });
  }

  function restDeck() {
    setStage("gathering");
    setAutoWashing(false);
    setRestAvailable(true);
    setActiveVisualIds([]);
    setDeckState((current) => ({
      ...current,
      ritualCards: gatherDeckToCenter(current.ritualCards),
    }));
    gatherTimers.current.forEach((timer) => window.clearTimeout(timer));
    gatherTimers.current = [
      window.setTimeout(() => {
        setStage("cutting");
        setDeckState((current) => ({
          ...current,
          ritualCards: quickCutDeckAtCenter(current.ritualCards),
        }));
      }, 880),
      window.setTimeout(() => {
        setDeckState((current) => ({
          ...current,
          ritualCards: squareDeckAtCenter(current.ritualCards),
        }));
      }, 1360),
      window.setTimeout(() => {
        setStage("rested");
      }, 2050),
    ];
  }

  function autoWashDeck() {
    setStage("washing");
    setAutoWashing(true);
    autoWashStartedAt.current = performance.now();
    setRestAvailable(false);
    setSelectedCards([]);
    setRevealedIds([]);
    setWashScore((score) => Math.max(score, 14));
    setDeckState((current) => ({
      ...current,
      ritualCards: loosenDeckForWash(current.ritualCards),
    }));
  }

  function washAgain() {
    gatherTimers.current.forEach((timer) => window.clearTimeout(timer));
    gatherTimers.current = [];
    setStage("washing");
    setAutoWashing(false);
    setWashScore(18);
    setRestAvailable(false);
    setActiveVisualIds([]);
    setSelectedCards([]);
    setRevealedIds([]);
    setDeckState((current) => ({
      ...current,
      ritualCards: loosenDeckForWash(scatterDeck(current.hiddenDeckOrder)),
    }));
  }

  function selectFromSpread(visualId: string) {
    setSelectedCards((current) => {
      return selectCardByVisualId(deckState.hiddenDeckOrder, current, visualId, maxSelectedCards);
    });
  }

  function revealCard(visualId: string) {
    setRevealedIds((current) => current.includes(visualId) ? current : [...current, visualId]);
  }

  function restartRitual() {
    const hiddenDeckOrder = createHiddenDeck();
    setDeckState({
      hiddenDeckOrder,
      ritualCards: hiddenDeckOrder,
    });
    setStage("placed");
    setActiveVisualIds([]);
    setWashScore(0);
    setRestAvailable(false);
    setAutoWashing(false);
    setWashDirection(1);
    setSelectedCards([]);
    setRevealedIds([]);
    clearGatherTimers();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.1, ease: "easeOut" }}
      className="absolute inset-0 overflow-hidden bg-[#010207] text-[#f7ead0]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(227,190,116,0.16),transparent_24%),radial-gradient(circle_at_50%_50%,rgba(11,24,44,0.92),rgba(3,5,12,0.98)_62%,#010207_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_18%_24%,rgba(255,255,255,0.85)_0_1px,transparent_1px),radial-gradient(circle_at_78%_16%,rgba(239,205,139,0.88)_0_1px,transparent_1px),radial-gradient(circle_at_68%_76%,rgba(255,255,255,0.55)_0_1px,transparent_1px)] [background-size:132px_148px]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(ellipse_at_50%_65%,rgba(222,178,95,0.12),transparent_48%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),transparent_22%,rgba(255,255,255,0.028))] opacity-60" />

      <Link
        href="/"
        aria-label="Go to home"
        className="absolute left-4 top-4 z-[80] inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#e4c174]/28 bg-black/34 text-[#f7ead0]/82 shadow-[0_10px_24px_rgba(0,0,0,0.28)] transition duration-300 hover:border-[#e4c174]/55 hover:bg-[#e4c174]/10 hover:text-[#ffe8aa] active:scale-95 sm:left-5 sm:top-5"
      >
        <Home size={17} strokeWidth={1.8} aria-hidden="true" />
      </Link>

      {(stage === "placed" || stage === "washing" || stage === "gathering" || stage === "cutting" || stage === "rested") && (
        <CardWashRitual
          stage={stage}
          ritualCards={deckState.ritualCards}
          activeVisualIds={activeVisualIds}
          canRest={restAvailable || washScore > 36}
          washProgress={washProgress}
          isAutoWashing={autoWashing}
          theme={theme}
          onBeginWash={beginWash}
          onWash={wash}
          onRest={restDeck}
          onWashAgain={washAgain}
          onSelectCards={enterSelectCards}
          onFallbackWash={autoWashDeck}
          showControls
        />
      )}

      {stage === "selecting" && (
        <RibbonSpread
          finalDeckOrder={deckState.hiddenDeckOrder}
          selectedCards={selectedCards}
          maxCards={maxSelectedCards}
          spread={selectedSpread}
          onSelect={selectFromSpread}
          onContinue={() => setStage("reveal")}
          backStyle={theme.cardBackStyle}
        />
      )}

      {stage === "reveal" && (
        <ReadingReveal
          selectedCards={selectedCards}
          revealedIds={revealedIds}
          autoReveal
          onContinue={() => setStage("reading")}
          onReveal={revealCard}
          onRestart={restartRitual}
          backStyle={theme.cardBackStyle}
          cardArtId={cardArtId}
        />
      )}

      {stage === "reading" && (
        <TarotHintReadingChat
          selectedCards={selectedCards}
          spread={selectedSpread}
          backStyle={theme.cardBackStyle}
          cardArtId={cardArtId}
          question={setup?.question}
          story={setup?.story}
          focusLabel={setup?.focusLabel}
        />
      )}

      <span className="sr-only">{deckState.hiddenDeckOrder.length} face-down cards placed.</span>
    </motion.div>
  );
}
