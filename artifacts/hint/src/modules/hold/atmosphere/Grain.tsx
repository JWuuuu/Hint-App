/**
 * Grain — a barely-there film grain that sits above the atmosphere
 * but below the content. Gives the room photographic depth so that
 * text feels like it lives in air rather than pasted on flat black.
 */

const NOISE_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220">
    <filter id="n">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix values="0 0 0 0 1  0 0 0 0 0.96  0 0 0 0 0.86  0 0 0 0.55 0"/>
    </filter>
    <rect width="100%" height="100%" filter="url(#n)"/>
  </svg>`
)}`;

interface Props {
  /** Peak opacity. Keep around 3–5%. */
  opacity?: number;
}

export function Grain({ opacity = 0.045 }: Props) {
  return (
    <div
      aria-hidden
      className="fixed inset-0 pointer-events-none z-[15] mix-blend-overlay"
      style={{
        backgroundImage: `url("${NOISE_SVG}")`,
        backgroundSize: "220px 220px",
        backgroundRepeat: "repeat",
        opacity,
      }}
    />
  );
}
