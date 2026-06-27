/**
 * CardSigil — the face of a tarot card as a sacred occult medallion.
 *
 * Layered ornament (back to front):
 *   1. Paper grain texture across the whole face
 *   2. Inner brushed-gold frame
 *   3. Four corner fleurs (gold knots)
 *   4. Arched cartouche at top holding the Roman numeral (gold ink)
 *   5. Central three-ring medallion with 12 outer dots and 4 cardinal cross marks
 *   6. The thematic emblem in ivory inside the medallion's inner ring
 *   7. Bottom finial knot
 *   8. Scattered "stars" in the negative-space corners
 *
 * Roman numeral + emblem are deterministic from the card id ("0-fool" → 0).
 */

import type { ReactNode } from "react";
import { GOLD } from "../atmosphere";

const ROMAN = [
  "0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
  "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI",
];

function getCardNumber(id: string): number {
  const n = parseInt(id.split("-")[0] ?? "", 10);
  return Number.isFinite(n) ? n : 0;
}

/* ─── Emblem glyphs (the heart of the card) ────────────────── */

function SunGlyph() {
  return (
    <g vectorEffect="non-scaling-stroke">
      <circle cx="0" cy="0" r="4" />
      <circle cx="0" cy="0" r="2" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * Math.PI * 2) / 12;
        const r1 = i % 2 === 0 ? 5.5 : 5.5;
        const r2 = i % 2 === 0 ? 9 : 7.5;
        return (
          <line
            key={i}
            x1={Math.cos(a) * r1}
            y1={Math.sin(a) * r1}
            x2={Math.cos(a) * r2}
            y2={Math.sin(a) * r2}
          />
        );
      })}
    </g>
  );
}

function MoonGlyph() {
  return (
    <g vectorEffect="non-scaling-stroke">
      <path d="M -2 -7 A 7 7 0 1 0 -2 7 A 5.2 5.2 0 1 1 -2 -7 Z" />
      {/* tiny stars beside the crescent */}
      <g fill="currentColor" stroke="none">
        <circle cx="5" cy="-5" r="0.6" />
        <circle cx="6.5" cy="2" r="0.45" />
        <circle cx="3.5" cy="6" r="0.5" />
      </g>
    </g>
  );
}

function StarGlyph() {
  const pts: string[] = [];
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6 - Math.PI / 2;
    const r = i % 2 === 0 ? 8.5 : 3.4;
    pts.push(`${Math.cos(a) * r},${Math.sin(a) * r}`);
  }
  return (
    <g vectorEffect="non-scaling-stroke">
      <polygon points={pts.join(" ")} />
      <circle cx="0" cy="0" r="1.6" fill="currentColor" stroke="none" />
    </g>
  );
}

function EyeGlyph() {
  return (
    <g vectorEffect="non-scaling-stroke">
      {/* triangle */}
      <polygon points="0,-8 7.5,5 -7.5,5" />
      {/* eye */}
      <path d="M -5 1 Q 0 -3 5 1 Q 0 5 -5 1 Z" />
      <circle cx="0" cy="1" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="0" cy="1" r="0.6" fill="rgba(8,8,8,0.95)" stroke="none" />
      {/* small rays at top */}
      <line x1="0" y1="-9.5" x2="0" y2="-11" />
      <line x1="-2.5" y1="-9.2" x2="-3.5" y2="-10.5" />
      <line x1="2.5" y1="-9.2" x2="3.5" y2="-10.5" />
    </g>
  );
}

function FlameGlyph() {
  return (
    <g vectorEffect="non-scaling-stroke">
      <path d="M 0 -9 C 5 -3 6 0 2.5 5 C 6 2.5 6 -1.5 9 1 C 7.5 7.5 1 10 -2.5 7.5 C -6 6 -6.5 1.5 -4 -1.5 C -2.5 0.5 -1.5 0 -1.5 -3 C -0.5 -5 0 -7 0 -9 Z" />
      <path d="M 0 -4 C 2 -1 2 1 0 3 C -2 1 -2 -1 0 -4 Z" fill="currentColor" stroke="none" opacity="0.55" />
    </g>
  );
}

function PentacleGlyph() {
  const pts: string[] = [];
  for (let i = 0; i < 5; i++) {
    const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    pts.push(`${Math.cos(a) * 8},${Math.sin(a) * 8}`);
  }
  const star = `${pts[0]} ${pts[2]} ${pts[4]} ${pts[1]} ${pts[3]} ${pts[0]}`;
  return (
    <g vectorEffect="non-scaling-stroke">
      <circle cx="0" cy="0" r="9.5" />
      <polyline points={star} />
      {/* small dots at each pentagram point */}
      {pts.map((p, i) => {
        const [x, y] = p.split(",").map(Number);
        return (
          <circle key={i} cx={x} cy={y} r="0.5" fill="currentColor" stroke="none" />
        );
      })}
    </g>
  );
}

function ChaliceGlyph() {
  return (
    <g vectorEffect="non-scaling-stroke">
      {/* bowl */}
      <path d="M -7 -5 Q 0 6 7 -5" />
      <path d="M -7 -5 L 7 -5" />
      {/* stem */}
      <line x1="0" y1="2" x2="0" y2="7" />
      {/* foot */}
      <line x1="-4" y1="8" x2="4" y2="8" />
      <line x1="-2.5" y1="7" x2="2.5" y2="7" />
      {/* droplet above */}
      <path d="M 0 -8 Q 1.5 -6 0 -4 Q -1.5 -6 0 -8 Z" fill="currentColor" stroke="none" />
    </g>
  );
}

function KeyGlyph() {
  return (
    <g vectorEffect="non-scaling-stroke">
      {/* ornate bow */}
      <circle cx="-4" cy="0" r="4" />
      <circle cx="-4" cy="0" r="2" />
      {/* shaft */}
      <line x1="0" y1="0" x2="10" y2="0" />
      {/* teeth */}
      <line x1="6" y1="0" x2="6" y2="3" />
      <line x1="9" y1="0" x2="9" y2="2.2" />
      {/* small dot finial */}
      <circle cx="10.5" cy="0" r="0.6" fill="currentColor" stroke="none" />
    </g>
  );
}

const GLYPHS: Array<() => ReactNode> = [
  SunGlyph,      // 0
  KeyGlyph,      // 1
  MoonGlyph,     // 2
  StarGlyph,     // 3
  PentacleGlyph, // 4
  EyeGlyph,      // 5
  ChaliceGlyph,  // 6
  FlameGlyph,    // 7
];

function getGlyph(cardNumber: number): () => ReactNode {
  return GLYPHS[cardNumber % GLYPHS.length] ?? SunGlyph;
}

/* ─── Corner fleur knot ───────────────────────────────────── */

function CornerFleur({ x, y, rot }: { x: number; y: number; rot: number }) {
  return (
    <g transform={`translate(${x},${y}) rotate(${rot})`}>
      {/* diamond */}
      <path d="M 0 -2.2 L 2.2 0 L 0 2.2 L -2.2 0 Z" />
      {/* tail outward */}
      <line x1="0" y1="2.2" x2="0" y2="5.5" />
      {/* trailing dot */}
      <circle cx="0" cy="6.6" r="0.55" />
      {/* small inner arc tendrils */}
      <path d="M -2.2 0 Q -3.5 -1 -4 -2.5" fill="none" />
      <path d="M 2.2 0 Q 3.5 -1 4 -2.5" fill="none" />
    </g>
  );
}

/* ─── Paper grain (deterministic SVG noise) ──────────────── */

const PAPER_GRAIN = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">
    <filter id="g">
      <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix values="0 0 0 0 1  0 0 0 0 0.95  0 0 0 0 0.8  0 0 0 0.45 0"/>
    </filter>
    <rect width="100%" height="100%" filter="url(#g)"/>
  </svg>`
)}`;

interface Props {
  cardId: string;
  reversed?: boolean;
  /** Override the emblem stroke color. Default = warm ivory. */
  color?: string;
}

export function CardSigil({
  cardId,
  reversed,
  color = "rgba(252, 240, 210, 0.85)",
}: Props) {
  const number = getCardNumber(cardId);
  const Glyph = getGlyph(number);
  const roman = ROMAN[number] ?? "·";

  // 12 outer dots between rings r=14 and r=11
  const outerDots = Array.from({ length: 12 }).map((_, i) => {
    const a = (i * Math.PI * 2) / 12 - Math.PI / 2;
    return { x: Math.cos(a) * 12.4, y: Math.sin(a) * 12.4 };
  });

  // 4 cardinal cross marks between rings r=11 and r=8
  const cardinalMarks = [0, 90, 180, 270].map((deg) => {
    const a = (deg * Math.PI) / 180;
    const r = 9.6;
    return { x: Math.cos(a) * r, y: Math.sin(a) * r };
  });

  return (
    <div className="absolute inset-0 overflow-hidden rounded-[7px]">
      {/* Paper grain texture on the card face */}
      <div
        aria-hidden
        className="absolute inset-0 mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("${PAPER_GRAIN}")`,
          backgroundSize: "60px 60px",
          backgroundRepeat: "repeat",
          opacity: 0.42,
        }}
      />

      {/* Inner brushed-gold frame */}
      <div
        aria-hidden
        className="absolute inset-[5px] rounded-[4px] pointer-events-none"
        style={{
          border: `0.5px solid ${GOLD.edge}`,
          boxShadow: `inset 0 0 22px ${GOLD.bloom}`,
        }}
      />

      {/* The sigil composition */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ transform: reversed ? "rotate(180deg)" : undefined }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="-22 -34 44 68"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* ── Corner fleurs (4) ── */}
          <g stroke={GOLD.stroke} strokeWidth="0.45" fill={GOLD.stroke}>
            <CornerFleur x={-18} y={-29} rot={135} />
            <CornerFleur x={18} y={-29} rot={-135} />
            <CornerFleur x={-18} y={29} rot={45} />
            <CornerFleur x={18} y={29} rot={-45} />
          </g>

          {/* ── Top band hairlines (corner to cartouche) ── */}
          <g stroke={GOLD.stroke} strokeWidth="0.32" opacity="0.7">
            <line x1="-14.5" y1="-28" x2="-10.5" y2="-28" />
            <line x1="10.5" y1="-28" x2="14.5" y2="-28" />
            <line x1="-14.5" y1="28" x2="-7" y2="28" />
            <line x1="7" y1="28" x2="14.5" y2="28" />
          </g>

          {/* ── Arched cartouche containing Roman numeral ── */}
          <g>
            <path
              d="M -10 -18 L -10 -25 Q -10 -28 -7 -28 L 7 -28 Q 10 -28 10 -25 L 10 -18 Z"
              stroke={GOLD.stroke}
              strokeWidth="0.5"
              fill="rgba(255, 225, 170, 0.05)"
            />
            <line
              x1="-8"
              y1="-19.5"
              x2="8"
              y2="-19.5"
              stroke={GOLD.stroke}
              strokeWidth="0.3"
              opacity="0.55"
            />
            <text
              x="0"
              y="-21"
              textAnchor="middle"
              fill={GOLD.ink}
              style={{
                fontFamily: "'Cormorant Garamond', 'Times New Roman', serif",
                fontSize:
                  roman.length > 3 ? 6.8 : roman.length > 2 ? 7.6 : 8.6,
                letterSpacing: "0.14em",
                fontStyle: "italic",
              }}
            >
              {roman}
            </text>
          </g>

          {/* ── Connector between cartouche and medallion ── */}
          <g stroke={GOLD.stroke} strokeWidth="0.32" opacity="0.7">
            <line x1="0" y1="-18" x2="0" y2="-15.5" />
            <path
              d="M 0 -15.2 L 0.8 -14.4 L 0 -13.6 L -0.8 -14.4 Z"
              fill={GOLD.stroke}
            />
          </g>

          {/* ── Central medallion: 3 concentric rings ── */}
          <g stroke={GOLD.stroke} fill="none">
            <circle cx="0" cy="0" r="14" strokeWidth="0.5" />
            <circle cx="0" cy="0" r="11" strokeWidth="0.35" opacity="0.78" />
            <circle cx="0" cy="0" r="8" strokeWidth="0.35" opacity="0.6" />
          </g>

          {/* ── 12 outer dots between r=14 and r=11 ── */}
          <g fill={GOLD.stroke}>
            {outerDots.map((d, i) => (
              <circle
                key={i}
                cx={d.x}
                cy={d.y}
                r={i % 3 === 0 ? 0.55 : 0.38}
                opacity={i % 3 === 0 ? 0.95 : 0.7}
              />
            ))}
          </g>

          {/* ── 4 cardinal cross marks between r=11 and r=8 ── */}
          <g stroke={GOLD.stroke} strokeWidth="0.4">
            {cardinalMarks.map((m, i) => (
              <g key={i}>
                <line x1={m.x - 0.9} y1={m.y} x2={m.x + 0.9} y2={m.y} />
                <line x1={m.x} y1={m.y - 0.9} x2={m.x} y2={m.y + 0.9} />
              </g>
            ))}
          </g>

          {/* ── Emblem inside the inner ring (ivory color) ── */}
          <g
            transform="translate(0, 0) scale(0.75)"
            stroke={color}
            strokeWidth="0.7"
            color={color}
          >
            <Glyph />
          </g>

          {/* ── Bottom finial knot ── */}
          <g transform="translate(0, 25)" stroke={GOLD.stroke} strokeWidth="0.4">
            {/* connector up to medallion */}
            <line x1="0" y1="-3" x2="0" y2="-1.6" opacity="0.7" />
            {/* center diamond */}
            <path
              d="M 0 -1.6 L 1.6 0 L 0 1.6 L -1.6 0 Z"
              fill={GOLD.stroke}
              stroke="none"
            />
            {/* side dots */}
            <circle cx="-4.5" cy="0" r="0.5" fill={GOLD.stroke} stroke="none" />
            <circle cx="4.5" cy="0" r="0.5" fill={GOLD.stroke} stroke="none" />
            {/* side tails */}
            <line x1="-2.2" y1="0" x2="-3.6" y2="0" opacity="0.7" />
            <line x1="2.2" y1="0" x2="3.6" y2="0" opacity="0.7" />
          </g>

          {/* ── Scattered tiny stars in negative-space corners ── */}
          <g fill={GOLD.stroke} opacity="0.55">
            <circle cx="-17" cy="-10" r="0.4" />
            <circle cx="17" cy="-10" r="0.4" />
            <circle cx="-17" cy="13" r="0.45" />
            <circle cx="17" cy="13" r="0.45" />
            {/* a couple of tiny 4-pointed stars too */}
            <g stroke={GOLD.stroke} strokeWidth="0.2" fill="none" opacity="0.7">
              <g transform="translate(-15.5, 6)">
                <line x1="-0.9" y1="0" x2="0.9" y2="0" />
                <line x1="0" y1="-0.9" x2="0" y2="0.9" />
              </g>
              <g transform="translate(15.5, 6)">
                <line x1="-0.9" y1="0" x2="0.9" y2="0" />
                <line x1="0" y1="-0.9" x2="0" y2="0.9" />
              </g>
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
}
