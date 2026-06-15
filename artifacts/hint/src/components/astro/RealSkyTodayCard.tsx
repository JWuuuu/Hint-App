import { useEffect, useState } from "react";
import { getRealSkyToday, type NasaApodResponse } from "../../lib/visual/nasaClient";
import { useLanguage } from "../../lib/i18n";

const ASTRO_TEXT = "var(--astro-text)";
const ASTRO_MUTED = "var(--astro-muted)";
const ASTRO_FAINT = "var(--astro-faint)";
const ASTRO_GOLD_BRIGHT = "var(--astro-gold-bright)";
const ASTRO_BORDER = "var(--astro-border)";
const ASTRO_SURFACE = "var(--astro-surface)";

export function RealSkyTodayCard({ date, onModeChange }: { date?: string; onModeChange?: (mode: "Connected" | "Fallback") => void }) {
  const { t } = useLanguage();
  const [image, setImage] = useState<NasaApodResponse | null>(null);

  useEffect(() => {
    let alive = true;
    getRealSkyToday(date).then((next) => {
      if (!alive) return;
      setImage(next);
      onModeChange?.(next.mode === "live" && Boolean(next.imageUrl) ? "Connected" : "Fallback");
    }).catch(() => {
      if (!alive) return;
      setImage(null);
      onModeChange?.("Fallback");
    });
    return () => {
      alive = false;
    };
  }, [date, onModeChange]);

  if (!image || image.mode === "fallback" || !image.imageUrl) {
    return null;
  }

  return (
    <aside className="overflow-hidden rounded-[8px] border shadow-[var(--astro-shadow-soft)]" style={{ background: ASTRO_SURFACE, borderColor: ASTRO_BORDER }}>
      <img src={image.imageUrl} alt="" loading="lazy" className="h-44 w-full object-cover" />
      <div>
        <div className="p-5">
          <span className="text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: ASTRO_GOLD_BRIGHT }}>{t("sky.realToday")}</span>
          <strong className="mt-2 block font-serif text-[26px] leading-tight" style={{ color: ASTRO_TEXT }}>{image.title}</strong>
          {image.date ? <small className="mt-2 block text-[12px] font-semibold" style={{ color: ASTRO_FAINT }}>{image.date} · NASA APOD</small> : null}
          {image.explanation ? <p className="mt-3 text-[13px] font-semibold leading-relaxed" style={{ color: ASTRO_MUTED }}>{image.explanation.slice(0, 140)}{image.explanation.length > 140 ? "..." : ""}</p> : null}
          {image.hdImageUrl ? <a href={image.hdImageUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-[12px] font-black" style={{ color: ASTRO_GOLD_BRIGHT }}>{t("sky.seeFullImage")}</a> : null}
        </div>
      </div>
    </aside>
  );
}
