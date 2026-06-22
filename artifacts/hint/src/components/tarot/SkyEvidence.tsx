import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useLanguage } from "../../lib/i18n";
import type { TarotTheme } from "../../lib/tarot/tarotThemeMap";
import { THEME_LABELS } from "../../lib/tarot/tarotThemeMap";
import type { SkySignal } from "../../lib/tarot/skyGuidedTarot";

type SkyEvidenceProps = {
  signals: SkySignal[];
  themes?: TarotTheme[];
  why?: string;
  compact?: boolean;
  defaultOpen?: boolean;
};

export function SkyEvidence({
  signals,
  themes = [],
  why,
  compact = false,
  defaultOpen = false,
}: SkyEvidenceProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(defaultOpen);
  const visibleSignals = signals.slice(0, compact ? 2 : 4);
  const visibleThemes = themes.slice(0, compact ? 3 : 6);

  if (visibleSignals.length === 0) return null;

  return (
    <section
      className="w-full rounded-[16px] border p-3 text-left sm:p-4"
      style={{
        background: "color-mix(in srgb, var(--hint-surface-soft) 80%, transparent)",
        borderColor: "color-mix(in srgb, var(--hint-gold, #cba866) 34%, var(--hint-border))",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Sparkles size={15} aria-hidden style={{ color: "var(--hint-gold, #cba866)" }} />
          <p
            className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: "var(--hint-gold, #cba866)" }}
          >
            {t("sky.evidence")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="shrink-0 font-sans text-[12px] font-semibold underline-offset-4 hover:underline"
          style={{ color: "var(--hint-text)" }}
        >
          {open ? t("sky.hideWhy") : t("sky.whyThisCard")}
        </button>
      </div>

      <div className="mt-2">
        <div className="flex min-w-0 flex-wrap gap-2">
          {visibleSignals.map((signal) => (
            <span
              key={signal.id}
              className="rounded-full border px-2.5 py-1 font-sans text-[11px] leading-none"
              style={{
                color: "var(--hint-text)",
                background: "color-mix(in srgb, var(--hint-input-bg) 86%, transparent)",
                borderColor: "var(--hint-border)",
              }}
            >
              {signal.label}
            </span>
          ))}
        </div>
      </div>

      {visibleThemes.length > 0 && (
        <p className="mt-2 max-w-[48rem] font-sans text-[12px] leading-relaxed" style={{ color: "var(--hint-muted)" }}>
          {t("sky.themes")}: {visibleThemes.map((theme) => THEME_LABELS[theme]).join(", ")}
        </p>
      )}

      {open && (
        <p className="mt-2 max-w-[52rem] font-sans text-[12px] leading-relaxed" style={{ color: "var(--hint-muted)" }}>
          {why ?? t("sky.defaultWhy")}
        </p>
      )}
    </section>
  );
}
