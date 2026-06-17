import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { ACCENT, GLASS } from "../hold/atmosphere";
import { AppScreen, ScreenHeader, GlassPanel, SectionLabel } from "../../components/app/AppChrome";
import { DailyPullSigil } from "../home/data/sigils";
import { DailyReportCard } from "../home/components/DailyReportCard";
import { getDailyReport } from "../home/data/dailyReport";
import {
  useGetOrCreateDailyPull,
  useUpdateDailyPull,
} from "@workspace/api-client-react";
import type { DailyPull } from "@workspace/api-client-react";
import type { DailyReport, DailyScore, DailyScoreKey } from "../home/types/home.types";
import { getAnonId, getLocalDateString } from "../../lib/identity";
import { useLanguage } from "../../lib/i18n";
import { useProfile } from "../../lib/useProfile";
import { readBirthProfile } from "../../lib/astro/userBirthProfile";

const OPTION_WINDOW = [-2, -1, 0, 1, 2] as const;
const PERIODS = [
  { key: "day", labelKey: "dailyPull.period.day" },
  { key: "week", labelKey: "dailyPull.period.week" },
  { key: "month", labelKey: "dailyPull.period.month" },
  { key: "year", labelKey: "dailyPull.period.year" },
] as const;
const SCORE_ORDER: DailyScoreKey[] = ["love", "wealth", "career", "study", "people"];

type PeriodMode = (typeof PERIODS)[number]["key"];
type PeriodOffsets = Record<PeriodMode, number>;
type Translate = (key: string) => string;

function startOfLocalDay(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addLocalDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addLocalMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function addLocalYears(date: Date, years: number): Date {
  return new Date(date.getFullYear() + years, 0, 1);
}

function startOfWeek(date: Date): Date {
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  return addLocalDays(startOfLocalDay(date), mondayOffset);
}

function startOfPeriod(period: PeriodMode, date: Date): Date {
  const day = startOfLocalDay(date);
  if (period === "week") return startOfWeek(day);
  if (period === "month") return new Date(day.getFullYear(), day.getMonth(), 1);
  if (period === "year") return new Date(day.getFullYear(), 0, 1);
  return day;
}

function endOfPeriod(period: PeriodMode, date: Date): Date {
  const start = startOfPeriod(period, date);
  if (period === "week") return addLocalDays(start, 6);
  if (period === "month") return new Date(start.getFullYear(), start.getMonth() + 1, 0);
  if (period === "year") return new Date(start.getFullYear(), 11, 31);
  return start;
}

function getPeriodAnchor(period: PeriodMode, today: Date, offset: number): Date {
  if (period === "week") return addLocalDays(today, offset * 7);
  if (period === "month") return addLocalMonths(today, offset);
  if (period === "year") return addLocalYears(today, offset);
  return addLocalDays(today, offset);
}

function datesInPeriod(period: PeriodMode, anchor: Date): Date[] {
  const start = startOfPeriod(period, anchor);
  const end = endOfPeriod(period, anchor);

  const dates: Date[] = [];
  for (let cursor = start; cursor <= end; cursor = addLocalDays(cursor, 1)) {
    dates.push(cursor);
  }
  return dates;
}

function withCount(template: string, count: number): string {
  return template.replace("{count}", String(count));
}

function formatDayLabel(date: Date, offset: number, t: Translate): string {
  if (offset === 0) return t("dailyPull.relative.today");
  if (offset === -1) return t("dailyPull.relative.yesterday");
  if (offset === 1) return t("dailyPull.relative.tomorrow");

  return date.toLocaleDateString(undefined, { weekday: "short" });
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatPeriodRange(period: PeriodMode, anchor: Date): string {
  const start = startOfPeriod(period, anchor);
  const end = endOfPeriod(period, anchor);

  if (period === "day") {
    return start.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  }

  if (period === "month") {
    return start.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }

  if (period === "year") {
    return String(start.getFullYear());
  }

  return `${formatShortDate(start)} - ${formatShortDate(end)}`;
}

function formatPeriodButtonLabel(period: PeriodMode, offset: number, anchor: Date, t: Translate): string {
  if (period === "day") return formatDayLabel(anchor, offset, t);
  if (period === "week") {
    if (offset === 0) return t("dailyPull.relative.thisWeek");
    if (offset === -1) return t("dailyPull.relative.lastWeek");
    if (offset === 1) return t("dailyPull.relative.nextWeek");
    return offset < 0
      ? withCount(t("dailyPull.relative.weeksAgo"), Math.abs(offset))
      : withCount(t("dailyPull.relative.inWeeks"), offset);
  }
  if (period === "month") {
    if (offset === 0) return t("dailyPull.relative.thisMonth");
    if (offset === -1) return t("dailyPull.relative.lastMonth");
    if (offset === 1) return t("dailyPull.relative.nextMonth");
    return anchor.toLocaleDateString(undefined, { month: "short" });
  }
  if (offset === 0) return t("dailyPull.relative.thisYear");
  if (offset === -1) return t("dailyPull.relative.lastYear");
  if (offset === 1) return t("dailyPull.relative.nextYear");
  return offset < 0
    ? withCount(t("dailyPull.relative.yearsAgo"), Math.abs(offset))
    : withCount(t("dailyPull.relative.inYears"), offset);
}

function periodTitle(period: PeriodMode, t: Translate): string {
  if (period === "week") return t("dailyPull.score.weekly");
  if (period === "month") return t("dailyPull.score.monthly");
  if (period === "year") return t("dailyPull.score.yearly");
  return t("dailyPull.score.daily");
}

function periodBadgeKey(period: PeriodMode): string {
  if (period === "week") return "dailyPull.badge.weekly";
  if (period === "month") return "dailyPull.badge.monthly";
  if (period === "year") return "dailyPull.badge.yearly";
  return "dailyPull.badge.daily";
}

type PeriodSummary = {
  period: PeriodMode;
  rangeLabel: string;
  overallScore: number;
  scores: DailyScore[];
  strongest: DailyScore;
  softest: DailyScore;
  bestDay: DailyReport;
  sampleCount: number;
  summary: string;
  suggestion: string;
  avoid: string;
};

function averageScores(reports: DailyReport[]): DailyScore[] {
  return SCORE_ORDER.map((key) => {
    const first = reports[0]!.scores.find((score) => score.key === key)!;
    const average = Math.round(
      reports.reduce((total, report) => {
        const score = report.scores.find((item) => item.key === key);
        return total + (score?.score ?? 0);
      }, 0) / reports.length,
    );
    return { ...first, score: average };
  });
}

function buildPeriodSummary({
  period,
  anchor,
  language,
  birthDetails,
}: {
  period: PeriodMode;
  anchor: Date;
  language: ReturnType<typeof useLanguage>["language"];
  birthDetails?: {
    birthDate?: string | null;
    birthTime?: string | null;
    birthPlace?: string | null;
  };
}): PeriodSummary | null {
  const dates = datesInPeriod(period, anchor);
  if (!dates.length) return null;

  const reports = dates.map((date) =>
    getDailyReport({
      anonId: getAnonId(),
      date,
      language,
      birthDetails,
    }),
  );
  const scores = averageScores(reports);
  const overallScore = Math.round(
    reports.reduce((total, report) => total + report.overallScore, 0) / reports.length,
  );
  const strongest = scores.reduce((best, score) => (score.score > best.score ? score : best), scores[0]!);
  const softest = scores.reduce((lowest, score) => (score.score < lowest.score ? score : lowest), scores[0]!);
  const bestDay = reports.reduce((best, report) =>
    report.overallScore > best.overallScore ? report : best,
  );
  const middleReport = reports[Math.floor(reports.length / 2)] ?? reports[0]!;

  return {
    period,
    rangeLabel: formatPeriodRange(period, anchor),
    overallScore,
    scores,
    strongest,
    softest,
    bestDay,
    sampleCount: reports.length,
    summary: `${strongest.label} carries the strongest signal at ${strongest.score}. ${softest.label} needs the most space, so keep that area simple.`,
    suggestion: middleReport.suggestion,
    avoid: middleReport.avoid,
  };
}

function PeriodScoreBar({ score }: { score: DailyScore }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="font-sans text-[11px]" style={{ color: GLASS.muted }}>
          {score.label}
        </span>
        <span className="font-serif text-[17px] tabular-nums" style={{ color: GLASS.text }}>
          {score.score}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{
            width: `${score.score}%`,
            background: `linear-gradient(90deg, ${score.tone}, rgba(255,255,255,0.74))`,
          }}
        />
      </div>
    </div>
  );
}

function PeriodSummaryCard({ summary }: { summary: PeriodSummary }) {
  const { t } = useLanguage();

  return (
    <GlassPanel className="mb-5 hint-shimmer-border">
      <div className="grid gap-5">
        <div>
          <p
            className="font-sans text-[10px] uppercase tracking-[0.22em]"
            style={{ color: ACCENT.aqua }}
          >
            {summary.rangeLabel}
          </p>
          <h2 className="mt-2 font-serif text-[28px] leading-none sm:text-[36px]" style={{ color: GLASS.text }}>
            {periodTitle(summary.period, t)}
          </h2>
          <div className="mt-5 flex items-end gap-2">
            <span
              className="font-serif text-[72px] leading-[0.82] tabular-nums sm:text-[86px]"
              style={{
                color: "var(--hint-score-ink)",
                textShadow: "var(--hint-score-shadow)",
              }}
            >
              {summary.overallScore}
            </span>
            <span className="pb-2 font-serif text-[19px]" style={{ color: "var(--hint-score-ink)" }}>
              {t("daily.score")}
            </span>
          </div>
          <p className="mt-4 max-w-md font-sans text-[13px] leading-relaxed" style={{ color: GLASS.muted }}>
            {summary.summary}
          </p>
        </div>

        <div className="grid gap-3">
          {summary.scores.map((score) => (
            <PeriodScoreBar key={score.key} score={score} />
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        <div className="hint-status-pill rounded-[14px] border p-4">
          <p className="font-sans text-[10px] uppercase tracking-[0.18em]" style={{ color: GLASS.faint }}>
            {t("dailyPull.strongest")}
          </p>
          <p className="mt-2 font-serif text-[18px]" style={{ color: GLASS.text }}>
            {summary.strongest.label} · {summary.strongest.score}
          </p>
        </div>
        <div className="hint-status-pill rounded-[14px] border p-4">
          <p className="font-sans text-[10px] uppercase tracking-[0.18em]" style={{ color: GLASS.faint }}>
            {t("dailyPull.bestDay")}
          </p>
          <p className="mt-2 font-serif text-[18px]" style={{ color: GLASS.text }}>
            {formatShortDate(new Date(`${summary.bestDay.date}T00:00:00`))} · {summary.bestDay.overallScore}
          </p>
        </div>
        <div className="hint-status-pill rounded-[14px] border p-4">
          <p className="font-sans text-[10px] uppercase tracking-[0.18em]" style={{ color: GLASS.faint }}>
            {t("dailyPull.daysRead")}
          </p>
          <p className="mt-2 font-serif text-[18px]" style={{ color: GLASS.text }}>
            {summary.sampleCount}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        <div>
          <p className="font-sans text-[10px] uppercase tracking-[0.2em]" style={{ color: GLASS.faint }}>
            {t("daily.suggest")}
          </p>
          <p className="mt-1 font-serif text-[15px] leading-snug" style={{ color: GLASS.text }}>
            {summary.suggestion}
          </p>
        </div>
        <div>
          <p className="font-sans text-[10px] uppercase tracking-[0.2em]" style={{ color: GLASS.faint }}>
            {t("daily.avoid")}
          </p>
          <p className="mt-1 font-serif text-[15px] leading-snug" style={{ color: GLASS.text }}>
            {summary.avoid}
          </p>
        </div>
      </div>
    </GlassPanel>
  );
}

export function DailyPullView() {
  const drawMutation = useGetOrCreateDailyPull();
  const updateMutation = useUpdateDailyPull();
  const [pull, setPull] = useState<DailyPull | null>(null);
  const [note, setNote] = useState("");
  const [savedNote, setSavedNote] = useState("");
  const [period, setPeriod] = useState<PeriodMode>("day");
  const [periodOffsets, setPeriodOffsets] = useState<PeriodOffsets>({
    day: 0,
    week: 0,
    month: 0,
    year: 0,
  });
  const [selectedOffset, setSelectedOffset] = useState(0);
  const drewRef = useRef(false);
  const dateRef = useRef(getLocalDateString());
  const { language, t } = useLanguage();
  const { profile } = useProfile();
  const [birthProfile, setBirthProfile] = useState(() => readBirthProfile());
  const activeBirthDetails = profile?.birthDate
    ? {
        birthDate: profile.birthDate,
        birthTime: profile.birthTime,
        birthPlace: profile.birthPlace,
      }
    : birthProfile
      ? {
          birthDate: birthProfile.birthDate,
          birthTime: birthProfile.birthTime,
          birthPlace: birthProfile.birthPlace,
        }
      : null;
  const birthPersonalized = Boolean(activeBirthDetails?.birthDate);
  const today = useMemo(() => startOfLocalDay(), []);
  const activeOffset = period === "day" ? selectedOffset : periodOffsets[period];
  const selectedDate = useMemo(() => getPeriodAnchor(period, today, activeOffset), [activeOffset, period, today]);
  const activeLabel = formatPeriodButtonLabel(period, activeOffset, selectedDate, t);
  const activeDetail = formatPeriodRange(period, selectedDate);
  const dayOptions = useMemo(
    () =>
      OPTION_WINDOW.map((relative) => {
        const offset = selectedOffset + relative;
        const date = addLocalDays(today, offset);
        return {
          offset,
          date,
          key: `${offset}:${getLocalDateString(date)}`,
          label: formatDayLabel(date, offset, t),
          detail: date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
          day: date.toLocaleDateString(undefined, { day: "numeric" }),
        };
      }),
    [selectedOffset, t, today],
  );
  const periodOptions = useMemo(
    () =>
      OPTION_WINDOW.map((relative) => {
        const offset = activeOffset + relative;
        const date = getPeriodAnchor(period, today, offset);
        return {
          offset,
          date,
          key: `${period}:${offset}:${getLocalDateString(date)}`,
          selected: offset === activeOffset,
          label: formatPeriodButtonLabel(period, offset, date, t),
          detail: formatPeriodRange(period, date),
        };
      }),
    [activeOffset, period, t, today],
  );
  const periodSummary = useMemo(
    () =>
      period === "day"
        ? null
        : buildPeriodSummary({
            period,
            anchor: selectedDate,
            language,
            birthDetails: activeBirthDetails ?? undefined,
          }),
    [activeBirthDetails?.birthDate, activeBirthDetails?.birthPlace, activeBirthDetails?.birthTime, language, period, selectedDate],
  );

  // Draw (or fetch the already-saved) pull for today, exactly once.
  useEffect(() => {
    if (drewRef.current) return;
    drewRef.current = true;
    drawMutation.mutate(
      { data: { anonId: getAnonId(), date: dateRef.current } },
      {
        onSuccess: (data) => {
          setPull(data);
          setNote(data.note ?? "");
          setSavedNote(data.note ?? "");
        },
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const syncBirthProfile = () => setBirthProfile(readBirthProfile());
    window.addEventListener("hint.birthProfile.updated", syncBirthProfile);
    window.addEventListener("storage", syncBirthProfile);
    return () => {
      window.removeEventListener("hint.birthProfile.updated", syncBirthProfile);
      window.removeEventListener("storage", syncBirthProfile);
    };
  }, []);

  function saveNote() {
    if (!pull || note === savedNote) return;
    updateMutation.mutate(
      { data: { anonId: getAnonId(), date: dateRef.current, note } },
      { onSuccess: (data) => setSavedNote(data.note ?? "") },
    );
  }

  function shiftActivePeriod(delta: number) {
    if (period === "day") {
      setSelectedOffset((value) => value + delta);
      return;
    }

    setPeriodOffsets((next) => ({
      ...next,
      [period]: next[period] + delta,
    }));
  }

  return (
    <AppScreen>
      <ScreenHeader
        eyebrow={t("dailyPull.eyebrow")}
        title={t("dailyPull.title")}
        subtitle={t("dailyPull.subtitle")}
        sigil={DailyPullSigil}
      />

      <section className="mb-5 lg:mb-6">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <SectionLabel>{t("dailyPull.calendarTitle")}</SectionLabel>
            <p className="mt-1 font-sans text-[12.5px] leading-relaxed" style={{ color: GLASS.muted }}>
              {t("dailyPull.calendarBody")}
            </p>
          </div>
          <span
            className="hidden h-9 items-center gap-2 rounded-full border px-3 font-serif text-[10px] uppercase tracking-[0.18em] sm:inline-flex"
            style={{
              background: "rgba(122,226,214,0.08)",
              borderColor: "rgba(122,226,214,0.2)",
              color: ACCENT.aqua,
            }}
          >
            <CalendarDays size={14} />
            {t(periodBadgeKey(period))}
          </span>
        </div>
        <div className="mb-3 grid grid-cols-4 gap-2 rounded-[16px] border p-1.5" style={{ background: "var(--hint-surface-strong)", borderColor: "var(--hint-border)" }}>
          {PERIODS.map((item) => {
            const selected = period === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setPeriod(item.key)}
                aria-pressed={selected}
                className="h-10 rounded-[12px] font-serif text-[13px] transition-[transform,opacity] duration-200 hover:-translate-y-0.5 active:translate-y-0"
                style={{
                  background: selected
                    ? "linear-gradient(145deg, rgba(243,212,144,0.78), rgba(210,158,104,0.82))"
                    : "transparent",
                  color: selected ? "#15120e" : GLASS.muted,
                  border: selected ? "1px solid rgba(255,255,255,0.24)" : "1px solid transparent",
                }}
              >
                {t(item.labelKey)}
              </button>
            );
          })}
        </div>
        <div
          className="mb-3 flex items-center justify-between gap-3 rounded-[16px] border px-2.5 py-2"
          style={{ background: "var(--hint-surface-strong)", borderColor: "var(--hint-border)" }}
        >
          <button
            type="button"
            onClick={() => shiftActivePeriod(-1)}
            aria-label={`${t("common.previous")} ${t(`dailyPull.period.${period}`)}`}
            className="grid size-10 shrink-0 place-items-center rounded-[12px] border transition-[transform,opacity] duration-200 hover:-translate-x-0.5"
            style={{ background: "var(--hint-input-bg)", borderColor: "var(--hint-border)", color: GLASS.text }}
          >
            <ChevronLeft size={18} />
          </button>
          <div className="min-w-0 text-center">
            <p className="font-serif text-[20px] leading-tight sm:text-[24px]" style={{ color: GLASS.text }}>
              {activeLabel}
            </p>
            <p className="mt-0.5 truncate font-sans text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: GLASS.faint }}>
              {activeDetail}
            </p>
          </div>
          <button
            type="button"
            onClick={() => shiftActivePeriod(1)}
            aria-label={`${t("common.next")} ${t(`dailyPull.period.${period}`)}`}
            className="grid size-10 shrink-0 place-items-center rounded-[12px] border transition-[transform,opacity] duration-200 hover:translate-x-0.5"
            style={{ background: "var(--hint-input-bg)", borderColor: "var(--hint-border)", color: GLASS.text }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <div
          className="rounded-[18px] border p-2"
          style={{
            background: "var(--hint-surface-strong)",
            borderColor: "var(--hint-border)",
            boxShadow: "var(--hint-elevated-shadow)",
          }}
        >
          {period === "day" ? (
            <div className="grid grid-cols-5 gap-1.5">
              {dayOptions.map((option) => {
                const selected = selectedOffset === option.offset;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setSelectedOffset(option.offset)}
                    aria-pressed={selected}
                    className="hint-tap-sparkle min-h-[72px] rounded-[12px] border px-2 py-2.5 text-left transition-[transform,opacity] duration-200 hover:-translate-y-0.5 active:translate-y-0"
                    style={{
                      background: selected
                        ? "linear-gradient(145deg, rgba(243,212,144,0.34), rgba(122,226,214,0.16))"
                        : "var(--hint-input-bg)",
                      borderColor: selected ? "rgba(206,178,110,0.58)" : "var(--hint-border)",
                      color: "var(--hint-text)",
                    }}
                  >
                    <span className="block">
                      <span className="font-sans text-[10px] uppercase tracking-[0.14em]" style={{ color: selected ? ACCENT.gold : "var(--hint-faint)" }}>
                        {option.label}
                      </span>
                    </span>
                    <span className="mt-2 block font-serif text-[26px] leading-none tabular-nums" style={{ color: selected ? ACCENT.gold : "var(--hint-text)" }}>
                      {option.day}
                    </span>
                    <span className="mt-2 block truncate font-sans text-[10px] font-semibold" style={{ color: "var(--hint-faint)" }}>
                      {option.detail}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-1.5">
              {periodOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() =>
                    setPeriodOffsets((next) => ({
                      ...next,
                      [period]: option.offset,
                    }))
                  }
                  aria-pressed={option.selected}
                  className="hint-tap-sparkle min-h-[72px] rounded-[12px] border px-2 py-2.5 text-left transition-[transform,opacity] duration-200 hover:-translate-y-0.5 active:translate-y-0"
                  style={{
                    background: option.selected
                      ? "linear-gradient(145deg, rgba(243,212,144,0.34), rgba(122,226,214,0.16))"
                      : "var(--hint-input-bg)",
                    borderColor: option.selected ? "rgba(206,178,110,0.58)" : "var(--hint-border)",
                    color: "var(--hint-text)",
                  }}
                >
                  <span className="block font-serif text-[18px] leading-tight" style={{ color: option.selected ? ACCENT.gold : "var(--hint-text)" }}>
                    {option.label}
                  </span>
                  <span className="mt-2 block font-sans text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--hint-faint)" }}>
                    {option.detail}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {periodSummary ? (
        <PeriodSummaryCard summary={periodSummary} />
      ) : (
        <DailyReportCard
          detailed
          dateOverride={selectedDate}
          className="mb-5"
          cardOverride={
            selectedOffset === 0 && pull && !birthPersonalized
              ? {
                  cardId: pull.cardId,
                  cardName: pull.cardName,
                  whisper: pull.whisper,
                }
              : null
          }
        />
      )}

      {period === "day" && selectedOffset === 0 && drawMutation.isError && (
        <GlassPanel className="mb-6">
          <p className="font-serif italic text-[14px] text-center" style={{ color: GLASS.muted }}>
            {t("dailyPull.error")}
          </p>
        </GlassPanel>
      )}

      {period === "day" && selectedOffset === 0 && pull && (
        <section className="mb-6">
          <SectionLabel>{t("dailyPull.noteTitle")}</SectionLabel>
          <GlassPanel>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onBlur={saveNote}
              placeholder={t("dailyPull.notePlaceholder")}
              className="w-full h-24 rounded-[16px] px-4 py-3 font-serif text-[14px] bg-transparent focus:outline-none resize-none"
              style={{
                background: "color-mix(in srgb, var(--hint-input-bg) 86%, transparent)",
                border: `1px solid ${GLASS.border}`,
                color: GLASS.text,
              }}
              data-testid="input-pull-note"
            />
            <div className="flex items-center justify-between mt-2 h-4">
              <span className="font-sans text-[11px]" style={{ color: GLASS.faint }}>
                {updateMutation.isPending
                  ? t("profile.keeping")
                  : note === savedNote && savedNote
                    ? t("dailyPull.kept")
                    : ""}
              </span>
            </div>
          </GlassPanel>
        </section>
      )}

      <section className="mb-6">
        <SectionLabel>{t("dailyPull.sitTitle")}</SectionLabel>
        <GlassPanel>
          <p className="font-sans text-[13px] leading-relaxed" style={{ color: GLASS.muted }}>
            {t("dailyPull.sitBody")}
          </p>
          <Link
            href="/app/tarot"
            className="hint-soft-button hint-tap-sparkle inline-flex items-center justify-center w-full h-11 rounded-full mt-4 font-sans text-[12px] font-black uppercase tracking-[0.16em]"
          >
            {t("dailyPull.openRoom")}
          </Link>
        </GlassPanel>
      </section>
    </AppScreen>
  );
}
