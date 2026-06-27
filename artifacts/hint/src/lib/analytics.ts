import { getAnonId } from "./identity";

export type AnalyticsEventName =
  | "app_opened"
  | "daily_card_pulled"
  | "reading_completed"
  | "follow_up_sent"
  | "paywall_viewed"
  | "reading_saved";

type AnalyticsProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

type PostHogLike = {
  capture: (event: string, properties?: AnalyticsProperties) => void;
  identify?: (distinctId: string) => void;
};

declare global {
  interface Window {
    posthog?: PostHogLike;
  }
}

export function trackEvent(
  event: AnalyticsEventName,
  properties: AnalyticsProperties = {},
): void {
  const payload = {
    anonId: getAnonId(),
    path: window.location.pathname,
    timestamp: new Date().toISOString(),
    ...properties,
  };

  try {
    if (window.posthog) {
      window.posthog.identify?.(payload.anonId);
      window.posthog.capture(event, payload);
      return;
    }

    if (import.meta.env.DEV) {
      console.info("[analytics]", event, payload);
    }
  } catch {
    // Analytics must never interrupt the reading flow.
  }
}
