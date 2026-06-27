import type { DailySkyDeck } from "../../lib/skydeck/generateDailySkyDeck";
import { SkyDeckEvidenceDrawer } from "./SkyDeckEvidenceDrawer";

export function SkyDeckExplanation({ deck }: { deck: DailySkyDeck }) {
  return (
    <section className="skydeck-explanation">
      <p>{deck.shortInterpretation}</p>
      <SkyDeckEvidenceDrawer evidence={deck.evidence} />
    </section>
  );
}
