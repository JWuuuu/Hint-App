export { PointerProvider, usePointer } from "./PointerContext";
export { RoomLight } from "./RoomLight";
export { Particles } from "./Particles";
export { Vignette } from "./Vignette";
export { Grain } from "./Grain";
export { Haze } from "./Haze";
export { Moonlight } from "./Moonlight";

/* ─── shared text tokens ─────────────────────────────────────── */

export const IVORY = {
  primary: "var(--hint-ritual-primary, rgba(252, 248, 238, 0.98))",
  strong: "var(--hint-ritual-strong, rgba(250, 246, 236, 0.93))",
  body: "var(--hint-ritual-body, rgba(248, 244, 234, 0.86))",
  mute: "var(--hint-ritual-muted, rgba(246, 242, 230, 0.66))",
  dim: "var(--hint-ritual-dim, rgba(246, 242, 230, 0.44))",
} as const;

// Halos give the text a warm glow without fuzzing the letterforms. We keep a
// single wide, low-opacity bloom (no tight close-radius shadow) so the edges
// of the glyphs stay crisp and readable on the dark room.
export const TEXT_HALO = {
  soft: "var(--hint-ritual-halo-soft, 0 0 24px rgba(255, 240, 210, 0.10))",
  strong: "var(--hint-ritual-halo-strong, 0 0 30px rgba(255, 238, 205, 0.16))",
} as const;

export const GOLD = {
  edge: "color-mix(in srgb, var(--hint-gold, #dcc383) 42%, transparent)",
  bloom: "color-mix(in srgb, var(--hint-gold-bright, #fff0bd) 26%, transparent)",
  stroke: "color-mix(in srgb, var(--hint-gold, #dcc383) 78%, transparent)",
  ink: "var(--hint-gold, #dcc383)",
} as const;

/* ─── NEW APP CHROME TOKENS (For redesigned Home/Rooms) ──────── */

export const NAVY = {
  base: "#0A0F1A",
  obsidian: "#060913",
  panel: "rgba(18, 25, 43, 0.6)",
  border: "rgba(100, 156, 158, 0.15)",
} as const;

export const APP_IVORY = {
  bg: "var(--hint-text, #F9F6F0)",
  text: "var(--hint-text, #1A1F2B)",
  muted: "var(--hint-muted, #6B7280)",
} as const;

export const ACCENT = {
  aqua: "var(--hint-aqua, #5eaeb3)",
  gold: "var(--hint-gold, #caa865)",
  lavender: "var(--hint-lavender, #b8a4d8)",
} as const;

/* ─── GLASSMORPHIC PREMIUM DARK TOKENS ───────────────────────── */

/** Frosted-glass surface tokens, used over the NAVY base. Text is soft
 *  white/grey so it stays readable on the translucent dark panels. */
export const GLASS = {
  /** warm translucent ivory — the hero / primary panel fill */
  hero: "var(--hint-surface, rgba(253, 251, 247, 0.08))",
  /** quieter neutral fill for secondary panels & list rows */
  panel: "var(--hint-surface-soft, rgba(255, 255, 255, 0.04))",
  panelHover: "var(--hint-surface, rgba(255, 255, 255, 0.07))",
  /** delicate hairline borders */
  border: "var(--hint-border, rgba(255, 255, 255, 0.12))",
  borderStrong: "var(--hint-border-strong, rgba(255, 255, 255, 0.18))",
  /** readable text on glass */
  text: "var(--hint-text, rgba(246, 248, 252, 0.95))",
  muted: "var(--hint-muted, rgba(222, 228, 238, 0.62))",
  faint: "var(--hint-faint, rgba(222, 228, 238, 0.4))",
} as const;

/** Subtle surface gradient for module tiles — deep navy into obsidian. */
export const TILE_GRADIENT =
  "linear-gradient(155deg, #0F1626 0%, #0A0F1A 55%, #060913 100%)";

/** Muted soft-gold ink for tile icons. */
export const SOFT_GOLD = "rgba(206, 178, 110, 0.88)";

/** A brighter teal used only for the emphasized Ask portal. */
export const AQUA_BRIGHT = "#40E0D0";

/** Aqua/teal radial fill + outer glow for the center Ask button. */
export const ASK_GLOW = {
  gradient:
    "radial-gradient(circle at 50% 32%, rgba(110, 240, 224, 0.95) 0%, rgba(64, 224, 208, 0.9) 45%, rgba(44, 158, 150, 0.92) 100%)",
  shadow: "0 0 15px rgba(64, 224, 208, 0.4), 0 6px 20px rgba(0, 0, 0, 0.45)",
} as const;
