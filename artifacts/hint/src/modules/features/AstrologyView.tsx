import { motion } from "framer-motion";
import { ACCENT, GLASS } from "../hold/atmosphere";
import { AppScreen, ScreenHeader, GlassPanel, SectionLabel } from "../../components/app/AppChrome";
import { NatalSigil } from "../home/data/sigils";
import { PreviewBadge, FeatureFooter, AttrRow } from "./shared";
import { useLanguage } from "../../lib/i18n";

function NatalRing() {
  const planets = [0, 52, 110, 165, 210, 268, 312];
  return (
    <svg viewBox="-60 -60 120 120" className="w-44 h-44">
      <circle cx="0" cy="0" r="52" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.6" />
      <circle cx="0" cy="0" r="38" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.6" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * Math.PI) / 6;
        return (
          <line
            key={i}
            x1={Math.cos(a) * 38}
            y1={Math.sin(a) * 38}
            x2={Math.cos(a) * 52}
            y2={Math.sin(a) * 52}
            stroke="rgba(255,255,255,0.10)"
            strokeWidth="0.5"
          />
        );
      })}
      {planets.map((deg, i) => {
        const a = (deg * Math.PI) / 180;
        return (
          <circle
            key={i}
            cx={Math.cos(a) * 45}
            cy={Math.sin(a) * 45}
            r={i === 0 ? 2.6 : 1.8}
            fill={i % 2 === 0 ? ACCENT.gold : "rgba(150,206,208,0.9)"}
          />
        );
      })}
      <circle cx="0" cy="0" r="2.4" fill={ACCENT.gold} />
    </svg>
  );
}

export function AstrologyView() {
  const { t } = useLanguage();
  const placements = [
    { label: t("astrology.placement.sun"), value: `${t("astrology.sign.scorpio")} · 12°`, glyph: "☉" },
    { label: t("astrology.placement.moon"), value: `${t("astrology.sign.pisces")} · 4°`, glyph: "☽" },
    { label: t("astrology.placement.rising"), value: `${t("astrology.sign.libra")} · 27°`, glyph: "↑" },
    { label: t("astrology.placement.mercury"), value: `${t("astrology.sign.sagittarius")} · 9°`, glyph: "☿" },
    { label: t("astrology.placement.venus"), value: `${t("astrology.sign.capricorn")} · 18°`, glyph: "♀" },
  ];

  return (
    <AppScreen>
      <ScreenHeader
        eyebrow={t("astrology.eyebrow")}
        title={t("astrology.title")}
        subtitle={t("astrology.subtitle")}
        sigil={NatalSigil}
      />

      <div className="mb-4">
        <PreviewBadge />
      </div>

      <GlassPanel hero className="mb-4">
        <div className="flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: -8 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1.1, ease: "easeOut" }}
          >
            <NatalRing />
          </motion.div>
          <p
            className="font-serif italic text-[14px] text-center mt-2 max-w-xs"
            style={{ color: GLASS.text }}
          >
            {t("astrology.quote")}
          </p>
        </div>
      </GlassPanel>

      <section className="mb-6">
        <SectionLabel>{t("astrology.placements")}</SectionLabel>
        <GlassPanel padded={false}>
          <div className="px-5 pt-1">
            {placements.map((placement) => (
              <AttrRow key={placement.glyph} {...placement} />
            ))}
          </div>
        </GlassPanel>
      </section>

      <FeatureFooter note={t("astrology.footer")} />
    </AppScreen>
  );
}
