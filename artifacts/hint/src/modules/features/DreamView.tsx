import { ACCENT, GLASS } from "../hold/atmosphere";
import { AppScreen, ScreenHeader, GlassPanel, SectionLabel } from "../../components/app/AppChrome";
import { DreamSigil } from "../home/data/sigils";
import { PreviewBadge, FeatureFooter } from "./shared";
import { useLanguage } from "../../lib/i18n";

const FRAGMENTS = [
  {
    id: "house",
    dateKey: "dream.fragment.lastNight",
    textKey: "dream.fragment.house",
    tagKey: "dream.fragment.thresholds",
  },
  {
    id: "train",
    dateKey: "dream.fragment.tue",
    textKey: "dream.fragment.train",
    tagKey: "dream.fragment.time",
  },
  {
    id: "water",
    dateKey: "dream.fragment.sun",
    textKey: "dream.fragment.water",
    tagKey: "dream.fragment.emotion",
  },
];

export function DreamView() {
  const { t } = useLanguage();

  return (
    <AppScreen>
      <ScreenHeader
        eyebrow={t("dream.eyebrow")}
        title={t("dream.title")}
        subtitle={t("dream.subtitle")}
        sigil={DreamSigil}
        backHref="/rooms"
        backLabel={t("common.back")}
      />

      <div className="mb-4">
        <PreviewBadge />
      </div>

      {/* Capture mock */}
      <GlassPanel hero className="mb-6">
        <p className="font-serif text-[13px] mb-3" style={{ color: GLASS.muted }}>
          {t("dream.question")}
        </p>
        <div
          className="w-full rounded-[8px] px-4 py-4 mb-4"
          style={{ background: "rgba(0,0,0,0.25)", border: `1px solid ${GLASS.border}` }}
        >
          <p className="font-serif italic text-[14px]" style={{ color: GLASS.faint }}>
            {t("dream.placeholder")}
          </p>
        </div>
        <div
          className="inline-flex items-center justify-center w-full h-11 rounded-[8px] font-serif text-[12px] uppercase tracking-[0.24em]"
          style={{
            background: "rgba(206,178,110,0.12)",
            border: "1px solid rgba(206,178,110,0.3)",
            color: ACCENT.gold,
          }}
        >
          {t("dream.decode")}
        </div>
      </GlassPanel>

      <section className="mb-6">
        <SectionLabel>{t("dream.recent")}</SectionLabel>
        <div className="flex flex-col gap-3">
          {FRAGMENTS.map((f) => (
            <div
              key={f.id}
              className="flex items-start gap-4 px-4 py-4 rounded-[8px]"
              style={{ background: GLASS.panel, border: `1px solid ${GLASS.border}` }}
            >
              <span
                className="shrink-0 font-serif text-[10px] uppercase tracking-[0.2em] w-16 pt-0.5"
                style={{ color: GLASS.faint }}
              >
                {t(f.dateKey)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-serif text-[14px] leading-snug" style={{ color: GLASS.text }}>
                  {t(f.textKey)}
                </p>
                <span
                  className="inline-block mt-2 px-2.5 py-0.5 rounded-full font-sans text-[10px] uppercase tracking-wider"
                  style={{ background: "rgba(178,152,179,0.12)", color: ACCENT.lavender }}
                >
                  {t(f.tagKey)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <FeatureFooter note={t("dream.footer")} />
    </AppScreen>
  );
}
