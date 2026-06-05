import type { RitualCard } from "../logic/createHiddenDeck";
import { TarotCardVisual } from "./TarotCardVisual";

type ReadingRevealProps = {
  selectedCards: RitualCard[];
  revealedIds: readonly string[];
  onReveal: (visualId: string) => void;
  onRestart: () => void;
};

const POSITION_LABELS = ["Past", "Present", "Next"];

export function ReadingReveal({
  selectedCards,
  revealedIds,
  onReveal,
  onRestart,
}: ReadingRevealProps) {
  const allRevealed = selectedCards.every((card) => revealedIds.includes(card.visualId));

  return (
    <section className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden px-4 py-8 text-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(226,190,116,0.16),transparent_30%),linear-gradient(180deg,#050816,#010207)]" />
      <div className="relative z-10 mb-8">
        <p className="font-serif text-4xl text-[#f7ead0]">These are the cards that came through.</p>
        <p className="mt-3 font-sans text-sm text-[#d8c7a6]/75">Turn them when you are ready.</p>
      </div>

      <div className="relative z-10 grid w-full max-w-4xl gap-6 sm:grid-cols-3">
        {selectedCards.map((card, index) => {
          const revealed = revealedIds.includes(card.visualId);
          return (
            <div key={card.visualId} className="flex flex-col items-center gap-4">
              <TarotCardVisual
                card={card}
                faceDown={!revealed}
                revealed={revealed}
                positionLabel={POSITION_LABELS[index] ?? `Card ${index + 1}`}
                onClick={revealed ? undefined : () => onReveal(card.visualId)}
              />
              <p className="font-sans text-[11px] uppercase tracking-[0.22em] text-[#d8c7a6]/72">
                {POSITION_LABELS[index] ?? `Card ${index + 1}`}
              </p>
            </div>
          );
        })}
      </div>

      {allRevealed && (
        <button
          type="button"
          onClick={onRestart}
          className="relative z-10 mt-10 rounded-full border border-[#e4c174]/45 px-6 py-3 font-sans text-xs uppercase tracking-[0.22em] text-[#f7ead0]"
        >
          Begin again
        </button>
      )}
    </section>
  );
}
