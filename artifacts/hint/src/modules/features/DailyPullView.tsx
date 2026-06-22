import { useEffect, useMemo, useRef, useState } from "react";
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

function daysBetween(date: Date, base: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((startOfLocalDay(date).getTime() - startOfLocalDay(base).getTime()) / msPerDay);
}

function offsetForPeriod(period: PeriodMode, date: Date, today: Date): number {
  if (period === "week") {
    return Math.round(daysBetween(startOfWeek(date), startOfWeek(today)) / 7);
  }
  if (period === "month") {
    return (date.getFullYear() - today.getFullYear()) * 12 + (date.getMonth() - today.getMonth());
  }
  if (period === "year") {
    return date.getFullYear() - today.getFullYear();
  }
  return daysBetween(date, today);
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

function sameLocalDay(a: Date, b: Date): boolean {
  return getLocalDateString(a) === getLocalDateString(b);
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
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="font-sans text-[10px]" style={{ color: GLASS.muted }}>
          {score.label}
        </span>
        <span className="font-serif text-[15px] tabular-nums" style={{ color: GLASS.text }}>
          {score.score}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
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
    <GlassPanel className="mb-4 hint-shimmer-border" padded={false}>
      <div className="p-4">
      <div className="grid gap-4">
        <div>
          <p
            className="font-sans text-[10px] uppercase tracking-[0.22em]"
            style={{ color: ACCENT.aqua }}
          >
            {summary.rangeLabel}
          </p>
          <h2 className="mt-1.5 font-serif text-[24px] leading-none sm:text-[30px]" style={{ color: GLASS.text }}>
            {periodTitle(summary.period, t)}
          </h2>
          <div className="mt-3 flex items-end gap-2">
            <span
              className="font-serif text-[54px] leading-[0.82] tabular-nums sm:text-[64px]"
              style={{
                color: "var(--hint-score-ink)",
                textShadow: "var(--hint-score-shadow)",
              }}
            >
              {summary.overallScore}
            </span>
            <span className="pb-1.5 font-serif text-[16px]" style={{ color: "var(--hint-score-ink)" }}>
              {t("daily.score")}
            </span>
          </div>
          <p className="mt-3 max-w-md font-sans text-[12px] leading-relaxed" style={{ color: GLASS.muted }}>
            {summary.summary}
          </p>
        </div>

        <div className="grid gap-2.5 min-[390px]:grid-cols-2 min-[390px]:gap-x-3">
          {summary.scores.map((score) => (
            <PeriodScoreBar key={score.key} score={score} />
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="hint-status-pill rounded-[13px] border p-3">
          <p className="font-sans text-[10px] uppercase tracking-[0.18em]" style={{ color: GLASS.faint }}>
            {t("dailyPull.strongest")}
          </p>
          <p className="mt-1.5 truncate font-serif text-[15px]" style={{ color: GLASS.text }}>
            {summary.strongest.label} · {summary.strongest.score}
          </p>
        </div>
        <div className="hint-status-pill rounded-[13px] border p-3">
          <p className="font-sans text-[10px] uppercase tracking-[0.18em]" style={{ color: GLASS.faint }}>
            {t("dailyPull.bestDay")}
          </p>
          <p className="mt-1.5 truncate font-serif text-[15px]" style={{ color: GLASS.text }}>
            {formatShortDate(new Date(`${summary.bestDay.date}T00:00:00`))} · {summary.bestDay.overallScore}
          </p>
        </div>
        <div className="hint-status-pill rounded-[13px] border p-3">
          <p className="font-sans text-[10px] uppercase tracking-[0.18em]" style={{ color: GLASS.faint }}>
            {t("dailyPull.daysRead")}
          </p>
          <p className="mt-1.5 truncate font-serif text-[15px]" style={{ color: GLASS.text }}>
            {summary.sampleCount}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 min-[390px]:grid-cols-2">
        <div>
          <p className="font-sans text-[10px] uppercase tracking-[0.2em]" style={{ color: GLASS.faint }}>
            {t("daily.suggest")}
          </p>
          <p className="mt-1 font-serif text-[14px] leading-snug" style={{ color: GLASS.text }}>
            {summary.suggestion}
          </p>
        </div>
        <div>
          <p className="font-sans text-[10px] uppercase tracking-[0.2em]" style={{ color: GLASS.faint }}>
            {t("daily.avoid")}
          </p>
          <p className="mt-1 font-serif text-[14px] leading-snug" style={{ color: GLASS.text }}>
            {summary.avoid}
          </p>
        </div>
      </div>
      </div>
    </GlassPanel>
  );
}

function calendarCells(cursor: Date): Date[] {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = addLocalDays(first, -first.getDay());
  return Array.from({ length: 42 }, (_, index) => addLocalDays(start, index));
}

function weekDayLabels(): string[] {
  const base = new Date(2026, 5, 14);
  return Array.from({ length: 7 }, (_, index) =>
    addLocalDays(base, index).toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2),
  );
}

function CalendarJumpMenu({
  selectedDate,
  currentPeriod,
  today,
  onSelect,
  onClose,
}: {
  selectedDate: Date;
  currentPeriod: PeriodMode;
  today: Date;
  onSelect: (date: Date, mode: PeriodMode) => void;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const [mode, setMode] = useState<PeriodMode>(currentPeriod);
  const [cursor, setCursor] = useState(() => new Date(selectedDate));
  const cells = useMemo(() => calendarCells(cursor), [cursor]);
  const monthNames = useMemo(
    () => Array.from({ length: 12 }, (_, month) => new Date(cursor.getFullYear(), month, 1)),
    [cursor],
  );
  const yearStart = Math.floor(cursor.getFullYear() / 12) * 12;
  const years = useMemo(
    () => Array.from({ length: 12 }, (_, index) => yearStart + index),
    [yearStart],
  );
  const selectedWeekKey = getLocalDateString(startOfWeek(selectedDate));

  function shiftCursor(delta: number) {
    if (mode === "year") {
      setCursor((date) => new Date(date.getFullYear() + delta * 12, date.getMonth(), 1));
      return;
    }
    if (mode === "month") {
      setCursor((date) => new Date(date.getFullYear() + delta, date.getMonth(), 1));
      return;
    }
    setCursor((date) => new Date(date.getFullYear(), date.getMonth() + delta, 1));
  }

  return (
    <div
      data-testid="daily-calendar-jump-menu"
      className="hint-liquid-panel rounded-[28px] p-3"
      style={{
        position: "absolute",
        left: 0,
        top: "2.75rem",
        zIndex: 40,
        width: "100%",
        maxWidth: 340,
        borderColor: "color-mix(in srgb, var(--hint-rose) 24%, var(--hint-border))",
      }}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => shiftCursor(-1)}
          className="grid size-9 place-items-center rounded-full border"
          style={{ color: GLASS.text, background: "var(--hint-input-bg)", borderColor: GLASS.border }}
          aria-label={t("common.previous")}
        >
          <ChevronLeft size={17} />
        </button>
        <div className="min-w-0 text-center">
          <p className="font-serif text-[20px] leading-none" style={{ color: GLASS.text }}>
            {mode === "year"
              ? `${years[0]} - ${years[years.length - 1]}`
              : cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </p>
          <p className="mt-1 font-sans text-[9px] font-black uppercase tracking-[0.16em]" style={{ color: GLASS.faint }}>
            Calendar jump
          </p>
        </div>
        <button
          type="button"
          onClick={() => shiftCursor(1)}
          className="grid size-9 place-items-center rounded-full border"
          style={{ color: GLASS.text, background: "var(--hint-input-bg)", borderColor: GLASS.border }}
          aria-label={t("common.next")}
        >
          <ChevronRight size={17} />
        </button>
      </div>

      <div className="mb-3 grid grid-cols-4 gap-1 rounded-full border p-1" style={{ borderColor: GLASS.border, background: "color-mix(in srgb, var(--hint-surface-soft) 74%, transparent)" }}>
        {PERIODS.map((item) => {
          const selected = mode === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setMode(item.key)}
              className="h-8 rounded-full font-sans text-[10px] font-black uppercase tracking-[0.08em]"
              style={{
                color: selected ? "var(--hint-special-action-text)" : GLASS.muted,
                background: selected ? "var(--hint-special-action-bg)" : "transparent",
                boxShadow: selected ? "inset 0 1px 0 rgba(255,255,255,0.46)" : "none",
              }}
            >
              {t(item.labelKey)}
            </button>
          );
        })}
      </div>

      {(mode === "day" || mode === "week") && (
        <>
          <div className="mb-1 grid grid-cols-7 gap-1 px-1">
            {weekDayLabels().map((day) => (
              <span key={day} className="text-center font-sans text-[9px] font-black uppercase" style={{ color: GLASS.faint }}>
                {day}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((date) => {
              const inMonth = date.getMonth() === cursor.getMonth();
              const isSelected = sameLocalDay(date, selectedDate);
              const isSameWeek = getLocalDateString(startOfWeek(date)) === selectedWeekKey;
              const selected = mode === "week" ? isSameWeek : isSelected;
              return (
                <button
                  key={getLocalDateString(date)}
                  type="button"
                  onClick={() => onSelect(date, mode)}
                  className="h-9 rounded-[13px] font-serif text-[13px] tabular-nums transition active:scale-[0.96]"
                  style={{
                    color: selected ? "var(--hint-special-action-text)" : inMonth ? GLASS.text : GLASS.faint,
                    background: selected
                      ? "var(--hint-special-action-bg)"
                      : sameLocalDay(date, today)
                        ? "color-mix(in srgb, var(--hint-rose) 12%, var(--hint-surface-soft))"
                        : "transparent",
                    border: selected ? "1px solid color-mix(in srgb, var(--hint-rose) 30%, var(--hint-border))" : "1px solid transparent",
                  }}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </>
      )}

      {mode === "month" && (
        <div className="grid grid-cols-3 gap-1.5">
          {monthNames.map((date) => {
            const selected = selectedDate.getFullYear() === date.getFullYear() && selectedDate.getMonth() === date.getMonth();
            return (
              <button
                key={date.getMonth()}
                type="button"
                onClick={() => onSelect(date, "month")}
                className="min-h-11 rounded-[16px] px-2 font-serif text-[13px] transition active:scale-[0.96]"
                style={{
                  color: selected ? "var(--hint-special-action-text)" : GLASS.text,
                  background: selected ? "var(--hint-special-action-bg)" : "color-mix(in srgb, var(--hint-surface-soft) 64%, transparent)",
                  border: `1px solid ${selected ? "color-mix(in srgb, var(--hint-rose) 30%, var(--hint-border))" : GLASS.border}`,
                }}
              >
                {date.toLocaleDateString(undefined, { month: "short" })}
              </button>
            );
          })}
        </div>
      )}

      {mode === "year" && (
        <div className="grid grid-cols-3 gap-1.5">
          {years.map((year) => {
            const selected = selectedDate.getFullYear() === year;
            return (
              <button
                key={year}
                type="button"
                onClick={() => onSelect(new Date(year, 0, 1), "year")}
                className="min-h-11 rounded-[16px] px-2 font-serif text-[14px] tabular-nums transition active:scale-[0.96]"
                style={{
                  color: selected ? "var(--hint-special-action-text)" : GLASS.text,
                  background: selected ? "var(--hint-special-action-bg)" : "color-mix(in srgb, var(--hint-surface-soft) 64%, transparent)",
                  border: `1px solid ${selected ? "color-mix(in srgb, var(--hint-rose) 30%, var(--hint-border))" : GLASS.border}`,
                }}
              >
                {year}
              </button>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={onClose}
        className="hint-ghost-button mt-3 h-10 w-full rounded-full font-sans text-[11px] font-black uppercase tracking-[0.12em]"
      >
        Close
      </button>
    </div>
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
  const [calendarOpen, setCalendarOpen] = useState(false);
  const activePullDateRef = useRef("");
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
  const today = useMemo(() => startOfLocalDay(), []);
  const activeOffset = period === "day" ? selectedOffset : periodOffsets[period];
  const selectedDate = useMemo(() => getPeriodAnchor(period, today, activeOffset), [activeOffset, period, today]);
  const selectedDateKey = useMemo(() => getLocalDateString(selectedDate), [selectedDate]);
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

  useEffect(() => {
    if (period !== "day") return;
    const pullDate = selectedDateKey;
    activePullDateRef.current = pullDate;
    setPull(null);
    setNote("");
    setSavedNote("");
    drawMutation.mutate(
      { data: { anonId: getAnonId(), date: pullDate } },
      {
        onSuccess: (data) => {
          if (activePullDateRef.current !== pullDate) return;
          setPull(data);
          setNote(data.note ?? "");
          setSavedNote(data.note ?? "");
        },
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, selectedDateKey]);

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
    const pullDate = selectedDateKey;
    updateMutation.mutate(
      { data: { anonId: getAnonId(), date: pullDate, note } },
      {
        onSuccess: (data) => {
          if (activePullDateRef.current === pullDate) setSavedNote(data.note ?? "");
        },
      },
    );
  }

  function shiftActivePeriod(delta: number) {
    setCalendarOpen(false);

    if (period === "day") {
      setSelectedOffset((value) => value + delta);
      return;
    }

    setPeriodOffsets((next) => ({
      ...next,
      [period]: next[period] + delta,
    }));
  }

  function jumpToDate(date: Date, nextPeriod: PeriodMode) {
    const normalizedDate = startOfLocalDay(date);

    setPeriod(nextPeriod);
    if (nextPeriod === "day") {
      setSelectedOffset(offsetForPeriod("day", normalizedDate, today));
    } else {
      setPeriodOffsets((next) => ({
        ...next,
        [nextPeriod]: offsetForPeriod(nextPeriod, normalizedDate, today),
      }));
    }
    setCalendarOpen(false);
  }

  return (
    <AppScreen>
      <ScreenHeader
        eyebrow={t("dailyPull.eyebrow")}
        title={t("dailyPull.title")}
        subtitle={t("dailyPull.subtitle")}
        sigil={DailyPullSigil}
        showBack={false}
      />

      <section className="mb-3">
        <div className="relative mb-2 flex items-center justify-between gap-4">
          <SectionLabel>{t("dailyPull.calendarTitle")}</SectionLabel>
          <button
            type="button"
            data-testid="button-calendar-jump"
            onClick={() => setCalendarOpen((open) => !open)}
            aria-expanded={calendarOpen}
            aria-label="Open calendar jump"
            className="hint-tap-sparkle inline-flex h-9 items-center gap-1.5 rounded-full border px-3 font-serif text-[9px] uppercase tracking-[0.14em]"
            style={{
              background: calendarOpen
                ? "var(--hint-special-action-bg)"
                : "color-mix(in srgb, var(--hint-rose) 9%, transparent)",
              borderColor: calendarOpen
                ? "color-mix(in srgb, var(--hint-rose) 34%, var(--hint-border))"
                : "color-mix(in srgb, var(--hint-rose) 24%, var(--hint-border))",
              color: calendarOpen ? "var(--hint-special-action-text)" : "var(--hint-rose)",
            }}
          >
            <CalendarDays size={13} />
            Calendar
          </button>
          {calendarOpen ? (
            <CalendarJumpMenu
              selectedDate={selectedDate}
              currentPeriod={period}
              today={today}
              onSelect={jumpToDate}
              onClose={() => setCalendarOpen(false)}
            />
          ) : null}
        </div>
        <div className="mb-1.5 grid grid-cols-4 gap-1 rounded-[14px] border p-1" style={{ background: "var(--hint-surface-strong)", borderColor: "var(--hint-border)" }}>
          {PERIODS.map((item) => {
            const selected = period === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setPeriod(item.key);
                  setCalendarOpen(false);
                }}
                aria-pressed={selected}
                className="h-8 rounded-[10px] font-serif text-[11px] transition-[transform,opacity] duration-200 hover:-translate-y-0.5 active:translate-y-0"
                style={{
                  background: selected
                    ? "linear-gradient(145deg, rgba(255,239,199,0.92), rgba(244,175,203,0.72))"
                    : "transparent",
                  color: selected ? "#3a2435" : GLASS.muted,
                  border: selected ? "1px solid rgba(255,255,255,0.24)" : "1px solid transparent",
                }}
              >
                {t(item.labelKey)}
              </button>
            );
          })}
        </div>
        <div
          className="mb-1.5 flex items-center justify-between gap-3 rounded-[14px] border px-2 py-1"
          style={{ background: "var(--hint-surface-strong)", borderColor: "var(--hint-border)" }}
        >
          <button
            type="button"
            onClick={() => shiftActivePeriod(-1)}
            aria-label={`${t("common.previous")} ${t(`dailyPull.period.${period}`)}`}
            className="grid size-8 shrink-0 place-items-center rounded-[10px] border transition-[transform,opacity] duration-200 hover:-translate-x-0.5"
            style={{ background: "var(--hint-input-bg)", borderColor: "var(--hint-border)", color: GLASS.text }}
          >
            <ChevronLeft size={18} />
          </button>
          <div className="min-w-0 text-center">
            <p className="font-serif text-[17px] leading-tight sm:text-[21px]" style={{ color: GLASS.text }}>
              {activeLabel}
            </p>
            <p className="mt-0.5 truncate font-sans text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: GLASS.faint }}>
              {activeDetail}
            </p>
          </div>
          <button
            type="button"
            onClick={() => shiftActivePeriod(1)}
            aria-label={`${t("common.next")} ${t(`dailyPull.period.${period}`)}`}
            className="grid size-8 shrink-0 place-items-center rounded-[10px] border transition-[transform,opacity] duration-200 hover:translate-x-0.5"
            style={{ background: "var(--hint-input-bg)", borderColor: "var(--hint-border)", color: GLASS.text }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <div
          className="rounded-[15px] border p-1"
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
                    className="hint-tap-sparkle min-h-[50px] rounded-[10px] border px-1.5 py-1.5 text-left transition-[transform,opacity] duration-200 hover:-translate-y-0.5 active:translate-y-0"
                    style={{
                      background: selected
                        ? "var(--hint-special-action-bg)"
                        : "color-mix(in srgb, var(--hint-input-bg) 88%, transparent)",
                      borderColor: selected ? "var(--hint-special-action-border)" : "var(--hint-border)",
                      color: selected ? "var(--hint-special-action-text)" : "var(--hint-text)",
                    }}
                  >
                    <span className="block">
                      <span className="block truncate font-sans text-[8px] font-bold uppercase tracking-[0.08em]" style={{ color: selected ? "var(--hint-special-action-text)" : "var(--hint-faint)" }}>
                        {option.label}
                      </span>
                    </span>
                    <span className="mt-0.5 block font-serif text-[19px] leading-none tabular-nums" style={{ color: selected ? "var(--hint-special-action-text)" : "var(--hint-text)" }}>
                      {option.day}
                    </span>
                    <span className="mt-0.5 block truncate font-sans text-[7.5px] font-semibold" style={{ color: selected ? "color-mix(in srgb, var(--hint-special-action-text) 72%, transparent)" : "var(--hint-faint)" }}>
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
                  className="hint-tap-sparkle min-h-[50px] rounded-[10px] border px-1.5 py-1.5 text-left transition-[transform,opacity] duration-200 hover:-translate-y-0.5 active:translate-y-0"
                  style={{
                    background: option.selected
                      ? "var(--hint-special-action-bg)"
                      : "color-mix(in srgb, var(--hint-input-bg) 88%, transparent)",
                    borderColor: option.selected ? "var(--hint-special-action-border)" : "var(--hint-border)",
                    color: option.selected ? "var(--hint-special-action-text)" : "var(--hint-text)",
                  }}
                >
                  <span className="block font-serif text-[13px] leading-tight" style={{ color: option.selected ? "var(--hint-special-action-text)" : "var(--hint-text)" }}>
                    {option.label}
                  </span>
                  <span className="mt-0.5 block font-sans text-[7.5px] font-bold uppercase tracking-[0.08em]" style={{ color: option.selected ? "color-mix(in srgb, var(--hint-special-action-text) 72%, transparent)" : "var(--hint-faint)" }}>
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
          key={selectedDateKey}
          detailed
          dateOverride={selectedDate}
          className="mb-4"
        />
      )}

      {period === "day" && drawMutation.isError && (
        <GlassPanel className="mb-4">
          <p className="font-serif italic text-[14px] text-center" style={{ color: GLASS.muted }}>
            {t("dailyPull.error")}
          </p>
        </GlassPanel>
      )}

      {period === "day" && pull && (
        <section className="mb-4">
          <SectionLabel>{t("dailyPull.noteTitle")}</SectionLabel>
          <GlassPanel padded={false} className="p-3.5">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onBlur={saveNote}
              placeholder={t("dailyPull.notePlaceholder")}
              className="h-20 w-full resize-none rounded-[22px] bg-transparent px-3.5 py-3 font-serif text-[14px] focus:outline-none"
              style={{
                background: "color-mix(in srgb, var(--hint-input-bg) 86%, transparent)",
                border: `1px solid ${GLASS.border}`,
                color: GLASS.text,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
              }}
              data-testid="input-pull-note"
            />
            <div className="mt-2 flex h-4 items-center justify-between">
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
    </AppScreen>
  );
}
