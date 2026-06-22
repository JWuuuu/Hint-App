import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Link } from "wouter";
import type { RitualCard } from "../types/ritual.types";
import { createHiddenDeck } from "../logic/createHiddenDeck";
import {
  applyTableCurrent,
  cutDeckIntoPackets,
  gatherDeckToCenter,
  loosenDeckForWash,
  mergeCutDeckAtCenter,
  settleWashedDeck,
  squareDeckAtCenter,
  transferCutPacket,
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

type RitualStage = "placed" | "washing" | "gathering" | "cutReady" | "cutting" | "selecting" | "reveal" | "reading";

type ChamberDeckState = {
  hiddenDeckOrder: RitualCard[];
  ritualCards: RitualCard[];
};

const ENABLE_FULL_DECK_INTRO = false;
const INITIAL_RITUAL_STAGE: RitualStage = ENABLE_FULL_DECK_INTRO ? "placed" : "washing";
const INITIAL_WASH_SCORE = ENABLE_FULL_DECK_INTRO ? 0 : 10;

const BACKGROUND_THEMES: Record<TarotRoomSetup["backgroundId"], Pick<WashRitualTheme, "chamberOverlay" | "starClassName" | "tableBackground" | "tableBorderColor" | "tableShadow" | "tableRingColor" | "secondaryRingColor">> = {
  stars: {
    chamberOverlay:
      "linear-gradient(180deg, rgba(255,237,246,0.12), rgba(12,8,26,0.04) 28%, rgba(220,196,255,0.08) 62%, rgba(4,3,12,0.98) 100%), radial-gradient(ellipse at 50% 36%, rgba(246,187,207,0.24), transparent 30%), radial-gradient(circle at 50% 52%, rgba(26,19,50,0.94), rgba(7,6,18,0.98) 65%, #020106 100%)",
    starClassName:
      "opacity-44 [background-image:radial-gradient(circle_at_18%_24%,rgba(255,238,246,0.86)_0_1px,transparent_1px),radial-gradient(circle_at_78%_16%,rgba(248,214,152,0.82)_0_1px,transparent_1px),radial-gradient(circle_at_68%_76%,rgba(219,199,255,0.66)_0_1px,transparent_1px)] [background-size:132px_148px]",
    tableBackground:
      "radial-gradient(circle at 48% 42%, rgba(255,236,244,0.18), transparent 30%), radial-gradient(circle at 50% 54%, rgba(45,37,78,0.82), rgba(14,11,30,0.95) 58%, rgba(4,3,12,0.99) 100%)",
    tableBorderColor: "rgba(238,188,205,0.28)",
    tableShadow:
      "0 35px 110px rgba(0,0,0,0.68), 0 0 46px rgba(221,180,255,0.10), inset 0 0 92px rgba(246,187,207,0.13)",
    tableRingColor: "rgba(246,187,207,0.22)",
    secondaryRingColor: "rgba(248,214,152,0.14)",
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

type HiddenCardIdentity = Pick<RitualCard, "cardId" | "name" | "orientation">;

function getHiddenIdentities(deck: readonly RitualCard[]): HiddenCardIdentity[] {
  return deck.map((card) => ({
    cardId: card.cardId,
    name: card.name,
    orientation: card.orientation,
  }));
}

function applyHiddenIdentitiesToFixedVisuals(
  visualDeck: readonly RitualCard[],
  identities: readonly HiddenCardIdentity[],
): RitualCard[] {
  return visualDeck.map((visualCard, index) => {
    const identity = identities[index] ?? identities[0];
    return {
      ...visualCard,
      cardId: identity?.cardId ?? visualCard.cardId,
      name: identity?.name ?? visualCard.name,
      orientation: identity?.orientation ?? visualCard.orientation,
      selected: false,
      revealed: false,
    };
  });
}

function washHiddenOrder(deck: readonly RitualCard[]): RitualCard[] {
  const identities = getHiddenIdentities(deck);
  const half = Math.ceil(identities.length / 2);
  const left = identities.slice(0, half);
  const right = identities.slice(half);
  const mixed: HiddenCardIdentity[] = [];
  const max = Math.max(left.length, right.length);

  for (let index = 0; index < max; index += 1) {
    if (right[index]) mixed.push(right[index]!);
    if (left[index]) mixed.push(left[index]!);
  }

  return applyHiddenIdentitiesToFixedVisuals(deck, mixed);
}

function cutHiddenOrder(deck: readonly RitualCard[], ratio = 0.37): RitualCard[] {
  const identities = getHiddenIdentities(deck);
  const cutIndex = Math.max(1, Math.min(identities.length - 1, Math.floor(identities.length * ratio)));
  const cut = [...identities.slice(cutIndex), ...identities.slice(0, cutIndex)];
  return applyHiddenIdentitiesToFixedVisuals(deck, cut);
}

function createInitialChamberDeckState(): ChamberDeckState {
  const hiddenDeckOrder = createHiddenDeck();
  return {
    hiddenDeckOrder,
    ritualCards: ENABLE_FULL_DECK_INTRO ? hiddenDeckOrder : loosenDeckForWash(hiddenDeckOrder),
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
  const setupSpreadType = setup?.spreadType === "xRelationship" ? "loveTree" : setup?.spreadType;
  const selectedSpread = SPREAD_CHOICES.find((spread) => spread.id === setupSpreadType) ?? SPREAD_CHOICES[0]!;
  const maxSelectedCards = selectedSpread.cardCount;
  const [deckState, setDeckState] = useState<ChamberDeckState>(() => createInitialChamberDeckState());
  const [stage, setStage] = useState<RitualStage>(INITIAL_RITUAL_STAGE);
  const [activeVisualIds, setActiveVisualIds] = useState<string[]>([]);
  const [washScore, setWashScore] = useState(INITIAL_WASH_SCORE);
  const [washDirection, setWashDirection] = useState<1 | -1>(1);
  const [selectedCards, setSelectedCards] = useState<RitualCard[]>([]);
  const [revealedIds, setRevealedIds] = useState<string[]>([]);
  const gatherTimers = useRef<number[]>([]);

  const washProgress = Math.min(1, washScore / 56);

  useEffect(() => {
    if (!activeVisualIds.length) return;
    const timer = window.setTimeout(() => setActiveVisualIds([]), 520);
    return () => window.clearTimeout(timer);
  }, [activeVisualIds]);

  useEffect(() => {
    if (stage !== "washing") return;
    const progressTimer = window.setInterval(() => {
      setWashScore((score) => {
        return Math.min(56, score + 0.45);
      });
    }, 420);
    return () => {
      window.clearInterval(progressTimer);
    };
  }, [stage]);

  useEffect(() => {
    if (stage !== "placed" && stage !== "washing") return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      if (now - last > 32) {
        last = now;
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
  }, [stage, washDirection]);

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
    setStage("selecting");
  }

  function startCutDeck() {
    const secondCutDirection: 1 | -1 = washDirection === 1 ? -1 : 1;
    setStage("cutting");
    setDeckState((current) => ({
      ...current,
      hiddenDeckOrder: cutHiddenOrder(current.hiddenDeckOrder, 0.42),
      ritualCards: cutDeckIntoPackets(current.ritualCards, washDirection, 0),
    }));
    clearGatherTimers();
    gatherTimers.current = [
      window.setTimeout(() => {
        setDeckState((current) => ({
          ...current,
          ritualCards: transferCutPacket(current.ritualCards, washDirection, 0),
        }));
      }, 680),
      window.setTimeout(() => {
        setDeckState((current) => ({
          ...current,
          hiddenDeckOrder: cutHiddenOrder(current.hiddenDeckOrder, 0.58),
          ritualCards: cutDeckIntoPackets(current.ritualCards, secondCutDirection, 1),
        }));
      }, 1320),
      window.setTimeout(() => {
        setDeckState((current) => ({
          ...current,
          ritualCards: transferCutPacket(current.ritualCards, secondCutDirection, 1),
        }));
      }, 2020),
      window.setTimeout(() => {
        setDeckState((current) => ({
          ...current,
          ritualCards: mergeCutDeckAtCenter(current.ritualCards),
        }));
      }, 2700),
      window.setTimeout(() => {
        enterSelectCards();
      }, 3600),
    ];
  }

  function finishWash() {
    if (stage !== "placed" && stage !== "washing") return;
    setWashScore(56);
    setActiveVisualIds([]);
    setStage("gathering");
    setDeckState((current) => ({
      ...current,
      hiddenDeckOrder: washHiddenOrder(current.hiddenDeckOrder),
      ritualCards: gatherDeckToCenter(current.ritualCards),
    }));
    clearGatherTimers();
    gatherTimers.current = [
      window.setTimeout(() => {
        setDeckState((current) => ({
          ...current,
          ritualCards: squareDeckAtCenter(current.ritualCards),
        }));
      }, 620),
      window.setTimeout(() => {
        setStage("cutReady");
      }, 880),
      window.setTimeout(() => {
        startCutDeck();
      }, 1040),
    ];
  }

  function cutDeck() {
    if (stage !== "cutReady") return;
    startCutDeck();
  }

  function beginWash() {
    if (stage !== "placed") return;
    setStage("washing");
    setDeckState((current) => ({
      ...current,
      ritualCards: loosenDeckForWash(current.ritualCards),
    }));
    setWashScore((score) => Math.max(score, 10));
  }

  function wash(pointer: WashPointer) {
    if (stage !== "placed" && stage !== "washing") return;
    setStage((current) => current === "placed" ? "washing" : current);
    setWashDirection(pointer.spinDirection);
    setDeckState((current) => {
      const result = applyWashForce(current.ritualCards, pointer);
      setActiveVisualIds(result.activeVisualIds);
      setWashScore((score) => {
        return Math.min(56, score + result.movementScore + 0.35);
      });
      return {
        ...current,
        ritualCards: result.cards,
      };
    });
  }

  function selectFromSpread(visualId: string) {
    setSelectedCards((current) => {
      return selectCardByVisualId(deckState.hiddenDeckOrder, current, visualId, maxSelectedCards);
    });
  }

  const revealCard = useCallback((visualId: string) => {
    setRevealedIds((current) => current.includes(visualId) ? current : [...current, visualId]);
  }, []);

  function restartRitual() {
    setDeckState(createInitialChamberDeckState());
    setStage(INITIAL_RITUAL_STAGE);
    setActiveVisualIds([]);
    setWashScore(INITIAL_WASH_SCORE);
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
      className="absolute inset-0 overflow-hidden text-[#f7ead0]"
    >
      <div className="pointer-events-none absolute inset-0" style={{ background: theme.chamberOverlay }} />
      <div className={`pointer-events-none absolute inset-0 ${theme.starClassName}`} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(ellipse_at_50%_65%,rgba(222,178,95,0.12),transparent_48%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),transparent_22%,rgba(255,255,255,0.028))] opacity-60" />

      <Link
        href="/app"
        aria-label="Close Tarot Room"
        className="absolute left-4 top-[calc(var(--hint-safe-top)+0.75rem)] z-[80] inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-black/28 text-[#f7ead0]/84 shadow-[0_10px_24px_rgba(0,0,0,0.28)] backdrop-blur-md transition duration-300 hover:border-[#e4c174]/55 hover:bg-[#e4c174]/10 hover:text-[#ffe8aa] active:scale-95 sm:left-5"
      >
        <X size={19} strokeWidth={1.9} aria-hidden="true" />
      </Link>

      {(stage === "placed" || stage === "washing" || stage === "gathering" || stage === "cutReady" || stage === "cutting") && (
        <CardWashRitual
          stage={stage}
          ritualCards={deckState.ritualCards}
          washProgress={washProgress}
          theme={theme}
          onBeginWash={beginWash}
          onWash={wash}
          onWashRelease={finishWash}
          onCutDeck={cutDeck}
          onContinue={enterSelectCards}
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
          cardArtId={cardArtId}
          theme={theme}
          question={setup?.question}
        />
      )}

      {stage === "reveal" && (
        <ReadingReveal
          selectedCards={selectedCards}
          revealedIds={revealedIds}
          spread={selectedSpread}
          autoReveal
          onContinue={() => setStage("reading")}
          onReveal={revealCard}
          onRestart={restartRitual}
          backStyle={theme.cardBackStyle}
          cardArtId={cardArtId}
          theme={theme}
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
