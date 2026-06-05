import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import type { CutPile, CutPileId } from "../logic/cutDeck";
import { cutDeck, stackPiles } from "../logic/cutDeck";
import type { RitualCard } from "../logic/createHiddenDeck";
import { createHiddenDeck, scatterDeck } from "../logic/createHiddenDeck";
import { selectCardByVisualId } from "../logic/selectCards";
import { applyWashForce, gatherDeckToCenter, squareDeckAtCenter } from "../logic/washPhysics";
import type { WashPointer } from "../logic/washPhysics";
import { CardWashRitual } from "./CardWashRitual";
import { CutDeckStage } from "./CutDeckStage";
import { ReadingReveal } from "./ReadingReveal";
import { RibbonSpread } from "./RibbonSpread";
import { StackPilesStage } from "./StackPilesStage";

type RitualStage =
  | "placed"
  | "washing"
  | "gathering"
  | "cutting"
  | "stacking"
  | "ribbon"
  | "reveal";

const MAX_SELECTED_CARDS = 3;

export function TarotRoom() {
  const [placedDeck, setPlacedDeck] = useState<RitualCard[]>(() => createHiddenDeck());
  const [hiddenDeckOrder, setHiddenDeckOrder] = useState<RitualCard[]>(() => placedDeck);
  const [ritualCards, setRitualCards] = useState<RitualCard[]>(() => placedDeck);
  const [selectedCards, setSelectedCards] = useState<RitualCard[]>([]);
  const [cutPiles, setCutPiles] = useState<CutPile[]>([]);
  const [finalDeckOrder, setFinalDeckOrder] = useState<RitualCard[]>([]);

  const [stage, setStage] = useState<RitualStage>("placed");
  const [activeVisualIds, setActiveVisualIds] = useState<string[]>([]);
  const [washScore, setWashScore] = useState(0);
  const [restAvailable, setRestAvailable] = useState(false);
  const [stackOrder, setStackOrder] = useState<CutPileId[]>([]);
  const [revealedIds, setRevealedIds] = useState<string[]>([]);

  const canRest = restAvailable || washScore > 28;
  const visibleDeckCount = useMemo(() => placedDeck.length, [placedDeck.length]);

  useEffect(() => {
    if (stage !== "washing") return;
    const timer = window.setTimeout(() => setRestAvailable(true), 3200);
    return () => window.clearTimeout(timer);
  }, [stage]);

  function resetRitual() {
    const nextDeck = createHiddenDeck();
    setPlacedDeck(nextDeck);
    setHiddenDeckOrder(nextDeck);
    setRitualCards(nextDeck);
    setSelectedCards([]);
    setCutPiles([]);
    setFinalDeckOrder([]);
    setStage("placed");
    setActiveVisualIds([]);
    setWashScore(0);
    setRestAvailable(false);
    setStackOrder([]);
    setRevealedIds([]);
  }

  function beginWash() {
    if (stage === "placed") setStage("washing");
  }

  function wash(pointer: WashPointer) {
    const result = applyWashForce(ritualCards, pointer);
    setRitualCards(result.cards);
    setActiveVisualIds(result.activeVisualIds);
    setWashScore((score) => score + result.movementScore);
  }

  function restDeck() {
    setStage("gathering");
    setRitualCards((cards) => gatherDeckToCenter(cards));
    window.setTimeout(() => {
      setRitualCards((cards) => squareDeckAtCenter(cards));
    }, 760);
    window.setTimeout(() => {
      setActiveVisualIds([]);
      setStage("cutting");
    }, 1750);
  }

  function doCut() {
    setCutPiles(cutDeck(hiddenDeckOrder));
  }

  function choosePile(id: CutPileId) {
    if (stackOrder.includes(id) || stackOrder.length >= 3) return;
    const nextOrder = [...stackOrder, id];
    setStackOrder(nextOrder);
    if (nextOrder.length === 3) {
      setFinalDeckOrder(stackPiles(cutPiles, nextOrder));
    }
  }

  function washAgain() {
    const scattered = scatterDeck(hiddenDeckOrder);
    setRitualCards(scattered);
    setPlacedDeck(scattered);
    setCutPiles([]);
    setFinalDeckOrder([]);
    setStackOrder([]);
    setSelectedCards([]);
    setRevealedIds([]);
    setWashScore(0);
    setRestAvailable(false);
    setStage("washing");
  }

  function selectFromRibbon(visualId: string) {
    setSelectedCards((current) => {
      const next = selectCardByVisualId(finalDeckOrder, current, visualId, MAX_SELECTED_CARDS);
      if (next.length === MAX_SELECTED_CARDS) {
        window.setTimeout(() => setStage("reveal"), 700);
      }
      return next;
    });
  }

  function revealCard(visualId: string) {
    setRevealedIds((current) => current.includes(visualId) ? current : [...current, visualId]);
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#010207] text-[#f7ead0]">
      <Link
        href="/"
        className="absolute left-5 top-5 z-50 font-serif text-[11px] uppercase tracking-[0.32em] text-[#d8c7a6]/75 transition-opacity hover:opacity-80"
      >
        ← Home
      </Link>
      <div className="absolute right-5 top-16 z-50 rounded-full border border-[#e4c174]/25 bg-black/24 px-4 py-2 font-sans text-[10px] uppercase tracking-[0.22em] text-[#d8c7a6]/80 sm:right-32 sm:top-5">
        78 cards placed
      </div>

      {(stage === "placed" || stage === "washing" || stage === "gathering") && (
        <CardWashRitual
          stage={stage}
          ritualCards={ritualCards}
          activeVisualIds={activeVisualIds}
          canRest={canRest}
          onBeginWash={beginWash}
          onWash={wash}
          onRest={restDeck}
        />
      )}

      {stage === "cutting" && (
        <CutDeckStage
          cutPiles={cutPiles}
          onCut={doCut}
          onContinue={() => setStage("stacking")}
        />
      )}

      {stage === "stacking" && (
        <StackPilesStage
          cutPiles={cutPiles}
          stackOrder={stackOrder}
          onChoosePile={choosePile}
          onSpread={() => setStage("ribbon")}
          onWashAgain={washAgain}
        />
      )}

      {stage === "ribbon" && (
        <RibbonSpread
          finalDeckOrder={finalDeckOrder}
          selectedCards={selectedCards}
          maxCards={MAX_SELECTED_CARDS}
          onSelect={selectFromRibbon}
        />
      )}

      {stage === "reveal" && (
        <ReadingReveal
          selectedCards={selectedCards}
          revealedIds={revealedIds}
          onReveal={revealCard}
          onRestart={resetRitual}
        />
      )}

      <div className="pointer-events-none absolute bottom-5 left-5 z-50 font-sans text-[10px] uppercase tracking-[0.2em] text-[#d8c7a6]/45">
        Hidden deck set before touch · {visibleDeckCount} visual cards
      </div>
    </div>
  );
}
