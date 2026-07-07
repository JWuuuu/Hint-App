import { useEffect, useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Copy, Sparkles, UserRound } from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";
import { apiUrl } from "../../lib/api";
import { getGeoDetails, getTimezoneDetails, type AstroGeoPlace } from "../../lib/astro/astroClient";
import { useProfile } from "../../lib/useProfile";
import { PersonalSignalSeal } from "../astrology/components/PersonalSignalSeal";
import type { BirthProfileInput, CompatibilityResult, NormalizedBirthChart, ZodiacSign } from "../astrology/types";
import { useBirthChart } from "../astrology/useBirthChart";

type BirthDetails = {
  name: string;
  birthDate: string;
  birthTime?: string | null;
  birthPlace?: string | null;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  timezoneOffset?: number;
};

type InviteSummary = {
  token: string;
  status: "pending" | "completed" | "expired";
  expiresAt: string;
  creatorName?: string;
  resultId?: string;
};

const SIGN_LABELS: Record<ZodiacSign, string> = {
  aries: "Aries",
  taurus: "Taurus",
  gemini: "Gemini",
  cancer: "Cancer",
  leo: "Leo",
  virgo: "Virgo",
  libra: "Libra",
  scorpio: "Scorpio",
  sagittarius: "Sagittarius",
  capricorn: "Capricorn",
  aquarius: "Aquarius",
  pisces: "Pisces",
};

function signLabel(sign?: ZodiacSign) {
  return sign ? SIGN_LABELS[sign] : "Open";
}

function compatibilityStorageKey(id: string) {
  return `hint_compatibility_result_v1_${id}`;
}

function readStoredResult(id: string) {
  try {
    const raw = window.localStorage.getItem(compatibilityStorageKey(id));
    return raw ? (JSON.parse(raw) as CompatibilityResult) : null;
  } catch {
    return null;
  }
}

function writeStoredResult(result: CompatibilityResult) {
  try {
    window.localStorage.setItem(compatibilityStorageKey(result.id), JSON.stringify(result));
  } catch {
    // Local result cache is best-effort.
  }
}

function detailsToBirthInput(input: BirthDetails): BirthProfileInput {
  return {
    name: input.name,
    birthday: input.birthDate,
    birthTime: input.birthTime ?? undefined,
    birthCity: input.birthPlace ?? undefined,
    latitude: input.latitude,
    longitude: input.longitude,
    timezone: input.timezoneOffset ?? input.timezone ?? (typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined),
  };
}

function BirthDetailsForm({
  title,
  subtitle,
  initial,
  submitLabel,
  saving,
  requireConsent = false,
  onSubmit,
}: {
  title: string;
  subtitle: string;
  initial?: BirthDetails | null;
  submitLabel: string;
  saving?: boolean;
  requireConsent?: boolean;
  onSubmit: (input: BirthDetails, consent: boolean) => void | Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [birthDate, setBirthDate] = useState(initial?.birthDate ?? "");
  const [birthTime, setBirthTime] = useState(initial?.birthTime ?? "");
  const [birthPlace, setBirthPlace] = useState(initial?.birthPlace ?? "");
  const [latitude, setLatitude] = useState(initial?.latitude !== undefined ? String(initial.latitude) : "");
  const [longitude, setLongitude] = useState(initial?.longitude !== undefined ? String(initial.longitude) : "");
  const [timezone, setTimezone] = useState(initial?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [timezoneOffset, setTimezoneOffset] = useState(initial?.timezoneOffset !== undefined ? String(initial.timezoneOffset) : "");
  const [placeResults, setPlaceResults] = useState<AstroGeoPlace[]>([]);
  const [placeLoading, setPlaceLoading] = useState(false);
  const [placeMode, setPlaceMode] = useState<"live" | "fallback" | null>(null);
  const [placeError, setPlaceError] = useState("");
  const [consent, setConsent] = useState(!requireConsent);
  const complete = name.trim().length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(birthDate) && birthPlace.trim().length > 0 && consent;

  const numeric = (value: string) => {
    const next = Number(value);
    return Number.isFinite(next) ? next : undefined;
  };

  async function searchPlace() {
    const query = birthPlace.trim();
    if (!query) return;
    setPlaceLoading(true);
    setPlaceError("");
    try {
      const response = await getGeoDetails(query, 6);
      setPlaceResults(response.results);
      setPlaceMode(response.mode);
      if (!response.results.length) setPlaceError("No matching place found.");
    } catch {
      setPlaceResults([]);
      setPlaceMode(null);
      setPlaceError("Place lookup is unavailable. Advanced entry still works.");
    } finally {
      setPlaceLoading(false);
    }
  }

  async function selectPlace(place: AstroGeoPlace) {
    const label = place.label ?? [place.name, place.region, place.country].filter(Boolean).join(", ");
    setBirthPlace(label || place.name);
    setLatitude(String(place.latitude));
    setLongitude(String(place.longitude));
    setTimezone(place.timezoneId ?? place.timezone ?? timezone);
    if (place.timezoneOffset !== undefined) setTimezoneOffset(String(place.timezoneOffset));
    try {
      const date = /^\d{4}-\d{2}-\d{2}$/.test(birthDate) ? birthDate : new Date().toISOString().slice(0, 10);
      const time = await getTimezoneDetails(place.latitude, place.longitude, date);
      setTimezone(time.timezoneId ?? place.timezoneId ?? place.timezone ?? timezone);
      if (time.timezoneOffset !== undefined) setTimezoneOffset(String(time.timezoneOffset));
    } catch {
      // Coordinates are still better than a city-only profile.
    }
  }

  return (
    <form
      className="rounded-[30px] border p-5 shadow-[var(--hint-elevated-shadow)]"
      style={{ background: "var(--hint-card-surface)", borderColor: "var(--hint-border)" }}
      onSubmit={(event) => {
        event.preventDefault();
        if (!complete) return;
        void onSubmit(
          {
            name: name.trim(),
            birthDate,
            birthTime: birthTime || null,
            birthPlace: birthPlace.trim() || null,
            latitude: numeric(latitude),
            longitude: numeric(longitude),
            timezone,
            timezoneOffset: numeric(timezoneOffset),
          },
          consent,
        );
      }}
    >
      <h2 className="font-serif text-[34px] leading-tight" style={{ color: "var(--hint-text)" }}>
        {title}
      </h2>
      <p className="mt-2 text-[14px] font-semibold leading-relaxed" style={{ color: "var(--hint-muted)" }}>
        {subtitle}
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <input className="h-12 rounded-[16px] border px-4 text-[14px] outline-none" style={{ background: "var(--hint-input-bg)", borderColor: "var(--hint-border)", color: "var(--hint-text)" }} value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" />
        <input className="h-12 rounded-[16px] border px-4 text-[14px] outline-none" style={{ background: "var(--hint-input-bg)", borderColor: "var(--hint-border)", color: "var(--hint-text)" }} value={birthDate} onChange={(event) => setBirthDate(event.target.value)} placeholder="YYYY-MM-DD" inputMode="numeric" />
        <input className="h-12 rounded-[16px] border px-4 text-[14px] outline-none" style={{ background: "var(--hint-input-bg)", borderColor: "var(--hint-border)", color: "var(--hint-text)" }} type="time" value={birthTime} onChange={(event) => setBirthTime(event.target.value)} />
        <div className="sm:col-span-2">
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <input className="h-12 rounded-[16px] border px-4 text-[14px] outline-none" style={{ background: "var(--hint-input-bg)", borderColor: "var(--hint-border)", color: "var(--hint-text)" }} value={birthPlace} onChange={(event) => setBirthPlace(event.target.value)} placeholder="Birth city" />
            <button type="button" onClick={() => void searchPlace()} disabled={!birthPlace.trim() || placeLoading} className="h-12 rounded-[16px] border px-4 text-[13px] font-black disabled:opacity-50" style={{ background: "var(--hint-input-bg)", borderColor: "var(--hint-border)", color: "var(--hint-text)" }}>
              {placeLoading ? "Finding..." : "Find place"}
            </button>
          </div>
          {placeMode ? <p className="mt-2 text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--hint-faint)" }}>{placeMode === "live" ? "AstrologyAPI place match" : "Saved place match"}</p> : null}
          {placeError ? <p className="mt-2 text-[12px] font-semibold" style={{ color: "var(--hint-rose)" }}>{placeError}</p> : null}
          {placeResults.length ? (
            <div className="mt-3 grid gap-2">
              {placeResults.map((place) => {
                const label = place.label ?? [place.name, place.region, place.country].filter(Boolean).join(", ");
                return (
                  <button key={`${place.name}-${place.latitude}-${place.longitude}`} type="button" onClick={() => void selectPlace(place)} className="rounded-[16px] border px-3 py-2 text-left" style={{ background: "var(--hint-input-bg)", borderColor: "var(--hint-border)", color: "var(--hint-text)" }}>
                    <span className="block text-[13px] font-black">{label || place.name}</span>
                    <span className="mt-1 block text-[11px] font-semibold" style={{ color: "var(--hint-muted)" }}>{place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
      <details className="mt-4 rounded-[18px] border p-3" style={{ background: "var(--hint-card-inner)", borderColor: "var(--hint-border)" }}>
        <summary className="cursor-pointer text-[11px] font-black uppercase tracking-[0.16em]" style={{ color: "var(--hint-faint)" }}>Advanced location</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input className="h-11 rounded-[14px] border px-3 text-[13px] outline-none" style={{ background: "var(--hint-input-bg)", borderColor: "var(--hint-border)", color: "var(--hint-text)" }} value={latitude} onChange={(event) => setLatitude(event.target.value)} placeholder="Latitude" />
          <input className="h-11 rounded-[14px] border px-3 text-[13px] outline-none" style={{ background: "var(--hint-input-bg)", borderColor: "var(--hint-border)", color: "var(--hint-text)" }} value={longitude} onChange={(event) => setLongitude(event.target.value)} placeholder="Longitude" />
          <input className="h-11 rounded-[14px] border px-3 text-[13px] outline-none" style={{ background: "var(--hint-input-bg)", borderColor: "var(--hint-border)", color: "var(--hint-text)" }} value={timezone} onChange={(event) => setTimezone(event.target.value)} placeholder="Timezone" />
          <input className="h-11 rounded-[14px] border px-3 text-[13px] outline-none" style={{ background: "var(--hint-input-bg)", borderColor: "var(--hint-border)", color: "var(--hint-text)" }} value={timezoneOffset} onChange={(event) => setTimezoneOffset(event.target.value)} placeholder="UTC offset" />
        </div>
      </details>
      {requireConsent ? (
        <label className="mt-4 flex gap-3 rounded-[18px] border p-3 text-[13px] font-semibold leading-relaxed" style={{ background: "var(--hint-card-inner)", borderColor: "var(--hint-border)", color: "var(--hint-muted)" }}>
          <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1 size-4" />
          I consent to share these birth details for this compatibility preview.
        </label>
      ) : null}
      <button
        type="submit"
        disabled={!complete || saving}
        className="mt-5 h-12 w-full rounded-full text-[14px] font-black shadow-[0_14px_30px_rgba(203,168,102,0.2)] transition-[transform,opacity] duration-200 hover:-translate-y-0.5 disabled:opacity-45"
        style={{ background: "linear-gradient(135deg, var(--hint-gold-bright), var(--hint-gold))", color: "#080B14" }}
      >
        {saving ? "Working..." : submitLabel}
      </button>
    </form>
  );
}

function ScorePill({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-[22px] border p-4" style={{ background: "var(--hint-card-inner)", borderColor: "var(--hint-border)" }}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-black" style={{ color: "var(--hint-text)" }}>{label}</p>
        <p className="font-serif text-[34px] leading-none tabular-nums" style={{ color: value >= 70 ? "var(--hint-aqua)" : value >= 52 ? "var(--hint-gold)" : "var(--hint-rose)" }}>
          {value}
        </p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full" style={{ background: "var(--hint-surface-soft)" }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, var(--hint-gold), var(--hint-aqua))" }}
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.48, ease: "easeOut" }}
        />
      </div>
    </article>
  );
}

function ChartMini({ label, chart }: { label: string; chart: NormalizedBirthChart }) {
  return (
    <article className="rounded-[28px] border p-5" style={{ background: "var(--hint-card-surface)", borderColor: "var(--hint-border)" }}>
      <div className="flex items-center gap-4">
        <div className="shrink-0 rounded-[22px] border p-2" style={{ background: "rgba(8,11,20,0.72)", borderColor: "rgba(203,168,102,0.24)" }}>
          <PersonalSignalSeal chart={chart} size={112} compact />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--hint-faint)" }}>{label}</p>
          <h3 className="mt-1 font-serif text-[24px] leading-tight" style={{ color: "var(--hint-text)" }}>
            {signLabel(chart.sunSign)} Sun
          </h3>
          <p className="mt-1 text-[13px] font-semibold leading-relaxed" style={{ color: "var(--hint-muted)" }}>
            {signLabel(chart.moonSign)} Moon · {signLabel(chart.risingSign)} Rising
          </p>
        </div>
      </div>
    </article>
  );
}

function ResultView({ id }: { id: string }) {
  const [result, setResult] = useState<CompatibilityResult | null>(() => readStoredResult(id));
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    void fetch(apiUrl(`/api/compatibility/${id}`))
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Result not found."))))
      .then((payload: CompatibilityResult) => {
        if (!alive) return;
        setResult(payload);
        writeStoredResult(payload);
      })
      .catch((fetchError) => {
        if (alive && !result) setError(fetchError instanceof Error ? fetchError.message : "Result not found.");
      });
    return () => {
      alive = false;
    };
  }, [id]);

  if (!result) {
    return (
      <PanelShell eyebrow="Together" title="Shared chart" subtitle={error || "Opening compatibility result..."}>
        <Link className="inline-flex rounded-full border px-5 py-3 text-[13px] font-black" style={{ borderColor: "var(--hint-border)", color: "var(--hint-text)" }} href="/app/compatibility">
          Back to Together
        </Link>
      </PanelShell>
    );
  }

  const scores = [
    ["Overall", result.scores.overall],
    ["Attraction", result.scores.attraction],
    ["Communication", result.scores.communication],
    ["Emotion", result.scores.emotionalRhythm],
    ["Stability", result.scores.stability],
    ["Tension", result.scores.tension],
  ] as const;

  return (
    <PanelShell
      eyebrow="Together"
      title={`${result.people.user.name ?? "You"} + ${result.people.friend.name ?? "them"}`}
      subtitle="Compatibility preview based on both saved birth profiles. Use it as a mirror, not a verdict."
    >
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-[34px] border p-5 shadow-[var(--hint-elevated-shadow)]" style={{ background: "var(--hint-hero-surface)", borderColor: "var(--hint-border)" }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--hint-gold)" }}>Shared rhythm</p>
              <h2 className="mt-2 font-serif text-[58px] leading-none" style={{ color: "var(--hint-text)" }}>{result.scores.overall}</h2>
            </div>
            <span className="rounded-full border px-3 py-1.5 text-[12px] font-bold" style={{ background: "var(--hint-card-inner)", borderColor: "var(--hint-border)", color: "var(--hint-muted)" }}>
              {result.source === "api" ? "API synastry" : "Preview"}
            </span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {scores.map(([label, value]) => <ScorePill key={label} label={label} value={value} />)}
          </div>
        </div>
        <div className="grid gap-4">
          <ChartMini label={result.people.user.name ?? "You"} chart={result.people.user.chart} />
          <ChartMini label={result.people.friend.name ?? "Friend"} chart={result.people.friend.chart} />
        </div>
      </section>
      <section className="mt-5 grid gap-3 lg:grid-cols-2">
        {Object.entries(result.highlights).map(([key, value]) => (
          <article key={key} className="rounded-[24px] border p-5" style={{ background: "var(--hint-card-surface)", borderColor: "var(--hint-border)" }}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--hint-faint)" }}>{key.replace(/([A-Z])/g, " $1")}</p>
            <p className="mt-2 text-[15px] font-semibold leading-relaxed" style={{ color: "var(--hint-text)" }}>{value}</p>
          </article>
        ))}
      </section>
    </PanelShell>
  );
}

function InviteView({ token }: { token: string }) {
  const [, navigate] = useLocation();
  const [invite, setInvite] = useState<InviteSummary | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;
    void fetch(apiUrl(`/api/compatibility/invite/${token}`))
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Invite not found."))))
      .then((payload: InviteSummary) => {
        if (alive) setInvite(payload);
      })
      .catch((inviteError) => {
        if (alive) setError(inviteError instanceof Error ? inviteError.message : "Invite not found.");
      });
    return () => {
      alive = false;
    };
  }, [token]);

  useEffect(() => {
    if (invite?.status === "completed" && invite.resultId) {
      navigate(`/compatibility/${invite.resultId}`);
    }
  }, [invite?.resultId, invite?.status, navigate]);

  async function completeInvite(input: BirthDetails, consent: boolean) {
    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch(apiUrl(`/api/compatibility/invite/${token}/complete`), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          friendName: input.name,
          friendBirthProfile: detailsToBirthInput(input),
          consent,
        }),
      });
      if (!response.ok) throw new Error("Could not complete invite.");
      const payload = (await response.json()) as { resultId: string; result: CompatibilityResult };
      writeStoredResult(payload.result);
      navigate(`/compatibility/${payload.resultId}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not complete invite.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (error && !invite) {
    return (
      <PanelShell eyebrow="Together" title="Invite unavailable" subtitle={error}>
        <Link className="inline-flex rounded-full border px-5 py-3 text-[13px] font-black" style={{ borderColor: "var(--hint-border)", color: "var(--hint-text)" }} href="/app/compatibility">
          Create a new invite
        </Link>
      </PanelShell>
    );
  }

  if (invite?.status === "completed" && invite.resultId) {
    return null;
  }

  return (
    <PanelShell
      eyebrow="Together"
      title={`${invite?.creatorName ?? "Someone"} invited you`}
      subtitle="Add your birth details only if you consent. Hint will build a shared compatibility preview from both charts."
    >
      {error ? <p className="mb-4 rounded-[18px] border p-3 text-[13px] font-semibold" style={{ background: "var(--hint-card-inner)", borderColor: "var(--hint-border)", color: "var(--hint-rose)" }}>{error}</p> : null}
      <BirthDetailsForm
        title="Your birth details"
        subtitle="This is used for this shared chart preview. The browser never receives the astrology API key."
        submitLabel="Open shared chart"
        saving={isSubmitting}
        requireConsent
        onSubmit={completeInvite}
      />
    </PanelShell>
  );
}

function PanelShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="h-full w-full overflow-y-auto pb-20" style={{ background: "var(--hint-page-bg)", color: "var(--hint-text)" }}>
      <main className="mx-auto max-w-6xl px-4 pt-[92px]">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.28em]" style={{ color: "var(--hint-gold)" }}>{eyebrow}</p>
            <h1 className="mt-2 font-serif text-[42px] leading-tight sm:text-[64px]" style={{ color: "var(--hint-text)" }}>{title}</h1>
            <p className="mt-3 max-w-3xl text-[16px] font-semibold leading-relaxed" style={{ color: "var(--hint-muted)" }}>{subtitle}</p>
          </div>
          <Link href="/app/astrology" aria-label="Astrology" className="grid h-12 w-12 shrink-0 place-items-center rounded-full border" style={{ background: "var(--hint-surface-soft)", borderColor: "var(--hint-border)", color: "var(--hint-text)" }}>
            <Sparkles size={20} />
          </Link>
        </div>
        {children}
        <p className="mt-7 rounded-[20px] border p-4 text-[12px] font-semibold leading-relaxed" style={{ background: "var(--hint-surface-soft)", borderColor: "var(--hint-border)", color: "var(--hint-muted)" }}>
          Compatibility is a reflective chart preview. It is not a guaranteed prediction, and invite completion requires consent.
        </p>
      </main>
    </div>
  );
}

function DefaultCompatibilityView() {
  const { anonId, profile, saveProfile, isSaving } = useProfile();
  const selfDetails = profile?.birthDate
    ? {
        name: profile.name,
        birthDate: profile.birthDate,
        birthTime: profile.birthTime,
        birthPlace: profile.birthPlace,
      }
    : null;
  const { birthInput, chart } = useBirthChart(anonId, selfDetails);
  const [inviteUrl, setInviteUrl] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const canInvite = Boolean(birthInput && chart);

  const coreLine = useMemo(() => {
    if (!chart) return "Save your birth details first, then invite someone into a shared chart room.";
    return `${signLabel(chart.sunSign)} Sun, ${signLabel(chart.moonSign)} Moon, ${signLabel(chart.risingSign)} Rising will anchor the shared chart.`;
  }, [chart]);

  async function saveSelf(input: BirthDetails) {
    await saveProfile({
      name: input.name,
      birthDate: input.birthDate,
      birthTime: input.birthTime ?? undefined,
      birthPlace: input.birthPlace ?? undefined,
    });
  }

  async function createInvite() {
    if (!birthInput) return;
    setIsCreating(true);
    setError("");
    try {
      const response = await fetch(apiUrl("/api/compatibility/invite"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          createdByUserId: anonId,
          relationshipType: "unclear",
          birthProfile: birthInput,
        }),
      });
      if (!response.ok) throw new Error("Could not create invite.");
      const invite = (await response.json()) as { token: string };
      setInviteUrl(`${window.location.origin}/compatibility/invite/${invite.token}`);
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : "Could not create invite.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <PanelShell
      eyebrow="Together"
      title="Shared chart room"
      subtitle="Invite-based compatibility. Your chart starts the room; their chart is added only after they consent."
    >
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-[34px] border p-5 shadow-[var(--hint-elevated-shadow)]" style={{ background: "var(--hint-hero-surface)", borderColor: "var(--hint-border)" }}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ background: "var(--hint-surface-soft)", borderColor: "var(--hint-border)", color: "var(--hint-gold)" }}>
              <UserRound size={14} />
              Invite flow
            </span>
            <span className="rounded-full border px-3 py-1.5 text-[11px] font-semibold" style={{ background: "var(--hint-surface-soft)", borderColor: "var(--hint-border)", color: "var(--hint-muted)" }}>
              Consent required
            </span>
          </div>
          <h2 className="mt-5 font-serif text-[44px] leading-tight" style={{ color: "var(--hint-text)" }}>Compare two charts without making it weird.</h2>
          <p className="mt-4 max-w-2xl text-[16px] font-semibold leading-relaxed" style={{ color: "var(--hint-muted)" }}>{coreLine}</p>
          <button
            type="button"
            disabled={!canInvite || isCreating}
            onClick={createInvite}
            className="mt-6 inline-flex h-12 items-center justify-center rounded-full px-6 text-[14px] font-black transition-[transform,opacity] duration-200 hover:-translate-y-0.5 disabled:opacity-45"
            style={{ background: "linear-gradient(135deg, var(--hint-gold-bright), var(--hint-gold))", color: "#080B14" }}
          >
            {isCreating ? "Creating..." : "Create invite link"}
          </button>
          {!canInvite ? <p className="mt-3 text-[13px] font-semibold" style={{ color: "var(--hint-muted)" }}>Save your birth profile before creating an invite.</p> : null}
          {error ? <p className="mt-3 text-[13px] font-semibold" style={{ color: "var(--hint-rose)" }}>{error}</p> : null}
          {inviteUrl ? (
            <div className="mt-5 rounded-[22px] border p-4" style={{ background: "var(--hint-card-inner)", borderColor: "var(--hint-border)" }}>
              <p className="text-[12px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--hint-faint)" }}>Invite link</p>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                <code className="min-w-0 flex-1 break-all rounded-[14px] px-3 py-2 text-[13px]" style={{ background: "var(--hint-surface-soft)", color: "var(--hint-text)" }}>{inviteUrl}</code>
                <button type="button" onClick={() => void navigator.clipboard?.writeText(inviteUrl)} className="inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-[13px] font-bold" style={{ borderColor: "var(--hint-border)", color: "var(--hint-text)" }}>
                  <Copy size={15} />
                  Copy
                </button>
              </div>
            </div>
          ) : null}
        </div>
        {chart ? (
          <div className="rounded-[30px] border p-5 shadow-[var(--hint-elevated-shadow)]" style={{ background: "var(--hint-card-surface)", borderColor: "var(--hint-border)" }}>
            <PersonalSignalSeal chart={chart} size={230} />
            <h2 className="mt-2 font-serif text-[30px]" style={{ color: "var(--hint-text)" }}>Your side is ready.</h2>
            <p className="mt-2 text-[14px] font-semibold leading-relaxed" style={{ color: "var(--hint-muted)" }}>
              {signLabel(chart.venusSign)} Venus and {signLabel(chart.marsSign)} Mars help shape the relationship preview.
            </p>
          </div>
        ) : (
          <BirthDetailsForm title="Save your birth details" subtitle="Hint needs your profile first before it can create a shared chart invite." submitLabel="Save profile" saving={isSaving} onSubmit={(input) => void saveSelf(input)} />
        )}
      </section>
    </PanelShell>
  );
}

export function CompatibilityView() {
  const [isInvite, inviteParams] = useRoute("/compatibility/invite/:token");
  const [isResult, resultParams] = useRoute("/compatibility/:id");

  if (isInvite && inviteParams?.token) return <InviteView token={inviteParams.token} />;
  if (isResult && resultParams?.id) return <ResultView id={resultParams.id} />;
  return <DefaultCompatibilityView />;
}
