/**
 * Vignette — a soft radial darkening at the edges that breathes slowly.
 * Makes the black feel like a room with depth, not a screen.
 */

import { motion } from "framer-motion";

export function Vignette() {
  return (
    <motion.div
      aria-hidden
      className="fixed inset-0 pointer-events-none z-10"
      style={{
        background:
          "radial-gradient(ellipse at center, transparent 38%, var(--hint-vignette-mid, rgba(0,0,0,0.5)) 74%, var(--hint-vignette-edge, rgba(0,0,0,0.92)) 100%)",
      }}
      animate={{ opacity: [0.78, 1, 0.78] }}
      transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}
