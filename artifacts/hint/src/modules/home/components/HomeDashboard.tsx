import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowRight,
  Check,
  Gift,
  Library,
  MessageCircle,
  Moon,
  Sparkles,
  Star,
  type LucideIcon,
} from "lucide-react";
import { useGetUserStats } from "@workspace/api-client-react";
import { ACCENT, GOLD } from "../../hold/atmosphere";
import { getAnonId } from "../../../lib/identity";
import { getDailyReport } from "../data/dailyReport";
import {
  getRitualProgress,
  recordRitualCompletion,
  subscribeToRitualProgress,
  type RitualProgressSnapshot,
} from "../data/localRitualProgress";
import { ModuleGrid } from "./ModuleGrid";
import { FeedCards } from "./FeedCards";
import { CardSigil } from "../../hold/components/CardSigil";
import { useLanguage } from "../../../lib/i18n";
import { saveLocalDailyReading } from "../../readings/localDailyReadings";
import type { DailyReport, DailyScore } from "../types/home.types";

type PortalCardData = {
  title: string;
  label: string;
  body: string;
  href: string;
  icon: LucideIcon;
  color: string;
};

function scoreInsight(score: DailyScore) {
  const direction =
    score.score >= 84
      ? "Strong"
      : score.score >= 70
        ? "Steady"
        : score.score >= 56
          ? "Gentle"
          : "Careful";

  const focus: Record<DailyScore["key"], string> = {
    love: "Softness first.",
    resources: "Keep money simple.",
    work: "Finish one thing.",
    focus: "Quiet one task.",
    connection: "Let one message breathe.",
  };

  return `${direction}. ${focus[score.key]}`;
}

function ScoreSummaryGrid({ scores }: { scores: DailyScore[] }) {
  return (
    <div className="mt-6 grid gap-2 sm:grid-cols-2 md:grid-cols-5">
      {scores.map((score) => (
        <div
          key={score.key}
          className="rounded-[14px] border p-3"
          style={{
            background: "color-mix(in srgb, var(--hint-surface-soft) 76%, transparent)",
            borderColor: "var(--hint-border)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <p
              className="font-sans text-[11px] font-medium"
              style={{ color: "var(--hint-text)" }}
            >
              {score.label}
            </p>
            <p
              className="font-serif text-[20px] leading-none tabular-nums"
              style={{ color: score.tone, textShadow: "0 0 16px color-mix(in srgb, currentColor 28%, transparent)" }}
            >
              {score.score}
            </p>
          </div>
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full"
            style={{ background: "color-mix(in srgb, var(--hint-border) 55%, transparent)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${score.score}%`,
                background: `linear-gradient(90deg, ${score.tone}, color-mix(in srgb, ${score.tone} 28%, transparent))`,
              }}
            />
          </div>
          <p className="mt-2 font-sans text-[11px] leading-snug" style={{ color: "var(--hint-muted)" }}>
            {scoreInsight(score)}
          </p>
        </div>
      ))}
    </div>
  );
}

function OverallScoreBadge({
  score,
  label,
  compact = false,
}: {
  score: number;
  label: string;
  compact?: boolean;
}) {
  return (
    <div
      className={[
        "relative overflow-hidden rounded-full border",
        compact
          ? "flex min-w-[112px] items-center gap-2 px-3 py-2"
          : "mx-auto mt-5 flex w-full max-w-[196px] items-center justify-center gap-3 px-4 py-3",
      ].join(" ")}
      style={{
        background:
          "linear-gradient(145deg, color-mix(in srgb, var(--hint-surface) 88%, transparent), color-mix(in srgb, var(--hint-input-bg) 74%, transparent))",
        borderColor: "color-mix(in srgb, var(--hint-border-strong) 74%, transparent)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.18), 0 16px 34px rgba(20,18,28,0.12)",
      }}
    >
      <span
        aria-hidden
        className="absolute inset-y-2 left-2 w-8 rounded-full blur-xl"
        style={{ background: "rgba(122,226,214,0.32)" }}
      />
      <span
        className={compact ? "font-serif text-[31px] leading-none tabular-nums" : "font-serif text-[42px] leading-none tabular-nums"}
        style={{
          color: "var(--hint-score-ink)",
          textShadow: "var(--hint-score-shadow)",
        }}
      >
        {score}
      </span>
      <span className="flex flex-col text-left font-sans leading-tight">
        <span
          className="text-[9px] font-semibold uppercase tracking-[0.16em]"
          style={{ color: ACCENT.gold }}
        >
          Daily
        </span>
        <span
          className="text-[11px] font-medium"
          style={{ color: "var(--hint-muted)" }}
        >
          {label}
        </span>
      </span>
    </div>
  );
}

function ThemeAwareDailyCard({
  report,
  revealed,
}: {
  report: DailyReport;
  revealed: boolean;
}) {
  return (
    <div
      className="tarot-flip mx-auto aspect-[46/71] w-[220px] max-w-full sm:w-[260px]"
      style={{
        filter: "drop-shadow(0 34px 42px rgba(31, 25, 34, 0.22))",
      }}
    >
      <motion.div
        className="tarot-flip-inner"
        animate={{ rotateY: revealed ? 180 : 0 }}
        transition={{ duration: 0.9, ease: [0.45, 0, 0.2, 1] }}
      >
        <div
          className="tarot-flip-face overflow-hidden rounded-[20px] border"
          style={{
            background: "var(--hint-deck-card-bg)",
            borderColor: "color-mix(in srgb, var(--hint-gold, #cba866) 46%, var(--hint-border))",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16)",
          }}
        >
          <div
            aria-hidden
            className="absolute inset-[11px] rounded-[14px] border"
            style={{ borderColor: "color-mix(in srgb, var(--hint-gold, #cba866) 36%, transparent)" }}
          />
          <div
            aria-hidden
            className="absolute left-0 top-0 h-full w-[46%]"
            style={{
              background: "linear-gradient(110deg, rgba(255,255,255,0.18), rgba(255,255,255,0.04) 48%, transparent)",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.svg
              width="58%"
              height="58%"
              viewBox="-48 -58 96 116"
              fill="none"
              stroke="color-mix(in srgb, var(--hint-gold, #cba866) 78%, var(--hint-text))"
              strokeWidth="1.7"
              animate={!revealed ? { scale: [1, 1.035, 1], opacity: [0.72, 1, 0.72] } : { opacity: 0.72 }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <path d="M 0 -42 L 30 0 L 0 42 L -30 0 Z" />
              <path d="M 0 -22 L 16 0 L 0 22 L -16 0 Z" />
              <circle cx="0" cy="0" r="4" fill="currentColor" />
            </motion.svg>
          </div>
        </div>

        <div
          className="tarot-flip-face tarot-flip-back overflow-hidden rounded-[20px] border"
          style={{
            background: "var(--hint-daily-card-face-bg)",
            borderColor: "color-mix(in srgb, var(--hint-gold, #cba866) 58%, var(--hint-border))",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14), 0 0 34px rgba(203,168,102,0.12)",
          }}
        >
          <div
            aria-hidden
            className="absolute inset-[10px] rounded-[14px] border"
            style={{ borderColor: "color-mix(in srgb, var(--hint-gold, #cba866) 34%, transparent)" }}
          />
          <CardSigil cardId={report.card.cardId} />
        </div>
      </motion.div>
    </div>
  );
}

function DailyHintSection({
  report,
  todayCompleted,
  onReveal,
}: {
  report: DailyReport;
  todayCompleted: boolean;
  onReveal: () => void;
}) {
  const [revealed, setRevealed] = useState(todayCompleted);
  const keywords = [report.scores[0]?.label, report.scores[2]?.label, "Clarity"].filter(Boolean);

  useEffect(() => {
    setRevealed(todayCompleted);
  }, [report.date, todayCompleted]);

  function revealDailyCard() {
    if (!revealed) {
      setRevealed(true);
    }
    if (!todayCompleted) {
      onReveal();
    }
  }

  return (
    <motion.section
      id="your-card"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.16, duration: 0.76, ease: "easeOut" }}
      className="relative scroll-mt-28 overflow-hidden rounded-[28px] border px-5 py-8 sm:px-10 sm:py-12 lg:px-14"
      style={{
        background:
          "linear-gradient(105deg, color-mix(in srgb, var(--hint-surface) 86%, transparent), color-mix(in srgb, var(--hint-input-bg) 78%, transparent))",
        borderColor: "color-mix(in srgb, var(--hint-border) 82%, white)",
        boxShadow: "var(--hint-elevated-shadow)",
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(560px 380px at 24% 54%, rgba(122,226,214,0.18), transparent 68%), radial-gradient(480px 320px at 8% 0%, rgba(239,166,116,0.13), transparent 68%)",
        }}
      />

      <div className="relative grid items-center gap-8 lg:grid-cols-[0.78fr_1fr]">
        <button
          type="button"
          onClick={revealDailyCard}
          className="group rounded-[22px] outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--hint-aqua)_80%,white)]"
          aria-label={revealed ? `Daily card: ${report.card.cardName}` : "Reveal daily card"}
        >
          <ThemeAwareDailyCard report={report} revealed={revealed} />
        </button>

        <div className="min-w-0 text-center lg:text-left">
          <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.34em]" style={{ color: "var(--hint-faint)" }}>
            The ritual · one card a day
          </p>

          {!revealed ? (
            <motion.div
              key="daily-unrevealed"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
            >
              <p className="mt-4 max-w-xl font-serif text-[25px] italic leading-snug sm:text-[31px]" style={{ color: "var(--hint-muted)" }}>
                A single card is waiting for you. Take a breath, then turn it over.
              </p>
              <button
                type="button"
                onClick={revealDailyCard}
                className="mt-5 inline-flex items-center gap-3 rounded-full px-1 font-sans text-[13px] font-semibold uppercase tracking-[0.26em] transition hover:translate-x-1"
                style={{ color: "var(--hint-faint)" }}
              >
                <span className="size-2.5 rounded-full" style={{ background: ACCENT.gold, boxShadow: "0 0 18px rgba(228,198,138,0.34)" }} />
                Tap the card to draw
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="daily-revealed"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.66, ease: "easeOut" }}
            >
              <h2 className="mt-4 font-serif text-[48px] leading-none sm:text-[70px]" style={{ color: "var(--hint-text)", textShadow: "var(--hint-ritual-halo-soft)" }}>
                {report.card.cardName}
              </h2>
              <p className="mt-5 max-w-2xl font-serif text-[24px] italic leading-relaxed sm:text-[31px]" style={{ color: "var(--hint-ritual-body)" }}>
                "{report.card.whisper}"
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-2 lg:justify-start">
                {keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="rounded-full border px-4 py-2 font-sans text-[13px] font-medium"
                style={{
                  borderColor: "var(--hint-border-strong)",
                  background: "color-mix(in srgb, var(--hint-surface) 82%, transparent)",
                  color: "var(--hint-ritual-body)",
                }}
                  >
                    {keyword}
                  </span>
                ))}
              </div>
              <Link
                href="/daily-pull"
                className="mt-8 inline-flex h-12 items-center justify-center gap-3 rounded-full px-6 font-sans text-[14px] font-semibold"
                style={{
                  color: "#231d2a",
                  background: "linear-gradient(135deg, rgba(228,164,82,1), rgba(242,148,111,0.98))",
                  boxShadow: "0 20px 34px rgba(219, 142, 85, 0.24)",
                }}
              >
                Open full reading
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </motion.section>
  );
}

function RitualStreakPanel({ ritual }: { ritual: RitualProgressSnapshot }) {
  const progress = ritual.progressPercent;
  const rewardText =
    ritual.daysUntilCredit === 0
      ? "Deeper reading unlocked"
      : `${ritual.daysUntilCredit} ${ritual.daysUntilCredit === 1 ? "day" : "days"} to a deeper reading`;
  const ritualStatus = ritual.todayCompleted
    ? "today's ritual is complete"
    : "draw today's card to keep the thread";

  return (
    <motion.section
      id="rewards"
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.72, ease: "easeOut" }}
      className="relative scroll-mt-28 overflow-hidden rounded-[28px] border px-5 py-8 sm:px-10 sm:py-10"
      style={{
        background:
          "linear-gradient(115deg, color-mix(in srgb, var(--hint-surface) 86%, transparent), color-mix(in srgb, var(--hint-input-bg) 70%, transparent))",
        borderColor: "var(--hint-border)",
        boxShadow: "var(--hint-elevated-shadow)",
      }}
    >
      <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 className="font-serif text-[42px] leading-none sm:text-[56px]" style={{ color: "var(--hint-text)" }}>
            Your ritual
          </h2>
          <p className="font-serif text-[18px] italic sm:text-[22px]" style={{ color: "var(--hint-muted)" }}>
            a streak you keep gently, not anxiously
          </p>
        </div>
        <Link
          href="/me"
          className="font-sans text-[12px] font-semibold uppercase tracking-[0.22em]"
          style={{ color: "var(--hint-faint)" }}
        >
          All rewards →
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.9fr] lg:items-center">
        <div>
          <div className="mb-8 flex items-center gap-5">
            <motion.p
              className="font-serif text-[74px] leading-none"
              style={{ color: "#eaa15f" }}
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              {ritual.currentStreak}
            </motion.p>
            <div>
              <p className="font-serif text-[23px] leading-tight" style={{ color: "var(--hint-text)" }}>
                day streak
              </p>
              <p className="font-sans text-[16px]" style={{ color: "var(--hint-muted)" }}>
                {ritualStatus}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-7 items-start gap-2">
            {ritual.week.map((day, index) => {
              const done = day.completed;
              return (
                <div key={day.date} className="text-center">
                  <motion.div
                    className="mx-auto grid size-11 place-items-center rounded-full"
                    style={{
                      background: done
                        ? "linear-gradient(135deg, #e2a245, #f09974)"
                        : "color-mix(in srgb, var(--hint-surface-soft) 86%, transparent)",
                      border: done
                        ? "0"
                        : day.today
                          ? "2px solid rgba(218, 163, 71, 0.92)"
                          : "1px solid color-mix(in srgb, var(--hint-border-strong) 72%, transparent)",
                      color: done ? "#231d2a" : ACCENT.gold,
                      boxShadow: done
                        ? "0 14px 28px rgba(224, 146, 80, 0.24)"
                        : day.today
                          ? "0 0 0 7px rgba(218, 163, 71, 0.1)"
                          : "none",
                    }}
                    initial={{ scale: 0.7, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05, duration: 0.38, ease: "easeOut" }}
                  >
                    {done ? <Check size={16} /> : <Sparkles size={16} />}
                  </motion.div>
                  <p className="mt-3 font-sans text-[12px] font-semibold" style={{ color: "var(--hint-muted)" }}>
                    {day.label}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between gap-4">
              <p className="font-sans text-[15px]" style={{ color: "var(--hint-text)" }}>
                {rewardText}
              </p>
              <p className="font-sans text-[14px]" style={{ color: "var(--hint-faint)" }}>
                {progress}%
              </p>
            </div>
            <div className="h-2 overflow-hidden rounded-full" style={{ background: "color-mix(in srgb, var(--hint-border) 52%, transparent)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #d7a246, #f19573, #a997ea)" }}
                initial={{ width: 0 }}
                whileInView={{ width: `${progress}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.1, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <RewardStat icon={Star} value={`${ritual.auraStars}`} label="Aura stars" />
            <RewardStat icon={Gift} value={`${ritual.readingCredits}`} label="Reading credits" />
          </div>
          <div
            className="flex flex-col gap-4 rounded-[22px] border p-5 sm:flex-row sm:items-center sm:justify-between"
            style={{
              background: "var(--hint-me-plus-surface)",
              borderColor: "var(--hint-me-plus-border)",
              boxShadow: "var(--hint-me-plus-shadow)",
            }}
          >
            <div className="flex items-center gap-4">
              <div className="grid size-14 place-items-center rounded-[16px] border" style={{ borderColor: "var(--hint-border)", color: ACCENT.gold }}>
                <Sparkles size={20} />
              </div>
              <div>
                <p className="font-serif text-[25px]" style={{ color: "var(--hint-text)" }}>
                  Hint Plus
                </p>
                <p className="max-w-sm font-sans text-[14px] leading-relaxed" style={{ color: "var(--hint-muted)" }}>
                  Deeper readings, mood history, and the full daily report.
                </p>
              </div>
            </div>
            <Link
              href="/me"
              className="inline-flex h-12 shrink-0 items-center justify-center rounded-full px-6 font-sans text-[14px] font-semibold"
              style={{ color: "#fffaf2", background: "#292331" }}
            >
              Try free
            </Link>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function RewardStat({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
}) {
  return (
    <div
      className="flex items-center gap-4 rounded-[18px] border p-5"
      style={{
        background: "color-mix(in srgb, var(--hint-surface-soft) 82%, transparent)",
        borderColor: "var(--hint-border)",
      }}
    >
      <div className="grid size-12 place-items-center rounded-[14px]" style={{ background: "rgba(228, 198, 138, 0.16)", color: ACCENT.gold }}>
        <Icon size={18} />
      </div>
      <div>
        <p className="font-serif text-[30px] leading-none" style={{ color: "var(--hint-text)" }}>
          {value}
        </p>
        <p className="font-sans text-[14px]" style={{ color: "var(--hint-muted)" }}>
          {label}
        </p>
      </div>
    </div>
  );
}

function DailyHintHero({ report }: { report: DailyReport }) {
  const { t } = useLanguage();

  return (
    <div
      className="relative overflow-hidden rounded-[22px] border"
      style={{
        background:
          "linear-gradient(135deg, color-mix(in srgb, var(--hint-surface-strong) 82%, transparent), color-mix(in srgb, var(--hint-input-bg) 72%, transparent))",
        borderColor: "var(--hint-border)",
        boxShadow: "var(--hint-elevated-shadow)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(620px 360px at 10% 6%, rgba(122,226,214,0.18), transparent 68%), radial-gradient(520px 360px at 92% 10%, rgba(243,212,144,0.18), transparent 66%), linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.07) 48%, transparent 72%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-x-8 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${GOLD.edge}, transparent)` }}
      />

      <div className="relative grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_260px] lg:items-center">
        <div className="min-w-0">
          <div className="mb-4 flex items-center gap-3">
            <p
              className="font-sans text-[11px] font-medium uppercase tracking-[0.14em]"
              style={{ color: ACCENT.aqua }}
            >
              {t("home.dailyNow")}
            </p>
            <span className="h-px flex-1" style={{ background: "var(--hint-border)" }} />
          </div>
          <div className="flex items-start justify-between gap-4">
            <h2
              className="max-w-xl font-serif text-[32px] leading-[1.02] sm:text-[46px] lg:text-[52px]"
              style={{ color: "var(--hint-text)" }}
            >
              {report.title}
            </h2>
            <div className="shrink-0 lg:hidden">
              <OverallScoreBadge score={report.overallScore} label={t("daily.score")} compact />
            </div>
          </div>
          <p className="mt-4 max-w-2xl font-sans text-[14px] leading-relaxed sm:text-[15px]" style={{ color: "var(--hint-muted)" }}>
            {report.summary}
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <PrimaryLink href="/tarot">{t("home.startReading")}</PrimaryLink>
            <SecondaryLink href="/ask">
              <MessageCircle size={15} />
              {t("home.talkFirst")}
            </SecondaryLink>
          </div>

          <ScoreSummaryGrid scores={report.scores} />

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div
              className="rounded-[14px] border p-4 sm:col-span-2"
              style={{
                background: "color-mix(in srgb, var(--hint-input-bg) 78%, transparent)",
                borderColor: "var(--hint-border)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14)",
              }}
            >
              <p className="font-sans text-[11px] font-medium uppercase tracking-[0.14em]" style={{ color: ACCENT.gold }}>
                {report.card.cardName}
              </p>
              <p className="mt-2 font-sans text-[13px] leading-relaxed" style={{ color: "var(--hint-muted)" }}>
                {report.card.whisper}
              </p>
            </div>
            <div
              className="rounded-[14px] border p-4"
              style={{
                background: "color-mix(in srgb, var(--hint-surface-soft) 82%, transparent)",
                borderColor: "var(--hint-border)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14)",
              }}
            >
              <p className="font-sans text-[11px] font-medium uppercase tracking-[0.14em]" style={{ color: ACCENT.aqua }}>
                {t("home.tonightAction")}
              </p>
              <p className="mt-2 font-sans text-[13px] leading-snug" style={{ color: "var(--hint-text)" }}>
                {report.suggestion}
              </p>
            </div>
          </div>

          <p className="mt-5 max-w-2xl font-sans text-[12.5px] leading-relaxed" style={{ color: "var(--hint-muted)" }}>
            <span className="font-medium" style={{ color: "var(--hint-text)" }}>
              {t("home.returnTitle")}.
            </span>{" "}
            {t("home.returnShort")}
          </p>
        </div>

        <div className="relative mx-auto hidden w-full max-w-[260px] lg:block">
          <div
            aria-hidden
            className="absolute left-1/2 top-1/2 h-[250px] w-[250px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(122,226,214,0.20), rgba(243,212,144,0.12) 48%, transparent 72%)" }}
          />
          <Link
            href="/daily-pull"
            className="group relative mx-auto block aspect-[46/71] w-[148px] overflow-hidden rounded-[14px] border sm:w-[172px] lg:w-[188px]"
            style={{
              background: "var(--hint-deck-card-bg)",
              borderColor: "rgba(206,178,110,0.38)",
              boxShadow: "0 28px 58px rgba(0,0,0,0.34), 0 0 42px rgba(206,178,110,0.14)",
            }}
          >
            <div className="absolute inset-[8px] rounded-[8px] border border-[rgba(206,178,110,0.34)]" />
            <CardSigil cardId={report.card.cardId} />
            <div
              className="absolute inset-x-0 bottom-0 px-4 py-4 font-sans text-[12px] font-medium"
              style={{
                color: "#f9f6f0",
                background: "linear-gradient(to top, rgba(0,0,0,0.68), transparent)",
              }}
            >
              {t("home.openCard")}
            </div>
          </Link>
          <OverallScoreBadge score={report.overallScore} label={t("daily.score")} />
        </div>
      </div>
    </div>
  );
}

function PrimaryLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-[999px] px-5 font-sans text-[14px] font-medium"
      style={{
        color: "#08070B",
        background: "linear-gradient(145deg, rgba(243,212,144,0.98), rgba(122,226,214,0.92))",
        boxShadow: "0 14px 30px rgba(0,0,0,0.32), 0 0 24px rgba(228,198,138,0.20)",
      }}
    >
      {children}
      <ArrowRight size={14} />
    </Link>
  );
}

function SecondaryLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-[999px] border px-5 font-sans text-[14px] font-medium"
      style={{
        color: "var(--hint-text)",
        borderColor: "var(--hint-border-strong)",
        background: "var(--hint-surface-soft)",
      }}
    >
      {children}
    </Link>
  );
}

function PortalCard({
  card,
  index,
}: {
  card: PortalCardData;
  index: number;
}) {
  const Icon = card.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.36 + index * 0.08, duration: 0.58, ease: "easeOut" }}
    >
      <Link href={card.href} className="block h-full">
        <div
          className="group relative flex h-full min-h-[188px] flex-col justify-between overflow-hidden rounded-[14px] border p-4"
          style={{
            background: "var(--hint-card-surface)",
            borderColor: "var(--hint-border)",
            boxShadow: "var(--hint-elevated-shadow)",
          }}
        >
          <div
            className="absolute inset-[9px] rounded-[9px] border opacity-60"
            style={{ borderColor: card.color }}
          />
          <div className="relative flex items-center justify-between">
            <span
              className="font-sans text-[10px] font-medium uppercase tracking-[0.12em]"
              style={{ color: card.color }}
            >
              {card.label}
            </span>
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{ color: card.color, background: "var(--hint-surface-soft)" }}
            >
              <Icon size={18} strokeWidth={1.7} />
            </span>
          </div>
          <div className="relative">
            <h3 className="font-serif text-[22px] leading-tight" style={{ color: "var(--hint-text)" }}>
              {card.title}
            </h3>
            <p className="mt-2 font-sans text-[12.5px] leading-relaxed" style={{ color: "var(--hint-muted)" }}>
              {card.body}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function PatternPanel() {
  const { t } = useLanguage();
  const { data } = useGetUserStats({ anonId: getAnonId() });

  return (
    <div
      className="grid gap-3 rounded-[14px] border p-4 sm:grid-cols-[1.1fr_0.9fr]"
      style={{
        background: "var(--hint-surface)",
        borderColor: "var(--hint-border)",
        boxShadow: "0 16px 44px rgba(0,0,0,0.12)",
      }}
    >
      <div>
        <div className="flex items-center gap-2">
          <Library size={16} style={{ color: ACCENT.gold }} />
          <h3 className="font-serif text-[18px]" style={{ color: "var(--hint-text)" }}>
            {t("home.pattern.title")}
          </h3>
        </div>
        <p className="mt-2 max-w-md font-sans text-[12.5px] leading-relaxed" style={{ color: "var(--hint-muted)" }}>
          {t("home.pattern.body")}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          [t("home.stat.readings"), data?.readings ?? 0],
          [t("home.stat.pages"), data?.journals ?? 0],
          [t("home.stat.pulls"), data?.pulls ?? 0],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-[10px] border px-3 py-3 text-center"
            style={{
              background: "var(--hint-stat-bg)",
              borderColor: "var(--hint-border)",
            }}
          >
            <p className="font-serif text-[22px] tabular-nums" style={{ color: "var(--hint-text)" }}>
              {value}
            </p>
            <p className="font-sans text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: "var(--hint-faint)" }}>
              {label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4 px-1">
      <h2 className="font-serif text-[22px] leading-none" style={{ color: "var(--hint-text)" }}>
        {title}
      </h2>
      {action && (
        <Link
          href={action.href}
          className="font-sans text-[11px] font-medium uppercase tracking-[0.1em]"
          style={{ color: "var(--hint-muted)" }}
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function HomeDashboard() {
  const { language, t } = useLanguage();
  const [ritual, setRitual] = useState(() => getRitualProgress());
  const report = useMemo(
    () => getDailyReport({ anonId: getAnonId(), language }),
    [language],
  );

  useEffect(() => {
    return subscribeToRitualProgress(() => setRitual(getRitualProgress()));
  }, []);

  function completeDailyRitual() {
    saveLocalDailyReading(report.card);
    setRitual(recordRitualCompletion(report.date));
  }

  const startCards = [
    {
      title: t("home.card.tarot.title"),
      label: t("home.card.tarot.label"),
      body: t("home.card.tarot.body"),
      href: "/tarot",
      icon: Sparkles,
      color: ACCENT.gold,
    },
    {
      title: t("home.card.ask.title"),
      label: t("home.card.ask.label"),
      body: t("home.card.ask.body"),
      href: "/ask",
      icon: MessageCircle,
      color: ACCENT.aqua,
    },
    {
      title: t("home.card.daily.title"),
      label: t("home.card.daily.label"),
      body: t("home.card.daily.body"),
      href: "/daily-pull",
      icon: Moon,
      color: ACCENT.lavender,
    },
  ];
  return (
    <div className="h-full w-full overflow-y-auto overscroll-none pb-16">
      <div className="mx-auto w-full max-w-lg px-4 pt-28 sm:max-w-3xl sm:px-6 md:pt-28 lg:max-w-6xl">
        <motion.section
          id="today"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.75, ease: "easeOut" }}
          className="relative mb-8 scroll-mt-28 overflow-visible pt-3"
        >
          <div className="py-5 lg:py-8">
            <div className="relative z-10">
              <p className="font-sans text-[11px] font-medium uppercase tracking-[0.12em]" style={{ color: ACCENT.gold }}>
                {t("home.eyebrow")}
              </p>
              <h1
                className="mt-4 max-w-4xl font-serif text-[42px] leading-[0.95] sm:text-[58px] lg:text-[72px]"
                style={{ color: "var(--hint-text)", textShadow: "0 0 32px rgba(228,198,138,0.12)" }}
              >
                {t("home.title")}
              </h1>
              <p className="mt-4 max-w-2xl font-sans text-[14px] leading-relaxed sm:text-[16px]" style={{ color: "var(--hint-muted)" }}>
                {t("home.subtitle")}
              </p>
            </div>
          </div>
        </motion.section>

        <div className="mb-10">
          <DailyHintSection
            report={report}
            todayCompleted={ritual.todayCompleted}
            onReveal={completeDailyRitual}
          />
        </div>

        <section id="signals" className="mb-10 scroll-mt-28">
          <SectionHeader title="Today's signals" />
          <ScoreSummaryGrid scores={report.scores} />
        </section>

        <div className="mb-10">
          <RitualStreakPanel ritual={ritual} />
        </div>

        <section className="mb-7">
          <div className="grid gap-3 md:grid-cols-3">
            {startCards.map((card, index) => (
              <PortalCard key={card.title} card={card} index={index} />
            ))}
          </div>
        </section>

        <section className="mb-8">
          <SectionHeader title={t("home.chooseRoom")} action={{ href: "/rooms", label: t("home.allRooms") }} />
          <ModuleGrid delay={0.05} />
        </section>

        <section className="mb-10">
          <SectionHeader title={t("home.notes")} />
          <FeedCards />
        </section>
      </div>
    </div>
  );
}
