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
    <section className="rounded-[8px] border p-3.5 shadow-[var(--astro-shadow-soft)]" style={{ background: ASTRO_SURFACE, borderColor: ASTRO_BORDER }}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-sans text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: ASTRO_GOLD }}>{t("account.birthProfile")}</p>
          <h2 className="mt-1 font-serif text-[21px] leading-tight" style={{ color: ASTRO_TEXT }}>{profile.name}</h2>
        </div>
        <button type="button" onClick={onEdit} className="grid h-9 w-9 shrink-0 place-items-center rounded-[8px] border" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER, color: ASTRO_GOLD_BRIGHT }} aria-label={t("account.editBirthProfile")}>
          <Edit3 size={15} />
        </button>
      </div>
      <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
        {[
          [t("birthProfile.date"), profile.birthDate],
          [t("birthProfile.time"), profile.birthTime || t("birthProfile.unknown")],
          [t("birthProfile.place"), profile.birthPlace],
          [t("birthProfile.timezone"), profile.timezone || t("birthProfile.local")],
          [t("birthProfile.coordinates"), profile.latitude !== undefined && profile.longitude !== undefined ? `${profile.latitude}, ${profile.longitude}` : t("birthProfile.neededForHouses")],
          [t("birthProfile.utcOffset"), profile.timezoneOffset !== undefined ? String(profile.timezoneOffset) : t("birthProfile.neededForHouses")],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[8px] border px-2.5 py-2" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER }}>
            <p className="text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: ASTRO_FAINT }}>{label}</p>
            <p className="mt-1 break-words text-[12px] font-black leading-snug" style={{ color: ASTRO_TEXT }}>{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
