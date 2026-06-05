/**
 * Moonlight — cool blue-gray radial that rims the top edges of the room.
 * Pairs with the warm RoomLight in the center for a cinematic temperature
 * contrast (cool periphery + warm focus = depth, like a moonlit window).
 *
 * Static, breathes very slowly, behind everything.
 */

import { motion } from "framer-motion";

export function Moonlight() {
  return (
    <motion.div
      aria-hidden
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        background: [
          // top moonlight band
          "radial-gradient(ellipse 1200px 600px at 50% -10%, rgba(120, 145, 200, 0.10) 0%, transparent 60%)",
          // distant cool corner light
          "radial-gradient(ellipse 700px 500px at 100% 100%, rgba(100, 130, 180, 0.05) 0%, transparent 65%)",
        ].join(", "),
      }}
      animate={{ opacity: [0.85, 1, 0.85] }}
      transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}
