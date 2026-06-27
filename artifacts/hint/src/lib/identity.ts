/**
 * Anonymous per-user identity. Hint has no login — each browser gets a
 * stable random id stored in localStorage, used to scope the user's profile,
 * daily pulls, journals, and readings.
 */

const STORAGE_KEY = "hint_anon_id";

let cached: string | null = null;

export function getAnonId(): string {
  if (cached) return cached;

  let id: string | null = null;
  try {
    id = localStorage.getItem(STORAGE_KEY);
  } catch {
    // localStorage unavailable (private mode, etc.) — fall through to a fresh id.
  }

  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Ignore write failures; the id still lives for this session via cache.
    }
  }

  cached = id;
  return id;
}

/**
 * Onboarding can be deferred — a returning visitor who chose "later" should not
 * be stopped at the identity ritual every time. We remember that choice locally.
 */
const ONBOARDING_SKIPPED_KEY = "hint_onboarding_skipped";

export function hasSkippedOnboarding(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_SKIPPED_KEY) === "1";
  } catch {
    return false;
  }
}

export function setOnboardingSkipped(): void {
  try {
    localStorage.setItem(ONBOARDING_SKIPPED_KEY, "1");
  } catch {
    // Ignore write failures — they'll just see the ritual again next time.
  }
}

/** Today's date in the user's local timezone as YYYY-MM-DD. */
export function getLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
