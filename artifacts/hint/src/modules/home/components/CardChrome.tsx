import { GOLD } from "../../hold/atmosphere";

interface CornerOrnamentsProps {
  size?: number;
  inset?: number;
  opacity?: number;
}

export function CornerOrnaments({
  size = 10,
  inset = 6,
  opacity = 0.85,
}: CornerOrnamentsProps) {
  const stroke = GOLD.stroke;
  const sw = 0.6;
  return (
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none"
      style={{ opacity }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 10 10"
        className="absolute"
        style={{ top: inset, left: inset }}
      >
        <path d={`M 0 4 L 0 0 L 4 0`} stroke={stroke} strokeWidth={sw} fill="none" />
      </svg>
      <svg
        width={size}
        height={size}
        viewBox="0 0 10 10"
        className="absolute"
        style={{ top: inset, right: inset }}
      >
        <path d={`M 6 0 L 10 0 L 10 4`} stroke={stroke} strokeWidth={sw} fill="none" />
      </svg>
      <svg
        width={size}
        height={size}
        viewBox="0 0 10 10"
        className="absolute"
        style={{ bottom: inset, left: inset }}
      >
        <path d={`M 0 6 L 0 10 L 4 10`} stroke={stroke} strokeWidth={sw} fill="none" />
      </svg>
      <svg
        width={size}
        height={size}
        viewBox="0 0 10 10"
        className="absolute"
        style={{ bottom: inset, right: inset }}
      >
        <path d={`M 6 10 L 10 10 L 10 6`} stroke={stroke} strokeWidth={sw} fill="none" />
      </svg>
    </div>
  );
}

interface EtchedBorderProps {
  radius?: number;
}

/**
 * An etched gold hairline that overlays a card. Top edge slightly brighter
 * (catching "moonlight"), sides falling off softer than a uniform 1px line.
 * Render *inside* a relative-positioned card, above content (pointer-events
 * are disabled).
 */
export function EtchedBorder({ radius = 10 }: EtchedBorderProps) {
  return (
    <>
      {/* Soft inner top highlight — the "moonlit" upper rim */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{
          background: `linear-gradient(to right, transparent, ${GOLD.bloom}, transparent)`,
          borderTopLeftRadius: radius,
          borderTopRightRadius: radius,
        }}
      />
      {/* Faint bottom edge — quieter, like ink settling */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px pointer-events-none opacity-60"
        style={{
          background: `linear-gradient(to right, transparent, ${GOLD.edge}, transparent)`,
        }}
      />
    </>
  );
}

/**
 * A thin starlit divider — a hairline gold line with a single seed-point
 * star at its center. Use to separate header from body inside cards.
 */
export function StarlitDivider({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative h-px ${className}`}
      style={{
        background: `linear-gradient(to right, transparent, ${GOLD.edge}, transparent)`,
      }}
      aria-hidden
    >
      <span
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[3px] h-[3px] rounded-full"
        style={{
          background: GOLD.stroke,
          boxShadow: `0 0 6px ${GOLD.bloom}, 0 0 1.5px ${GOLD.stroke}`,
        }}
      />
    </div>
  );
}
