import type { SkyDeckScore } from "../../lib/skydeck/generateDailySkyDeck";

export function SkyScoreBar({ score }: { score: SkyDeckScore }) {
  return (
    <div className="sky-score-bar">
      <div className="sky-score-bar__top">
        <span>{score.label}</span>
        <strong>{score.score}</strong>
      </div>
      <div className="sky-score-bar__track" aria-hidden="true">
        <span style={{ transform: `scaleX(${score.score / 100})` }} />
      </div>
    </div>
  );
}
