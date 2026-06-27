import { useEffect, useState } from "react";
import {
  HINT_THEME_STORAGE_KEY,
  type HintTheme,
} from "../components/app/theme";

export const HINT_PREFERENCES_STORAGE_KEY = "hint.preferences.v1";
export const HINT_PREFERENCES_UPDATED_EVENT = "hint:preferences-updated";

export type HintPreferences = {
  reduceMotion: boolean;
  soundAndHaptics: boolean;
};

const DEFAULT_PREFERENCES: HintPreferences = {
  reduceMotion: false,
  soundAndHaptics: true,
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getHintPreferences(): HintPreferences {
  if (!canUseStorage()) return DEFAULT_PREFERENCES;

  try {
    const raw = window.localStorage.getItem(HINT_PREFERENCES_STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<HintPreferences>;
    return {
      reduceMotion: Boolean(parsed.reduceMotion),
      soundAndHaptics:
        typeof parsed.soundAndHaptics === "boolean"
          ? parsed.soundAndHaptics
          : DEFAULT_PREFERENCES.soundAndHaptics,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function saveHintPreferences(next: HintPreferences): HintPreferences {
  if (!canUseStorage()) return next;

  try {
    window.localStorage.setItem(HINT_PREFERENCES_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(HINT_PREFERENCES_UPDATED_EVENT));
  } catch {
    // Preferences are best-effort in private browsing.
  }

  return next;
}

export function setHintPreference<K extends keyof HintPreferences>(
  key: K,
  value: HintPreferences[K],
): HintPreferences {
  return saveHintPreferences({
    ...getHintPreferences(),
    [key]: value,
  });
}

export function setHintThemePreference(theme: HintTheme): void {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(HINT_THEME_STORAGE_KEY, theme);
    window.dispatchEvent(new Event(HINT_PREFERENCES_UPDATED_EVENT));
  } catch {
    // Ignore localStorage failures.
  }
}

export function useHintPreferences() {
  const [preferences, setPreferences] = useState<HintPreferences>(getHintPreferences);

  useEffect(() => {
    const sync = () => setPreferences(getHintPreferences());
    window.addEventListener(HINT_PREFERENCES_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(HINT_PREFERENCES_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const updatePreference = <K extends keyof HintPreferences>(
    key: K,
    value: HintPreferences[K],
  ) => {
    const next = setHintPreference(key, value);
    setPreferences(next);
  };

  return {
    preferences,
    setPreference: updatePreference,
  };
}
