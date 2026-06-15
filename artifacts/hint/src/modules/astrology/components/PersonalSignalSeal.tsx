import type { NormalizedBirthChart, ZodiacSign } from "../types";

const SIGN_GLYPHS: Record<ZodiacSign, string> = {
  aries: "♈",
  taurus: "♉",
  gemini: "♊",
  cancer: "♋",
  leo: "♌",
  virgo: "♍",
  libra: "♎",
  scorpio: "♏",
  sagittarius: "♐",
  capricorn: "♑",
  aquarius: "♒",
  pisces: "♓",
};

function hash(value: string) {
  let total = 0;
  for (let index = 0; index < value.length; index += 1) {
    total = (total * 31 + value.charCodeAt(index)) >>> 0;
  }
  return total;
}

function seedFromChart(chart?: NormalizedBirthChart | null) {
  if (!chart) return 17;
  return hash(
    [
      chart.sunSign ?? "",
      chart.moonSign ?? "",
      chart.risingSign ?? "",
      chart.venusSign ?? "",
      chart.marsSign ?? "",
      chart.dominantElement ?? "",
      chart.dominantModality ?? "",
      chart.moonPhase?.name ?? "",
    ].join("|"),
  );
}

function point(index: number, count: number, radius: number, seed: number) {
  const angle = ((index / count) * Math.PI * 2) - Math.PI / 2 + ((seed % 19) * Math.PI) / 180;
  return {
    x: 100 + Math.cos(angle) * radius,
    y: 100 + Math.sin(angle) * radius,
  };
}

export function PersonalSignalSeal({
  chart,
  size = 220,
  compact = false,
}: {
  chart?: NormalizedBirthChart | null;
  size?: number;
  compact?: boolean;
}) {
  const seed = seedFromChart(chart);
  const nodes = Array.from({ length: compact ? 6 : 10 }, (_, index) => {
    const radius = index % 2 ? 58 + (seed % 12) : 74 - (seed % 10);
    return point(index, compact ? 6 : 10, radius, seed + index * 7);
  });
  const inner = Array.from({ length: compact ? 4 : 6 }, (_, index) => point(index, compact ? 4 : 6, 32 + (seed % 8), seed + 23));
  const signs = [chart?.sunSign, chart?.moonSign, chart?.risingSign, chart?.venusSign, chart?.marsSign].filter(Boolean) as ZodiacSign[];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label="Personal Signal Seal"
      className="block max-w-full"
    >
      <defs>
        <radialGradient id={`seal-glow-${seed}`} cx="50%" cy="42%" r="62%">
          <stop offset="0%" stopColor="rgba(134,214,199,0.22)" />
          <stop offset="58%" stopColor="rgba(203,168,102,0.12)" />
          <stop offset="100%" stopColor="rgba(8,11,20,0)" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="94" fill={`url(#seal-glow-${seed})`} />
      <circle cx="100" cy="100" r="78" fill="none" stroke="rgba(203,168,102,0.42)" strokeWidth="1.2" />
      <circle cx="100" cy="100" r="52" fill="none" stroke="rgba(134,214,199,0.22)" strokeWidth="0.9" />
      <path
        d={nodes.map((node, index) => `${index === 0 ? "M" : "L"} ${node.x.toFixed(2)} ${node.y.toFixed(2)}`).join(" ") + " Z"}
        fill="rgba(203,168,102,0.06)"
        stroke="rgba(203,168,102,0.48)"
        strokeWidth="1"
      />
      <path
        d={inner.map((node, index) => `${index === 0 ? "M" : "L"} ${node.x.toFixed(2)} ${node.y.toFixed(2)}`).join(" ") + " Z"}
        fill="rgba(134,214,199,0.06)"
        stroke="rgba(134,214,199,0.44)"
        strokeWidth="1"
      />
      {nodes.map((node, index) => (
        <circle key={`${node.x}-${node.y}`} cx={node.x} cy={node.y} r={index % 3 === 0 ? 3 : 2} fill={index % 2 ? "var(--hint-aqua)" : "var(--hint-gold)"} opacity="0.92" />
      ))}
      <circle cx="100" cy="100" r="22" fill="rgba(8,11,20,0.72)" stroke="rgba(203,168,102,0.56)" />
      <text x="100" y="108" textAnchor="middle" fontFamily="Georgia, serif" fontSize="28" fill="var(--hint-gold-bright)">
        {chart?.sunSign ? SIGN_GLYPHS[chart.sunSign] : "H"}
      </text>
      {!compact && signs.map((sign, index) => {
        const mark = point(index, signs.length || 1, 100, seed + 41);
        return (
          <text key={`${sign}-${index}`} x={mark.x} y={mark.y} textAnchor="middle" dominantBaseline="middle" fontSize="14" fill="rgba(242,236,222,0.72)">
            {SIGN_GLYPHS[sign]}
          </text>
        );
      })}
    </svg>
  );
}
