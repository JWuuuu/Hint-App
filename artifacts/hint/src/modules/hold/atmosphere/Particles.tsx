/**
 * Starfield — a layered, parallax, gently twinkling night sky.
 *
 * Three depth tiers (far / mid / near) drift at different speeds for
 * parallax, each star twinkles softly, and a handful of brighter "anchor"
 * stars bloom with a soft halo. A very rare, slow shooting star streaks
 * across as the signature touch.
 *
 * Pure CSS animation — only `transform` and `opacity` are animated, both
 * compositor-accelerated, so there is no per-frame JS and it stays smooth
 * on phones. `prefers-reduced-motion` quiets the drift/twinkle and removes
 * the shooting star entirely.
 */

import { useMemo } from "react";

interface Star {
  left: number; // %
  top: number; // %
  size: number; // px
  op: number; // peak opacity
  min: number; // trough opacity
  twinkle: number; // s
  delay: number; // s
  color: string;
  anchor: boolean;
}

interface Tier {
  name: string;
  count: number;
  sizeMin: number;
  sizeMax: number;
  opMin: number;
  opMax: number;
  /** parallax drift in px, [x, y] */
  drift: [number, number];
  /** drift loop duration, s */
  driftDur: number;
  /** how many of this tier's stars bloom as anchors */
  anchors: number;
}

const TIERS: Tier[] = [
  {
    name: "far",
    count: 64,
    sizeMin: 0.7,
    sizeMax: 1.3,
    opMin: 0.14,
    opMax: 0.34,
    drift: [10, 8],
    driftDur: 150,
    anchors: 0,
  },
  {
    name: "mid",
    count: 38,
    sizeMin: 1.1,
    sizeMax: 1.9,
    opMin: 0.28,
    opMax: 0.54,
    drift: [20, -14],
    driftDur: 110,
    anchors: 3,
  },
  {
    name: "near",
    count: 18,
    sizeMin: 1.7,
    sizeMax: 2.8,
    opMin: 0.42,
    opMax: 0.78,
    drift: [34, 22],
    driftDur: 78,
    anchors: 4,
  },
];

const STAR_COLORS = [
  "rgba(255, 253, 247, 1)", // soft white
  "rgba(255, 253, 247, 1)",
  "rgba(255, 253, 247, 1)",
  "rgba(224, 232, 248, 1)", // cool moonlit
  "rgba(255, 239, 214, 1)", // warm candle
];

function buildTier(tier: Tier, seed: number): Star[] {
  // Deterministic pseudo-random so mount stays stable.
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
  return Array.from({ length: tier.count }, (_, i) => {
    const op = tier.opMin + rand() * (tier.opMax - tier.opMin);
    const isAnchor = i < tier.anchors;
    return {
      left: rand() * 100,
      top: rand() * 100,
      size: tier.sizeMin + rand() * (tier.sizeMax - tier.sizeMin),
      op: isAnchor ? Math.min(0.92, op + 0.18) : op,
      min: op * (0.32 + rand() * 0.2),
      twinkle: 3.2 + rand() * 5.5, // 3.2–8.7s
      delay: rand() * 9,
      color: STAR_COLORS[Math.floor(rand() * STAR_COLORS.length)],
      anchor: isAnchor,
    };
  });
}

interface Props {
  /** Global multiplier on star count (1 = default density). */
  density?: number;
  seed?: number;
}

export function Particles({ density = 1, seed = 7 }: Props) {
  const tiers = useMemo(
    () =>
      TIERS.map((t, ti) => ({
        tier: t,
        stars: buildTier(
          { ...t, count: Math.max(1, Math.round(t.count * density)) },
          seed + ti * 101,
        ),
      })),
    [density, seed],
  );

  return (
    <div
      aria-hidden
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
    >
      <style>{`
        @keyframes hint-twinkle {
          0%, 100% { opacity: var(--star-min); transform: scale(0.82); }
          50%      { opacity: var(--star-op);  transform: scale(1.12); }
        }
        @keyframes hint-tier-drift {
          0%   { transform: translate3d(0, 0, 0); }
          50%  { transform: translate3d(var(--drift-x), var(--drift-y), 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
        /* A slow diagonal streak. Visible only for a brief window each loop
           so it reads as a rare event, not a metronome. */
        @keyframes hint-shoot {
          0%   { opacity: 0; transform: translate3d(0, 0, 0) rotate(var(--shoot-rot)) scaleX(0.15); }
          3%   { opacity: 0; }
          5%   { opacity: 0.85; }
          11%  { opacity: 0.9;  transform: translate3d(var(--shoot-x), var(--shoot-y), 0) rotate(var(--shoot-rot)) scaleX(1); }
          14%  { opacity: 0; }
          100% { opacity: 0; transform: translate3d(var(--shoot-x), var(--shoot-y), 0) rotate(var(--shoot-rot)) scaleX(1); }
        }
        .hint-shoot {
          display: none;
        }
        @media (prefers-reduced-motion: reduce) {
          .hint-star  { animation: none !important; opacity: var(--star-op) !important; transform: none !important; }
          .hint-tier  { animation: none !important; }
          .hint-shoot { display: none !important; }
        }
      `}</style>

      {tiers.map(({ tier, stars }) => (
        <div
          key={tier.name}
          className="hint-tier absolute"
          style={{
            inset: "-6%",
            ["--drift-x" as string]: `${tier.drift[0]}px`,
            ["--drift-y" as string]: `${tier.drift[1]}px`,
            animation: `hint-tier-drift ${tier.driftDur}s ease-in-out infinite`,
            willChange: "transform",
          }}
        >
          {stars.map((st, i) => (
            <span
              key={i}
              className="hint-star absolute rounded-full block"
              style={{
                left: `${st.left}%`,
                top: `${st.top}%`,
                width: `${st.size}px`,
                height: `${st.size}px`,
                background: st.color,
                ["--star-op" as string]: st.op,
                ["--star-min" as string]: st.min,
                animation: `hint-twinkle ${st.twinkle}s ease-in-out ${st.delay}s infinite`,
                boxShadow: st.anchor
                  ? `0 0 ${st.size * 3}px ${st.size * 1.1}px ${st.color.replace(", 1)", `, ${st.op * 0.6})`)}, 0 0 ${st.size * 1.4}px ${st.color.replace(", 1)", `, ${st.op})`)}`
                  : `0 0 ${st.size * 1.2}px ${st.color.replace(", 1)", `, ${st.op * 0.5})`)}`,
                willChange: "transform, opacity",
              }}
            />
          ))}
        </div>
      ))}

      {/* Signature: rare, slow shooting stars. Two, with different angles,
          delays and total periods so they never feel scheduled. */}
      <ShootingStar
        top="14%"
        left="-6%"
        length={150}
        rot={16}
        dx="62vw"
        dy="30vh"
        duration={19}
        delay={6}
      />
      <ShootingStar
        top="-4%"
        left="64%"
        length={120}
        rot={28}
        dx="-46vw"
        dy="52vh"
        duration={31}
        delay={17}
      />
    </div>
  );
}

interface ShootProps {
  top: string;
  left: string;
  length: number;
  rot: number;
  dx: string;
  dy: string;
  duration: number;
  delay: number;
}

function ShootingStar({
  top,
  left,
  length,
  rot,
  dx,
  dy,
  duration,
  delay,
}: ShootProps) {
  return (
    <div
      className="hint-shoot absolute"
      style={{
        top,
        left,
        width: `${length}px`,
        height: "1.6px",
        borderRadius: "9999px",
        background:
          "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,250,240,0.55) 60%, rgba(255,255,255,0.95) 100%)",
        boxShadow: "0 0 6px 1px rgba(255, 248, 236, 0.5)",
        transformOrigin: "right center",
        ["--shoot-x" as string]: dx,
        ["--shoot-y" as string]: dy,
        ["--shoot-rot" as string]: `${rot}deg`,
        animation: `hint-shoot ${duration}s ease-in ${delay}s infinite`,
        willChange: "transform, opacity",
      }}
    />
  );
}
