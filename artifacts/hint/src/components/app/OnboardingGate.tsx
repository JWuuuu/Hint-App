import { motion } from "framer-motion";
import { useState, type ReactNode } from "react";
import { ACCENT, GLASS } from "../../modules/hold/atmosphere";
import { AppScreen } from "./AppChrome";
import { ProfileForm } from "./ProfileForm";
import { useProfile } from "../../lib/useProfile";
import { hasSkippedOnboarding, setOnboardingSkipped } from "../../lib/identity";
import { useLanguage } from "../../lib/i18n";

/**
 * OnboardingGate — on first entry (no saved profile), it holds the user at a
 * quiet identity ritual before letting them into the app. Returning users
 * (profile present) pass straight through. While we don't yet know, we render
 * nothing to avoid a flash of the wrong surface.
 */

export function OnboardingGate({ children }: { children: ReactNode }) {
  const { profile, isLoading, isMissing, isError, saveProfile, isSaving } =
    useProfile();
  const [skipped, setSkipped] = useState(hasSkippedOnboarding);
  const { t } = useLanguage();

  // Still resolving identity — keep the night dark for a beat.
  if (isLoading) {
    return null;
  }

  // We have a profile (or the lookup failed for a non-404 reason — in that case
  // we don't want to trap the user behind a broken gate, so let them in).
  if (profile || isError) {
    return <>{children}</>;
  }

  // No profile, but they chose to do this later — let them through. They can
  // still add their name and birth details anytime from the Me screen.
  if (skipped) {
    return <>{children}</>;
  }

  if (!isMissing) {
    return <>{children}</>;
  }

  return (
    <AppScreen>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="pt-6 pb-32"
      >
        <p
          className="font-serif text-[10px] uppercase tracking-[0.34em] mb-3"
          style={{ color: ACCENT.aqua }}
        >
          {t("onboarding.eyebrow")}
        </p>
        <h1
          className="font-serif text-[30px] leading-tight mb-3"
          style={{ color: GLASS.text }}
        >
          {t("onboarding.title")}
        </h1>
        <p
          className="font-sans text-[13.5px] leading-relaxed mb-8 max-w-sm"
          style={{ color: GLASS.muted }}
        >
          {t("onboarding.body")}
        </p>

        <ProfileForm
          submitLabel={t("onboarding.enter")}
          onSubmit={async (input) => {
            await saveProfile(input);
          }}
          isSaving={isSaving}
        />

        <div className="mt-6 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setOnboardingSkipped();
              setSkipped(true);
            }}
            className="font-serif text-[11px] uppercase tracking-[0.28em] py-2 transition-colors hover:!text-[rgba(246,248,252,0.85)]"
            style={{ color: GLASS.faint }}
            data-testid="button-skip-onboarding"
          >
            {t("onboarding.skip")}
          </button>
          <span
            className="font-sans text-[11px]"
            style={{ color: GLASS.faint }}
          >
            {t("onboarding.note")}
          </span>
        </div>
      </motion.div>
    </AppScreen>
  );
}
