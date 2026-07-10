import type { ReactNode } from "react";

/**
 * Profile details are an accuracy layer, not an entry requirement. The home
 * ritual should render first; users can add name and birth details from Me
 * when they want sharper personalized scores.
 */
export function OnboardingGate({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
