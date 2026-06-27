/**
 * RoomLight — a soft radial glow that follows the cursor / finger.
 * Lives behind everything. Pointer-events: none. The room reacts to you.
 */

import { motion, useMotionTemplate, useTransform } from "framer-motion";
import { usePointer } from "./PointerContext";

interface Props {
  /** Peak opacity of the glow. Keep very low. */
  intensity?: number;
  /** Pixel radius of the glow disc. */
  radius?: number;
}

export function RoomLight({ intensity = 0.07, radius = 520 }: Props) {
  const { x, y } = usePointer();

  const xPct = useTransform(x, (v) => `${v * 100}%`);
  const yPct = useTransform(y, (v) => `${v * 100}%`);

  const inner = `rgba(255,255,255,${intensity})`;
  const mid = `rgba(255,255,255,${intensity * 0.3})`;

  const background = useMotionTemplate`radial-gradient(circle ${radius}px at ${xPct} ${yPct}, ${inner} 0%, ${mid} 30%, transparent 65%)`;

  return (
    <motion.div
      aria-hidden
      className="fixed inset-0 pointer-events-none z-0 mix-blend-screen"
      style={{ background }}
    />
  );
}
