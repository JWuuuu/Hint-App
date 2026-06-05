export type HintTheme = "dark" | "bright";

export const HINT_THEME_STORAGE_KEY = "hint-theme";

export function getInitialHintTheme(): HintTheme {
  if (typeof window === "undefined") return "dark";

  try {
    return window.localStorage.getItem(HINT_THEME_STORAGE_KEY) === "bright"
      ? "bright"
      : "dark";
  } catch {
    return "dark";
  }
}

