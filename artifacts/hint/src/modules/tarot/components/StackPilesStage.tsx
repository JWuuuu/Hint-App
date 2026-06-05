import { motion } from "framer-motion";
import type { CutPile, CutPileId } from "../logic/cutDeck";
import { TarotCardVisual } from "./TarotCardVisual";

type StackPilesStageProps = {
  cutPiles: CutPile[];
  stackOrder: CutPileId[];
  onChoosePile: (id: CutPileId) => void;
  onSpread: () => void;
  onWashAgain: () => void;
};

function PileButton({
  pile,
  selectedIndex,
  onClick,
}: {
  pile: CutPile;
  selectedIndex: number;
  onClick: () => void;
}) {
  const chosen = selectedIndex >= 0;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={chosen}
      className="group flex flex-col items-center gap-3 disabled:cursor-default"
    >
      <motion.div
        className="relative h-[160px] w-[116px]"
        animate={chosen ? { y: 36 - selectedIndex * 11, x: 0, scale: 0.94 } : { y: 0, x: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 160, damping: 22 }}
      >
        {Array.from({ length: 9 }).map((_, index) => (
          <div
            key={index}
            className="absolute"
            style={{ left: index * 0.5, top: index * -0.45 }}
          >
            <TarotCardVisual compact />
          </div>
        ))}
      </motion.div>
      <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-[#d8c7a6]">
        {chosen ? `Stacked ${selectedIndex + 1}` : pile.label}
      </span>
    </button>
  );
}

export function StackPilesStage({
  cutPiles,
  stackOrder,
  onChoosePile,
  onSpread,
  onWashAgain,
}: StackPilesStageProps) {
  const ready = stackOrder.length === 3;

  return (
    <section className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden px-4 py-8 text-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(226,190,116,0.18),transparent_25%),linear-gradient(180deg,#050816,#010207)]" />
      <div className="relative z-10 mb-10">
        <p className="font-serif text-4xl text-[#f7ead0]">
          {ready ? "The deck is ready." : "Stack them in the order that feels right."}
        </p>
        <p className="mt-3 font-sans text-sm text-[#d8c7a6]/75">
          Your order becomes the final deck order.
        </p>
      </div>

      <div className="relative z-10 flex min-h-[250px] w-full max-w-3xl items-center justify-center gap-10">
        {cutPiles.map((pile) => (
          <PileButton
            key={pile.id}
            pile={pile}
            selectedIndex={stackOrder.indexOf(pile.id)}
            onClick={() => onChoosePile(pile.id)}
          />
        ))}
      </div>

      <div className="relative z-10 mt-8 flex flex-wrap justify-center gap-3">
        {ready && (
          <button
            type="button"
            onClick={onSpread}
            className="rounded-full border border-[#e4c174]/45 px-6 py-3 font-sans text-xs uppercase tracking-[0.22em] text-[#f7ead0]"
          >
            Spread the deck
          </button>
        )}
        <button
          type="button"
          onClick={onWashAgain}
          className="rounded-full border border-white/15 px-6 py-3 font-sans text-xs uppercase tracking-[0.22em] text-[#d8c7a6]"
        >
          Wash again
        </button>
      </div>
    </section>
  );
}
