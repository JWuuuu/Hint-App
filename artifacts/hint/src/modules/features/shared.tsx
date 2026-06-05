import { Link } from "wouter";
import { ACCENT, GLASS } from "../hold/atmosphere";
import { GlassPanel } from "../../components/app/AppChrome";
import { useLanguage } from "../../lib/i18n";

/** A quiet "in preview" badge used across the feature shells. */
export function PreviewBadge() {
  const { t } = useLanguage();

  return (
    <span
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full font-serif text-[10px] uppercase tracking-[0.24em]"
      style={{
        background: "rgba(178, 152, 179, 0.12)",
        border: "1px solid rgba(178, 152, 179, 0.28)",
        color: ACCENT.lavender,
      }}
    >
      <span
        className="w-1 h-1 rounded-full"
        style={{ background: ACCENT.lavender }}
      />
      {t("feature.preview")}
    </span>
  );
}

/** Closing note + Ask CTA shared by every feature shell. */
export function FeatureFooter({ note }: { note: string }) {
  const { t } = useLanguage();

  return (
    <GlassPanel hero className="mt-4">
      <p
        className="font-sans text-[12.5px] leading-relaxed mb-4"
        style={{ color: GLASS.muted }}
      >
        {note}
      </p>
      <Link
        href="/ask"
        className="inline-flex items-center justify-center w-full h-11 rounded-[8px] font-serif text-[12px] uppercase tracking-[0.24em]"
        style={{
          background: "rgba(100, 156, 158, 0.16)",
          border: "1px solid rgba(100, 156, 158, 0.32)",
          color: "rgba(150, 206, 208, 0.95)",
        }}
      >
        {t("feature.askInstead")}
      </Link>
    </GlassPanel>
  );
}

/** A labelled stat / attribute row used inside preview panels. */
export function AttrRow({
  label,
  value,
  glyph,
}: {
  label: string;
  value: string;
  glyph?: string;
}) {
  return (
    <div
      className="flex items-center justify-between py-3"
      style={{ borderTop: `1px solid ${GLASS.border}` }}
    >
      <span className="flex items-center gap-3 min-w-0">
        {glyph && (
          <span
            className="font-serif text-[15px] shrink-0"
            style={{ color: ACCENT.gold }}
          >
            {glyph}
          </span>
        )}
        <span className="font-sans text-[13px]" style={{ color: GLASS.muted }}>
          {label}
        </span>
      </span>
      <span className="font-serif text-[14px] text-right" style={{ color: GLASS.text }}>
        {value}
      </span>
    </div>
  );
}
