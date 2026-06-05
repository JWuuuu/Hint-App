import { motion } from "framer-motion";
import type { CutPile } from "../logic/cutDeck";
import { TarotCardVisual } from "./TarotCardVisual";

type CutDeckStageProps = {
  cutPiles: CutPile[];
  onCut: () => void;
  onContinue: () => void;
};

function DeckStack({ count = 18 }: { count?: number }) {
  return (
    <div className="relative h-[170px] w-[120px]">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="absolute"
          style={{
            left: `${index * 0.45}px`,
            top: `${index * -0.35}px`,
            transform: `rotate(${(index % 5 - 2) * 0.35}deg)`,
          }}
        >
          <TarotCardVisual compact />
        </div>
      ))}
    </div>
  );
}

function PilePreview({ pile, index }: { pile: CutPile; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.16, type: "spring", stiffness: 150, damping: 24 }}
      className="flex flex-col items-center gap-3"
    >
      <DeckStack count={10} />
      <p className="font-sans text-[11px] uppercase tracking-[0.22em] text-[#d8c7a6]">
        {pile.label} · {pile.cards.length}
      </p>
    </motion.div>
  );
}

export function CutDeckStage({ cutPiles, onCut, onContinue }: CutDeckStageProps) {
  const cut = cutPiles.length === 3;

  return (
    <section className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden px-4 py-8 text-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_46%,rgba(226,190,116,0.16),transparent_28%),linear-gradient(180deg,#050816,#010207)]" />
      <div className="relative z-10 mb-10">
        <p className="font-serif text-4xl text-[#f7ead0]">Cut the deck into three.</p>
        <p className="mt-3 font-sans text-sm text-[#d8c7a6]/75">
          The piles are slices of the deck already on the table.
        </p>
      </div>

      <div className="relative z-10 flex min-h-[230px] w-full max-w-3xl items-center justify-center gap-10">
        {cut ? cutPiles.map((pile, index) => <PilePreview key={pile.id} pile={pile} index={index} />) : <DeckStack />}
      </div>

      <div className="relative z-10 mt-8">
        {!cut ? (
          <button
            type="button"
            onClick={onCut}
            className="rounded-full border border-[#e4c174]/45 px-6 py-3 font-sans text-xs uppercase tracking-[0.22em] text-[#f7ead0]"
          >
            Cut
          </button>
        ) : (
          <button
            type="button"
            onClick={onContinue}
            className="rounded-full border border-[#e4c174]/45 px-6 py-3 font-sans text-xs uppercase tracking-[0.22em] text-[#f7ead0]"
          >
            Stack piles
          </button>
        )}
      </div>
    </section>
  );
}
