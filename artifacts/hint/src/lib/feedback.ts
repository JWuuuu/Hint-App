import { getHintPreferences } from "./preferences";

export type FeedbackIntent =
  | "soft"
  | "tap"
  | "select"
  | "reveal"
  | "success"
  | "complete"
  | "warning";

const HAPTIC_PATTERNS: Record<FeedbackIntent, number | number[]> = {
  soft: 5,
  tap: 8,
  select: [8, 18, 10],
  reveal: [10, 24, 18, 40, 26],
  success: [12, 28, 30],
  complete: [12, 20, 12, 40, 28],
  warning: [24, 40, 24],
};

function canVibrate() {
  return typeof navigator !== "undefined" && "vibrate" in navigator;
}

export function triggerHaptic(intent: FeedbackIntent = "tap") {
  if (!canVibrate()) return;

  const preferences = getHintPreferences();
  if (!preferences.soundAndHaptics) return;

  try {
    navigator.vibrate(HAPTIC_PATTERNS[intent]);
  } catch {
    // Vibration is best-effort and unavailable on some browsers/devices.
  }
}

export function triggerFeedback(intent: FeedbackIntent = "tap") {
  triggerHaptic(intent);
}
