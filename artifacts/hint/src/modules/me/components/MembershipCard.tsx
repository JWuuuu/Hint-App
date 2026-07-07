import { motion } from "framer-motion";
import { useEffect } from "react";
import { Sparkles, Check } from "lucide-react";
import { ACCENT, GLASS } from "../../hold/atmosphere";
import { useLanguage } from "../../../lib/i18n";
import { trackEvent } from "../../../lib/analytics";

const BENEFITS = [
  "me.benefit.deeper",
  "me.benefit.mood",
  "me.benefit.compatibility",
  "me.benefit.archive",
] as const;

export function MembershipCard() {
  const { t } = useLanguage();

  useEffect(() => {
    trackEvent("paywall_viewed", {
      source: "membership-card",
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.992 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.34, delay: 0.03, ease: [0.2, 0.78, 0.2, 1] }}
      className="relative transform-gpu overflow-hidden rounded-[8px] p-5"
      style={{
        background: "var(--hint-me-plus-surface)",
        border: "1px solid var(--hint-me-plus-border)",
        boxShadow: "var(--hint-me-plus-shadow)",
      }}
    >
      <div className="relative flex items-center gap-2.5 mb-1">
        <Sparkles size={18} color={ACCENT.gold} />
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-[19px]" style={{ color: GLASS.text }}>
            {t("me.planStatus")}
          </h3>
          <p className="font-sans text-[11px] mt-0.5" style={{ color: GLASS.faint }}>
            {t("me.currentPlan")}
          </p>
        </div>
      </div>
      <p className="relative font-sans text-[13px] leading-relaxed mb-4" style={{ color: GLASS.muted }}>
        {t("me.plusBody")}
      </p>

      <div className="relative grid grid-cols-2 gap-2.5 mb-5">
        {BENEFITS.map((b) => (
          <div key={b} className="flex items-center gap-2">
            <span
              className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "var(--hint-me-plus-check-bg)" }}
            >
              <Check size={11} color={ACCENT.gold} />
            </span>
            <span className="font-sans text-[12.5px]" style={{ color: GLASS.text }}>
              {t(b)}
            </span>
          </div>
        ))}
      </div>

      <button
        type="button"
        disabled
        aria-disabled="true"
        className="relative w-full h-11 cursor-not-allowed rounded-[8px] font-serif text-[12px] uppercase tracking-[0.24em] opacity-70"
        style={{
          background: "rgba(255,255,255,0.055)",
          color: GLASS.faint,
          border: `1px solid ${GLASS.border}`,
        }}
        data-testid="button-upgrade"
      >
        {t("me.plusTrial")} · Soon
      </button>
    </motion.div>
  );
}
