import type { ReactNode } from "react";
import { GOLD } from "../../hold/atmosphere";

/**
 * Sigils — monoline gold-ink glyphs in a single hand, drawn in a -16..16
 * box. Quiet, occult, never emoji or icon-soup. Each module references one.
 */
function S({ children }: { children: ReactNode }) {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="-16 -16 32 32"
      fill="none"
      stroke={GOLD.stroke}
      strokeWidth="0.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

const dot = (cx: number, cy: number, r = 1) => (
  <circle cx={cx} cy={cy} r={r} fill={GOLD.stroke} stroke="none" />
);

const card = (x = -6, y = -10, w = 12, h = 20) => (
  <rect x={x} y={y} width={w} height={h} rx="1" />
);

const star = (cx: number, cy: number, outer = 4, inner = 1.6) => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    const r = i % 2 === 0 ? outer : inner;
    pts.push(`${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`);
  }
  return <polygon points={pts.join(" ")} />;
};

/* ── Reflection ─────────────────────────────────────────────── */

export const AskSigil = () => (
  <S>
    <path d="M 4 -9 A 10 10 0 1 0 4 9 A 7 7 0 1 1 4 -9 Z" />
    {dot(-2, 0, 0.7)}
    {dot(-5, -4, 0.5)}
    {dot(-5, 4, 0.5)}
  </S>
);

export const JournalSigil = () => (
  <S>
    <path d="M -10 -7 L -10 8 L 0 6 L 10 8 L 10 -7 L 0 -5 Z" />
    <line x1="0" y1="-5" x2="0" y2="6" opacity="0.55" />
    <line x1="-7" y1="-2" x2="-3" y2="-2.5" opacity="0.6" />
    <line x1="3" y1="-2.5" x2="7" y2="-2" opacity="0.6" />
    <line x1="-7" y1="1" x2="-3" y2="0.5" opacity="0.6" />
    <line x1="3" y1="0.5" x2="7" y2="1" opacity="0.6" />
  </S>
);

export const MoodSigil = () => (
  <S>
    <circle cx="0" cy="0" r="10" />
    <path d="M -7 1 Q -3.5 5 0 1 Q 3.5 -3 7 1" />
    {dot(0, -4, 1)}
  </S>
);

export const DailyPullSigil = () => (
  <S>
    {card()}
    {star(0, 0)}
  </S>
);

export const AvoidingSigil = () => (
  <S>
    <path d="M -10 0 Q 0 -7 10 0 Q 0 7 -10 0 Z" />
    {dot(0, 0, 2)}
    <line x1="-9" y1="9" x2="9" y2="-9" />
  </S>
);

/* ── Tarot ──────────────────────────────────────────────────── */

export const TarotSigil = () => (
  <S>
    <line x1="-9" y1="-10" x2="-9" y2="10" />
    <line x1="9" y1="-10" x2="9" y2="10" />
    <circle cx="0" cy="0" r="4.5" />
    {dot(0, 0, 1.8)}
    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
      const a = (i * Math.PI) / 4;
      return (
        <line
          key={i}
          x1={Math.cos(a) * 5.5}
          y1={Math.sin(a) * 5.5}
          x2={Math.cos(a) * 7.5}
          y2={Math.sin(a) * 7.5}
        />
      );
    })}
  </S>
);

export const OneCardSigil = () => (
  <S>
    {card(-6, -10, 12, 20)}
    {dot(0, -5, 1)}
    <line x1="-3" y1="0" x2="3" y2="0" opacity="0.6" />
    {dot(0, 5, 1)}
  </S>
);

export const SpreadSigil = () => (
  <S>
    <g transform="rotate(-20)">
      <rect x="-4.5" y="-9" width="9" height="16" rx="1" />
    </g>
    <g transform="rotate(20)">
      <rect x="-4.5" y="-9" width="9" height="16" rx="1" />
    </g>
    <rect x="-4.5" y="-9" width="9" height="16" rx="1" />
    {dot(0, -1, 1)}
  </S>
);

export const DrawAgainSigil = () => (
  <S>
    <rect x="-5" y="-8" width="10" height="16" rx="1" />
    <path d="M 9 -3 A 9 9 0 1 1 6 -8" opacity="0.85" />
    <path d="M 6 -8 L 9 -8 M 6 -8 L 6 -5" opacity="0.85" />
  </S>
);

export const ArchiveSigil = () => (
  <S>
    <rect x="-9" y="-7" width="14" height="18" rx="1" opacity="0.45" />
    <rect x="-6" y="-9" width="14" height="18" rx="1" opacity="0.7" />
    <rect x="-3" y="-11" width="14" height="18" rx="1" />
    {star(4, -2, 2.4, 1)}
  </S>
);

/* ── Relationships ──────────────────────────────────────────── */

export const CompatibilitySigil = () => (
  <S>
    <circle cx="-3.5" cy="0" r="6" />
    <circle cx="3.5" cy="0" r="6" />
    {dot(0, 0, 1)}
  </S>
);

export const RelationshipEnergySigil = () => (
  <S>
    <path d="M -5 7 C -8 2 -3 -1 -5 -6 C -2 -3 0 -1 -2 4 C 0 1 1 3 -1 7 Z" />
    <path d="M 5 7 C 2 2 7 -1 5 -6 C 2 -3 4 -1 2 4 C 4 1 5 3 3 7 Z" />
  </S>
);

export const YouThemSigil = () => (
  <S>
    <circle cx="-6" cy="-3" r="3.2" />
    <path d="M -11 9 Q -6 3 -1 9" />
    <circle cx="6" cy="-3" r="3.2" />
    <path d="M 1 9 Q 6 3 11 9" />
  </S>
);

export const UnfinishedSigil = () => (
  <S>
    <path d="M -10 -7 Q -2 -2 -3 5" />
    <path d="M 10 -7 Q 2 -2 3 5" />
    {dot(-3, 8, 0.9)}
    {dot(3, 8, 0.9)}
  </S>
);

/* ── Astrology ──────────────────────────────────────────────── */

export const NatalSigil = () => (
  <S>
    <circle cx="0" cy="0" r="10" />
    <circle cx="0" cy="0" r="6" opacity="0.55" />
    {[0, 1, 2, 3, 4, 5].map((i) => {
      const a = (i * Math.PI) / 3;
      return (
        <line
          key={i}
          x1={Math.cos(a) * 6}
          y1={Math.sin(a) * 6}
          x2={Math.cos(a) * 10}
          y2={Math.sin(a) * 10}
          opacity="0.7"
        />
      );
    })}
    {dot(0, 0, 1.2)}
  </S>
);

export const ReportSigil = () => (
  <S>
    <rect x="-7" y="-10" width="14" height="20" rx="1" />
    {star(0, -4, 2.6, 1)}
    <line x1="-4" y1="2" x2="4" y2="2" opacity="0.6" />
    <line x1="-4" y1="5" x2="2" y2="5" opacity="0.6" />
  </S>
);

export const MoonPhaseSigil = () => (
  <S>
    <circle cx="-8" cy="0" r="3" opacity="0.6" />
    <path d="M 0 -4 A 4 4 0 1 0 0 4 A 3 3 0 1 1 0 -4 Z" />
    <circle cx="8" cy="0" r="3" fill={GOLD.stroke} stroke="none" opacity="0.55" />
    <circle cx="8" cy="0" r="3" />
  </S>
);

export const StarsSigil = () => (
  <S>
    <polyline points="-9,-6 -3,2 4,-3 9,6" opacity="0.55" />
    {dot(-9, -6, 1.2)}
    {dot(-3, 2, 1)}
    {dot(4, -3, 1.3)}
    {dot(9, 6, 1)}
  </S>
);

/* ── Inner Self ─────────────────────────────────────────────── */

export const InnerTypeSigil = () => (
  <S>
    {(() => {
      const pts: string[] = [];
      for (let i = 0; i < 9; i++) {
        const a = (i * 2 * Math.PI) / 9 - Math.PI / 2;
        pts.push(`${Math.cos(a) * 9},${Math.sin(a) * 9}`);
      }
      return <polygon points={pts.join(" ")} />;
    })()}
    {[0, 3, 6].map((i) => {
      const a = (i * 2 * Math.PI) / 9 - Math.PI / 2;
      const b = ((i + 3) * 2 * Math.PI) / 9 - Math.PI / 2;
      return (
        <line
          key={i}
          x1={Math.cos(a) * 9}
          y1={Math.sin(a) * 9}
          x2={Math.cos(b) * 9}
          y2={Math.sin(b) * 9}
          opacity="0.6"
        />
      );
    })}
  </S>
);

export const ShadowSigil = () => (
  <S>
    <circle cx="0" cy="0" r="9" />
    <path
      d="M 0 -9 A 9 9 0 0 1 0 9 A 7 7 0 0 0 0 -9 Z"
      fill={GOLD.stroke}
      stroke="none"
      opacity="0.55"
    />
  </S>
);

export const FutureSelfSigil = () => (
  <S>
    <path d="M -8 -10 L 8 -10 L -8 10 L 8 10 Z" />
    <line x1="0" y1="-10" x2="0" y2="10" opacity="0.55" />
    {dot(0, 0, 1.2)}
  </S>
);

export const DreamSigil = () => (
  <S>
    <circle cx="0" cy="-2" r="7" />
    <path d="M -7 -2 Q 0 -6 7 -2 Q 0 2 -7 -2 Z" />
    {dot(0, -2, 1.4)}
    <line x1="0" y1="5" x2="0" y2="11" />
    <line x1="-2" y1="9" x2="2" y2="9" />
  </S>
);

export const PatternSigil = () => (
  <S>
    <path d="M -11 0 Q -8 -7 -5 0 Q -2 7 1 0 Q 4 -7 7 0 Q 10 7 12 2" />
    {dot(-5, 0, 0.8)}
    {dot(1, 0, 0.8)}
    {dot(7, 0, 0.8)}
  </S>
);

/* ── Growth ─────────────────────────────────────────────────── */

export const EnergySigil = () => (
  <S>
    <circle cx="0" cy="0" r="10" />
    <path d="M 1 -6 L -3 1 L 0 1 L -1 7 L 4 -1 L 1 -1 Z" />
  </S>
);

export const StepSigil = () => (
  <S>
    <path d="M -8 9 Q -8 1 -1 1 Q 6 1 6 -7" opacity="0.7" />
    {dot(-8, 9, 1.2)}
    <path d="M 3 -7 L 6 -9 L 8 -6" />
  </S>
);

export const ClaritySigil = () => (
  <S>
    <path d="M 0 -10 C 7 -2 7 5 0 9 C -7 5 -7 -2 0 -10 Z" />
    <path d="M -3 3 Q 0 6 3 3" opacity="0.6" />
  </S>
);

export const WeeklySigil = () => (
  <S>
    {[-9, -6, -3, 0, 3, 6, 9].map((x, i) => (
      <line
        key={x}
        x1={x}
        y1={i === 3 ? -7 : -4}
        x2={x}
        y2={i === 3 ? 7 : 4}
        opacity={i === 3 ? 1 : 0.6}
      />
    ))}
    {dot(0, 0, 1.1)}
  </S>
);

export const BecomingSigil = () => (
  <S>
    <path d="M -7 6 Q 0 11 7 6 L 5 10 L -5 10 Z" />
    <line x1="0" y1="6" x2="0" y2="-4" />
    <path d="M 0 -1 Q 4 -3 5 -7" opacity="0.7" />
    <path d="M 0 -2 Q -4 -4 -5 -8" opacity="0.7" />
    {dot(0, -6, 1.4)}
  </S>
);

/* ── Utility ────────────────────────────────────────────────── */

export const MoreSigil = () => (
  <S>
    <circle cx="-6" cy="-6" r="3.4" />
    <circle cx="6" cy="-6" r="3.4" />
    <circle cx="-6" cy="6" r="3.4" />
    <circle cx="6" cy="6" r="3.4" opacity="0.55" />
    {dot(6, 6, 1)}
  </S>
);
