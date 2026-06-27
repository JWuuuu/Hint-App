import type { DailySkyDeck } from "../../lib/skydeck/generateDailySkyDeck";
import { SkyDeckEvidenceDrawer } from "./SkyDeckEvidenceDrawer";
import { SkyScoreBar } from "./SkyScoreBar";

export function SkyDeckCard({ deck, revealed = false }: { deck: DailySkyDeck; revealed?: boolean }) {
  return (
    <section className="skydeck-card">
      <div className="skydeck-card__header">
        <span>Daily SkyDeck</span>
        <strong>{deck.scores.overall}</strong>
      </div>
      <div className="skydeck-card__scores">
        {deck.scoreBars.map((score) => (
          <SkyScoreBar key={score.key} score={score} />
        ))}
      </div>
      {revealed && (
        <div className="skydeck-card__reading">
          <h3>{deck.dailyCard.cardName}</h3>
          <p>{deck.shortInterpretation}</p>
        </div>
      )}
      <SkyDeckEvidenceDrawer evidence={deck.evidence} />
    </section>
  );
}
