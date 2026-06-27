/**
 * Haze — large slow-drifting atmospheric pockets of dim warm/cool light.
 * Lives between the room background and the content. Creates spatial depth
 * (foreground/midground/background) that flat black cannot.
 *
 * Each pocket drifts independently on a 35–55s loop. Mix-blend-screen so
 * the warmth tints the black without ever lifting overall brightness.
 */

import { motion } from "framer-motion";

interface Pocket {
  x: string;
  y: string;
  size: number;
  tint: string;
  duration: number;
  delay: number;
  shift: [number, number];
}

const POCKETS: Pocket[] = [
  {
    x: "18%",
    y: "22%",
    size: 760,
    tint: "rgba(110, 140, 200, 0.06)", // moonlight cool
    duration: 48,
    delay: 0,
    shift: [40, -30],
  },
  {
    x: "78%",
    y: "30%",
    size: 620,
    tint: "rgba(255, 220, 165, 0.05)", // candle warm
    duration: 42,
    delay: -10,
    shift: [-40, 35],
  },
  {
    x: "30%",
    y: "78%",
    size: 880,
    tint: "rgba(255, 235, 195, 0.045)", // amber pool
    duration: 55,
    delay: -22,
    shift: [50, -50],
  },
  {
    x: "82%",
    y: "82%",
    size: 540,
    tint: "rgba(90, 120, 180, 0.04)", // distant moon
    duration: 38,
    delay: -6,
    shift: [-30, -40],
  },
  {
    x: "50%",
    y: "50%",
    size: 1100,
    tint: "rgba(190, 150, 110, 0.035)", // central amber breath
    duration: 62,
    delay: -18,
    shift: [25, 20],
  },
];

export function Haze() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
    >
      {POCKETS.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full mix-blend-screen"
          style={{
            width: p.size,
            height: p.size,
            left: p.x,
            top: p.y,
            marginLeft: -p.size / 2,
            marginTop: -p.size / 2,
            background: `radial-gradient(circle, ${p.tint} 0%, transparent 65%)`,
            filter: "blur(30px)",
          }}
          animate={{
            x: [0, p.shift[0], 0],
            y: [0, p.shift[1], 0],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
