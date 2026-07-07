import type { HintTheme } from "./theme";

interface Props {
  theme: HintTheme;
}

function Spark({
  x,
  y,
  size = 1,
  opacity = 1,
}: {
  x: number;
  y: number;
  size?: number;
  opacity?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${size})`} opacity={opacity}>
      <path
        d="M0 -16 3.8 -3.8 16 0 3.8 3.8 0 16 -3.8 3.8 -16 0 -3.8 -3.8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
      <circle cx="0" cy="0" r="1.6" fill="currentColor" />
    </g>
  );
}

function Orbit({
  x,
  y,
  scale = 1,
  rotate = 0,
  opacity = 1,
}: {
  x: number;
  y: number;
  scale?: number;
  rotate?: number;
  opacity?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`} opacity={opacity}>
      <circle cx="0" cy="0" r="84" fill="none" stroke="currentColor" strokeWidth="0.9" />
      <ellipse cx="0" cy="0" rx="118" ry="36" fill="none" stroke="currentColor" strokeWidth="0.8" />
      <ellipse cx="0" cy="0" rx="118" ry="36" fill="none" stroke="currentColor" strokeWidth="0.8" transform="rotate(60)" />
      <ellipse cx="0" cy="0" rx="118" ry="36" fill="none" stroke="currentColor" strokeWidth="0.8" transform="rotate(120)" />
      <circle cx="0" cy="-84" r="4.4" fill="currentColor" />
      <circle cx="84" cy="0" r="2.6" fill="currentColor" />
      <circle cx="-84" cy="0" r="2.6" fill="currentColor" />
    </g>
  );
}

function CelestialLinework() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1440 1080"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
      style={{ color: "var(--hint-ornament)" }}
    >
      <defs>
        <linearGradient id="hintLineA" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--hint-ornament-soft)" stopOpacity="0" />
          <stop offset="42%" stopColor="var(--hint-ornament-strong)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--hint-ornament-soft)" stopOpacity="0.18" />
        </linearGradient>
        <linearGradient id="hintLineB" x1="1" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--hint-aqua-line)" stopOpacity="0.05" />
          <stop offset="50%" stopColor="var(--hint-aqua-line)" stopOpacity="0.46" />
          <stop offset="100%" stopColor="var(--hint-ornament-strong)" stopOpacity="0.18" />
        </linearGradient>
        <radialGradient id="hintCenterGlow" cx="50%" cy="34%" r="58%">
          <stop offset="0%" stopColor="var(--hint-ornament-strong)" stopOpacity="0.16" />
          <stop offset="64%" stopColor="var(--hint-aqua-line)" stopOpacity="0.04" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="1440" height="1080" fill="url(#hintCenterGlow)" opacity="0.88" />

      <g fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke">
        <path
          d="M-120 250C95 105 248 222 404 170c180-60 269-238 486-132 184 89 273 307 586 194"
          stroke="url(#hintLineA)"
          strokeWidth="1.1"
          opacity="0.66"
        />
        <path
          d="M-90 660C92 491 306 628 458 538c189-111 222-318 462-218 210 87 257 292 620 142"
          stroke="url(#hintLineB)"
          strokeWidth="1"
          opacity="0.48"
        />
        <path
          d="M118 1012C286 787 446 912 628 762c193-159 278-375 544-286 139 47 225 150 376 82"
          stroke="url(#hintLineA)"
          strokeWidth="1"
          opacity="0.36"
        />
        <path
          d="M1320 -80C1220 94 1288 248 1114 332c-205 98-323-24-482 102-176 139-156 339-430 364"
          stroke="url(#hintLineB)"
          strokeWidth="0.9"
          opacity="0.32"
        />
      </g>

      <g fill="none" stroke="currentColor" vectorEffect="non-scaling-stroke">
        <circle cx="720" cy="400" r="290" strokeWidth="0.8" strokeDasharray="2 16" opacity="0.28" />
        <circle cx="720" cy="400" r="390" strokeWidth="0.7" strokeDasharray="1 22" opacity="0.2" />
        <circle cx="720" cy="400" r="518" strokeWidth="0.7" opacity="0.13" />
        <path d="M370 233a390 390 0 0 0 698 334" strokeWidth="1" opacity="0.26" />
        <path d="M1036 173a518 518 0 0 0-641 665" strokeWidth="0.8" opacity="0.18" />
      </g>

      <g fill="none" stroke="var(--hint-ornament-strong)" strokeWidth="0.85" opacity="0.34">
        <path d="M130 118c54 72-62 108-20 160 48 59 138-28 174 28 42 65-96 102-46 170" />
        <path d="M1218 148c-56 72 58 114 12 166-52 58-137-37-177 18-47 64 84 112 29 181" />
        <path d="M104 827c75-45 118 54 181 16 76-46-7-136 67-174 67-34 105 81 180 48" />
        <path d="M1140 860c78 38 116-68 181-31 75 43 5 137 82 171 65 29 103-82 175-51" />
      </g>

      <g style={{ color: "var(--hint-ornament-strong)" }}>
        <Orbit x={260} y={330} scale={0.78} rotate={-20} opacity={0.32} />
        <Orbit x={1190} y={342} scale={0.68} rotate={18} opacity={0.28} />
        <Orbit x={1045} y={826} scale={0.92} rotate={-10} opacity={0.2} />
        <Spark x={720} y={268} size={1.04} opacity={0.54} />
        <Spark x={555} y={470} size={0.62} opacity={0.36} />
        <Spark x={887} y={480} size={0.74} opacity={0.34} />
        <Spark x={210} y={710} size={0.58} opacity={0.38} />
        <Spark x={1230} y={684} size={0.52} opacity={0.36} />
      </g>
    </svg>
  );
}

export function CelestialBackdrop({ theme }: Props) {
  return (
    <div
      aria-hidden
      data-backdrop-theme={theme}
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
      style={{ background: "var(--hint-page-bg)" }}
    >
      <style>{`
        @keyframes hint-star-sail {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
          50% { transform: translate3d(22px, -18px, 0) rotate(0.001deg); }
        }
        @keyframes hint-ornament-breathe {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.018); }
        }
        @keyframes hint-foil-drift {
          0%, 100% { transform: translate3d(0, 0, 0); opacity: 0.58; }
          50% { transform: translate3d(-18px, 12px, 0); opacity: 0.92; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hint-star-sail,
          .hint-ornament-breathe,
          .hint-foil-drift {
            animation: none !important;
          }
        }
      `}</style>

      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(800px 580px at 18% 16%, var(--hint-bg-glow-a), transparent 68%), radial-gradient(920px 640px at 82% 18%, var(--hint-bg-glow-b), transparent 64%), radial-gradient(780px 600px at 54% 82%, var(--hint-bg-glow-c), transparent 70%)",
        }}
      />

      <div
        className="hint-star-sail absolute -inset-[8%]"
        style={{
          animation: "hint-star-sail 82s ease-in-out infinite",
          backgroundImage:
            "radial-gradient(1px 1px at 8% 18%, var(--hint-star-ink), transparent 65%), radial-gradient(1.5px 1.5px at 18% 76%, var(--hint-star-ink), transparent 65%), radial-gradient(1px 1px at 32% 28%, var(--hint-star-soft), transparent 65%), radial-gradient(1px 1px at 48% 12%, var(--hint-star-ink), transparent 65%), radial-gradient(1.4px 1.4px at 64% 68%, var(--hint-star-soft), transparent 65%), radial-gradient(1px 1px at 72% 32%, var(--hint-star-ink), transparent 65%), radial-gradient(1.8px 1.8px at 88% 20%, var(--hint-star-ink), transparent 65%), radial-gradient(1px 1px at 92% 82%, var(--hint-star-soft), transparent 65%)",
          backgroundSize:
            "360px 360px, 420px 420px, 300px 300px, 460px 460px, 390px 390px, 330px 330px, 520px 520px, 440px 440px",
          opacity: "var(--hint-star-opacity)",
        }}
      />

      <div
        className="hint-ornament-breathe absolute -inset-[6%]"
        style={{
          animation: "hint-ornament-breathe 18s ease-in-out infinite",
          opacity: "var(--hint-linework-opacity)",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, transparent 30%, rgba(0,0,0,0.10) 42%, rgba(0,0,0,0.55) 66%, rgba(0,0,0,0.26) 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, transparent 30%, rgba(0,0,0,0.10) 42%, rgba(0,0,0,0.55) 66%, rgba(0,0,0,0.26) 100%)",
        }}
      >
        <CelestialLinework />
      </div>

      <div
        className="hint-foil-drift absolute inset-0"
        style={{
          animation: "hint-foil-drift 34s ease-in-out infinite",
          background:
            "radial-gradient(2px 2px at 14% 62%, var(--hint-foil), transparent 70%), radial-gradient(3px 3px at 24% 28%, var(--hint-foil), transparent 70%), radial-gradient(2px 2px at 38% 84%, var(--hint-foil), transparent 70%), radial-gradient(3px 3px at 56% 18%, var(--hint-foil), transparent 70%), radial-gradient(2px 2px at 72% 76%, var(--hint-foil), transparent 70%), radial-gradient(3px 3px at 88% 42%, var(--hint-foil), transparent 70%)",
          filter: "blur(0.2px)",
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, var(--hint-top-veil), transparent 34%, var(--hint-bottom-veil))",
        }}
      />
    </div>
  );
}
