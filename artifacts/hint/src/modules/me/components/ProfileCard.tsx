import { motion } from "framer-motion";
import { Pencil } from "lucide-react";
import { ACCENT, GLASS } from "../../hold/atmosphere";
import { GlassPanel } from "../../../components/app/AppChrome";
import { zodiacSign, initialsFrom } from "../utils";
import type { Profile } from "@workspace/api-client-react";
import type { UserStats } from "@workspace/api-client-react";
import { useLanguage } from "../../../lib/i18n";

function Badge({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "gold" }) {
  const gold = tone === "gold";
  return (
    <span
      className="font-sans text-[11px] px-2.5 py-1 rounded-full whitespace-nowrap"
      style={{
        background: gold ? "rgba(196,169,98,0.14)" : GLASS.panel,
        border: `1px solid ${gold ? "rgba(196,169,98,0.34)" : GLASS.border}`,
        color: gold ? ACCENT.gold : GLASS.muted,
      }}
    >
      {label}
    </span>
  );
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex flex-col items-center flex-1">
      <span className="font-serif text-[19px] tabular-nums" style={{ color: GLASS.text }}>
        {value}
      </span>
      <span className="font-sans text-[11px] mt-0.5" style={{ color: GLASS.faint }}>
        {label}
      </span>
    </div>
  );
}

export function ProfileCard({
  profile,
  stats,
  onEdit,
}: {
  profile: Profile | null;
  stats?: UserStats;
  onEdit: () => void;
}) {
  const { language, t } = useLanguage();
  const name = profile?.name ?? t("me.guest");
  const initials = initialsFrom(profile?.name);
  const sign = zodiacSign(profile?.birthDate, language);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <GlassPanel hero>
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: "var(--hint-me-avatar-bg)",
              border: `1px solid ${GLASS.borderStrong}`,
              boxShadow: "var(--hint-me-avatar-shadow)",
            }}
          >
            <span className="font-serif text-[18px]" style={{ color: GLASS.text }}>
              {initials}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="font-serif text-[22px] leading-tight truncate" style={{ color: GLASS.text }}>
              {name}
            </h2>
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {sign && <Badge label={sign} />}
              <Badge label={t("me.nightUser")} />
              <Badge label={t("me.free")} tone="gold" />
            </div>
          </div>

          <button
            type="button"
            onClick={onEdit}
            className="shrink-0 w-9 h-9 rounded-[8px] flex items-center justify-center self-start"
            style={{ background: GLASS.panel, border: `1px solid ${GLASS.border}` }}
            aria-label={t("me.editProfile")}
            data-testid="button-edit-profile"
          >
            <Pencil size={15} color={ACCENT.gold} />
          </button>
        </div>

        {!profile?.birthDate && (
          <button
            type="button"
            onClick={onEdit}
            className="mt-5 inline-flex w-full items-center justify-center rounded-[10px] border px-4 py-3 font-sans text-[12px] font-semibold"
            style={{
              background: "rgba(196,169,98,0.12)",
              borderColor: "rgba(196,169,98,0.32)",
              color: ACCENT.gold,
            }}
          >
            Add birth details once for sharper daily and astrology signals
          </button>
        )}

        <div
          className="flex items-stretch mt-5 pt-5"
          style={{ borderTop: `1px solid ${GLASS.border}` }}
        >
          <Stat value={stats?.readings ?? 0} label={t("me.saved")} />
          <span className="w-px self-stretch" style={{ background: GLASS.border }} aria-hidden />
          <Stat value={stats?.journals ?? 0} label={t("me.journals")} />
          <span className="w-px self-stretch" style={{ background: GLASS.border }} aria-hidden />
          <Stat value={stats?.pulls ?? 0} label={t("me.pulls")} />
        </div>
      </GlassPanel>
    </motion.div>
  );
}
