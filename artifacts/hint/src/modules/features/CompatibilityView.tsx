import { motion } from "framer-motion";
import { ACCENT, GLASS } from "../hold/atmosphere";
import { AppScreen, ScreenHeader, GlassPanel, SectionLabel } from "../../components/app/AppChrome";
import { CompatibilitySigil } from "../home/data/sigils";
import { PreviewBadge, FeatureFooter, AttrRow } from "./shared";
import { useLanguage } from "../../lib/i18n";

const RADAR_AXES: { key: string; value: number }[] = [
  { key: "passion", value: 86 },
  { key: "trust", value: 70 },
  { key: "play", value: 92 },
  { key: "future", value: 66 },
  { key: "silence", value: 48 },
  { key: "intellect", value: 78 },
];

function CompatibilityRadar({ t }: { t: (key: string) => string }) {
  const cx = 100;
  const cy = 100;
  const R = 74;

  const pointAt = (i: number, r: number): [number, number] => {
    const angle = ((-90 + i * 60) * Math.PI) / 180;
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r];
  };

  // Concentric grid rings (4 levels)
  const rings = [0.25, 0.5, 0.75, 1].map((t) =>
    RADAR_AXES.map((_, i) => pointAt(i, R * t).join(","))
      .join(" "),
  );

  // Data polygon
  const dataPoints = RADAR_AXES.map((a, i) =>
    pointAt(i, R * (a.value / 100)).join(","),
  ).join(" ");

  return (
    <svg
      viewBox="0 0 200 200"
      width="240"
      height="240"
      className="overflow-visible"
      role="img"
      aria-label={t("compat.radarAria")}
    >
      <defs>
        <filter id="radarGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* concentric grid rings */}
      {rings.map((pts, i) => (
        <polygon
          key={`ring-${i}`}
          points={pts}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="0.75"
        />
      ))}

      {/* 6 axes from the centre */}
      {RADAR_AXES.map((_, i) => {
        const [x, y] = pointAt(i, R);
        return (
          <line
            key={`axis-${i}`}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="0.75"
          />
        );
      })}

      {/* data shape */}
      <motion.polygon
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        style={{ transformOrigin: "100px 100px" }}
        points={dataPoints}
        fill="rgba(230, 200, 255, 0.15)"
        stroke="#E6C8FF"
        strokeWidth="2"
        strokeLinejoin="round"
        filter="url(#radarGlow)"
      />

      {/* vertices */}
      {RADAR_AXES.map((a, i) => {
        const [x, y] = pointAt(i, R * (a.value / 100));
        return <circle key={`pt-${i}`} cx={x} cy={y} r="2" fill="#E6C8FF" />;
      })}

      {/* axis labels */}
      {RADAR_AXES.map((a, i) => {
        const [x, y] = pointAt(i, R + 18);
        const anchor =
          x > cx + 4 ? "start" : x < cx - 4 ? "end" : "middle";
        return (
          <text
            key={`label-${i}`}
            x={x}
            y={y}
            textAnchor={anchor}
            dominantBaseline="middle"
            fontSize="8.5"
            fontFamily="Inter, sans-serif"
            letterSpacing="0.5"
            fill="rgba(222, 228, 238, 0.62)"
          >
            {t(`compat.axis.${a.key}`)}
          </text>
        );
      })}
    </svg>
  );
}

export function CompatibilityView() {
  const { t } = useLanguage();

  return (
    <AppScreen>
      <ScreenHeader
        eyebrow={t("compat.eyebrow")}
        title={t("compat.title")}
        subtitle={t("compat.subtitle")}
        sigil={CompatibilitySigil}
        backHref="/rooms"
        backLabel={t("common.back")}
      />

      <div className="mb-4">
        <PreviewBadge />
      </div>

      <GlassPanel hero className="mb-4">
        <div className="flex flex-col items-center py-2">
          <CompatibilityRadar t={t} />
          <p
            className="font-serif italic text-[14px] text-center mt-4 max-w-xs"
            style={{ color: GLASS.text }}
          >
            {t("compat.quote")}
          </p>
        </div>
      </GlassPanel>

      <section className="mb-6">
        <SectionLabel>{t("compat.where")}</SectionLabel>
        <GlassPanel padded={false}>
          <div className="px-5 pt-1">
            <AttrRow label={t("compat.attr.emotional")} value={`${t("compat.value.high")} · 84`} />
            <AttrRow label={t("compat.attr.communication")} value={`${t("compat.value.steady")} · 71`} />
            <AttrRow label={t("compat.attr.tension")} value={`${t("compat.value.low")} · 22`} />
            <AttrRow label={t("compat.attr.longArc")} value={`${t("compat.value.promising")} · 80`} />
          </div>
        </GlassPanel>
      </section>

      <FeatureFooter note={t("compat.footer")} />
    </AppScreen>
  );
}
