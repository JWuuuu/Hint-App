import { Edit3 } from "lucide-react";
import { useLanguage } from "../../lib/i18n";
import type { BirthProfile } from "../../types/astrology";

const ASTRO_TEXT = "var(--astro-text)";
const ASTRO_FAINT = "var(--astro-faint)";
const ASTRO_GOLD = "var(--astro-gold)";
const ASTRO_GOLD_BRIGHT = "var(--astro-gold-bright)";
const ASTRO_BORDER = "var(--astro-border)";
const ASTRO_SURFACE = "var(--astro-surface)";
const ASTRO_INNER = "var(--astro-inner)";

export function BirthProfileCard({ profile, onEdit }: { profile: BirthProfile; onEdit: () => void }) {
  const { t } = useLanguage();
  return (
    <section className="rounded-[8px] border p-5 shadow-[var(--astro-shadow)]" style={{ background: ASTRO_SURFACE, borderColor: ASTRO_BORDER }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-sans text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: ASTRO_GOLD }}>{t("account.birthProfile")}</p>
          <h2 className="mt-2 font-serif text-[32px] leading-tight" style={{ color: ASTRO_TEXT }}>{profile.name}</h2>
        </div>
        <button type="button" onClick={onEdit} className="grid h-10 w-10 shrink-0 place-items-center rounded-[8px] border" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER, color: ASTRO_GOLD_BRIGHT }} aria-label={t("account.editBirthProfile")}>
          <Edit3 size={16} />
        </button>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {[
          [t("birthProfile.date"), profile.birthDate],
          [t("birthProfile.time"), profile.birthTime || t("birthProfile.unknown")],
          [t("birthProfile.place"), profile.birthPlace],
          [t("birthProfile.timezone"), profile.timezone || t("birthProfile.local")],
          [t("birthProfile.coordinates"), profile.latitude !== undefined && profile.longitude !== undefined ? `${profile.latitude}, ${profile.longitude}` : t("birthProfile.neededForHouses")],
          [t("birthProfile.utcOffset"), profile.timezoneOffset !== undefined ? String(profile.timezoneOffset) : t("birthProfile.neededForHouses")],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[8px] border px-4 py-3" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER }}>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: ASTRO_FAINT }}>{label}</p>
            <p className="mt-1 text-[14px] font-black" style={{ color: ASTRO_TEXT }}>{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
