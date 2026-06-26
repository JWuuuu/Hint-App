import { useEffect, useState } from "react";
import { CalendarDays, MapPin, Search } from "lucide-react";
import { getGeoDetails, getTimezoneDetails, type AstroGeoPlace } from "../../lib/astro/astroClient";
import { useLanguage } from "../../lib/i18n";
import type { BirthProfile } from "../../types/astrology";

type BirthProfileDraft = {
  name: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  latitude: string;
  longitude: string;
  timezone: string;
  timezoneOffset: string;
};

function draftFrom(profile?: BirthProfile | null): BirthProfileDraft {
  return {
    name: profile?.name ?? "",
    birthDate: profile?.birthDate ?? "",
    birthTime: profile?.birthTime ?? "",
    birthPlace: profile?.birthPlace ?? "",
    latitude: profile?.latitude !== undefined ? String(profile.latitude) : "",
    longitude: profile?.longitude !== undefined ? String(profile.longitude) : "",
    timezone: profile?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: profile?.timezoneOffset !== undefined ? String(profile.timezoneOffset) : "",
  };
}

const ASTRO_TEXT = "var(--astro-text)";
const ASTRO_MUTED = "var(--astro-muted)";
const ASTRO_GOLD_BRIGHT = "var(--astro-gold-bright)";
const ASTRO_GOLD = "var(--astro-gold)";
const ASTRO_BORDER = "var(--astro-border)";
const ASTRO_SURFACE = "var(--astro-surface)";
const ASTRO_INNER = "var(--astro-inner)";
const ASTRO_INPUT = "var(--astro-input)";
const ASTRO_BUTTON = "var(--astro-button)";
const ASTRO_BUTTON_TEXT = "var(--astro-button-text)";

const SAMPLE_PLACES: Array<{ label: string; draft: BirthProfileDraft }> = [
  {
    label: "Phoenix sample",
    draft: {
      name: "Phoenix Sample",
      birthDate: "1992-04-12",
      birthTime: "09:30",
      birthPlace: "Phoenix, AZ",
      latitude: "33.4484",
      longitude: "-112.0740",
      timezone: "America/Phoenix",
      timezoneOffset: "-7",
    },
  },
  {
    label: "Los Angeles sample",
    draft: {
      name: "Los Angeles Sample",
      birthDate: "1990-07-22",
      birthTime: "18:20",
      birthPlace: "Los Angeles, CA",
      latitude: "34.0522",
      longitude: "-118.2437",
      timezone: "America/Los_Angeles",
      timezoneOffset: "-8",
    },
  },
  {
    label: "Taipei sample",
    draft: {
      name: "Taipei Sample",
      birthDate: "1995-11-05",
      birthTime: "07:45",
      birthPlace: "Taipei, Taiwan",
      latitude: "25.0330",
      longitude: "121.5654",
      timezone: "Asia/Taipei",
      timezoneOffset: "8",
    },
  },
];

function FieldLabel({ label, required, detail }: { label: string; required?: boolean; detail?: string }) {
  return (
    <div className="mb-1.5 flex items-center justify-between gap-2">
      <span className="text-[10px] font-black uppercase tracking-[0.13em]" style={{ color: ASTRO_MUTED }}>
        {label}
      </span>
      <span className="shrink-0 rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.11em]" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER, color: required ? ASTRO_GOLD_BRIGHT : ASTRO_MUTED }}>
        {required ? "Required" : detail ?? "Optional"}
      </span>
    </div>
  );
}

export function BirthProfileForm({
  profile,
  title = "Add birth profile",
  submitLabel = "Save birth profile",
  onSubmit,
}: {
  profile?: BirthProfile | null;
  title?: string;
  submitLabel?: string;
  onSubmit: (profile: BirthProfileDraft) => void;
}) {
  const { t } = useLanguage();
  const [draft, setDraft] = useState<BirthProfileDraft>(() => draftFrom(profile));
  const [placeResults, setPlaceResults] = useState<AstroGeoPlace[]>([]);
  const [placeLoading, setPlaceLoading] = useState(false);
  const [placeMode, setPlaceMode] = useState<"live" | "fallback" | null>(null);
  const [placeError, setPlaceError] = useState("");
  const complete = draft.name.trim().length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(draft.birthDate) && draft.birthPlace.trim().length > 0;
  const completionSteps = [
    { label: "Name", ready: draft.name.trim().length > 0 },
    { label: "Date", ready: /^\d{4}-\d{2}-\d{2}$/.test(draft.birthDate) },
    { label: "Place", ready: draft.birthPlace.trim().length > 0 },
    { label: "Time", ready: draft.birthTime.trim().length > 0 },
  ];

  useEffect(() => {
    setDraft(draftFrom(profile));
  }, [profile?.birthDate, profile?.birthPlace, profile?.birthTime, profile?.latitude, profile?.longitude, profile?.name, profile?.timezone, profile?.timezoneOffset]);

  function update<Key extends keyof BirthProfileDraft>(key: Key, value: BirthProfileDraft[Key]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function searchPlace() {
    const query = draft.birthPlace.trim();
    if (!query) return;
    setPlaceLoading(true);
    setPlaceError("");
    try {
      const response = await getGeoDetails(query, 6);
      setPlaceResults(response.results);
      setPlaceMode(response.mode);
      if (!response.results.length) setPlaceError(t("birthProfile.placeNotFound"));
    } catch {
      setPlaceError(t("birthProfile.placeUnavailable"));
      setPlaceResults([]);
      setPlaceMode(null);
    } finally {
      setPlaceLoading(false);
    }
  }

  async function selectPlace(place: AstroGeoPlace) {
    const label = place.label ?? [place.name, place.region, place.country].filter(Boolean).join(", ");
    setDraft((current) => ({
      ...current,
      birthPlace: label || place.name,
      latitude: String(place.latitude),
      longitude: String(place.longitude),
      timezone: place.timezoneId ?? place.timezone ?? current.timezone,
      timezoneOffset: typeof place.timezoneOffset === "number" ? String(place.timezoneOffset) : current.timezoneOffset,
    }));
    try {
      const date = /^\d{4}-\d{2}-\d{2}$/.test(draft.birthDate) ? draft.birthDate : new Date().toISOString().slice(0, 10);
      const timezone = await getTimezoneDetails(place.latitude, place.longitude, date);
      setDraft((current) => ({
        ...current,
        timezone: timezone.timezoneId ?? place.timezoneId ?? place.timezone ?? current.timezone,
        timezoneOffset: typeof timezone.timezoneOffset === "number" ? String(timezone.timezoneOffset) : current.timezoneOffset,
      }));
    } catch {
      // Coordinates are still useful when timezone fallback is unavailable.
    }
  }

  return (
    <form
      className="rounded-[8px] border p-3.5 shadow-[var(--astro-shadow)]"
      style={{ background: ASTRO_SURFACE, borderColor: ASTRO_BORDER }}
      onSubmit={(event) => {
        event.preventDefault();
        if (!complete) return;
        onSubmit(draft);
      }}
    >
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[8px] border" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER, color: ASTRO_GOLD_BRIGHT }}>
          <CalendarDays size={17} />
        </span>
        <div className="min-w-0">
          <p className="mb-1 text-[9px] font-black uppercase tracking-[0.14em]" style={{ color: ASTRO_GOLD_BRIGHT }}>{t("birthProfile.editor")}</p>
          <h2 className="font-serif text-[20px] leading-tight" style={{ color: ASTRO_TEXT }}>
            {title}
          </h2>
          <p className="mt-1 text-[11px] font-semibold leading-snug" style={{ color: ASTRO_MUTED }}>
            {t("birthProfile.localSave")}
          </p>
        </div>
      </div>
      <div className="mt-3 grid gap-1.5" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
        {completionSteps.map((step) => (
          <div key={step.label} className="rounded-[8px] border px-2 py-2 text-center" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER }}>
            <p className="text-[8px] font-black uppercase tracking-[0.11em]" style={{ color: ASTRO_MUTED }}>{step.label}</p>
            <p className="mt-1 text-[10px] font-black" style={{ color: step.ready ? "var(--astro-aqua)" : ASTRO_GOLD_BRIGHT }}>{step.ready ? "Ready" : step.label === "Time" ? "Sharper" : "Needed"}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
        <label>
          <FieldLabel label={t("birthProfile.name")} required />
          <input aria-label={t("birthProfile.name")} className="astro-themed-input h-10 w-full rounded-[8px] border px-3 text-[13px] font-semibold outline-none" style={{ background: ASTRO_INPUT, borderColor: ASTRO_BORDER, color: ASTRO_TEXT }} value={draft.name} onChange={(event) => update("name", event.target.value)} placeholder={t("birthProfile.name")} />
        </label>
        <label>
          <FieldLabel label={t("birthProfile.birthDate")} required />
          <input aria-label={t("birthProfile.birthDate")} type="date" className="astro-themed-input h-10 w-full rounded-[8px] border px-3 text-[13px] font-semibold outline-none" style={{ background: ASTRO_INPUT, borderColor: ASTRO_BORDER, color: ASTRO_TEXT }} value={draft.birthDate} onChange={(event) => update("birthDate", event.target.value)} placeholder={t("birthProfile.birthDate")} />
        </label>
        <label>
          <FieldLabel label={t("birthProfile.birthTime")} detail="Recommended" />
          <input
            aria-label={t("birthProfile.birthTime")}
            className="astro-themed-input h-10 w-full rounded-[8px] border px-3 text-[13px] font-semibold outline-none"
            style={{ background: ASTRO_INPUT, borderColor: ASTRO_BORDER, color: ASTRO_TEXT }}
            value={draft.birthTime}
            onChange={(event) => update("birthTime", event.target.value)}
            placeholder={t("birthProfile.birthTimeOptional")}
            type="time"
          />
        </label>
        <div className="sm:col-span-2">
          <FieldLabel label={t("birthProfile.birthPlace")} required />
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <label className="flex h-10 items-center gap-2 rounded-[8px] border px-3" style={{ background: ASTRO_INPUT, borderColor: ASTRO_BORDER, color: ASTRO_TEXT }}>
              <MapPin size={14} style={{ color: ASTRO_GOLD_BRIGHT }} />
              <input aria-label={t("birthProfile.birthPlace")} className="astro-themed-input min-w-0 flex-1 bg-transparent text-[13px] font-semibold outline-none" style={{ color: ASTRO_TEXT }} value={draft.birthPlace} onChange={(event) => update("birthPlace", event.target.value)} placeholder={t("birthProfile.birthPlace")} />
            </label>
            <button type="button" onClick={searchPlace} disabled={placeLoading || !draft.birthPlace.trim()} className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border px-3 text-[12px] font-black transition-[opacity] disabled:opacity-50" style={{ background: ASTRO_INPUT, borderColor: ASTRO_BORDER, color: ASTRO_TEXT }}>
              <Search size={13} />
              {placeLoading ? t("birthProfile.searching") : t("birthProfile.findPlace")}
            </button>
          </div>
          {placeMode ? <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: ASTRO_MUTED }}>{placeMode === "live" ? t("birthProfile.liveMatch") : t("birthProfile.fallbackMatch")}</p> : null}
          {placeError ? <p className="mt-2 text-[12px] font-semibold" style={{ color: ASTRO_GOLD }}>{placeError}</p> : null}
          {placeResults.length ? (
            <div className="mt-3 grid gap-2">
              {placeResults.map((place) => {
                const label = place.label ?? [place.name, place.region, place.country].filter(Boolean).join(", ");
                return (
                  <button key={`${place.name}-${place.latitude}-${place.longitude}`} type="button" onClick={() => void selectPlace(place)} className="rounded-[8px] border px-3 py-2 text-left transition-[transform,opacity] duration-200 hover:-translate-y-0.5" style={{ background: ASTRO_INPUT, borderColor: ASTRO_BORDER, color: ASTRO_TEXT }}>
                    <span className="block text-[13px] font-black">{label || place.name}</span>
                    <span className="mt-1 block text-[11px] font-semibold" style={{ color: ASTRO_MUTED }}>{place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}{place.timezone ? ` · ${place.timezone}` : ""}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
      <details className="mt-3 rounded-[8px] border p-3" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER }}>
        <summary className="cursor-pointer text-[11px] font-black uppercase tracking-[0.13em]" style={{ color: ASTRO_GOLD_BRIGHT }}>Sample autofill</summary>
        <div className="mt-3 flex flex-wrap gap-2">
          {SAMPLE_PLACES.map((sample) => (
            <button
              key={sample.label}
              type="button"
              className="rounded-[8px] border px-3 py-2 text-[11px] font-black"
              style={{ background: ASTRO_INPUT, borderColor: ASTRO_BORDER, color: ASTRO_TEXT }}
              onClick={() => setDraft((current) => ({ ...current, ...sample.draft }))}
            >
              {sample.label}
            </button>
          ))}
        </div>
      </details>
      <details className="mt-3 rounded-[8px] border p-3" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER }}>
        <summary className="cursor-pointer text-[11px] font-black uppercase tracking-[0.13em]" style={{ color: ASTRO_GOLD_BRIGHT }}>{t("birthProfile.advancedLocation")}</summary>
        <p className="mt-2 text-[12px] font-semibold leading-relaxed" style={{ color: ASTRO_MUTED }}>
          {t("birthProfile.advancedHelp")}
        </p>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          <input className="astro-themed-input h-10 rounded-[8px] border px-3 text-[13px] font-semibold outline-none" style={{ background: ASTRO_INPUT, borderColor: ASTRO_BORDER, color: ASTRO_TEXT }} value={draft.latitude} onChange={(event) => update("latitude", event.target.value)} placeholder={t("birthProfile.latitude")} inputMode="decimal" />
          <input className="astro-themed-input h-10 rounded-[8px] border px-3 text-[13px] font-semibold outline-none" style={{ background: ASTRO_INPUT, borderColor: ASTRO_BORDER, color: ASTRO_TEXT }} value={draft.longitude} onChange={(event) => update("longitude", event.target.value)} placeholder={t("birthProfile.longitude")} inputMode="decimal" />
          <input className="astro-themed-input h-10 rounded-[8px] border px-3 text-[13px] font-semibold outline-none" style={{ background: ASTRO_INPUT, borderColor: ASTRO_BORDER, color: ASTRO_TEXT }} value={draft.timezone} onChange={(event) => update("timezone", event.target.value)} placeholder={t("birthProfile.timezone")} />
          <input className="astro-themed-input h-10 rounded-[8px] border px-3 text-[13px] font-semibold outline-none" style={{ background: ASTRO_INPUT, borderColor: ASTRO_BORDER, color: ASTRO_TEXT }} value={draft.timezoneOffset} onChange={(event) => update("timezoneOffset", event.target.value)} placeholder={t("birthProfile.timezoneOffset")} inputMode="decimal" />
        </div>
      </details>
      <button
        type="submit"
        disabled={!complete}
        className="mt-3 h-10 w-full rounded-[8px] text-[13px] font-black shadow-[var(--astro-button-shadow)] transition-[transform,opacity] duration-200 hover:-translate-y-0.5 disabled:opacity-45"
        style={{ background: ASTRO_BUTTON, color: ASTRO_BUTTON_TEXT }}
      >
        {submitLabel}
      </button>
    </form>
  );
}
