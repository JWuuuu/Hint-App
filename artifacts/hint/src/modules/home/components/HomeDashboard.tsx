import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bookmark,
  BriefcaseBusiness,
  Check,
  Coins,
  Gift,
  Heart,
  Library,
  MessageCircle,
  Moon,
  Sparkles,
  Star,
  UsersRound,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { useGetUserStats } from "@workspace/api-client-react";
import { ACCENT, GOLD } from "../../hold/atmosphere";
import { getAnonId, getLocalDateString } from "../../../lib/identity";
import {
  getOrCreateDailyReceipt,
  openDailyReceipt,
  parseServerDailyKey,
  type DailyReceipt,
} from "../../../lib/dailyReceipts";
import { getDailyReport } from "../data/dailyReport";
import { getDailyPullById } from "../data/dailyPulls";
import {
  getRitualProgress,
  subscribeToRitualProgress,
  toggleRitualTask,
  type RitualProgressSnapshot,
} from "../data/localRitualProgress";
import { FeedCards } from "./FeedCards";
import { CardSigil } from "../../hold/components/CardSigil";
import { getDefaultTarotCardBackForStyle, getTarotCardBackImage } from "../../tarot/logic/cardBacks";
import { getTarotCardImage } from "../../tarot/logic/cardImageMap";
import { useLanguage } from "../../../lib/i18n";
import {
  generateSkyCardReading,
  type SkyCardReading,
} from "../../../lib/readings/generateSkyCardReading";
import type { SkySignal } from "../../../lib/tarot/skyGuidedTarot";
import { THEME_LABELS } from "../../../lib/tarot/tarotThemeMap";
import {
  listLocalDailyReadings,
  listLocalDailyReadingMemory,
  saveLocalDailyReading,
} from "../../readings/localDailyReadings";
import { useProfile } from "../../../lib/useProfile";
import { readBirthProfile } from "../../../lib/astro/userBirthProfile";
import { triggerFeedback } from "../../../lib/feedback";
import type { DailyReport, DailyScore } from "../types/home.types";
import { LuckyIllustration } from "./LuckyIllustration";
import { SkyEvidence } from "../../../components/tarot/SkyEvidence";
import { SafeImage } from "../../../shared/ui/SafeImage";

const SKY_DECK_CARD_BACK_IMAGE = getTarotCardBackImage(getDefaultTarotCardBackForStyle("nocturne"));
const DAILY_SIGNAL_INTRO_COMPLETIONS_KEY = "hint_home_daily_signal_intro_completions_v1";
const REFERENCE_REVEAL_DUST = [
  { left: "6%", top: "24%", size: 3, delay: 0.1, glow: 0.62 },
  { left: "14%", top: "66%", size: 2, delay: 0.8, glow: 0.52 },
  { left: "23%", top: "78%", size: 2.5, delay: 1.3, glow: 0.58 },
  { left: "88%", top: "20%", size: 2.4, delay: 0.35, glow: 0.64 },
  { left: "96%", top: "35%", size: 2, delay: 1.1, glow: 0.48 },
  { left: "91%", top: "62%", size: 3.2, delay: 0.65, glow: 0.72 },
  { left: "83%", top: "76%", size: 2, delay: 1.55, glow: 0.50 },
  { left: "3%", top: "82%", size: 2.2, delay: 1.9, glow: 0.54 },
] as const;

type DailySignalIntroCompletions = Record<string, string>;

function dailySignalIntroCompletionKey(anonId: string, dailyKey: string) {
  return `${anonId}:${dailyKey}`;
}

function readDailySignalIntroCompletions(): DailySignalIntroCompletions {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(DAILY_SIGNAL_INTRO_COMPLETIONS_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as DailySignalIntroCompletions;
  } catch {
    return {};
  }
}

function hasCompletedDailySignalIntro(anonId: string, dailyKey: string) {
  return Boolean(readDailySignalIntroCompletions()[dailySignalIntroCompletionKey(anonId, dailyKey)]);
}

function markDailySignalIntroComplete(anonId: string, dailyKey: string) {
  if (typeof window === "undefined") return;
  try {
    const completions = {
      ...readDailySignalIntroCompletions(),
      [dailySignalIntroCompletionKey(anonId, dailyKey)]: new Date().toISOString(),
    };
    window.localStorage.setItem(DAILY_SIGNAL_INTRO_COMPLETIONS_KEY, JSON.stringify(completions));
  } catch {
    // The daily receipt still prevents a second reveal; this only avoids re-showing the intro.
  }
}

type RoomShortcutData = {
  title: string;
  body: string;
  href: string;
  icon: LucideIcon;
  color: string;
  tint: string;
};

const REFERENCE_HOME_ASSETS = {
  moonScene: "/reference-home/moon-scene.png",
} as const;

const REFERENCE_CARD_BACKGROUND =
  "linear-gradient(180deg, rgba(255,253,249,0.88), rgba(249,244,238,0.82))";
const REFERENCE_CARD_BORDER = "rgba(190, 162, 143, 0.085)";
const REFERENCE_CARD_SHADOW =
  "0 15px 36px rgba(101, 80, 67, 0.022), inset 0 1px 0 rgba(255,255,255,0.58), inset 0 -12px 28px rgba(180,142,122,0.006)";
const REFERENCE_TYPE = {
  ink: "#34313a",
  inkSoft: "#46414b",
  body: "#5d5660",
  muted: "#746d75",
  label: "#716b72",
  faint: "#8d858d",
  purple: "#a97fac",
  purpleDeep: "#926a96",
  score: "#b98eae",
} as const;

const LOCALE_BY_LANGUAGE: Record<string, string> = {
  en: "en-US",
  zh: "zh-CN",
  es: "es-ES",
  ja: "ja-JP",
  ko: "ko-KR",
};

function formatAppDate(date: string, language: string) {
  return new Intl.DateTimeFormat(LOCALE_BY_LANGUAGE[language] ?? "en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function formatReferenceDate(date: string, language: string) {
  return formatAppDate(date, language).toUpperCase();
}

function compactCardKeyword(keyword?: string) {
  return keyword?.split(/[·,|/]/)[0]?.trim();
}

function referenceThemeTitle(report: DailyReport) {
  return compactCardKeyword(report.card.keyword) || report.card.cardName || report.title;
}

function referenceThemeLine(report: DailyReport) {
  return report.card.do || report.card.themeNote || report.summary;
}

function profileInitial(name?: string | null) {
  const trimmed = name?.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "H";
}

function TodayShineLayer({ wide = false }: { wide?: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.span
        className={[
          "absolute -top-20 h-[34rem] -skew-x-12 rounded-full blur-2xl",
          wide ? "w-[44rem]" : "w-48",
        ].join(" ")}
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,192,210,0.10) 24%, rgba(255,244,214,0.18) 50%, rgba(134,214,199,0.10) 74%, transparent 100%)",
          mixBlendMode: "screen",
        }}
        animate={{ x: wide ? ["-50vw", "115vw"] : ["-35%", "720%"], opacity: [0, 0.48, 0] }}
        transition={{ duration: wide ? 8.6 : 5.8, repeat: Infinity, repeatDelay: wide ? 2.8 : 1.8, ease: "easeInOut" }}
      />
      <motion.span
        className="absolute inset-x-[-12%] top-0 h-40"
        style={{
          background:
            "radial-gradient(circle at 18% 42%, rgba(255,192,210,0.16), transparent 28%), radial-gradient(circle at 62% 34%, rgba(134,214,199,0.14), transparent 24%), radial-gradient(circle at 82% 56%, rgba(255,255,255,0.13), transparent 18%)",
          filter: "blur(10px)",
        }}
        animate={{ x: ["-3%", "3%", "-3%"], opacity: [0.28, 0.52, 0.28] }}
        transition={{ duration: 10.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.span
        className="absolute left-[52%] top-[12%] size-2 rounded-full"
        style={{ background: "rgba(255,251,236,0.88)", boxShadow: "0 0 26px rgba(255,251,236,0.82)" }}
        animate={{ scale: [0.72, 1.45, 0.72], opacity: [0.28, 1, 0.28] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

function scoreInsight(score: DailyScore) {
  const direction =
    score.score >= 84
      ? "Strong"
      : score.score >= 70
        ? "Steady"
        : score.score >= 56
          ? "Gentle"
          : "Careful";

  const scoreHint: Record<DailyScore["key"], string> = {
    love: "Softness first.",
    wealth: "Keep money simple.",
    career: "Finish one thing.",
    study: "Quiet focus.",
    people: "Say it gently.",
  };

  return `${direction}. ${scoreHint[score.key]}`;
}

function ScoreSummaryGrid({ scores }: { scores: DailyScore[] }) {
  return (
    <div className="mt-6 grid gap-2 sm:grid-cols-3">
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

function CompactSignalPanel({
  overallScore,
  scores,
  revealed,
  withTopMargin = true,
  birthPersonalized = false,
}: {
  overallScore: number;
  scores: DailyScore[];
  revealed: boolean;
  withTopMargin?: boolean;
  birthPersonalized?: boolean;
}) {
  const { t } = useLanguage();

  return (
    <motion.div
      id="signals"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className={[
        "relative scroll-mt-28 overflow-hidden rounded-[18px] border p-2.5 text-left lg:scroll-mt-28 lg:rounded-[20px] lg:p-4",
        withTopMargin ? "mt-5" : "",
      ].join(" ")}
      style={{
        background:
          "linear-gradient(145deg, color-mix(in srgb, var(--hint-surface) 88%, transparent), color-mix(in srgb, var(--hint-input-bg) 82%, transparent))",
        borderColor: "color-mix(in srgb, var(--hint-border-strong) 82%, transparent)",
        boxShadow: "0 18px 44px rgba(31,25,34,0.12), inset 0 1px 0 rgba(255,255,255,0.18)",
      }}
    >
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 w-24 -skew-x-12"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)",
        }}
        animate={{ x: ["-40%", "520%"], opacity: [0, 0.75, 0] }}
        transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 lg:mb-3 lg:gap-3">
        <div>
          <p
            className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] lg:text-[11px] lg:tracking-[0.2em]"
            style={{ color: ACCENT.gold }}
          >
            Today's signals
          </p>
          {!revealed && (
            <p className="mt-1 font-sans text-[11px] leading-snug lg:text-[12px]" style={{ color: "var(--hint-muted)" }}>
              Draw first. Scores are calculated from the card you reveal.
            </p>
          )}
        </div>
        <motion.div
          aria-hidden
          className="grid size-7 place-items-center rounded-full border lg:size-9"
          style={{
            color: ACCENT.gold,
            borderColor: "color-mix(in srgb, var(--hint-gold, #cba866) 34%, var(--hint-border))",
            background: "color-mix(in srgb, var(--hint-surface-soft) 78%, transparent)",
          }}
          animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.06, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="size-3.5 lg:size-[17px]" />
        </motion.div>
      </div>

      <div className="grid gap-2">
        {!revealed ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.48, ease: "easeOut" }}
            className="relative min-h-[126px] overflow-hidden rounded-[14px] border px-3 py-3 lg:min-h-[174px] lg:rounded-[16px] lg:px-4 lg:py-4"
            style={{
              background:
                "radial-gradient(circle at 50% 10%, rgba(122,226,214,0.18), transparent 58%), linear-gradient(145deg, color-mix(in srgb, var(--hint-surface) 90%, transparent), color-mix(in srgb, var(--hint-input-bg) 78%, transparent))",
              borderColor: "color-mix(in srgb, var(--hint-gold, #cba866) 38%, var(--hint-border))",
              boxShadow: "0 16px 34px rgba(31,25,34,0.14), inset 0 1px 0 rgba(255,255,255,0.18)",
            }}
          >
            <motion.span
              aria-hidden
              className="absolute left-3 top-3 grid size-9 place-items-center rounded-full border lg:left-5 lg:top-5 lg:size-11"
              style={{
                color: ACCENT.gold,
                borderColor: "color-mix(in srgb, var(--hint-gold, #cba866) 34%, var(--hint-border))",
                background: "color-mix(in srgb, var(--hint-surface-soft) 78%, transparent)",
              }}
              animate={{ scale: [1, 1.08, 1], opacity: [0.72, 1, 0.72] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="size-4 lg:size-[18px]" />
            </motion.span>
            <div className="relative ml-12 lg:ml-16">
              <p className="font-serif text-[21px] leading-tight lg:text-[26px]" style={{ color: "var(--hint-text)" }}>
                Score hidden
              </p>
              <p className="mt-1.5 max-w-sm font-sans text-[11px] leading-snug lg:mt-2 lg:text-[13px] lg:leading-relaxed" style={{ color: "var(--hint-muted)" }}>
                Hint scores energy, love, and career from today's sky, your birth details, and your ritual streak.
              </p>
            </div>
            <div className="relative mt-3 grid grid-cols-3 gap-1.5 lg:mt-5 lg:gap-2">
              {["Sky", "Birth", "Streak"].map((step, index) => (
                <div
                  key={step}
                  className="rounded-[10px] border px-2 py-1.5 lg:rounded-[12px] lg:px-3 lg:py-2"
                  style={{
                    background: "color-mix(in srgb, var(--hint-input-bg) 76%, transparent)",
                    borderColor: "var(--hint-border)",
                    color: index === 0 ? "var(--hint-text)" : "var(--hint-muted)",
                  }}
                >
                  <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.12em] lg:text-[10px] lg:tracking-[0.14em]">
                    {index + 1}
                  </p>
                  <p className="mt-0.5 truncate font-sans text-[10.5px] font-semibold lg:mt-1 lg:text-[12px]">{step}</p>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="grid gap-2 lg:flex lg:items-stretch">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.45 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="relative flex min-h-[48px] items-center gap-2 overflow-hidden rounded-[12px] border px-2.5 py-1.5 lg:min-h-[68px] lg:w-[128px] lg:shrink-0 lg:gap-2.5 lg:rounded-[14px] lg:px-3 lg:py-2"
              style={{
                background:
                  "radial-gradient(circle at 50% 20%, rgba(122,226,214,0.20), transparent 58%), linear-gradient(145deg, color-mix(in srgb, var(--hint-surface) 90%, transparent), color-mix(in srgb, var(--hint-input-bg) 78%, transparent))",
                borderColor: "color-mix(in srgb, var(--hint-gold, #cba866) 48%, var(--hint-border))",
                boxShadow: "0 16px 34px rgba(31,25,34,0.16), inset 0 1px 0 rgba(255,255,255,0.24)",
              }}
            >
              <motion.span
                aria-hidden
                className="absolute inset-3 rounded-full"
                style={{
                  background: "radial-gradient(circle, rgba(239,162,96,0.28), transparent 62%)",
                }}
                animate={{ scale: [0.84, 1.16, 0.84], opacity: [0.55, 0.95, 0.55] }}
                transition={{ duration: 3.1, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="relative">
                <motion.p
                  className="font-serif text-[28px] leading-none tabular-nums lg:text-[36px]"
                  style={{ color: "var(--hint-score-ink)", textShadow: "var(--hint-score-shadow)" }}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.45 }}
                  transition={{ delay: 0.12, duration: 0.48, ease: "easeOut" }}
                >
                  {overallScore}
                </motion.p>
              </div>
              <div className="relative min-w-0 flex-1">
                <p className="truncate font-sans text-[8px] font-semibold uppercase tracking-[0.12em] lg:text-[9px] lg:tracking-[0.14em]" style={{ color: ACCENT.gold }}>
                  Overall
                </p>
                <p className="mt-0.5 font-sans text-[9px] leading-none lg:text-[10px]" style={{ color: "var(--hint-muted)" }}>
                  {t("daily.score")}
                </p>
                <div
                  className="mt-1.5 h-1 overflow-hidden rounded-full lg:mt-2 lg:h-1.5"
                  style={{ background: "color-mix(in srgb, var(--hint-border) 62%, transparent)" }}
                >
                  <motion.div
                    className="relative h-full overflow-hidden rounded-full"
                    style={{
                      background: "linear-gradient(90deg, var(--hint-score-ink), color-mix(in srgb, var(--hint-gold, #cba866) 74%, transparent))",
                    }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${overallScore}%` }}
                    viewport={{ once: true, amount: 0.45 }}
                    transition={{ delay: 0.1, duration: 0.72, ease: "easeOut" }}
                  >
                    <motion.span
                      aria-hidden
                      className="absolute inset-y-0 right-0 w-10 rounded-full"
                      style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.76))" }}
                      animate={{ opacity: [0.2, 0.95, 0.2] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </motion.div>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-3 gap-1.5 lg:flex lg:min-w-0 lg:flex-1 lg:gap-2">
              {scores.map((score, index) => (
                <motion.div
                  key={score.key}
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, amount: 0.45 }}
                  transition={{ delay: index * 0.07, duration: 0.42, ease: "easeOut" }}
                  className="relative min-h-[44px] overflow-hidden rounded-[10px] border px-2 py-1.5 lg:min-h-[68px] lg:min-w-0 lg:flex-1 lg:rounded-[12px] lg:px-2.5 lg:py-2"
                  style={{
                    background: "color-mix(in srgb, var(--hint-input-bg) 82%, transparent)",
                    borderColor: "color-mix(in srgb, var(--hint-border-strong) 72%, transparent)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
                  }}
                >
                  <div className="relative">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-sans text-[10px] font-semibold leading-none lg:truncate lg:text-[12px]" style={{ color: "var(--hint-text)" }}>
                        {score.label}
                      </p>
                      <p className="font-serif text-[18px] leading-none tabular-nums lg:text-[23px]" style={{ color: score.tone }}>
                        {score.score}
                      </p>
                    </div>
                    <div
                      className="relative mt-1.5 h-1 overflow-hidden rounded-full lg:mt-2 lg:h-1.5"
                      style={{ background: "color-mix(in srgb, var(--hint-border) 62%, transparent)" }}
                    >
                      <motion.div
                        className="relative h-full overflow-hidden rounded-full"
                        style={{
                          background: `linear-gradient(90deg, ${score.tone}, color-mix(in srgb, ${score.tone} 28%, transparent))`,
                        }}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${score.score}%` }}
                        viewport={{ once: true, amount: 0.45 }}
                        transition={{ delay: 0.12 + index * 0.07, duration: 0.72, ease: "easeOut" }}
                      >
                        <motion.span
                          aria-hidden
                          className="absolute inset-y-0 right-0 w-10 rounded-full"
                          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.74))" }}
                          animate={{ opacity: [0.18, 0.9, 0.18] }}
                          transition={{ duration: 1.7 + index * 0.12, repeat: Infinity, ease: "easeInOut" }}
                        />
                      </motion.div>
                    </div>
                    <p className="mt-1 hidden truncate font-sans text-[10.5px] 2xl:block" style={{ color: "var(--hint-muted)" }}>
                      {scoreInsight(score)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
      {revealed && !birthPersonalized && (
        <Link
          href="/app/profile"
          onPointerDown={() => triggerFeedback("select")}
          className="hint-pressable relative mt-3 inline-flex w-full items-center justify-center rounded-full border px-4 py-2.5 font-sans text-[12px] font-semibold"
          style={{
            color: "var(--hint-text)",
            background: "color-mix(in srgb, var(--hint-surface-soft) 88%, transparent)",
            borderColor: "color-mix(in srgb, var(--hint-gold, #cba866) 34%, var(--hint-border))",
          }}
        >
          Add birth details for sharper daily scores
        </Link>
      )}
    </motion.div>
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
        style={{ background: "rgba(168,216,208,0.24)" }}
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

function SkyCardRevealEffects({ revealed, revealing = false }: { revealed: boolean; revealing?: boolean }) {
  const active = revealed || revealing;
  const sparks = [
    { x: "-42%", y: "8%", delay: 0.04, color: "rgba(255,229,172,0.96)" },
    { x: "118%", y: "15%", delay: 0.16, color: "rgba(255,205,224,0.92)" },
    { x: "-30%", y: "76%", delay: 0.25, color: "rgba(151,232,224,0.92)" },
    { x: "106%", y: "70%", delay: 0.36, color: "rgba(255,244,214,0.95)" },
    { x: "52%", y: "-25%", delay: 0.44, color: "rgba(255,205,224,0.86)" },
  ];

  return (
    <div aria-hidden className="pointer-events-none absolute inset-[-22%]">
      <motion.span
        className="absolute inset-0 rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(circle, rgba(255,207,220,0.20), rgba(203,168,102,0.14) 36%, rgba(168,216,208,0.08) 58%, transparent 72%)",
        }}
        animate={{
          scale: active ? [0.72, 1.32, 1.03] : [0.92, 1.02, 0.92],
          opacity: active ? [0.06, 0.78, 0.34] : [0.22, 0.38, 0.22],
        }}
        transition={{ duration: active ? 1.12 : 4.2, repeat: active ? 0 : Infinity, ease: "easeInOut" }}
      />
      {[0, 1].map((ring) => (
        <motion.span
          key={`sky-ring-${ring}-${active ? "open" : "wait"}`}
          className="absolute inset-[12%] rounded-full border"
          style={{
            borderColor: ring === 0 ? "rgba(255,225,166,0.50)" : "rgba(168,216,208,0.26)",
            boxShadow: ring === 0 ? "0 0 26px rgba(255,225,166,0.14)" : "0 0 24px rgba(168,216,208,0.10)",
          }}
          animate={
            active
              ? { scale: [0.58, 1.7], opacity: [0.62, 0] }
              : { scale: [0.98, 1.05, 0.98], opacity: [0.18, 0.34, 0.18] }
          }
          transition={{
            duration: active ? 1.05 : 4.8,
            delay: ring * 0.16,
            repeat: active ? 0 : Infinity,
            ease: "easeOut",
          }}
        />
      ))}
      {sparks.map((spark, index) => (
        <motion.span
          key={`sky-spark-${index}-${active ? "open" : "idle"}`}
          className="absolute grid size-4 place-items-center"
          style={{ left: spark.x, top: spark.y, color: spark.color }}
          animate={
            active
              ? { scale: [0.15, 1.24, 0.68], rotate: [0, 38, 92], opacity: [0, 1, 0] }
              : { scale: [0.6, 1, 0.6], opacity: [0.18, 0.72, 0.18] }
          }
          transition={{
            duration: active ? 1.05 : 3.2,
            delay: spark.delay,
            repeat: active ? 0 : Infinity,
            repeatDelay: index * 0.18,
            ease: "easeInOut",
          }}
        >
          <Sparkles className="size-4" strokeWidth={1.8} />
        </motion.span>
      ))}
    </div>
  );
}

function ThemeAwareDailyCard({
  report,
  revealed,
  revealing = false,
  presentation = "dashboard",
}: {
  report: DailyReport;
  revealed: boolean;
  revealing?: boolean;
  presentation?: "dashboard" | "intro";
}) {
  const revealedCardImage =
    getTarotCardImage(report.card.cardId, "original") ??
    getTarotCardImage(report.card.cardId, "hint-classic");
  const cardSizeClass =
    presentation === "intro"
      ? revealed
        ? "aspect-[300/527] w-[168px] sm:w-[184px]"
        : "aspect-[46/71] w-[172px] sm:w-[190px]"
      : revealed
        ? "aspect-[300/527] w-[124px] sm:w-[136px]"
        : "aspect-[46/71] w-[142px] sm:w-[166px]";

  return (
    <div className="relative mx-auto w-fit">
      <SkyCardRevealEffects revealed={revealed} revealing={revealing} />
      {revealing && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-[-18%] z-30 rounded-full"
          style={{
            background:
              "conic-gradient(from 18deg, transparent 0deg, rgba(255,229,172,0.26) 42deg, transparent 78deg, rgba(151,232,224,0.18) 132deg, transparent 176deg, rgba(255,205,224,0.22) 238deg, transparent 300deg)",
            filter: "blur(10px)",
            mixBlendMode: "screen",
          }}
          initial={{ opacity: 0, rotate: -18, scale: 0.76 }}
          animate={{ opacity: [0, 0.72, 0], rotate: 44, scale: [0.76, 1.12, 1.26] }}
          transition={{ duration: 0.86, ease: "easeOut" }}
        />
      )}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-x-[18%] top-[-8%] z-10 h-8 -skew-x-12 rounded-full blur-md"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.54), transparent)" }}
        animate={{ x: revealed || revealing ? ["-120%", "250%"] : ["-80%", "190%"], opacity: [0, 0.84, 0] }}
        transition={{ duration: revealed || revealing ? 1.18 : 3.8, repeat: revealed || revealing ? 0 : Infinity, repeatDelay: 2.2, ease: "easeInOut" }}
      />
      <div
        className={[
          "tarot-flip relative z-20 max-w-full",
          cardSizeClass,
        ].join(" ")}
        style={{
          filter:
            presentation === "intro"
              ? "drop-shadow(0 30px 44px rgba(31, 25, 34, 0.18)) drop-shadow(0 0 34px rgba(243,169,202,0.20))"
              : "drop-shadow(0 24px 38px rgba(31, 25, 34, 0.24)) drop-shadow(0 0 26px rgba(203,168,102,0.14))",
        }}
      >
      <motion.div
        className="tarot-flip-inner"
        animate={{
          rotateY: revealed ? 180 : 0,
          y: revealing && !revealed ? [0, -10, 0] : 0,
          scale: revealed ? [0.98, 1.035, 1] : revealing ? [1, 1.045, 1] : 1,
        }}
        transition={{ duration: 0.92, ease: [0.45, 0, 0.2, 1] }}
      >
        <div
          className="tarot-flip-face overflow-hidden rounded-[20px] border"
          style={{
            backgroundImage: `url("${SKY_DECK_CARD_BACK_IMAGE}")`,
            backgroundPosition: "center",
            backgroundSize: "cover",
            borderColor: "color-mix(in srgb, var(--hint-gold, #cba866) 58%, var(--hint-border))",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16), 0 0 0 1px rgba(255,255,255,0.04)",
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
        </div>

        <div
          className={[
            "tarot-flip-face tarot-flip-back overflow-hidden",
            revealed ? "rounded-[4px]" : "rounded-[20px] border",
          ].join(" ")}
          style={{
            background: revealed
              ? "transparent"
              : "linear-gradient(160deg, #17111f 0%, #101827 48%, #092228 100%)",
            borderColor: revealed ? "transparent" : "color-mix(in srgb, var(--hint-gold, #cba866) 70%, var(--hint-border))",
            boxShadow: revealed
              ? "none"
              : "inset 0 1px 0 rgba(255,255,255,0.16), inset 0 0 0 1px rgba(0,0,0,0.28), 0 0 46px rgba(203,168,102,0.16)",
          }}
        >
          {!revealed ? (
            <div
              aria-hidden
              className="absolute inset-[10px] rounded-[14px] border"
              style={{ borderColor: "color-mix(in srgb, var(--hint-gold, #cba866) 34%, transparent)" }}
            />
          ) : null}
          {revealed ? (
            <div className="absolute inset-0 overflow-hidden rounded-[4px]">
              <SafeImage
                src={revealedCardImage}
                alt={report.card.cardName}
                loading="eager"
                className="h-full w-full object-contain"
                fallbackClassName="rounded-[4px]"
                fallbackLabel="Tarot card"
              >
                <CardSigil cardId={report.card.cardId} />
              </SafeImage>
            </div>
          ) : null}
        </div>
      </motion.div>
      </div>
    </div>
  );
}

function cardTheme(cardName: string): "wealth" | "love" | "career" | "mind" | "major" {
  const normalized = cardName.toLowerCase();
  if (normalized.includes("pentacles")) return "wealth";
  if (normalized.includes("cups") || normalized.includes("lovers") || normalized.includes("empress")) return "love";
  if (normalized.includes("wands") || normalized.includes("chariot") || normalized.includes("emperor") || normalized.includes("magician")) return "career";
  if (normalized.includes("swords") || normalized.includes("hermit") || normalized.includes("high priestess")) return "mind";
  return "major";
}

function memoryInsight(currentCardName: string): string {
  const readings = listLocalDailyReadings();
  const recent = readings.slice(0, 30);
  if (recent.length < 2) {
    return "Memory is just beginning. Draw daily cards for a few days and Hint will start noticing repeating themes.";
  }

  const currentTheme = cardTheme(currentCardName);
  let streak = 0;
  for (const reading of recent) {
    if (cardTheme(reading.cardName) !== currentTheme) break;
    streak += 1;
  }

  if (streak >= 3 && currentTheme === "wealth") {
    return `You have drawn wealth-related cards for ${streak} days in a row. Hint reads this as a practical upward trend: money, work, or a more stable opportunity may be asking for attention.`;
  }
  if (streak >= 3 && currentTheme === "love") {
    return `You have drawn love-related cards for ${streak} days in a row. Emotional signals are getting louder; connection, attraction, or a needed conversation may be closer than it looks.`;
  }

  const loveCount = recent.filter((reading) => cardTheme(reading.cardName) === "love").length;
  const previous = readings.slice(30, 60);
  const previousLoveCount = previous.filter((reading) => cardTheme(reading.cardName) === "love").length;
  if (recent.length >= 5 && loveCount >= 2) {
    const baseline = previous.length > 0 ? previousLoveCount / previous.length : 0.12;
    const current = loveCount / recent.length;
    const increase = Math.max(0, Math.round(((current - baseline) / Math.max(baseline, 0.08)) * 100));
    return increase > 0
      ? `In the last 30 days, love-related cards have appeared ${increase}% more often than your earlier pattern. Relationship themes are becoming more active.`
      : "Love-related cards have appeared repeatedly this month. Even if nothing is obvious yet, your emotional field is asking for more attention.";
  }

  if (currentTheme === "career" || currentTheme === "wealth") {
    return "Recent cards lean practical. Work, money, structure, and visible progress may matter more than emotional guessing right now.";
  }

  return "No strong repeating pattern yet. Today’s card stands on its own, but the memory layer will sharpen as your daily history grows.";
}

function CompactScoreSignal({ score, label, tone }: { score: number; label: string; tone: string }) {
  return (
    <div
      data-daily-score-card
      className="relative min-w-0 overflow-hidden rounded-[16px] border px-2.5 py-2"
      style={{
        background:
          "linear-gradient(145deg, color-mix(in srgb, var(--hint-surface-soft) 84%, transparent), color-mix(in srgb, var(--hint-input-bg) 62%, transparent))",
        borderColor: "color-mix(in srgb, var(--hint-border) 76%, transparent)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16)",
      }}
    >
      <span aria-hidden className="absolute inset-y-0 left-0 w-1 rounded-r-full" style={{ background: tone }} />
      <div className="relative flex items-center justify-between gap-2">
        <span className="min-w-0 font-sans text-[9px] font-black uppercase tracking-[0.04em]" style={{ color: "var(--hint-muted)" }}>
          {label}
        </span>
        <span
          className="shrink-0 font-serif text-[20px] leading-none tabular-nums"
          style={{ color: "var(--hint-text)", textShadow: `0 0 12px color-mix(in srgb, ${tone} 18%, transparent)` }}
        >
          {score}
        </span>
      </div>
      <div
        className="relative mt-1.5 h-1 overflow-hidden rounded-full"
        style={{ background: "color-mix(in srgb, var(--hint-border) 54%, transparent)" }}
      >
        <motion.span
          className="block h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, color-mix(in srgb, ${tone} 58%, white), ${tone})`,
            boxShadow: `0 0 14px color-mix(in srgb, ${tone} 42%, transparent)`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.68, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function DailyScoreCapsule({ report, revealed, compact = false }: { report: DailyReport; revealed: boolean; compact?: boolean }) {
  return (
    <div
      className={["relative overflow-hidden rounded-[24px] border", compact ? "p-2.5" : "p-3"].join(" ")}
      style={{
        background: "var(--hint-liquid-panel)",
        borderColor: "color-mix(in srgb, var(--hint-rose, #cf4f92) 24%, var(--hint-liquid-border))",
        boxShadow: "var(--hint-liquid-shadow)",
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(128deg, rgba(255,255,255,0.22), transparent 36%, color-mix(in srgb, var(--hint-aqua, #4a9f9d) 10%, transparent) 70%, transparent), radial-gradient(circle at 10% 10%, color-mix(in srgb, var(--hint-rose, #cf4f92) 13%, transparent), transparent 34%), radial-gradient(circle at 88% 18%, color-mix(in srgb, var(--hint-aqua, #4a9f9d) 10%, transparent), transparent 36%)",
        }}
      />
      {revealed ? (
        <div className="relative">
          <div className="flex items-center justify-between gap-2.5">
            <div className="min-w-0">
              <p className="font-sans text-[9px] font-black uppercase tracking-[0.16em]" style={{ color: "var(--hint-rose)" }}>
                Aura
              </p>
              <div className="mt-0.5 flex items-end gap-1.5">
                <p
                  className={["font-serif leading-none tabular-nums", compact ? "text-[34px]" : "text-[54px]"].join(" ")}
                  style={{ color: "var(--hint-score-ink)", textShadow: "var(--hint-score-shadow)" }}
                >
                  {report.overallScore}
                </p>
                <p className="pb-1.5 font-sans text-[10px] font-semibold leading-none" style={{ color: "var(--hint-muted)" }}>
                  overall
                </p>
              </div>
            </div>
            <motion.div
              className={["grid shrink-0 place-items-center rounded-full p-[3px]", compact ? "size-[44px]" : "size-[68px]"].join(" ")}
              style={{
                background: `conic-gradient(var(--hint-score-ink) ${report.overallScore * 3.6}deg, color-mix(in srgb, var(--hint-border) 58%, transparent) 0deg)`,
                boxShadow: "0 0 28px color-mix(in srgb, var(--hint-score-ink) 18%, transparent)",
              }}
              initial={{ rotate: -18, scale: 0.92, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              transition={{ duration: 0.56, ease: "easeOut" }}
            >
              <div
                className="grid size-full place-items-center rounded-full"
                style={{ background: "color-mix(in srgb, var(--hint-input-bg) 90%, transparent)" }}
              >
                <Sparkles className="size-5" aria-hidden style={{ color: "var(--hint-rose, #cf4f92)" }} />
              </div>
            </motion.div>
          </div>
          <div className={["mt-2.5 grid grid-cols-2", compact ? "gap-1.5" : "gap-2"].join(" ")}>
            {report.scores.map((score, index) => (
              <motion.div
                key={score.key}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.045, duration: 0.36, ease: "easeOut" }}
                className={index === report.scores.length - 1 ? "col-span-2" : undefined}
              >
                <CompactScoreSignal score={score.score} label={score.label} tone={score.tone} />
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="relative py-4 text-center">
          <div
            className="mx-auto grid size-16 place-items-center rounded-full border"
            style={{
              background: "color-mix(in srgb, var(--hint-surface-soft) 86%, transparent)",
              borderColor: "color-mix(in srgb, var(--hint-rose, #cf4f92) 28%, var(--hint-border))",
              boxShadow: "0 0 28px color-mix(in srgb, var(--hint-rose, #cf4f92) 14%, transparent)",
            }}
          >
            <Sparkles className="size-5" aria-hidden style={{ color: "var(--hint-rose, #cf4f92)" }} />
          </div>
          <p className="mt-3 font-serif text-[23px] leading-tight" style={{ color: "var(--hint-text)" }}>
            Aura score is sealed.
          </p>
          <p className="mx-auto mt-1.5 max-w-[15rem] font-sans text-[12px] leading-relaxed" style={{ color: "var(--hint-muted)" }}>
            Draw once to reveal today’s card, overall score, and five life signals.
          </p>
        </div>
      )}
    </div>
  );
}

function DailySignalIntro({
  report,
  date,
  language,
  receiptReady,
  alreadyOpenedToday,
  onReveal,
  onContinue,
}: {
  report: DailyReport;
  date: string;
  language: string;
  receiptReady: boolean;
  alreadyOpenedToday: boolean;
  onReveal: () => void | Promise<void>;
  onContinue: () => void;
}) {
  const [introRevealed, setIntroRevealed] = useState(alreadyOpenedToday);
  const [introRevealing, setIntroRevealing] = useState(false);
  const revealStartedRef = useRef(false);
  const timersRef = useRef<number[]>([]);
  const active = introRevealed || introRevealing;

  function queueTimer(callback: () => void, delay: number) {
    const timer = window.setTimeout(() => {
      timersRef.current = timersRef.current.filter((item) => item !== timer);
      callback();
    }, delay);
    timersRef.current.push(timer);
  }

  function revealIntroCard() {
    if (!receiptReady || introRevealed || alreadyOpenedToday || revealStartedRef.current) return;
    revealStartedRef.current = true;
    setIntroRevealing(true);
    queueTimer(() => {
      Promise.resolve(onReveal()).finally(() => {
        setIntroRevealed(true);
        queueTimer(() => {
          setIntroRevealing(false);
          revealStartedRef.current = false;
        }, 860);
      });
    }, 240);
  }

  useEffect(() => {
    if (!receiptReady || !alreadyOpenedToday) return;
    setIntroRevealed(true);
    setIntroRevealing(false);
    revealStartedRef.current = false;
  }, [alreadyOpenedToday, receiptReady]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current = [];
    };
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden pb-[calc(6.5rem+var(--hint-safe-bottom))]">
      <TodayShineLayer wide />
      <div className="relative z-10 mx-auto flex min-h-full w-full max-w-[var(--hint-app-width)] flex-col px-5 pt-[calc(0.95rem+var(--hint-safe-top))]">
        <header className="grid grid-cols-[2rem_1fr_2rem] items-center">
          <span aria-hidden className="grid size-8 place-items-center rounded-full">
            <span className="grid gap-1">
              <span className="block h-px w-3.5 rounded-full" style={{ background: "var(--hint-muted)" }} />
              <span className="block h-px w-3.5 rounded-full" style={{ background: "var(--hint-muted)" }} />
              <span className="block h-px w-3.5 rounded-full" style={{ background: "var(--hint-muted)" }} />
            </span>
          </span>
          <div className="text-center">
            <p className="font-serif text-[22px] leading-none tracking-[0.12em]" style={{ color: "var(--hint-text)" }}>
              HINT <span style={{ color: "var(--hint-rose)" }}>+</span>
            </p>
            <p className="mt-2 font-serif text-[12px] leading-none" style={{ color: "var(--hint-muted)" }}>
              Your daily signal from the universe.
            </p>
          </div>
          <span aria-hidden className="grid size-8 place-items-center rounded-full" style={{ color: "var(--hint-muted)" }}>
            <Sparkles size={15} strokeWidth={1.7} />
          </span>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center py-7 text-center">
          <p className="mb-8 font-sans text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: "var(--hint-rose)" }}>
            {formatAppDate(date, language)}
          </p>

          <div className="relative grid min-h-[360px] w-full place-items-center">
            <div aria-hidden className="absolute left-1/2 top-1/2 h-44 w-[21rem] -translate-x-1/2 -translate-y-1/2">
              <motion.span
                className="absolute left-1/2 top-1/2 block h-[86px] w-[20rem] -translate-x-1/2 -translate-y-1/2 rounded-full border"
                style={{
                  borderColor: "color-mix(in srgb, var(--hint-rose, #cf4f92) 32%, transparent)",
                  boxShadow: "0 0 28px color-mix(in srgb, var(--hint-rose, #cf4f92) 14%, transparent)",
                }}
                animate={{ rotate: active ? 24 : 0, opacity: active ? 0.72 : 0.48 }}
                transition={{ duration: 0.82, ease: "easeOut" }}
              />
              <motion.span
                className="absolute left-1/2 top-1/2 block h-[118px] w-[18rem] -translate-x-1/2 -translate-y-1/2 rounded-full border"
                style={{
                  borderColor: "color-mix(in srgb, var(--hint-aqua, #4a9f9d) 28%, transparent)",
                  boxShadow: "0 0 32px color-mix(in srgb, var(--hint-aqua, #4a9f9d) 13%, transparent)",
                }}
                animate={{ rotate: active ? -18 : 8, opacity: active ? 0.68 : 0.36 }}
                transition={{ duration: 0.82, ease: "easeOut" }}
              />
              <motion.span
                className="absolute left-[8%] top-[47%] size-2 rounded-full"
                style={{ background: "var(--hint-lavender)", boxShadow: "0 0 18px color-mix(in srgb, var(--hint-lavender, #cbbdf4) 64%, transparent)" }}
                animate={{ scale: [0.82, 1.2, 0.82], opacity: active ? [0.48, 0.92, 0.48] : [0.26, 0.7, 0.26] }}
                transition={{ duration: 2.9, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.span
                className="absolute right-[7%] top-[51%] size-1.5 rounded-full"
                style={{ background: "var(--hint-rose)", boxShadow: "0 0 16px color-mix(in srgb, var(--hint-rose, #cf4f92) 58%, transparent)" }}
                animate={{ scale: [1, 1.28, 1], opacity: active ? [0.52, 0.95, 0.52] : [0.28, 0.74, 0.28] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.35 }}
              />
            </div>

            <motion.div
              aria-hidden
              className="absolute left-1/2 top-1/2 size-48 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,244,203,0.56), rgba(255,196,220,0.24) 36%, rgba(176,235,229,0.15) 56%, transparent 72%)",
                filter: "blur(8px)",
                mixBlendMode: "screen",
              }}
              animate={{
                opacity: active ? [0.38, 0.86, 0.58] : [0.12, 0.30, 0.12],
                scale: active ? [0.88, 1.16, 1.02] : [0.82, 0.96, 0.82],
              }}
              transition={{ duration: active ? 1.4 : 3.8, repeat: active ? 0 : Infinity, ease: "easeInOut" }}
            />

            <motion.button
              type="button"
              onClick={revealIntroCard}
              disabled={!receiptReady || introRevealed || introRevealing}
              aria-label={
                !receiptReady
                  ? "Checking today's signal"
                  : introRevealed
                    ? `Daily tarot card: ${report.card.cardName}`
                    : "Reveal today's Hint"
              }
              className="relative z-10 rounded-[24px] outline-none transition-transform duration-200 focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--hint-aqua)_78%,white)] disabled:cursor-default"
              whileTap={receiptReady && !introRevealed && !introRevealing ? { scale: 0.985 } : undefined}
            >
              <ThemeAwareDailyCard report={report} revealed={introRevealed} revealing={introRevealing} presentation="intro" />
            </motion.button>
          </div>

          <motion.div
            key={introRevealed ? "revealed" : introRevealing ? "revealing" : "waiting"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, ease: "easeOut" }}
            className="mt-1 min-h-[128px] w-full"
          >
            {introRevealed ? (
              <div className="grid justify-items-center">
                <p className="font-sans text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: "var(--hint-rose)" }}>
                  Today's tarot card
                </p>
                <h1 className="mt-2 font-serif text-[28px] leading-tight" style={{ color: "var(--hint-text)" }}>
                  {report.card.cardName}
                </h1>
                <button
                  type="button"
                  onClick={onContinue}
                  className="relative mt-7 inline-flex h-12 min-w-[15.5rem] items-center justify-center overflow-hidden rounded-full px-6 font-sans text-[12px] font-black uppercase tracking-[0.13em] shadow-[0_18px_38px_rgba(202,93,141,0.22)] active:scale-[0.985]"
                  style={{
                    color: "white",
                    background:
                      "linear-gradient(135deg, color-mix(in srgb, var(--hint-rose, #cf4f92) 88%, white), color-mix(in srgb, var(--hint-lavender, #cbbdf4) 48%, var(--hint-rose, #cf4f92)))",
                  }}
                >
                  <span
                    aria-hidden
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.24), transparent)" }}
                  />
                  <span className="relative">OK, view today's signal</span>
                </button>
              </div>
            ) : (
              <div className="grid justify-items-center">
                <p className="font-serif text-[14px] leading-none" style={{ color: "var(--hint-muted)" }}>
                  {!receiptReady ? "Checking today's signal..." : introRevealing ? "Receiving your signal..." : "Your signal is waiting."}
                  <span style={{ color: "var(--hint-rose)" }}> +</span>
                </p>
                <button
                  type="button"
                  onClick={revealIntroCard}
                  disabled={!receiptReady || introRevealing}
                  className="relative mt-8 inline-flex h-12 min-w-[14.75rem] items-center justify-center overflow-hidden rounded-full px-6 font-sans text-[12px] font-black tracking-[0.01em] shadow-[0_18px_38px_rgba(202,93,141,0.22)] active:scale-[0.985] disabled:opacity-80"
                  style={{
                    color: "white",
                    background:
                      "linear-gradient(135deg, color-mix(in srgb, var(--hint-lavender, #cbbdf4) 34%, var(--hint-rose, #cf4f92)), color-mix(in srgb, var(--hint-rose, #cf4f92) 84%, var(--hint-gold, #cba866)))",
                  }}
                >
                  <span
                    aria-hidden
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.24), transparent)" }}
                  />
                  <span className="relative">{!receiptReady ? "Checking..." : introRevealing ? "Receiving..." : "Reveal Today's Hint"}</span>
                </button>
                <p className="mt-4 font-sans text-[10.5px] leading-none" style={{ color: "var(--hint-faint)" }}>
                  Take a deep breath, and receive.
                </p>
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

function DailyHintSection({
  report,
  revealed,
  onReveal,
  birthPersonalized,
  lockNotice,
}: {
  report: DailyReport;
  revealed: boolean;
  onReveal: () => void | Promise<void>;
  birthPersonalized: boolean;
  lockNotice?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const revealStartedRef = useRef(false);
  const revealTimerRef = useRef<number | null>(null);
  const memory = useMemo(() => memoryInsight(report.card.cardName), [report.card.cardName, revealed]);
  const skyReading = useMemo(
    () =>
      report.card.skyGuided
        ? generateSkyCardReading({
            cardId: report.card.cardId,
            cardName: report.card.cardName,
            cardWhisper: report.card.whisper,
            sky: report.card.skyGuided,
            tone: report.card.skyGuided.tone,
          })
        : null,
    [report.card.cardId, report.card.cardName, report.card.skyGuided, report.card.whisper],
  );

  function revealDailyCard() {
    if (revealed || revealStartedRef.current) return;
    revealStartedRef.current = true;
    triggerFeedback("reveal");
    setRevealing(true);
    revealTimerRef.current = window.setTimeout(() => {
      revealTimerRef.current = null;
      Promise.resolve(onReveal())
        .then(() => triggerFeedback("success"))
        .finally(() => {
          revealStartedRef.current = false;
          setRevealing(false);
        });
    }, 620);
  }

  useEffect(() => {
    if (!revealed) setExpanded(false);
  }, [revealed]);

  useEffect(() => {
    return () => {
      if (revealTimerRef.current !== null) window.clearTimeout(revealTimerRef.current);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.16, duration: 0.76, ease: "easeOut" }}
      className="hint-liquid-panel relative overflow-hidden rounded-[28px] px-3.5 py-3.5 sm:px-4 sm:py-4"
      style={{
        background: "var(--hint-liquid-panel-strong)",
        borderColor: "color-mix(in srgb, var(--hint-rose, #cf4f92) 34%, var(--hint-liquid-border))",
        boxShadow:
          "var(--hint-liquid-shadow), 0 18px 58px color-mix(in srgb, var(--hint-rose, #cf4f92) 12%, transparent)",
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(128deg, rgba(255,255,255,0.24), transparent 34%, color-mix(in srgb, var(--hint-aqua, #4a9f9d) 12%, transparent) 70%, transparent), radial-gradient(560px 380px at 18% 28%, color-mix(in srgb, var(--hint-rose, #cf4f92) 12%, transparent), transparent 68%), radial-gradient(520px 340px at 86% 8%, color-mix(in srgb, var(--hint-aqua, #4a9f9d) 10%, transparent), transparent 68%)",
        }}
      />
      <TodayShineLayer />

      <div className="relative">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--hint-rose)" }}>
              Today's card signal
            </p>
            <h2 className="mt-1 font-serif text-[23px] leading-none sm:text-[27px]" style={{ color: "var(--hint-text)" }}>
              {revealed ? "Sky card" : "Draw your sky card"}
            </h2>
          </div>
          {revealed && (
            <button
              type="button"
              onClick={() => {
                triggerFeedback("soft");
                setExpanded((value) => !value);
              }}
              className="hint-pressable rounded-full border px-2.5 py-1.5 font-sans text-[10px] font-semibold uppercase tracking-[0.12em] transition hover:translate-y-[-1px]"
              style={{
                color: "var(--hint-text)",
                background: "color-mix(in srgb, var(--hint-surface-soft) 72%, var(--hint-rose, #cf4f92) 18%)",
                borderColor: "color-mix(in srgb, var(--hint-rose, #cf4f92) 28%, var(--hint-border-strong))",
              }}
            >
              {expanded ? "Less" : "More"}
            </button>
          )}
        </div>

        <div className={revealed ? "grid gap-3 min-[390px]:grid-cols-[minmax(132px,0.68fr)_minmax(0,1.32fr)] min-[390px]:items-start" : "grid gap-4"}>
          <div className="min-w-0 text-center">
            <button
              type="button"
              onPointerDown={revealDailyCard}
              onClick={revealDailyCard}
              disabled={revealed || revealing}
              className="hint-pressable hint-tap-sparkle mx-auto block rounded-[20px] outline-none transition-transform duration-200 hover:translate-y-[-2px] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--hint-aqua)_80%,white)]"
              aria-label={revealed ? `Daily tarot card: ${report.card.cardName}` : "Tap to open today's sky card"}
            >
              <ThemeAwareDailyCard report={report} revealed={revealed} revealing={revealing} />
            </button>

            {!revealed && (
              <button
                type="button"
                onPointerDown={revealDailyCard}
                onClick={revealDailyCard}
                disabled={revealing}
                className="hint-pressable hint-tap-sparkle relative mt-3 inline-flex h-9 w-full max-w-[16rem] items-center justify-center overflow-hidden rounded-full border px-4 font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] sm:w-auto"
                style={{
                  color: "var(--hint-text)",
                  borderColor: "color-mix(in srgb, var(--hint-rose, #cf4f92) 34%, var(--hint-border-strong))",
                  background:
                    "linear-gradient(135deg, color-mix(in srgb, var(--hint-surface) 82%, transparent), color-mix(in srgb, var(--hint-rose, #cf4f92) 14%, transparent))",
                  boxShadow: "0 14px 28px rgba(31,25,34,0.10)",
                }}
                aria-label="Tap to open today's sky card"
              >
                {revealing && (
                  <span
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, color-mix(in srgb, var(--hint-rose, #cf4f92) 24%, transparent), color-mix(in srgb, var(--hint-lavender, #7563bf) 18%, transparent), color-mix(in srgb, var(--hint-aqua, #4a9f9d) 16%, transparent), transparent)",
                    }}
                  />
                )}
                <span className="relative">{revealing ? "Revealing" : "Tap to open"}</span>
              </button>
            )}
            {!birthPersonalized && (
              <Link
                href="/app/profile"
                onPointerDown={() => triggerFeedback("select")}
                className="hint-pressable mt-3 inline-flex w-full max-w-[16rem] items-center justify-center rounded-full border px-4 py-2.5 font-sans text-[12px] font-semibold"
                style={{
                  color: "var(--hint-text)",
                  background: "color-mix(in srgb, var(--hint-surface-soft) 88%, transparent)",
                  borderColor: "color-mix(in srgb, var(--hint-rose, #cf4f92) 26%, var(--hint-border))",
                }}
              >
                Add birth details
              </Link>
            )}
          </div>

          <div className="grid min-w-0 gap-3">
            <DailyScoreCapsule report={report} revealed={revealed} compact={revealed} />
          </div>

          {revealed && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.42, ease: "easeOut" }}
              className="min-w-0 rounded-[22px] border px-3.5 py-3 text-left min-[390px]:col-span-2"
              style={{
                color: "var(--hint-text)",
                borderColor: "color-mix(in srgb, var(--hint-rose, #cf4f92) 30%, var(--hint-border-strong))",
                background: "var(--hint-liquid-panel)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.24), 0 12px 32px color-mix(in srgb, var(--hint-rose, #cf4f92) 12%, transparent)",
              }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden
                  className="grid size-9 shrink-0 place-items-center rounded-[15px] border"
                  style={{
                    color: "var(--hint-rose)",
                    background: "color-mix(in srgb, var(--hint-rose, #cf4f92) 14%, var(--hint-surface-soft))",
                    borderColor: "color-mix(in srgb, var(--hint-rose, #cf4f92) 30%, var(--hint-border))",
                  }}
                >
                  <Sparkles size={16} strokeWidth={1.8} />
                </span>
                <div className="min-w-0">
                  <p className="font-sans text-[8.5px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--hint-rose)" }}>
                    Card revealed
                  </p>
                  <p className="mt-0.5 whitespace-normal break-words font-serif text-[19px] leading-tight" style={{ color: "var(--hint-text)" }}>
                    {report.card.cardName}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {revealed && report.card.skyGuided && (
            <div className="mx-auto w-full min-[390px]:hidden">
              <SkyEvidence
                signals={report.card.skyGuided.evidence}
                themes={report.card.skyGuided.themes}
                why={skyReading?.whyThisCard.join(" ")}
                compact
              />
            </div>
          )}

          {revealed && report.card.skyGuided && (
            <div className="hidden min-w-0 min-[390px]:col-span-2 min-[390px]:block">
              <SkyEvidence
                signals={report.card.skyGuided.evidence}
                themes={report.card.skyGuided.themes}
                why={skyReading?.whyThisCard.join(" ")}
                compact
              />
            </div>
          )}
        </div>

        {(!revealed || expanded) && (
          <div
            className="mt-3 rounded-[20px] border p-3.5"
            style={{
              background:
                "linear-gradient(145deg, color-mix(in srgb, var(--hint-input-bg) 70%, transparent), color-mix(in srgb, var(--hint-surface-soft) 58%, transparent))",
              borderColor: "color-mix(in srgb, var(--hint-border) 88%, transparent)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14)",
            }}
          >
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: ACCENT.gold }}>
              Tarot interpretation
            </p>
            <h3 className="mt-1 font-serif text-[24px] leading-none" style={{ color: "var(--hint-text)" }}>
              {revealed ? "What it points to" : "Waiting for the reveal"}
            </h3>
            <p className="mt-2 font-sans text-[13px] leading-relaxed" style={{ color: "var(--hint-muted)" }}>
              {revealed
                ? skyReading?.shortAnswer ?? `${report.card.whisper} ${report.astrologyNote}`
                : "The card is chosen by today's transit against your birth details, then translated into a daily reflection."}
            </p>
            {revealed && skyReading && (
              <p className="mt-2 font-sans text-[12px] leading-relaxed" style={{ color: "var(--hint-muted)" }}>
                {skyReading.whatThisMeans}
              </p>
            )}
            {revealed && (
              <p className="mt-3 rounded-[12px] border p-3 font-sans text-[12px] leading-relaxed" style={{ color: "var(--hint-muted)", background: "color-mix(in srgb, var(--hint-surface-soft) 76%, transparent)", borderColor: "var(--hint-border)" }}>
                {memory}
              </p>
            )}
            {lockNotice && (
              <p className="mt-3 rounded-full border px-3 py-2 font-sans text-[10px] font-semibold leading-tight" style={{ color: "var(--hint-muted)", background: "color-mix(in srgb, var(--hint-surface-soft) 72%, transparent)", borderColor: "var(--hint-border)" }}>
                Offline daily lock active. This result will use local fallback until the API returns.
              </p>
            )}
          </div>
        )}

        {revealed && expanded && (
          <motion.div
            key="today-score-more"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, ease: "easeOut" }}
            className="mt-5 grid gap-4"
          >
            <div
              className="rounded-[18px] border p-4 sm:p-5"
              style={{
                background: "color-mix(in srgb, var(--hint-input-bg) 84%, transparent)",
                borderColor: "var(--hint-border)",
              }}
            >
              <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: ACCENT.gold }}>
                For you today
              </p>
              <p className="mt-2 font-serif text-[23px] leading-tight sm:text-[28px]" style={{ color: "var(--hint-text)" }}>
                {report.selfHint}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <DetailItem label="Suggestion" value={report.suggestion} />
                <DetailItem label="Avoid" value={report.avoid} />
                <DetailItem label="Psychology" value={report.psychology} />
                <DetailItem label="Astrology" value={report.astrologyNote} />
              </div>
              <Link
                href="/app/ask"
                onPointerDown={() => triggerFeedback("select")}
                className="hint-pressable hint-tap-sparkle mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full font-sans text-[12px] font-semibold sm:w-auto sm:px-5"
                style={{
                  color: "#231d2a",
                  background: "linear-gradient(135deg, rgba(228,164,82,1), rgba(242,148,111,0.98))",
                  boxShadow: "0 18px 30px rgba(219, 142, 85, 0.22)",
                }}
              >
                Ask AI for specifics
                <ArrowRight size={15} />
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {report.lucky.map((item) => (
                <div
                  key={item.key}
                  className="flex min-h-[124px] flex-col items-center justify-center rounded-[22px] border p-3 text-center"
                  style={{
                    background: "var(--hint-lucky-tile-bg)",
                    borderColor: "var(--hint-border)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.20)",
                  }}
                >
                  <LuckyIllustration item={item} size={50} />
                  <p className="mt-2 truncate font-serif text-[17px] leading-tight" style={{ color: "var(--hint-text)" }}>
                    {item.value}
                  </p>
                  <p className="mt-1 font-sans text-[10px] font-semibold leading-tight" style={{ color: "var(--hint-faint)" }}>
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  const accent =
    label === "Suggestion"
      ? "rgba(150,211,255,0.45)"
      : label === "Avoid"
        ? "rgba(255,176,190,0.48)"
        : "rgba(228,198,138,0.22)";

  return (
    <div
      className="rounded-[14px] border p-3"
      style={{
        background: "color-mix(in srgb, var(--hint-surface-soft) 68%, transparent)",
        borderColor: "var(--hint-border)",
      }}
    >
      <div className="relative inline-block">
        <span
          aria-hidden
          className="absolute inset-x-[-4px] bottom-[-3px] h-3 rounded-full"
          style={{ background: accent, transform: "rotate(-8deg)" }}
        />
        <p className="relative font-serif text-[19px] font-semibold leading-none sm:text-[21px]" style={{ color: "var(--hint-text)" }}>
          {label}
        </p>
      </div>
      <p className="mt-2 font-sans text-[12.5px] leading-relaxed" style={{ color: "var(--hint-muted)" }}>
        {value}
      </p>
    </div>
  );
}

function RitualStreakPanel({
  ritual,
  tasks,
  onToggleTask,
}: {
  ritual: RitualProgressSnapshot;
  tasks: Array<{ text: string; reason: string }>;
  onToggleTask: (index: number) => void;
}) {
  const progress = ritual.progressPercent;
  const rewardText =
    ritual.daysUntilCredit === 0
      ? "10 credits earned this week"
      : `${ritual.daysUntilCredit} ${ritual.daysUntilCredit === 1 ? "day" : "days"} to 10 credits`;
  const ritualStatus = ritual.todayCompleted
    ? "today's three tasks are complete"
    : `${ritual.todayTaskCompletions.length}/3 tasks checked today`;

  return (
    <motion.section
      id="rewards"
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.72, ease: "easeOut" }}
      className="hint-liquid-panel relative scroll-mt-28 overflow-hidden rounded-[22px] px-3 py-3 sm:px-3.5"
      style={{
        background: "var(--hint-liquid-panel)",
        borderColor: "color-mix(in srgb, var(--hint-rose, #f7c7d7) 22%, var(--hint-border))",
      }}
    >
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-sans text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: "var(--hint-rose)" }}>
            Ritual
          </p>
          <h2 className="mt-0.5 font-serif text-[21px] leading-none" style={{ color: "var(--hint-text)" }}>
            Energy tasks
          </h2>
          <p className="mt-1 truncate font-sans text-[12px] font-semibold" style={{ color: "var(--hint-muted)" }}>
            {ritualStatus}
          </p>
        </div>
        <Link
          href="/app/profile"
          onPointerDown={() => triggerFeedback("select")}
          className="hint-status-pill hint-pressable shrink-0 rounded-full px-2.5 py-1.5 font-sans text-[9px] font-black uppercase tracking-[0.1em]"
        >
          Rewards
        </Link>
      </div>

      <div className="grid gap-2.5">
        <div>
          <div
            className="rounded-[17px] border p-1.5"
            style={{
              background: "color-mix(in srgb, var(--hint-input-bg) 80%, transparent)",
              borderColor: "var(--hint-border)",
            }}
          >
            <div className="grid gap-0.5">
              {tasks.slice(0, 3).map((task, index) => {
                const checked = ritual.todayTaskCompletions.includes(index);
                return (
                    <button
                      key={task.text}
                      type="button"
                      onClick={() => {
                        triggerFeedback(checked ? "soft" : "complete");
                        onToggleTask(index);
                      }}
                      className="hint-pressable grid min-h-[44px] grid-cols-[30px_1fr] items-center gap-2 rounded-[13px] px-1.5 py-1.5 text-left transition active:scale-[0.99]"
                  >
                    <span
                      className="grid size-6 place-items-center rounded-[9px] border"
                      style={{
                        background: checked ? "linear-gradient(135deg, #f0c3d5, #dfbf82)" : "rgba(255,255,255,0.08)",
                        borderColor: checked ? "rgba(240,195,213,0.58)" : "color-mix(in srgb, var(--hint-border-strong) 78%, transparent)",
                        color: checked ? "#172422" : "var(--hint-faint)",
                      }}
                    >
                      {checked ? <Check size={15} strokeWidth={2.5} /> : null}
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate font-serif text-[15px] leading-tight"
                        style={{
                          color: checked ? "var(--hint-faint)" : "var(--hint-text)",
                          textDecoration: checked ? "line-through" : "none",
                          textDecorationThickness: "2px",
                        }}
                      >
                        {task.text}
                      </span>
                      <span className="block truncate font-sans text-[10px] font-semibold" style={{ color: "var(--hint-faint)" }}>
                        {task.reason}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-2.5 grid grid-cols-7 items-start gap-1">
            {ritual.week.map((day, index) => {
              const done = day.completed;
              return (
                <div key={day.date} className="text-center">
                  <motion.div
                    className="mx-auto grid size-6 place-items-center rounded-full"
                    style={{
                      background: done
                        ? "linear-gradient(135deg, #d7a874, #d894aa)"
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
                    {done ? <Check size={12} /> : <Sparkles size={11} />}
                  </motion.div>
                  <p className="mt-1 font-sans text-[8.5px] font-semibold" style={{ color: "var(--hint-muted)" }}>
                    {day.label}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-2.5">
            <div className="mb-1.5 flex items-center justify-between gap-4">
              <p className="truncate font-sans text-[11px] font-semibold" style={{ color: "var(--hint-text)" }}>
                {rewardText}
              </p>
              <p className="font-sans text-[11px] font-semibold" style={{ color: "var(--hint-faint)" }}>
                {progress}%
              </p>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full" style={{ background: "color-mix(in srgb, var(--hint-border) 52%, transparent)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #d7a874, #d894aa, #a98bc1)" }}
                initial={{ width: 0 }}
                whileInView={{ width: `${progress}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.1, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <RewardStat icon={Star} value={`${ritual.starLevel}`} label="Star level" />
          <RewardStat icon={Gift} value={`${ritual.readingCredits}`} label="Credits" />
          <RewardStat icon={Sparkles} value={`${ritual.currentStreak}`} label="Day streak" />
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
      className="min-w-0 rounded-[14px] border px-1.5 py-2 text-center"
      style={{
        background: "color-mix(in srgb, var(--hint-surface-soft) 82%, transparent)",
        borderColor: "var(--hint-border)",
      }}
    >
      <div className="mx-auto grid size-6 place-items-center rounded-[10px]" style={{ background: "rgba(228, 198, 138, 0.16)", color: ACCENT.gold }}>
        <Icon size={13} />
      </div>
      <p className="mt-1 font-serif text-[17px] leading-none tabular-nums" style={{ color: "var(--hint-text)" }}>
        {value}
      </p>
      <p className="mt-0.5 truncate font-sans text-[8px] font-black uppercase tracking-[0.06em]" style={{ color: "var(--hint-muted)" }}>
        {label}
      </p>
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
            <PrimaryLink href="/app/tarot">{t("home.startReading")}</PrimaryLink>
            <SecondaryLink href="/app/ask">
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
            href="/app/daily"
            onPointerDown={() => triggerFeedback("select")}
            className="hint-pressable hint-tap-sparkle group relative mx-auto block aspect-[46/71] w-[148px] overflow-hidden rounded-[14px] border sm:w-[172px] lg:w-[188px]"
            style={{
              backgroundImage: `url("${SKY_DECK_CARD_BACK_IMAGE}")`,
              backgroundPosition: "center",
              backgroundSize: "cover",
              borderColor: "rgba(206,178,110,0.38)",
              boxShadow: "0 0 42px rgba(206,178,110,0.16)",
            }}
          >
            <div className="absolute inset-[8px] rounded-[8px] border border-[rgba(206,178,110,0.34)]" />
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
      onPointerDown={() => triggerFeedback("select")}
      className="hint-pressable hint-tap-sparkle inline-flex h-12 items-center justify-center gap-2 rounded-[999px] px-5 font-sans text-[14px] font-medium"
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
      onPointerDown={() => triggerFeedback("select")}
      className="hint-pressable inline-flex h-12 items-center justify-center gap-2 rounded-[999px] border px-5 font-sans text-[14px] font-medium"
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

function RoomShortcutCard({
  card,
  index,
}: {
  card: RoomShortcutData;
  index: number;
}) {
  const Icon = card.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ delay: 0.08 + index * 0.05, duration: 0.48, ease: "easeOut" }}
    >
      <Link href={card.href} onPointerDown={() => triggerFeedback("select")} className="block h-full">
        <div
          className="hint-pressable hint-tap-sparkle group relative flex min-h-[132px] flex-col justify-between overflow-hidden rounded-[24px] border p-4 transition-transform active:scale-[0.985]"
          style={{
            background:
              "linear-gradient(145deg, color-mix(in srgb, var(--hint-surface-strong) 72%, white), color-mix(in srgb, var(--hint-rose, #f7c7d7) 7%, var(--hint-surface-soft) 86%))",
            borderColor: "color-mix(in srgb, var(--hint-border) 80%, transparent)",
            boxShadow: "0 18px 44px rgba(64,45,72,0.10), inset 0 1px 0 rgba(255,255,255,0.34)",
          }}
        >
          <div
            aria-hidden
            className="absolute inset-0 opacity-80"
            style={{
              background: `radial-gradient(circle at 18% 18%, ${card.tint}, transparent 38%), linear-gradient(120deg, rgba(255,255,255,0.24), transparent 46%)`,
            }}
          />
          <div className="relative">
            <span
              className="grid size-[48px] place-items-center rounded-[16px] border"
              style={{
                color: card.color,
                background: "color-mix(in srgb, var(--hint-surface-soft) 82%, transparent)",
                borderColor: `color-mix(in srgb, ${card.color} 24%, var(--hint-border))`,
                boxShadow: `0 10px 24px color-mix(in srgb, ${card.color} 10%, transparent)`,
              }}
            >
              <Icon size={20} strokeWidth={1.75} />
            </span>
          </div>
          <div className="relative">
            <h3 className="font-serif text-[24px] leading-none" style={{ color: "var(--hint-text)" }}>
              {card.title}
            </h3>
            <p className="mt-2 font-sans text-[12px] font-semibold leading-snug" style={{ color: "var(--hint-muted)" }}>
              {card.body}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function AstrologyPreviewCard() {
  return (
    <Link href="/app/astrology" onPointerDown={() => triggerFeedback("select")} className="block">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.52, ease: "easeOut" }}
        className="hint-pressable hint-tap-sparkle relative overflow-hidden rounded-[28px] border p-5"
        style={{
          background:
            "linear-gradient(150deg, color-mix(in srgb, var(--hint-surface-strong) 72%, white), color-mix(in srgb, var(--hint-rose, #f7c7d7) 10%, var(--hint-surface-soft) 86%))",
          borderColor: "color-mix(in srgb, var(--hint-border) 72%, transparent)",
          boxShadow: "0 22px 56px rgba(64,45,72,0.10), inset 0 1px 0 rgba(255,255,255,0.34)",
        }}
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(255,214,229,0.20),transparent_36%),radial-gradient(circle_at_78%_72%,rgba(134,214,199,0.10),transparent_34%)]" />
        <div className="relative mx-auto grid w-full max-w-[280px] place-items-center">
          <svg viewBox="0 0 220 220" className="h-[190px] w-[190px]" aria-hidden>
            <circle cx="110" cy="110" r="92" fill="none" stroke="color-mix(in srgb, var(--hint-gold) 42%, transparent)" strokeWidth="1.6" />
            <circle cx="110" cy="110" r="66" fill="none" stroke="color-mix(in srgb, var(--hint-border) 76%, transparent)" strokeWidth="1.5" />
            <circle cx="110" cy="110" r="34" fill="none" stroke="color-mix(in srgb, var(--hint-border) 82%, transparent)" strokeWidth="1.5" />
            {Array.from({ length: 12 }, (_, index) => {
              const angle = (index / 12) * Math.PI * 2 - Math.PI / 2;
              const x1 = 110 + Math.cos(angle) * 78;
              const y1 = 110 + Math.sin(angle) * 78;
              const x2 = 110 + Math.cos(angle) * 92;
              const y2 = 110 + Math.sin(angle) * 92;
              return <line key={index} x1={x1} y1={y1} x2={x2} y2={y2} stroke="color-mix(in srgb, var(--hint-gold) 38%, transparent)" strokeWidth="1.4" />;
            })}
            <polyline points="58,74 86,142 152,152 166,68" fill="none" stroke="color-mix(in srgb, var(--hint-gold) 30%, transparent)" strokeWidth="1.5" />
            {([
              [58, 74, "#90A8EF"],
              [86, 142, "#EF84BD"],
              [152, 152, "#B298D8"],
              [166, 68, "#86D6C7"],
              [104, 72, "#CBA866"],
            ] satisfies Array<[number, number, string]>).map(([cx, cy, fill]) => (
              <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="5.5" fill={fill} />
            ))}
            <g transform="translate(110 110)" fill="none" stroke="var(--hint-gold)" strokeWidth="2.4">
              <path d="M0 -25 16 0 0 25 -16 0Z" />
              <path d="M0 -12 8 0 0 12 -8 0Z" />
              <circle cx="0" cy="0" r="2.6" fill="var(--hint-gold)" />
            </g>
          </svg>
        </div>
        <div className="relative mt-2 grid grid-cols-3 gap-2">
          {[
            ["Sun", "Chart"],
            ["Moon", "Transit"],
            ["Rising", "Profile"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-[16px] border px-2 py-3 text-center"
              style={{
                background: "color-mix(in srgb, var(--hint-surface-soft) 82%, transparent)",
                borderColor: "color-mix(in srgb, var(--hint-border) 86%, transparent)",
              }}
            >
              <p className="font-sans text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: "var(--hint-faint)" }}>
                {label}
              </p>
              <p className="mt-1 truncate font-serif text-[18px] leading-none" style={{ color: "var(--hint-text)" }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </motion.section>
    </Link>
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
            className="rounded-[18px] border px-3 py-3 text-center"
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
          onPointerDown={() => triggerFeedback("tap")}
          className="hint-pressable rounded-full px-2 py-1 font-sans text-[11px] font-medium uppercase tracking-[0.1em]"
          style={{ color: "var(--hint-muted)" }}
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

function TodayAppHeader({
  title,
  date,
  language,
  profileName,
}: {
  title: string;
  date: string;
  language: string;
  profileName?: string | null;
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: "easeOut" }}
      className="mb-2 flex min-h-11 items-center justify-between gap-3 px-1"
    >
      <div className="min-w-0">
        <p
          className="truncate font-sans text-[9.5px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: "var(--hint-rose)" }}
        >
          {formatAppDate(date, language)}
        </p>
        <h1 className="mt-0.5 font-serif text-[28px] leading-none" style={{ color: "var(--hint-text)" }}>
          {title}
        </h1>
      </div>
      <Link
        href="/app/profile"
        aria-label="Open profile"
        onPointerDown={() => triggerFeedback("select")}
        className="hint-liquid-panel hint-pressable hint-tap-sparkle grid size-10 shrink-0 place-items-center rounded-full font-serif text-[17px] leading-none active:scale-95"
        style={{ color: "var(--hint-text)" }}
      >
        {profileInitial(profileName)}
      </Link>
    </motion.header>
  );
}

function AppActionList({ cards }: { cards: RoomShortcutData[] }) {
  return (
    <section className="mb-4">
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="font-sans text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: "var(--hint-rose)" }}>
          Rooms
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.45 }}
              transition={{ delay: index * 0.045, duration: 0.36, ease: "easeOut" }}
            >
              <Link
                href={card.href}
                onPointerDown={() => triggerFeedback("select")}
                className="hint-liquid-panel hint-pressable hint-tap-sparkle flex min-h-[92px] flex-col justify-between rounded-[22px] px-2.5 py-3 active:scale-[0.97]"
              >
                  <span
                    className="grid size-9 shrink-0 place-items-center rounded-[15px] border"
                    style={{
                      color: card.color,
                      background: `radial-gradient(circle at 30% 10%, ${card.tint}, transparent 58%), color-mix(in srgb, var(--hint-surface-soft) 82%, transparent)`,
                      borderColor: `color-mix(in srgb, ${card.color} 26%, var(--hint-border))`,
                    }}
                  >
                    <Icon size={17} strokeWidth={1.9} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-sans text-[13px] font-semibold leading-tight" style={{ color: "var(--hint-text)" }}>
                      {card.title}
                    </p>
                    <p className="mt-1 font-sans text-[10.5px] font-semibold leading-snug" style={{ color: "var(--hint-muted)" }}>
                      {card.body}
                    </p>
                  </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

const REFERENCE_SCORE_ICONS: Record<DailyScore["key"], LucideIcon> = {
  love: Heart,
  wealth: Coins,
  career: BriefcaseBusiness,
  study: BookOpen,
  people: UsersRound,
};

function ReferenceOrbitBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <span
        className="absolute left-[-6rem] top-[9rem] h-[20rem] w-[20rem] rounded-full blur-3xl"
        style={{ background: "rgba(231, 208, 205, 0.060)" }}
      />
      <span
        className="absolute right-[-7rem] top-[-1rem] h-[22rem] w-[22rem] rounded-full blur-3xl"
        style={{ background: "rgba(229, 207, 176, 0.072)" }}
      />
      <span
        className="absolute inset-0"
        style={{
          background: "linear-gradient(118deg, transparent 0%, rgba(255,255,255,0.17) 45%, transparent 64%)",
          opacity: 0.34,
        }}
      />
      <svg
        viewBox="0 0 472 230"
        className="absolute left-1/2 top-0 h-[230px] w-full max-w-[472px] -translate-x-1/2"
        preserveAspectRatio="none"
      >
        <defs>
          <radialGradient id="reference-top-planet" cx="38%" cy="30%" r="62%">
            <stop offset="0" stopColor="#e8cfc6" stopOpacity="0.92" />
            <stop offset="0.48" stopColor="#c8a3af" stopOpacity="0.76" />
            <stop offset="1" stopColor="#927aa7" stopOpacity="0.68" />
          </radialGradient>
          <linearGradient id="reference-top-gold-line" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#d5a76d" stopOpacity="0.18" />
            <stop offset="0.55" stopColor="#d9b98d" stopOpacity="0.34" />
            <stop offset="1" stopColor="#d5a76d" stopOpacity="0.12" />
          </linearGradient>
        </defs>
        <g fill="none" strokeLinecap="round">
          <path
            d="M316 -6 C282 21 255 36 226 68"
            stroke="rgba(255,255,255,0.44)"
            strokeWidth="0.72"
          />
          <path
            d="M338 16 C381 -7 437 1 463 42 C489 84 470 135 428 157"
            stroke="url(#reference-top-gold-line)"
            strokeWidth="0.82"
          />
          <path
            d="M374 38 C403 10 445 25 455 63 C465 104 435 137 394 132"
            stroke="rgba(202,157,104,0.18)"
            strokeWidth="0.72"
          />
          <path
            d="M326 94 L359 118 L389 102 L420 135"
            stroke="rgba(203,158,103,0.18)"
            strokeWidth="0.72"
          />
          <path
            d="M245 80 C279 58 335 60 382 84"
            stroke="rgba(222,174,111,0.18)"
            strokeWidth="0.82"
          />
          <ellipse
            cx="305"
            cy="84"
            rx="72"
            ry="15"
            transform="rotate(11 305 84)"
            stroke="rgba(218,168,105,0.22)"
            strokeWidth="0.72"
          />
          <ellipse
            cx="305"
            cy="84"
            rx="54"
            ry="10"
            transform="rotate(11 305 84)"
            stroke="rgba(255,241,214,0.36)"
            strokeWidth="0.58"
          />
          <path
            d="M247 89 C284 105 343 101 383 80"
            stroke="rgba(255,246,226,0.22)"
            strokeWidth="0.62"
          />
        </g>
        <circle cx="305" cy="84" r="9.2" fill="url(#reference-top-planet)" opacity="0.74" />
        <g fill="rgba(190,139,83,0.38)">
          <circle cx="350" cy="24" r="1.7" />
          <circle cx="393" cy="33" r="1.1" />
          <circle cx="459" cy="42" r="1.4" />
          <circle cx="328" cy="97" r="1.75" />
          <circle cx="359" cy="118" r="1.35" />
          <circle cx="389" cy="102" r="1.25" />
          <circle cx="420" cy="135" r="1.45" />
          <circle cx="449" cy="177" r="1.1" />
        </g>
        <g fill="rgba(222,174,111,0.18)">
          <circle cx="426" cy="20" r="0.9" />
          <circle cx="452" cy="113" r="0.8" />
          <circle cx="284" cy="83" r="0.75" />
          <circle cx="236" cy="90" r="0.9" />
        </g>
        <g stroke="rgba(214,160,95,0.28)" strokeLinecap="round" strokeWidth="0.76">
          <path d="M155 101 L155 112 M149 106.5 L160.5 106.5" />
          <path d="M385 68 L385 75 M381.5 71.5 L388.5 71.5" />
        </g>
      </svg>
      <svg viewBox="0 0 440 1120" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <g fill="none" stroke="rgba(190, 146, 102, 0.060)" strokeLinecap="round" strokeWidth="0.72">
          <path d="M245 82 C309 24 374 77 425 18" />
          <path d="M253 88 C304 111 365 112 417 75" />
          <ellipse cx="376" cy="74" rx="62" ry="39" transform="rotate(-22 376 74)" opacity="0.78" />
          <path d="M356 393 C419 345 468 349 504 399" opacity="0.55" />
          <path d="M-44 804 C70 724 171 740 246 828" opacity="0.52" />
          <path d="M-24 930 C86 846 190 864 274 962" opacity="0.35" />
        </g>
        <g fill="none" stroke="rgba(255, 255, 255, 0.36)" strokeLinecap="round" strokeWidth="0.66">
          <path d="M430 -10 C379 22 314 43 254 88" />
          <path d="M226 96 C267 72 306 75 343 105" opacity="0.52" />
        </g>
        <g fill="rgba(191, 143, 93, 0.13)">
          <circle cx="268" cy="42" r="2" />
          <circle cx="332" cy="32" r="1.15" />
          <circle cx="392" cy="107" r="1.35" />
          <circle cx="423" cy="25" r="1.05" />
          <circle cx="348" cy="79" r="1.1" />
        </g>
        <g fill="rgba(218, 174, 116, 0.085)">
          <circle cx="312" cy="302" r="1.05" />
          <circle cx="382" cy="384" r="1.25" />
          <circle cx="52" cy="676" r="1" />
          <circle cx="399" cy="748" r="1.1" />
        </g>
        <g stroke="rgba(214, 160, 95, 0.10)" strokeLinecap="round" strokeWidth="0.76">
          <path d="M350 58 L350 67 M345 62.5 L354.5 62.5" />
          <path d="M390 88 L390 94 M387 91 L393 91" />
          <path d="M205 846 L205 854 M201 850 L209 850" />
        </g>
      </svg>
    </div>
  );
}

function ReferenceHintLogo() {
  return (
    <Link
      href="/app/profile"
      aria-label="Open profile"
      onPointerDown={() => triggerFeedback("select")}
      className="hint-pressable relative grid size-[62px] shrink-0 place-items-center overflow-hidden rounded-full border text-center active:scale-95"
      style={{
        color: REFERENCE_TYPE.ink,
        background: "linear-gradient(145deg, rgba(255,254,250,0.70), rgba(248,239,230,0.40))",
        borderColor: "rgba(191, 159, 132, 0.105)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.54), 0 10px 22px rgba(98,78,64,0.026)",
      }}
    >
      <span
        aria-hidden
        className="absolute inset-x-2 top-1 h-px rounded-full"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.86), transparent)" }}
      />
      <span className="grid justify-items-center">
        <Sparkles size={19} strokeWidth={1.5} />
        <span className="font-serif text-[15px] leading-none">hint</span>
      </span>
    </Link>
  );
}

function referenceDailyCardImage(cardId: string) {
  return (
    getTarotCardImage(cardId, "hint-card-2") ??
    getTarotCardImage(cardId, "hint-classic") ??
    getTarotCardImage(cardId)
  );
}

function referenceDailyCardReading(report: DailyReport): SkyCardReading {
  if (report.card.skyGuided) {
    return generateSkyCardReading({
      cardId: report.card.cardId,
      cardName: report.card.cardName,
      cardWhisper: report.card.whisper,
      sky: report.card.skyGuided,
      tone: report.card.skyGuided.tone,
    });
  }

  const keyword = report.card.keyword?.split("·")[0]?.trim() || "today's signal";
  return {
    shortAnswer: `${report.card.cardName} points to ${keyword}. Name the clearest next step and keep it simple.`,
    cardMeaning: report.card.whisper,
    whatThisMeans: report.card.themeNote ?? report.summary,
    followUpChips: ["What should I do next?", "What am I avoiding?", "What needs attention?"],
    whyThisCard: [report.card.themeNote ?? "This card is today's strongest tarot signal."],
  };
}

function ReferenceFloatingHintCard({
  revealed,
  revealing,
  receiptReady,
  report,
  onActivate,
}: {
  revealed: boolean;
  revealing: boolean;
  receiptReady: boolean;
  report: DailyReport;
  onActivate: () => void;
}) {
  const cardImage = referenceDailyCardImage(report.card.cardId);

  return (
    <motion.button
      type="button"
      disabled={!receiptReady || revealing}
      aria-busy={revealing ? "true" : "false"}
      aria-label={
        revealed
          ? `View today's Hint for ${report.card.cardName}`
          : receiptReady
            ? "Reveal today's Hint card"
            : "Preparing today's Hint card"
      }
      onClick={onActivate}
      className="hint-pressable pointer-events-auto absolute z-10 border-0 bg-transparent p-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-[#fff1cf] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-wait disabled:opacity-85"
      style={{ position: "absolute", overflow: "visible", right: 62, top: 28, height: 180, width: 94, perspective: 620 }}
      whileTap={receiptReady && !revealing ? { scale: 0.985 } : undefined}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 bottom-[-29px] z-0 h-[62px] w-[194px] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(255,252,237,0.70) 0%, rgba(255,239,210,0.42) 28%, rgba(245,206,177,0.18) 54%, rgba(192,157,199,0.07) 70%, transparent 82%)",
          filter: "blur(0.9px)",
        }}
      />
      <svg
        aria-hidden
        viewBox="0 0 196 70"
        className="pointer-events-none absolute left-1/2 bottom-[-31px] z-0 h-[66px] w-[204px] -translate-x-1/2"
      >
        <defs>
          <radialGradient id="reference-card-base-glow" cx="50%" cy="42%" r="54%">
            <stop offset="0" stopColor="#fffdf0" stopOpacity="0.82" />
            <stop offset="0.38" stopColor="#ffedca" stopOpacity="0.42" />
            <stop offset="1" stopColor="#ffdfb8" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="98" cy="35" rx="70" ry="17" fill="url(#reference-card-base-glow)" />
        <ellipse cx="98" cy="34" rx="48" ry="9" fill="rgba(255,253,241,0.34)" />
        <g fill="none" strokeLinecap="round">
          <ellipse cx="98" cy="35" rx="58" ry="10" stroke="rgba(255,250,229,0.66)" strokeWidth="0.92" />
          <ellipse cx="98" cy="35" rx="75" ry="16" stroke="rgba(255,228,190,0.42)" strokeWidth="0.78" />
          <ellipse cx="98" cy="35" rx="91" ry="23" stroke="rgba(238,199,151,0.26)" strokeWidth="0.66" />
          <path d="M28 36 C56 49 139 49 169 36" stroke="rgba(255,248,224,0.50)" strokeWidth="0.78" />
          <path d="M43 35 C67 42 128 42 153 35" stroke="rgba(255,254,244,0.46)" strokeWidth="0.72" />
        </g>
      </svg>
      <motion.span
        className="relative z-10 block h-full w-full"
        animate={{
          y: [0, -3, 0],
          rotate: revealing ? [-0.25, 0.65, -0.1] : [-0.2, 0, -0.2],
          rotateY: revealing ? [-30, 44, -26] : [-30, -26, -30],
          rotateX: revealing ? [0.6, 1.2, 0.5] : [0.8, 0.3, 0.8],
        }}
        transition={{
          y: { duration: 5.6, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 5.6, repeat: Infinity, ease: "easeInOut" },
          rotateY: revealing ? { duration: 0.9, ease: [0.45, 0, 0.2, 1] } : { duration: 6.8, repeat: Infinity, ease: "easeInOut" },
          rotateX: { duration: 6.8, repeat: revealing ? 0 : Infinity, ease: "easeInOut" },
        }}
        style={{
          transformStyle: "preserve-3d",
          transformOrigin: "43% 52%",
          filter: "drop-shadow(0 18px 24px rgba(86,58,116,0.06)) drop-shadow(0 0 10px rgba(255,238,205,0.16))",
        }}
      >
      <span
        aria-hidden
        className="absolute inset-[-6px] rounded-[20px]"
        style={{
          background: "linear-gradient(90deg, rgba(255,247,218,0.28), rgba(255,244,230,0.07))",
          filter: "blur(2px)",
          transform: "translateX(5px)",
        }}
      />
      <motion.span
        aria-hidden
        className="absolute left-1/2 top-1/2 h-[180px] w-[158px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "conic-gradient(from 45deg, transparent 0deg, rgba(255,244,211,0.11) 54deg, transparent 92deg, rgba(208,178,220,0.07) 168deg, transparent 228deg, rgba(255,244,211,0.10) 306deg, transparent 360deg)",
          filter: "blur(3px)",
          mixBlendMode: "screen",
        }}
        animate={{
          opacity: revealing ? [0, 0.46, 0.18] : revealed ? [0.08, 0.16, 0.08] : [0.04, 0.10, 0.04],
          rotate: revealing ? [0, 160] : [0, 34, 0],
          scale: revealing ? [0.82, 1.24, 1.02] : [0.96, 1.05, 0.96],
        }}
        transition={{
          duration: revealing ? 1 : 7,
          repeat: revealing ? 0 : Infinity,
          ease: "easeInOut",
        }}
      />
      <span
        aria-hidden
        className="absolute -right-[12px] top-[8px] h-[calc(100%-12px)] w-[82%] rounded-[16px] border"
        style={{
          background: "linear-gradient(155deg, rgba(255,242,224,0.48), rgba(177,139,181,0.18))",
          borderColor: "rgba(255,239,209,0.20)",
          transform: "translateZ(-17px) rotateY(9deg) skewY(0.65deg)",
          boxShadow: "10px 14px 24px rgba(77,50,105,0.06)",
        }}
      />
      <span
        aria-hidden
        className="absolute -right-[3px] top-[7px] h-[calc(100%-8px)] w-[14px] rounded-r-[18px] border"
        style={{
          background: "linear-gradient(90deg, rgba(255,250,236,0.98), rgba(242,222,216,0.82) 36%, rgba(202,174,207,0.46) 78%, rgba(119,93,145,0.20))",
          borderColor: "rgba(255,233,203,0.36)",
          transform: "translateZ(-2px) rotateY(6deg)",
          boxShadow: "inset 3px 0 0 rgba(255,255,255,0.42), 5px 8px 14px rgba(85,58,108,0.055), 0 0 8px rgba(255,237,205,0.16)",
        }}
      />
      <motion.div
        className="relative h-full w-full overflow-hidden rounded-[15px] border-2"
        animate={{ scale: revealed ? [1, 1.018, 1.006] : 1 }}
        transition={{ duration: 0.52, ease: "easeOut" }}
        style={{
          background:
            "radial-gradient(circle at 52% 51%, rgba(255,239,178,0.50), transparent 14%), radial-gradient(circle at 48% 36%, rgba(255,252,238,0.18), transparent 25%), radial-gradient(circle at 82% 14%, rgba(255,255,255,0.13), transparent 20%), linear-gradient(158deg, rgba(232,205,216,0.76), rgba(200,166,196,0.74) 38%, rgba(165,135,184,0.76) 70%, rgba(121,98,154,0.72) 100%)",
          backgroundPosition: "center",
          backgroundSize: "cover",
          borderColor: "rgba(255,242,219,0.82)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.80), inset 0 0 0 1px rgba(255,238,206,0.48), inset 0 -18px 26px rgba(88,58,107,0.06), 0 0 0 1px rgba(255,246,226,0.24), 0 0 10px rgba(255,238,206,0.18)",
        }}
      >
        {revealed && cardImage ? (
          <SafeImage
            src={cardImage}
            alt={report.card.cardName}
            loading="eager"
            className="absolute inset-0 z-[2] h-full w-full object-cover"
            fallbackClassName="absolute inset-0 z-[2] h-full w-full rounded-[15px]"
            fallbackLabel={report.card.cardName}
          />
        ) : null}
        {revealed ? (
          <>
            <span
              aria-hidden
              className="absolute inset-0 z-[3]"
              style={{
                background:
                  "linear-gradient(112deg, rgba(255,255,255,0.26), transparent 28%, transparent 66%, rgba(255,238,202,0.18))",
                mixBlendMode: "screen",
              }}
            />
            <motion.span
              aria-hidden
              className="absolute inset-[-3px] z-[4] rounded-[17px]"
              style={{
                boxShadow:
                  "inset 0 0 0 2px rgba(255,239,204,0.88), 0 0 15px rgba(255,223,157,0.40), 0 0 28px rgba(255,235,189,0.18)",
              }}
              animate={{ opacity: [0.58, 1, 0.64] }}
              transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
            />
          </>
        ) : null}
        <span
          aria-hidden
          className="absolute inset-[-2px] rounded-[16px]"
          style={{
            boxShadow:
              "inset 0 0 0 2px rgba(255,249,230,0.46), inset -7px 0 0 rgba(255,244,221,0.34), inset 2px 0 0 rgba(255,246,226,0.20), 0 0 7px rgba(255,236,203,0.14)",
          }}
        />
        <span
          aria-hidden
          className="absolute bottom-[-8px] left-1/2 h-9 w-[92%] -translate-x-1/2 rounded-full"
          style={{
            background: "radial-gradient(ellipse, rgba(255,246,218,0.30), rgba(255,232,196,0.10) 54%, transparent 75%)",
            filter: "blur(3px)",
          }}
        />
        <span
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(112deg, rgba(255,255,255,0.26), transparent 30%, transparent 62%, rgba(255,239,204,0.16)), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.16), transparent 18%)",
            mixBlendMode: "screen",
          }}
        />
        <motion.span
          aria-hidden
          className="absolute inset-y-[-8%] left-[-52%] w-[38%] rotate-12 rounded-full"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.38), rgba(255,244,211,0.20), transparent)",
            filter: "blur(4px)",
          }}
          animate={{ x: ["0%", "430%"], opacity: [0, 0.9, 0] }}
          transition={{ duration: 4.8, repeat: Infinity, repeatDelay: 1.4, ease: "easeInOut" }}
        />
        <span
          className="absolute inset-[8px] rounded-[9px] border"
          style={{ borderColor: "rgba(255,232,194,0.46)" }}
        />
        <span
          className="absolute inset-[16px] rounded-[7px] border"
          style={{ borderColor: "rgba(255,244,220,0.13)" }}
        />
        <svg
          viewBox="0 0 106 172"
          className="absolute inset-0 h-full w-full transition-opacity duration-500"
          style={{ opacity: 1 }}
        >
          <defs>
            <linearGradient id="reference-card-foil" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#fff4d2" stopOpacity="0.96" />
              <stop offset="0.48" stopColor="#fff4d2" stopOpacity="0.46" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0.70" />
            </linearGradient>
            <radialGradient id="reference-card-star" cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor="#fffff6" stopOpacity="0.98" />
              <stop offset="0.42" stopColor="#ffe897" stopOpacity="0.94" />
              <stop offset="1" stopColor="#ffe897" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect x="10" y="9" width="86" height="154" rx="10" fill="none" stroke="url(#reference-card-foil)" strokeWidth="1.35" />
          <rect x="15" y="15" width="76" height="142" rx="8" fill="none" stroke="#fff0ca" strokeOpacity="0.58" strokeWidth="0.78" />
          <rect x="20" y="24" width="66" height="124" rx="7" fill="none" stroke="#fff4d6" strokeOpacity="0.36" strokeWidth="0.64" />
          <g fill="none" stroke="#fff0ca" strokeOpacity="0.60" strokeLinecap="round" strokeWidth="0.70">
            <path d="M23 25 C28 17 38 16 45 23" />
            <path d="M27 21 C27 30 34 31 39 25" opacity="0.70" />
            <path d="M25 31 C31 29 34 32 35 38" opacity="0.58" />
            <path d="M60 23 C67 16 77 17 82 25" />
            <path d="M67 25 C72 31 79 30 79 21" opacity="0.70" />
            <path d="M71 38 C72 32 75 29 81 31" opacity="0.58" />
            <path d="M23 147 C28 155 38 156 45 149" />
            <path d="M27 151 C27 142 34 141 39 147" opacity="0.70" />
            <path d="M25 141 C31 143 34 140 35 134" opacity="0.58" />
            <path d="M60 149 C67 156 77 155 82 147" />
            <path d="M67 147 C72 141 79 142 79 151" opacity="0.70" />
            <path d="M71 134 C72 140 75 143 81 141" opacity="0.58" />
            <path d="M53 33 C67 59 67 113 53 139 C39 113 39 59 53 33Z" opacity="0.48" />
            <path d="M25 86 C41 73 65 73 81 86 C65 99 41 99 25 86Z" opacity="0.28" />
            <path d="M31 79 C42 64 62 63 75 78" opacity="0.20" />
            <path d="M31 93 C42 108 62 109 75 94" opacity="0.20" />
            <path d="M33 39 C44 63 45 110 33 133" opacity="0.16" />
            <path d="M73 39 C62 63 61 110 73 133" opacity="0.16" />
            <path d="M53 37 L53 134" opacity="0.18" />
            <path d="M29 50 C44 43 62 43 77 50" opacity="0.18" />
            <path d="M29 122 C44 129 62 129 77 122" opacity="0.18" />
          </g>
          <g fill="#fff7dc" opacity="0.76">
            <circle cx="31" cy="58" r="1" />
            <circle cx="43" cy="45" r="0.85" />
            <circle cx="57" cy="55" r="0.92" />
            <circle cx="73" cy="43" r="0.85" />
            <circle cx="68" cy="67" r="0.72" />
            <circle cx="37" cy="76" r="0.64" />
            <circle cx="78" cy="83" r="0.74" />
            <circle cx="30" cy="124" r="0.78" />
            <circle cx="46" cy="112" r="0.86" />
            <circle cx="58" cy="121" r="0.78" />
            <circle cx="76" cy="111" r="0.86" />
          </g>
          <circle cx="53" cy="86" r="34" fill="url(#reference-card-star)" opacity="0.24" />
          <g stroke="#f5d399" strokeOpacity="0.46" strokeLinecap="round" strokeWidth="0.54">
            <path d="M53 62 L53 110" />
            <path d="M31 86 L75 86" />
            <path d="M38 71 L68 101" />
            <path d="M68 71 L38 101" />
            <path d="M45 65 L61 107" opacity="0.46" />
            <path d="M61 65 L45 107" opacity="0.46" />
            <path d="M34 76 L72 96" opacity="0.42" />
            <path d="M72 76 L34 96" opacity="0.42" />
          </g>
          <g fill="#fff3c8" opacity="0.92">
            <path d="M53 57 L58 80.5 L80 86 L58 91.5 L53 115 L48 91.5 L26 86 L48 80.5Z" />
            <path d="M53 43 L55.4 82 L64 86 L55.4 90 L53 129 L50.6 90 L42 86 L50.6 82Z" opacity="0.56" />
            <circle cx="53" cy="86" r="4.1" />
            <circle cx="32" cy="36" r="1.1" />
            <circle cx="78" cy="51" r="0.9" />
            <circle cx="72" cy="132" r="1.05" />
            <circle cx="35" cy="116" r="0.85" />
          </g>
          <g stroke="#fff7de" strokeOpacity="0.92" strokeLinecap="round" strokeWidth="0.78">
            <path d="M27 69 L27 75 M24 72 L30 72" />
            <path d="M80 99 L80 107 M76 103 L84 103" />
            <path d="M68 31 L68 35 M66 33 L70 33" opacity="0.72" />
            <path d="M38 101 L38 105 M36 103 L40 103" opacity="0.58" />
            <path d="M74 72 L74 76 M72 74 L76 74" opacity="0.58" />
          </g>
        </svg>
        <span
          className="absolute inset-y-0 left-0 w-[46%]"
          style={{ background: "linear-gradient(105deg, rgba(255,255,255,0.22), rgba(255,255,255,0.04) 54%, transparent)" }}
        />
        <span
          aria-hidden
          className="absolute bottom-[13px] left-1/2 h-[2px] w-9 -translate-x-1/2 rounded-full"
          style={{ background: "rgba(255,238,205,0.52)", boxShadow: "0 0 14px rgba(255,238,205,0.50)" }}
        />
      </motion.div>
      </motion.span>
    </motion.button>
  );
}

function ReferenceHeroArt({
  className = "",
  revealed,
  revealing,
  receiptReady,
  report,
  onCardActivate,
}: {
  className?: string;
  revealed: boolean;
  revealing: boolean;
  receiptReady: boolean;
  report: DailyReport;
  onCardActivate: () => void;
}) {
  return (
    <div
      className={["pointer-events-none grid place-items-center overflow-hidden rounded-[30px]", className].join(" ")}
      style={{ position: "absolute", inset: 0 }}
    >
      <span
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(246,226,222,0.10) 0%, rgba(232,205,216,0.15) 34%, rgba(193,159,190,0.30) 66%, rgba(151,120,173,0.48) 100%)",
        }}
      />
      <span
        aria-hidden
        className="absolute inset-0 opacity-[0.78]"
        style={{
          background:
            "radial-gradient(circle at 74% 62%, rgba(255,244,203,0.34), transparent 24%), radial-gradient(circle at 83% 24%, rgba(255,255,255,0.16), transparent 18%), radial-gradient(circle at 61% 42%, rgba(220,184,222,0.18), transparent 48%), linear-gradient(90deg, rgba(253,226,236,0) 0%, rgba(241,207,224,0.08) 32%, rgba(143,109,166,0.38) 100%)",
        }}
      />
      <span
        aria-hidden
        className="absolute inset-0 opacity-[0.32]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 12% 20%, rgba(90,61,49,0.05) 0 0.45px, transparent 0.8px), radial-gradient(circle at 66% 64%, rgba(255,245,226,0.18) 0 0.55px, transparent 1px), radial-gradient(circle at 88% 42%, rgba(80,55,94,0.08) 0 0.5px, transparent 0.9px)",
          backgroundSize: "7px 7px, 9px 9px, 13px 13px",
          mixBlendMode: "overlay",
        }}
      />
      <svg viewBox="0 0 380 248" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <g fill="none" strokeLinecap="round">
          <path d="M179 5 C150 45 139 78 139 119 C139 157 157 189 192 223" stroke="rgba(255,255,255,0.22)" strokeWidth="0.65" />
          <path d="M157 101 C203 52 301 47 375 83" stroke="rgba(255,236,197,0.19)" strokeWidth="0.72" />
          <path d="M180 155 C226 127 307 126 380 153" stroke="rgba(255,248,224,0.24)" strokeWidth="0.76" />
          <path d="M250 75 C294 48 342 49 383 75" stroke="rgba(255,244,215,0.12)" strokeWidth="0.58" />
          <ellipse cx="300" cy="132" rx="88" ry="24" transform="rotate(-24 300 132)" stroke="rgba(255,247,218,0.34)" strokeWidth="0.72" />
          <ellipse cx="301" cy="135" rx="74" ry="18" transform="rotate(18 301 135)" stroke="rgba(255,236,199,0.27)" strokeWidth="0.68" />
          <path d="M226 197 C261 219 333 216 372 179" stroke="rgba(255,248,224,0.15)" strokeWidth="0.64" />
          <path d="M223 67 L235 84 L254 77 L270 103 L292 92 L310 124 L338 108" stroke="rgba(255,255,255,0.22)" strokeWidth="0.48" />
          <path d="M209 127 L226 111 L252 119 L269 99" stroke="rgba(255,255,255,0.18)" strokeWidth="0.44" />
        </g>
        <g fill="rgba(255,248,220,0.66)">
          <circle cx="206" cy="96" r="1.35" />
          <circle cx="310" cy="70" r="1.15" />
          <circle cx="331" cy="136" r="1.45" />
          <circle cx="284" cy="195" r="1.1" />
          <circle cx="248" cy="83" r="0.9" />
          <circle cx="355" cy="177" r="0.9" />
          <circle cx="188" cy="160" r="1" />
          <circle cx="237" cy="147" r="0.75" />
          <circle cx="349" cy="108" r="0.85" />
        </g>
        <g fill="rgba(255,255,255,0.62)">
          <circle cx="235" cy="84" r="1.3" />
          <circle cx="270" cy="103" r="1.2" />
          <circle cx="338" cy="108" r="1.3" />
          <circle cx="226" cy="111" r="1" />
          <circle cx="252" cy="119" r="0.9" />
        </g>
        <g stroke="rgba(255,245,212,0.44)" strokeLinecap="round">
          <path d="M180 67 L180 77 M175 72 L185 72" />
          <path d="M335 96 L335 104 M331 100 L339 100" />
          <path d="M252 116 L252 122 M249 119 L255 119" opacity="0.54" />
          <path d="M206 171 L206 177 M203 174 L209 174" opacity="0.58" />
        </g>
      </svg>
      <motion.svg
        aria-hidden
        viewBox="0 0 210 188"
        className="absolute right-[24px] top-[38px] z-[2] h-[182px] w-[230px]"
        animate={{
          opacity: revealing ? [0.42, 0.72, 0.58] : [0.24, 0.40, 0.24],
          rotate: revealing ? [0, 10, 0] : [0, 2, 0],
        }}
        transition={{ duration: revealing ? 1.05 : 6.4, repeat: revealing ? 0 : Infinity, ease: "easeInOut" }}
      >
        <g fill="none" strokeLinecap="round">
          <ellipse cx="118" cy="100" rx="92" ry="26" transform="rotate(-24 118 100)" stroke="#fff2c9" strokeOpacity="0.30" strokeWidth="0.82" />
          <ellipse cx="120" cy="106" rx="82" ry="20" transform="rotate(19 120 106)" stroke="#fff6db" strokeOpacity="0.30" strokeWidth="0.74" />
          <ellipse cx="115" cy="132" rx="78" ry="15" stroke="#ffe4bd" strokeOpacity="0.22" strokeWidth="0.74" />
          <path d="M33 128 C63 148 154 150 198 119" stroke="#fff2c9" strokeOpacity="0.16" strokeWidth="0.7" />
        </g>
        <g fill="#fff3cf" opacity="0.38">
          <circle cx="48" cy="72" r="1.3" />
          <circle cx="176" cy="68" r="1.1" />
          <circle cx="167" cy="138" r="1.25" />
          <circle cx="79" cy="149" r="1" />
        </g>
      </motion.svg>
      <ReferenceFloatingHintCard
        revealed={revealed}
        revealing={revealing}
        receiptReady={receiptReady}
        report={report}
        onActivate={onCardActivate}
      />
      <motion.svg
        aria-hidden
        viewBox="0 0 230 182"
        className="absolute right-[5px] top-[48px] z-[18] h-[176px] w-[254px]"
        animate={{ opacity: revealing ? [0.54, 0.82, 0.62] : [0.42, 0.58, 0.42] }}
        transition={{ duration: revealing ? 1 : 5.6, repeat: revealing ? 0 : Infinity, ease: "easeInOut" }}
        style={{ transform: "perspective(620px) rotateY(-20deg) rotateZ(-2deg)" }}
      >
        <g fill="none" strokeLinecap="round">
          <path
            d="M16 135 C70 80 158 70 222 102"
            stroke="rgba(255,248,222,0.68)"
            strokeWidth="1.08"
          />
          <path
            d="M23 140 C75 164 171 159 220 113"
            stroke="rgba(239,202,150,0.34)"
            strokeWidth="0.82"
          />
        </g>
        <g fill="rgba(255,246,214,0.78)">
          <circle cx="42" cy="128" r="1.7" />
          <circle cx="128" cy="101" r="2.1" />
          <circle cx="199" cy="105" r="2.8" />
        </g>
        <g stroke="rgba(255,246,218,0.62)" strokeLinecap="round" strokeWidth="0.78">
          <path d="M199 99 L199 111 M193 105 L205 105" />
          <path d="M42 124 L42 132 M38 128 L46 128" opacity="0.72" />
        </g>
      </motion.svg>
      <span
        aria-hidden
        className="absolute bottom-[18px] right-[38px] h-[58px] w-[190px] rounded-full"
        style={{
          background: "radial-gradient(ellipse, rgba(255,249,224,0.38), rgba(255,229,190,0.14) 52%, transparent 76%)",
          filter: "blur(1px)",
        }}
      />
      <span
        aria-hidden
        className="absolute bottom-[43px] right-[86px] h-3 w-[96px] rounded-full"
        style={{ background: "rgba(255,249,222,0.32)", filter: "blur(2px)" }}
      />
      <motion.svg
        viewBox="0 0 182 58"
        className="absolute bottom-[16px] right-[32px] h-[62px] w-[202px]"
        animate={{ opacity: revealing ? [0.42, 0.74, 0.58] : [0.28, 0.44, 0.28], scale: revealing ? [0.94, 1.05, 1] : [1, 1.018, 1] }}
        transition={{ duration: revealing ? 1 : 4.8, repeat: revealing ? 0 : Infinity, ease: "easeInOut" }}
      >
        <g fill="none" stroke="rgba(255,235,199,0.36)" strokeWidth="0.86">
          <ellipse cx="84" cy="27" rx="62" ry="11" />
          <ellipse cx="84" cy="27" rx="79" ry="18" />
          <ellipse cx="84" cy="27" rx="44" ry="7" />
          <ellipse cx="84" cy="27" rx="29" ry="4.5" opacity="0.54" />
          <path d="M24 28 C48 38 119 38 145 28" opacity="0.42" />
        </g>
      </motion.svg>
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-[78%]"
        style={{ background: "linear-gradient(90deg, rgba(255,248,244,0.52), rgba(250,235,238,0.30) 42%, rgba(250,235,238,0.09) 70%, rgba(250,235,238,0))" }}
      />
      <span
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 74% 70%, rgba(255,240,210,0.20), transparent 30%), linear-gradient(180deg, rgba(255,255,255,0.06), transparent 52%, rgba(83,55,105,0.035))",
        }}
      />
    </div>
  );
}

function ReferenceDailyRevealOverlay({
  open,
  revealing,
  report,
  onClose,
  onCardRevealed,
}: {
  open: boolean;
  revealing: boolean;
  report: DailyReport;
  onClose: () => void;
  onCardRevealed: () => void;
}) {
  const reading = useMemo(() => referenceDailyCardReading(report), [report]);
  const cardImage = referenceDailyCardImage(report.card.cardId);
  const keyword = report.card.keyword?.split("·")[0]?.trim() || report.card.cardName;
  const [flipped, setFlipped] = useState(false);
  const [detailsReady, setDetailsReady] = useState(false);
  const didAnnounceRevealRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    setFlipped(false);
    setDetailsReady(false);
    didAnnounceRevealRef.current = false;
  }, [open, report.card.cardId]);

  useEffect(() => {
    if (!open || !flipped) return;
    const timer = window.setTimeout(() => setDetailsReady(true), 680);
    return () => window.clearTimeout(timer);
  }, [flipped, open]);

  useEffect(() => {
    if (!open || revealing || flipped) return;
    const timer = window.setTimeout(() => {
      triggerFeedback("reveal");
      setFlipped(true);
    }, 620);
    return () => window.clearTimeout(timer);
  }, [flipped, open, revealing]);

  useEffect(() => {
    if (!detailsReady || didAnnounceRevealRef.current) return;
    didAnnounceRevealRef.current = true;
    onCardRevealed();
  }, [detailsReady, onCardRevealed]);

  function handleFlipCard() {
    if (revealing || flipped) return;
    triggerFeedback("reveal");
    setFlipped(true);
  }

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[200] overflow-hidden px-5 pb-[calc(1.1rem+var(--hint-safe-bottom))] pt-[calc(1.35rem+var(--hint-safe-top))]"
      role="dialog"
      aria-modal="true"
      aria-label={`Today's tarot card: ${report.card.cardName}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 34%, rgba(255,223,162,0.15), transparent 34%), radial-gradient(circle at 52% 61%, rgba(181,133,190,0.10), transparent 42%), rgba(16, 14, 17, 0.70)",
          backdropFilter: "blur(13px) saturate(0.84)",
          WebkitBackdropFilter: "blur(13px) saturate(0.84)",
        }}
      />
      <span
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.20), transparent 20%, rgba(0,0,0,0.16) 100%), radial-gradient(circle at 50% 48%, rgba(255,241,197,0.08), transparent 36%)",
        }}
      />
      <span
        aria-hidden
        className="absolute left-1/2 top-[20%] h-[36rem] w-[28rem] -translate-x-1/2 rounded-full opacity-70"
        style={{
          background: "radial-gradient(ellipse, rgba(255,222,153,0.16), rgba(118,82,133,0.08) 44%, transparent 72%)",
          filter: "blur(22px)",
        }}
      />
      <button
        type="button"
        aria-label="Close today's tarot reveal"
        disabled={revealing}
        className="hint-pressable absolute z-20 grid h-10 w-10 place-items-center rounded-full border disabled:opacity-60"
        onClick={onClose}
        style={{
          position: "absolute",
          left: "1.75rem",
          top: "calc(1.45rem + var(--hint-safe-top))",
          color: "rgba(255,248,236,0.92)",
          background: "rgba(255,244,222,0.050)",
          borderColor: "rgba(236,205,154,0.42)",
          boxShadow: "0 10px 26px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.13)",
          backdropFilter: "blur(5px)",
          WebkitBackdropFilter: "blur(5px)",
        }}
      >
        <ArrowLeft size={20} strokeWidth={1.8} />
      </button>
      <button
        type="button"
        aria-label="Save today's tarot card"
        className="hint-pressable absolute z-20 grid h-10 w-10 place-items-center rounded-full border"
        style={{
          position: "absolute",
          right: "1.75rem",
          top: "calc(1.45rem + var(--hint-safe-top))",
          color: "rgba(255,248,236,0.90)",
          background: "rgba(255,244,222,0.050)",
          borderColor: "rgba(236,205,154,0.38)",
          boxShadow: "0 10px 26px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.13)",
          backdropFilter: "blur(5px)",
          WebkitBackdropFilter: "blur(5px)",
        }}
      >
        <Bookmark size={18} strokeWidth={1.7} />
      </button>

      <motion.div
        className="relative z-10 mx-auto flex min-h-full w-full max-w-[430px] flex-col items-center text-center"
        initial={{ y: 18, scale: 0.97, filter: "blur(6px)" }}
        animate={{ y: 0, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="relative mt-[68px] h-[370px] w-[230px] min-[420px]:mt-[70px] min-[420px]:h-[390px] min-[420px]:w-[242px]"
          style={{ perspective: "1300px" }}
        >
          <motion.span
            aria-hidden
            className="absolute inset-[-42px] rounded-full"
            style={{
              background: "radial-gradient(ellipse at 50% 52%, rgba(255,226,154,0.38), rgba(224,178,103,0.16) 42%, transparent 70%)",
              filter: "blur(13px)",
            }}
            animate={{ opacity: flipped ? [0.58, 0.88, 0.62] : [0.24, 0.44, 0.28], scale: [0.96, 1.03, 0.98] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.span
            aria-hidden
            className="pointer-events-none absolute left-[-22px] top-[5%] h-[86%] w-[34px] rounded-full"
            style={{
              background: "linear-gradient(180deg, transparent, rgba(255,226,158,0.44) 18%, rgba(255,240,197,0.34) 54%, rgba(255,213,132,0.30) 82%, transparent)",
              filter: "blur(12px)",
            }}
            animate={{ opacity: flipped ? [0.34, 0.66, 0.42] : 0.18 }}
            transition={{ duration: 2.2, repeat: flipped ? Infinity : 0, ease: "easeInOut" }}
          />
          <motion.span
            aria-hidden
            className="pointer-events-none absolute right-[-24px] top-[4%] h-[88%] w-[38px] rounded-full"
            style={{
              background: "linear-gradient(180deg, transparent, rgba(255,230,164,0.52) 16%, rgba(255,244,207,0.42) 55%, rgba(255,214,130,0.34) 84%, transparent)",
              filter: "blur(13px)",
            }}
            animate={{ opacity: flipped ? [0.42, 0.78, 0.48] : 0.20 }}
            transition={{ duration: 2.4, repeat: flipped ? Infinity : 0, ease: "easeInOut", delay: 0.1 }}
          />
          <motion.span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-[9%] h-[82%] w-[118%] -translate-x-1/2 rounded-[28px]"
            style={{
              background: "radial-gradient(ellipse at 50% 48%, transparent 42%, rgba(255,232,169,0.16) 62%, transparent 78%)",
              filter: "blur(8px)",
            }}
            animate={{ opacity: flipped ? [0.20, 0.42, 0.24] : 0.10 }}
            transition={{ duration: 2.7, repeat: flipped ? Infinity : 0, ease: "easeInOut" }}
          />
          <motion.span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-[-22px] h-[42px] w-[104%] -translate-x-1/2 rounded-full"
            style={{
              background: "linear-gradient(90deg, transparent 1%, rgba(255,226,158,0.42) 12%, rgba(255,246,213,0.58) 50%, rgba(255,226,158,0.42) 88%, transparent 99%)",
              filter: "blur(10px)",
            }}
            animate={{ opacity: flipped ? [0.46, 0.84, 0.52] : 0.16 }}
            transition={{ duration: 2.35, repeat: flipped ? Infinity : 0, ease: "easeInOut" }}
          />
          <motion.span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-[-5px] h-[4px] w-[96%] -translate-x-1/2 rounded-full"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,245,210,0.84) 16%, rgba(255,226,146,0.98) 50%, rgba(255,245,210,0.84) 84%, transparent)",
              boxShadow: "0 0 16px rgba(255,228,153,0.72), 0 0 34px rgba(239,190,103,0.32)",
            }}
            animate={{ opacity: flipped ? [0.58, 1, 0.66] : 0.22 }}
            transition={{ duration: 1.9, repeat: flipped ? Infinity : 0, ease: "easeInOut" }}
          />
          {REFERENCE_REVEAL_DUST.map((dot, index) => (
            <motion.span
              key={`reference-reveal-dust-${index}`}
              aria-hidden
              className="pointer-events-none absolute z-[2] rounded-full"
              style={{
                left: dot.left,
                top: dot.top,
                height: dot.size,
                width: dot.size,
                background: "rgba(255,226,150,0.92)",
                boxShadow: `0 0 ${8 + dot.size * 3}px rgba(255,222,137,${dot.glow})`,
              }}
              animate={{
                opacity: flipped ? [0.18, 0.86, 0.26] : [0.05, 0.36, 0.10],
                scale: flipped ? [0.78, 1.42, 0.90] : [0.72, 1.12, 0.80],
                y: flipped ? [0, -3, 0] : [0, -2, 0],
              }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: dot.delay }}
            />
          ))}
          <button
            type="button"
            disabled={revealing || flipped}
            onClick={handleFlipCard}
            className="hint-pressable relative z-10 h-full w-full rounded-[20px] border-0 bg-transparent p-0 text-left disabled:cursor-default"
            aria-label={flipped ? `${report.card.cardName} revealed` : "Today's tarot card is turning"}
          >
            <motion.div
              className="relative h-full w-full"
              initial={{ rotateY: 0, rotateZ: -2.5, y: 10, scale: 0.94 }}
              animate={{
                rotateY: flipped ? 180 : 0,
                rotateZ: flipped ? 0 : [-2.5, -1.4, -2.5],
                y: flipped ? 0 : [10, 4, 10],
                scale: flipped ? 1 : 0.96,
              }}
              transition={{
                rotateY: { duration: 0.86, ease: [0.18, 0.9, 0.2, 1] },
                rotateZ: { duration: flipped ? 0.86 : 3.2, repeat: flipped ? 0 : Infinity, ease: "easeInOut" },
                y: { duration: flipped ? 0.86 : 3.2, repeat: flipped ? 0 : Infinity, ease: "easeInOut" },
                scale: { duration: 0.64, ease: "easeOut" },
              }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <div
                className="absolute inset-0 overflow-hidden rounded-[20px] border-[1.5px]"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  borderColor: "rgba(255,222,152,0.88)",
                  background: "linear-gradient(155deg, #071423, #0b1120 54%, #151123)",
                  boxShadow:
                    "0 0 0 1px rgba(255,246,214,0.28) inset, 0 0 20px rgba(255,216,139,0.32), 0 24px 58px rgba(0,0,0,0.34)",
                }}
              >
                {SKY_DECK_CARD_BACK_IMAGE ? (
                  <SafeImage
                    src={SKY_DECK_CARD_BACK_IMAGE}
                    alt="Tarot card back"
                    loading="eager"
                    className="h-full w-full object-cover"
                    fallbackClassName="h-full w-full rounded-[20px]"
                    fallbackLabel="Hint"
                  />
                ) : null}
                <span
                  aria-hidden
                  className="absolute inset-[-2px] rounded-[21px]"
                  style={{
                    boxShadow: "inset 0 0 0 2px rgba(255,231,171,0.48), 0 0 22px rgba(255,220,145,0.25)",
                  }}
                />
              </div>
              <div
                className="reference-today-card-reveal absolute inset-0 overflow-hidden rounded-[20px] border-[2px]"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                  borderColor: "rgba(255,228,164,0.96)",
                  background: "var(--hint-deck-card-bg)",
                  boxShadow:
                    "0 0 0 1px rgba(255,255,255,0.30) inset, 0 0 28px rgba(255,230,162,0.72), 0 0 68px rgba(239,190,103,0.30), 0 0 104px rgba(255,214,128,0.13), 0 28px 60px rgba(0,0,0,0.36)",
                }}
              >
                {cardImage ? (
                  <SafeImage
                    src={cardImage}
                    alt={report.card.cardName}
                    loading="eager"
                    className="h-full w-full object-cover"
                    fallbackClassName="h-full w-full rounded-[20px]"
                    fallbackLabel={report.card.cardName}
                  />
                ) : (
                  <CardSigil cardId={report.card.cardId} />
                )}
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-[18px]"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(3,14,28,0.20), transparent 28%, rgba(4,14,28,0.18)), radial-gradient(circle at 50% 36%, transparent 38%, rgba(1,10,22,0.18) 100%)",
                    mixBlendMode: "multiply",
                  }}
                />
                <motion.span
                  aria-hidden
                  className="absolute inset-[-3px] rounded-[22px]"
                  style={{
                    boxShadow:
                      "inset 0 0 0 2px rgba(255,240,198,0.82), 0 0 20px rgba(255,230,168,0.72), 0 0 44px rgba(244,199,112,0.30)",
                  }}
                  animate={{ opacity: flipped ? [0.78, 1, 0.82] : 0.64 }}
                  transition={{ duration: 1.65, repeat: flipped ? Infinity : 0, ease: "easeInOut" }}
                />
                <motion.span
                  aria-hidden
                  className="absolute inset-y-[-18%] left-[-48%] w-[18%] rotate-12 rounded-full"
                  style={{
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.28), rgba(255,231,170,0.18), transparent)",
                    filter: "blur(6px)",
                  }}
                  animate={flipped ? { x: ["0%", "620%"], opacity: [0, 0.34, 0] } : { opacity: 0 }}
                  transition={{ duration: 3.2, repeat: flipped ? Infinity : 0, repeatDelay: 1.45, ease: "easeInOut" }}
                />
              </div>
            </motion.div>
          </button>
          <motion.svg
            viewBox="0 0 320 104"
            className="pointer-events-none absolute -bottom-[60px] left-1/2 z-[3] h-[108px] w-[330px] -translate-x-1/2 min-[420px]:w-[366px]"
            aria-hidden
            animate={{ opacity: flipped ? [0.76, 1, 0.82] : [0.30, 0.48, 0.34], scale: flipped ? [0.98, 1.035, 1] : [0.94, 1, 0.96] }}
            transition={{ duration: 2.35, repeat: Infinity, ease: "easeInOut" }}
          >
            <defs>
              <radialGradient id="referenceRevealBaseGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(255,249,224,0.95)" />
                <stop offset="38%" stopColor="rgba(255,224,154,0.42)" />
                <stop offset="68%" stopColor="rgba(224,176,100,0.14)" />
                <stop offset="100%" stopColor="rgba(255,220,152,0)" />
              </radialGradient>
              <filter id="referenceRevealBaseBlur" x="-20%" y="-80%" width="140%" height="260%">
                <feGaussianBlur stdDeviation="2.4" />
              </filter>
            </defs>
            <ellipse cx="160" cy="54" rx="106" ry="25" fill="url(#referenceRevealBaseGlow)" filter="url(#referenceRevealBaseBlur)" />
            <ellipse cx="160" cy="50" rx="76" ry="14" fill="rgba(255,249,226,0.20)" />
            <g fill="none" strokeLinecap="round">
              <ellipse cx="160" cy="52" rx="98" ry="18" stroke="rgba(255,246,213,0.82)" strokeWidth="1.15" />
              <ellipse cx="160" cy="52" rx="132" ry="31" stroke="rgba(236,197,128,0.48)" strokeWidth="0.92" />
              <ellipse cx="160" cy="52" rx="154" ry="39" stroke="rgba(223,176,101,0.20)" strokeWidth="0.72" />
              <ellipse cx="160" cy="50" rx="69" ry="9" stroke="rgba(255,252,238,0.68)" strokeWidth="0.72" />
            </g>
          </motion.svg>
          <motion.span
            aria-hidden
            className="absolute -bottom-[6px] left-1/2 h-px w-[82px] -translate-x-1/2 rounded-full"
            style={{ background: "rgba(255,241,204,0.72)", boxShadow: "0 0 18px rgba(255,222,150,0.65)" }}
            animate={{
              opacity: flipped ? [0.50, 0.98, 0.64] : [0.24, 0.42, 0.28],
            }}
            transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {!detailsReady ? (
          <motion.div
            className="mt-[64px] min-h-[142px]"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.36, ease: "easeOut" }}
          >
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: "rgba(224,187,237,0.86)" }}>
              {revealing ? "Preparing today’s tarot" : "Choosing today’s tarot"}
            </p>
            <p className="mt-2 font-serif text-[24px] font-medium leading-tight text-white/90">
              {revealing ? "Your card is arriving." : "The card is turning."}
            </p>
            <p className="mx-auto mt-3 max-w-[16rem] font-serif text-[14px] font-medium leading-snug text-white/58">
              {revealing ? "One soft second while the daily pull settles." : "The back comes forward first, then opens into today’s message."}
            </p>
          </motion.div>
        ) : (
          <motion.div
            className="mt-[50px] w-full"
            initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.46, ease: "easeOut" }}
          >
            <p className="font-sans text-[9.5px] font-semibold uppercase tracking-[0.24em]" style={{ color: "rgba(224,187,237,0.90)" }}>
              Today’s tarot
            </p>
            <h2 className="mt-2 font-serif text-[35px] font-medium leading-none text-white min-[420px]:text-[38px]">
              {report.card.cardName}
            </h2>
            <p className="mx-auto mt-3 max-w-[17rem] font-sans text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: "rgba(219,181,232,0.88)" }}>
              {keyword}
            </p>
            <p className="mx-auto mt-4 max-w-[21.25rem] font-serif text-[15.5px] font-medium leading-[1.34] text-white/78 min-[420px]:text-[16px]">
              {reading.shortAnswer}
            </p>

            <div className="mx-auto mt-4 grid w-full max-w-[286px] gap-2.5">
              <Link
                href="/app/daily"
                className="hint-pressable inline-flex h-11 items-center justify-center gap-2 rounded-full font-sans text-[13px] font-semibold"
                style={{
                  color: "rgba(86,62,96,0.90)",
                  background: "linear-gradient(145deg, rgba(244,211,247,0.96) 0%, rgba(214,174,224,0.96) 48%, rgba(192,151,207,0.94) 100%)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.58), 0 18px 34px rgba(0,0,0,0.20), 0 0 24px rgba(226,181,232,0.25)",
                }}
              >
                Read interpretation
                <Sparkles size={15} strokeWidth={1.5} />
              </Link>
              <button
                type="button"
                disabled={revealing}
                onClick={onClose}
                className="hint-pressable h-10 rounded-full border font-sans text-[13px] font-semibold disabled:opacity-60"
                style={{
                  color: "rgba(235,198,139,0.86)",
                  background: "rgba(255,244,222,0.035)",
                  borderColor: "rgba(229,193,138,0.42)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
                  backdropFilter: "blur(5px)",
                  WebkitBackdropFilter: "blur(5px)",
                }}
              >
                Return to Today
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>,
    document.body,
  );
}

function ReferenceHero({
  report,
  revealed,
  revealing,
  receiptReady,
  onReveal,
}: {
  report: DailyReport;
  revealed: boolean;
  revealing: boolean;
  receiptReady: boolean;
  onReveal: () => void | Promise<void>;
}) {
  const reading = useMemo(() => referenceDailyCardReading(report), [report]);
  const cardImage = referenceDailyCardImage(report.card.cardId);
  const keyword = report.card.keyword?.split("·")[0]?.trim() || report.card.cardName;

  function handleRevealClick() {
    triggerFeedback(revealed ? "tap" : "reveal");
    void Promise.resolve(onReveal());
  }

  return (
    <section
      className="relative min-w-0 overflow-hidden rounded-[29px] border"
      style={{
        minHeight: 222,
        background:
          "radial-gradient(circle at 76% 74%, rgba(255,235,194,0.25), transparent 30%), radial-gradient(circle at 16% 8%, rgba(255,247,242,0.54), transparent 42%), linear-gradient(105deg, rgba(239,222,218,0.96) 0%, rgba(230,207,218,0.78) 42%, rgba(190,158,188,0.60) 72%, rgba(151,121,171,0.56) 100%)",
        borderColor: "rgba(190, 126, 180, 0.145)",
        boxShadow: "0 18px 42px rgba(116, 80, 120, 0.040), 0 1px 0 rgba(255,255,255,0.66) inset, inset 0 -18px 42px rgba(107,76,119,0.016)",
      }}
    >
      <span
        aria-hidden
        className="absolute inset-x-8 top-0 h-px rounded-full"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.36), transparent)" }}
      />
      <span
        aria-hidden
        className="absolute bottom-[-4rem] right-[5.5rem] h-36 w-36 rounded-full blur-2xl"
        style={{ background: "rgba(255,235,197,0.18)" }}
      />
      <span
        aria-hidden
        className="absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 34%, rgba(84,54,46,0.050) 0 0.45px, transparent 0.85px), radial-gradient(circle at 76% 58%, rgba(255,255,255,0.16) 0 0.55px, transparent 0.95px)",
          backgroundSize: "6px 6px, 8px 8px",
          mixBlendMode: "overlay",
        }}
      />
      {revealed ? (
        <motion.div
          className="relative z-10 grid min-h-[222px] grid-cols-[minmax(0,1fr)_96px] items-center gap-3 px-5 py-4 min-[420px]:grid-cols-[minmax(0,1fr)_106px] min-[420px]:gap-3.5 min-[420px]:px-5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, ease: "easeOut" }}
        >
          <div className="min-w-0 pr-1">
            <p className="font-sans text-[8.4px] font-medium uppercase tracking-[0.22em] min-[420px]:text-[9px]" style={{ color: REFERENCE_TYPE.purple }}>
              Today’s tarot
            </p>
            <h2 className="mt-1 font-serif text-[25px] font-normal leading-none min-[420px]:text-[28px]" style={{ color: REFERENCE_TYPE.ink }}>
              {report.card.cardName}
            </h2>
            <p className="mt-1.5 line-clamp-1 font-sans text-[8.6px] font-medium uppercase tracking-[0.16em]" style={{ color: REFERENCE_TYPE.faint }}>
              {keyword}
            </p>
            <p className="mt-3 line-clamp-4 font-serif text-[13.4px] font-normal leading-[1.32] min-[420px]:text-[14.4px]" style={{ color: REFERENCE_TYPE.body }}>
              {reading.shortAnswer}
            </p>
            <button
              type="button"
              onClick={handleRevealClick}
              className="hint-pressable mt-4 inline-flex h-8 items-center rounded-full border px-3.5 font-sans text-[10.5px] font-medium"
              style={{
                color: REFERENCE_TYPE.purpleDeep,
                background: "rgba(255,252,248,0.46)",
                borderColor: "rgba(198,165,142,0.095)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.46), 0 8px 16px rgba(104,72,119,0.034)",
              }}
            >
              View card again
            </button>
          </div>
          <button
            type="button"
            onClick={handleRevealClick}
            className="hint-pressable relative mx-auto h-[164px] w-[96px] overflow-visible rounded-[15px] border-0 bg-transparent p-0 active:scale-[0.98] min-[420px]:h-[178px] min-[420px]:w-[106px]"
            aria-label={`Open today's tarot reveal for ${report.card.cardName}`}
          >
            <span
              aria-hidden
              className="absolute -bottom-5 left-1/2 h-10 w-[128px] -translate-x-1/2 rounded-full min-[420px]:w-[138px]"
              style={{
                background: "radial-gradient(ellipse, rgba(255,246,218,0.42), rgba(255,226,190,0.16) 48%, transparent 72%)",
                filter: "blur(1px)",
              }}
            />
            <span
              className="relative block h-full w-full overflow-hidden rounded-[15px] border-2"
              style={{
                borderColor: "rgba(255,239,204,0.88)",
                background: "var(--hint-deck-card-bg)",
                boxShadow:
                  "0 18px 30px rgba(75,50,88,0.14), 0 0 18px rgba(255,225,168,0.26), inset 0 1px 0 rgba(255,255,255,0.62)",
              }}
            >
              {cardImage ? (
                <SafeImage
                  src={cardImage}
                  alt={report.card.cardName}
                  loading="eager"
                  className="h-full w-full object-cover"
                  fallbackClassName="h-full w-full rounded-[15px]"
                  fallbackLabel={report.card.cardName}
                />
              ) : (
                <CardSigil cardId={report.card.cardId} />
              )}
              <motion.span
                aria-hidden
                className="absolute inset-[-2px] rounded-[16px]"
                style={{ boxShadow: "inset 0 0 0 2px rgba(255,242,214,0.78), 0 0 14px rgba(255,225,168,0.36)" }}
                animate={{ opacity: [0.56, 0.92, 0.60] }}
                transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
              />
            </span>
          </button>
        </motion.div>
      ) : (
        <div className="relative min-h-[222px]">
          <div className="relative z-10 flex min-h-[222px] w-[55%] flex-col pl-6 pr-0 pt-[36px]">
            <h2 className="font-serif text-[34px] font-normal leading-[1.02]" style={{ color: REFERENCE_TYPE.ink }}>
              Your Hint<br />
              is <span className="italic" style={{ color: REFERENCE_TYPE.purple }}>waiting.</span>
            </h2>
            <p
              className="mt-3 max-w-[9.8rem] font-serif text-[14px] font-normal leading-[1.32]"
              style={{ color: REFERENCE_TYPE.body }}
            >
              The universe left you a little note.
            </p>
            <button
              type="button"
              disabled={!receiptReady || revealing}
              onClick={handleRevealClick}
              aria-busy={revealing ? "true" : "false"}
              className="hint-pressable mt-[17px] inline-flex h-[38px] w-full max-w-[170px] items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 font-serif text-[13.2px] active:scale-[0.98] disabled:opacity-75"
              style={{
                color: "#fff8f4",
                background: "linear-gradient(145deg, #9d7daf 0%, #87689d 48%, #725584 100%)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.32), inset 0 -8px 16px rgba(67,42,80,0.09), 0 12px 20px rgba(104,72,119,0.10)",
              }}
            >
              {revealing ? "Opening Today’s Hint" : receiptReady ? "Reveal Today’s Hint" : "Preparing Today’s Hint"}
              <span aria-hidden className="shrink-0 text-[16px] leading-none">✦</span>
            </button>
          </div>
          <ReferenceHeroArt
            className="absolute inset-0"
            revealed={false}
            revealing={revealing}
            receiptReady={receiptReady}
            report={report}
            onCardActivate={handleRevealClick}
          />
        </div>
      )}
    </section>
  );
}

function ReferenceScoreItem({ score, isLast }: { score: DailyScore; isLast: boolean }) {
  const Icon = REFERENCE_SCORE_ICONS[score.key];

  return (
    <div className={["min-w-0 px-1 text-center", isLast ? "" : "border-r"].join(" ")} style={{ borderColor: "rgba(198, 165, 142, 0.050)" }}>
      <div className="flex min-w-0 items-center justify-center gap-1">
        <Icon className="shrink-0" size={14.5} strokeWidth={1.35} style={{ color: score.tone }} />
        <p className="whitespace-nowrap font-sans text-[9.2px] font-normal leading-none min-[420px]:text-[9.8px]" style={{ color: REFERENCE_TYPE.body }}>
          {score.label}
        </p>
      </div>
      <p
        className="mt-1.5 flex h-[20px] items-center justify-center text-center font-serif text-[17px] leading-none tabular-nums min-[420px]:text-[18px]"
        style={{
          color: REFERENCE_TYPE.ink,
          fontVariantNumeric: "lining-nums tabular-nums",
          fontFeatureSettings: '"lnum" 1, "tnum" 1',
        }}
      >
        {score.score}
      </p>
    </div>
  );
}

function ReferenceEnergyValue({ score }: { score: number }) {
  return (
    <div className="relative ml-1.5 mt-2 h-[64px] w-[104px] min-[420px]:ml-2 min-[420px]:h-[70px] min-[420px]:w-[116px]">
      <span
        aria-hidden
        className="absolute left-3 top-2 size-10 rounded-full min-[420px]:left-4 min-[420px]:size-11"
        style={{
          background: "radial-gradient(circle, rgba(255,247,223,0.58), rgba(255,232,205,0.14) 58%, transparent 72%)",
          filter: "blur(1.2px)",
        }}
      />
      <span
        aria-hidden
        className="absolute right-1 top-[19px] text-[17px] min-[420px]:right-2 min-[420px]:top-[21px] min-[420px]:text-[18px]"
        style={{
          color: "rgba(214,160,95,0.30)",
          textShadow: "0 0 12px rgba(255,232,189,0.44)",
        }}
      >
        ✦
      </span>
      <div className="absolute left-1.5 top-[8px] flex items-end">
        <span
          className="font-serif text-[50px] leading-[0.78] min-[420px]:text-[56px]"
          style={{ color: REFERENCE_TYPE.score, fontVariantNumeric: "proportional-nums lining-nums" }}
        >
          {score}
        </span>
        <span className="mb-[6px] ml-1 font-sans text-[10.5px] font-normal leading-none min-[420px]:mb-[7px] min-[420px]:ml-1.5 min-[420px]:text-[11.5px]" style={{ color: REFERENCE_TYPE.muted }}>
          /100
        </span>
      </div>
    </div>
  );
}

function ReferenceMoonScene() {
  return (
    <div
      aria-hidden
      className="relative size-[72px] shrink-0 overflow-hidden rounded-full min-[420px]:size-[82px]"
      style={{
        background: "linear-gradient(145deg, rgba(60, 38, 80, 0.72), rgba(34, 28, 54, 0.92))",
        boxShadow: "0 14px 24px rgba(72, 46, 84, 0.07), inset 0 1px 0 rgba(255,255,255,0.18)",
      }}
    >
      <SafeImage
        src={REFERENCE_HOME_ASSETS.moonScene}
        alt=""
        className="h-full w-full object-cover"
        fallbackClassName="h-full w-full bg-[#3a274d]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18)" }}
      />
    </div>
  );
}

function ReferenceEnergyPanel({
  report,
  revealed,
}: {
  report: DailyReport;
  revealed: boolean;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const scores = report.scores;
  const themeTitle = referenceThemeTitle(report);
  const themeLine = referenceThemeLine(report);

  return (
    <section
      id="today-summary"
      className="relative min-w-0 overflow-hidden rounded-[28px] border px-4 pb-1 pt-4"
      style={{
        background: REFERENCE_CARD_BACKGROUND,
        borderColor: REFERENCE_CARD_BORDER,
        boxShadow: REFERENCE_CARD_SHADOW,
      }}
    >
      <span
        aria-hidden
        className="absolute inset-x-8 top-0 h-px rounded-full"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.52), transparent)" }}
      />
      <div className="relative grid grid-cols-[104px_minmax(0,1fr)_72px] items-start gap-3 min-[420px]:grid-cols-[116px_minmax(0,1fr)_82px] min-[420px]:gap-4">
        <div className="relative min-w-0">
          <p className="font-sans text-[9.2px] font-medium uppercase tracking-[0.22em]" style={{ color: REFERENCE_TYPE.label }}>
            Today’s energy
          </p>
          <ReferenceEnergyValue score={report.overallScore} />
        </div>
        <div
          className="min-w-0 border-l pl-3 min-[420px]:pl-4"
          style={{ borderColor: "rgba(198, 158, 129, 0.060)" }}
        >
          <p className="font-sans text-[9.2px] font-medium uppercase tracking-[0.22em]" style={{ color: REFERENCE_TYPE.label }}>
            Today’s theme
          </p>
          <p className="mt-1.5 font-serif text-[25px] font-normal leading-none min-[420px]:mt-2 min-[420px]:text-[27px]" style={{ color: REFERENCE_TYPE.ink }}>
            {themeTitle}
          </p>
          <p className="mt-1.5 line-clamp-2 font-serif text-[12.8px] font-normal leading-[1.30] min-[420px]:mt-2 min-[420px]:text-[13.8px] min-[420px]:leading-[1.30]" style={{ color: REFERENCE_TYPE.muted }}>
            {themeLine}
          </p>
        </div>
        <div className="self-start">
          <ReferenceMoonScene />
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          triggerFeedback("select");
          setDetailsOpen((open) => !open);
        }}
        aria-expanded={detailsOpen}
        aria-label="Tap to see more details"
        className="hint-pressable relative mt-2 flex w-full items-center gap-2 rounded-[22px] border px-3.5 py-1 text-left active:scale-[0.99]"
        style={{
          background: "rgba(255,253,249,0.62)",
          borderColor: "rgba(199, 160, 128, 0.075)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.58), 0 9px 18px rgba(96, 75, 61, 0.012)",
        }}
      >
        <div className="grid min-w-0 flex-1 grid-cols-5 items-center">
          {scores.map((score, index) => (
            <ReferenceScoreItem key={score.key} score={score} isLast={index === scores.length - 1} />
          ))}
        </div>
        <span
          className="grid size-7 shrink-0 place-items-center rounded-full"
          style={{
            color: "#fff8fb",
            background: "linear-gradient(145deg, rgba(200, 158, 198, 0.62), rgba(172, 123, 179, 0.68))",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.40), 0 7px 16px rgba(146,86,154,0.050)",
          }}
        >
          <motion.span animate={{ rotate: detailsOpen ? 180 : 0 }} transition={{ duration: 0.22, ease: "easeOut" }}>
            <ChevronDown size={15} strokeWidth={2} />
          </motion.span>
        </span>
      </button>
      <button
        type="button"
        onClick={() => {
          triggerFeedback("select");
          setDetailsOpen((open) => !open);
        }}
        className="hint-pressable mx-auto mt-0.5 flex items-center justify-center gap-2 px-2 py-0 font-sans text-[9px] font-normal"
        style={{ color: "#91878e" }}
      >
        <span aria-hidden style={{ color: "rgba(214, 160, 95, 0.48)" }}>
          ✦
        </span>
        Tap to see more details
      </button>
      {detailsOpen ? (
        <div
          className="relative mt-3 overflow-hidden rounded-[18px] border px-4 py-3"
          style={{
            background:
              "radial-gradient(circle at 16% 8%, rgba(255,244,214,0.22), transparent 28%), radial-gradient(circle at 78% 18%, rgba(205,171,220,0.09), transparent 30%), linear-gradient(145deg, rgba(255,252,248,0.36), rgba(255,246,241,0.24))",
            borderColor: "rgba(196, 163, 137, 0.052)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.30), 0 10px 22px rgba(116,90,74,0.010)",
          }}
        >
          <span
            aria-hidden
            className="absolute -left-10 top-1/2 h-20 w-44 -translate-y-1/2 rounded-full blur-2xl"
            style={{ background: "rgba(217, 174, 198, 0.18)" }}
          />
          <span
            aria-hidden
            className="absolute right-6 top-4 text-[18px]"
            style={{ color: "rgba(209, 165, 111, 0.42)" }}
          >
            ✦
          </span>
          <p className="font-serif text-[16px] leading-snug" style={{ color: REFERENCE_TYPE.inkSoft }}>
            {report.title}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
            {scores.map((score) => (
              <p key={score.key} className="flex items-center justify-between gap-3 font-sans text-[11px]" style={{ color: REFERENCE_TYPE.muted }}>
                <span>{score.label}</span>
                <span className="font-serif text-[15px] tabular-nums" style={{ color: REFERENCE_TYPE.ink }}>{score.score}</span>
              </p>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ReferenceSkyEvidenceArt() {
  return (
    <div aria-hidden className="pointer-events-none relative h-[48px] w-[88px] overflow-visible">
      <svg viewBox="0 0 118 72" className="absolute inset-0 h-full w-full overflow-visible" style={{ transform: "rotate(-8deg)" }}>
        <defs>
          <radialGradient id="sky-evidence-planet-fill" cx="32%" cy="22%" r="82%">
            <stop offset="0" stopColor="#fff0df" />
            <stop offset="0.34" stopColor="#edd8dc" />
            <stop offset="0.68" stopColor="#d6b9d2" />
            <stop offset="1" stopColor="#b58ebe" />
          </radialGradient>
        </defs>
        <g fill="rgba(214, 160, 95, 0.38)">
          <circle cx="18" cy="38" r="1" />
          <circle cx="103" cy="23" r="0.9" />
          <circle cx="35" cy="12" r="0.75" />
          <circle cx="95" cy="52" r="0.85" />
        </g>
        <g stroke="rgba(226, 178, 124, 0.34)" strokeLinecap="round">
          <path d="M22 49 L22 55 M19 52 L25 52" />
          <path d="M109 39 L109 43 M107 41 L111 41" opacity="0.70" />
        </g>
        <path
          d="M18 40 C45 28 84 28 110 37"
          fill="none"
          stroke="rgba(221, 170, 112, 0.26)"
          strokeLinecap="round"
          strokeWidth="0.78"
        />
        <circle
          cx="64"
          cy="35"
          r="22"
          fill="url(#sky-evidence-planet-fill)"
          filter="drop-shadow(0 10px 16px rgba(125, 86, 132, 0.08))"
        />
        <path d="M48 21 C58 28 72 32 84 31" fill="none" stroke="rgba(255,255,255,0.20)" strokeLinecap="round" strokeWidth="0.68" />
        <path d="M47 48 C58 43 74 44 83 50" fill="none" stroke="rgba(116,77,132,0.14)" strokeLinecap="round" strokeWidth="0.8" />
        <circle cx="64" cy="35" r="22" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="0.72" />
        <g fill="none" strokeLinecap="round">
          <path d="M14 41 C41 52 85 51 111 36" stroke="rgba(246, 212, 168, 0.62)" strokeWidth="0.92" />
          <path d="M25 39 C50 32 82 31 104 36" stroke="rgba(210, 158, 118, 0.28)" strokeWidth="0.68" />
        </g>
      </svg>
    </div>
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function polishSkyLogicLine(line: string, cardId: string | undefined, cardName: string) {
  if (!cardId) return line;
  return line.replace(new RegExp(`\\b${escapeRegExp(cardId)}\\b`, "i"), cardName);
}

const SKY_BODY_COPY: Record<string, { why: string; brings: string }> = {
  sun: {
    why: "The Sun describes identity, clarity, and the part of you that wants to be seen plainly.",
    brings: "It can bring confidence, visibility, and a clearer sense of direction.",
  },
  moon: {
    why: "The Moon describes emotional rhythm, instinct, and what your body notices before your mind explains it.",
    brings: "It can bring mood, intuition, memory, and a need for emotional honesty.",
  },
  mercury: {
    why: "Mercury describes language, timing, questions, and the way information moves through the day.",
    brings: "It can bring messages, decisions, useful conversations, or a cleaner way to say the truth.",
  },
  venus: {
    why: "Venus describes affection, desire, self-worth, pleasure, and the values behind your choices.",
    brings: "It can bring relationship mirrors, money/value questions, softness, attraction, or a need to receive better.",
  },
  mars: {
    why: "Mars describes will, friction, momentum, and the part of you that wants to act.",
    brings: "It can bring courage, urgency, tension, or the energy to move something forward.",
  },
  jupiter: {
    why: "Jupiter describes growth, belief, perspective, and where life wants more room.",
    brings: "It can bring openings, generosity, learning, or a bigger frame for the situation.",
  },
  saturn: {
    why: "Saturn describes limits, responsibility, patience, and what needs to become real.",
    brings: "It can bring boundaries, commitment, maturity, delayed timing, or the need to choose carefully.",
  },
  neptune: {
    why: "Neptune describes dreams, sensitivity, longing, and places where the facts can blur.",
    brings: "It can bring imagination, compassion, confusion, or a reminder to check the story against reality.",
  },
  pluto: {
    why: "Pluto describes attachment, release, power, and the pattern underneath the obvious pattern.",
    brings: "It can bring transformation, intensity, truth beneath the surface, or a clean ending.",
  },
};

const SKY_ASPECT_COPY: Record<NonNullable<SkySignal["aspect"]>, { why: string; brings: string }> = {
  conjunct: {
    why: "A conjunction blends two signals together, so the theme becomes louder and harder to ignore.",
    brings: "It can bring concentration: one issue asks for your full attention.",
  },
  sextile: {
    why: "A sextile opens a quieter door; the signal is useful if you choose to work with it.",
    brings: "It can bring cooperation, small openings, and a chance to make something easier.",
  },
  square: {
    why: "A square creates pressure, which is why this signal may feel impossible to dismiss.",
    brings: "It can bring friction, motivation, and a practical need to adjust your approach.",
  },
  trine: {
    why: "A trine lets energy flow more naturally, so the signal may arrive as ease or support.",
    brings: "It can bring grace, recovery, and a smoother path through the theme.",
  },
  opposite: {
    why: "An opposition puts two sides across from each other, asking for contrast and balance.",
    brings: "It can bring reflection, relationship mirrors, distance, or a choice that needs honesty.",
  },
};

const SKY_HOUSE_FOCUS: Record<number, string> = {
  1: "identity, first impressions, and what you are ready to claim",
  2: "self-worth, money, comfort, and what feels genuinely valuable",
  3: "messages, learning, siblings, neighbors, and the next honest conversation",
  4: "home, family, privacy, memory, and emotional roots",
  5: "creativity, desire, play, romance, and what wants to be expressed",
  6: "routines, health, service, and the small habits that change the day",
  7: "partnership, projection, attraction, and one-to-one dynamics",
  8: "intimacy, trust, shared resources, fear, and transformation",
  9: "meaning, belief, study, travel, and the bigger truth behind the moment",
  10: "career, direction, responsibility, and what is visible to others",
  11: "friends, community, hopes, networks, and the future you are moving toward",
  12: "rest, dreams, hidden feelings, closure, and what needs quiet space",
};

function formatEvidenceList(values: string[], fallback: string) {
  const unique = Array.from(new Set(values.filter(Boolean)));
  if (unique.length === 0) return fallback;
  if (unique.length === 1) return unique[0]!;
  if (unique.length === 2) return `${unique[0]} and ${unique[1]}`;
  return `${unique.slice(0, -1).join(", ")}, and ${unique[unique.length - 1]}`;
}

function evidenceFallbackSignals(): SkySignal[] {
  return [
    {
      id: "reference-venus-saturn",
      label: "Venus conjunct Saturn",
      bodies: ["venus", "saturn"],
      aspect: "conjunct",
      strength: 78,
      themes: ["relationshipTension", "selfWorth", "boundary", "waiting"],
    },
    {
      id: "reference-moon-9th",
      label: "Moon in the 9th house",
      bodies: ["moon"],
      house: 9,
      strength: 74,
      themes: ["emotionalFear", "healing", "growth", "truth"],
    },
  ];
}

function skySignalSymbol(signal: SkySignal, index: number) {
  const bodies = signal.bodies.map((body) => body.toLowerCase());
  if (bodies.includes("moon")) return "☽";
  if (bodies.includes("venus")) return "♀";
  if (bodies.includes("mercury")) return "☿";
  if (bodies.includes("sun")) return "☉";
  if (bodies.includes("saturn")) return "♄";
  return index === 0 ? "☉" : "☽";
}

function themeLabelsForSignal(signal: SkySignal, fallbackLabels: string[]) {
  const labels = (signal.themes ?? []).map((theme) => THEME_LABELS[theme]).filter(Boolean);
  return labels.length > 0 ? labels : fallbackLabels;
}

function skySignalExplanation({
  signal,
  report,
  fallbackThemeLabels,
}: {
  signal: SkySignal;
  report: DailyReport;
  fallbackThemeLabels: string[];
}) {
  const bodies = signal.bodies.map((body) => body.toLowerCase());
  const bodyWhy = bodies.map((body) => SKY_BODY_COPY[body]?.why).filter(Boolean);
  const bodyBrings = bodies.map((body) => SKY_BODY_COPY[body]?.brings).filter(Boolean);
  const aspect = signal.aspect ? SKY_ASPECT_COPY[signal.aspect] : null;
  const houseFocus = signal.house ? SKY_HOUSE_FOCUS[signal.house] : null;
  const themes = formatEvidenceList(themeLabelsForSignal(signal, fallbackThemeLabels).slice(0, 3), "today's strongest theme");
  const bodyLine = formatEvidenceList(bodyWhy.slice(0, 2), "This is one of today's stronger sky signals.");
  const bringsLine = formatEvidenceList(bodyBrings.slice(0, 2), "It can make today's pattern easier to notice.");

  return {
    why: [
      `${signal.label} is one of the signals Hint used for today's card.`,
      bodyLine,
      aspect?.why,
      houseFocus ? `The house placement points it toward ${houseFocus}.` : null,
      `That is why ${report.card.cardName} leans toward ${themes}.`,
    ]
      .filter(Boolean)
      .join(" "),
    brings: [
      `It may bring ${themes} into focus today.`,
      bringsLine,
      aspect?.brings,
      "Use it as context for the hint, not as a fixed prediction.",
    ]
      .filter(Boolean)
      .join(" "),
  };
}

function ReferenceEvidencePanel({ report }: { report: DailyReport }) {
  const [expanded, setExpanded] = useState(false);
  const [activeEvidenceId, setActiveEvidenceId] = useState<string | null>(null);
  const sky = report.card.skyGuided;
  const reading = useMemo(
    () =>
      sky
        ? generateSkyCardReading({
            cardId: report.card.cardId,
            cardName: report.card.cardName,
            cardWhisper: report.card.whisper,
            sky,
            tone: sky.tone,
      })
        : null,
    [report.card.cardId, report.card.cardName, report.card.whisper, sky],
  );
  const evidenceSignals = useMemo(() => (sky?.evidence?.length ? sky.evidence.slice(0, 2) : evidenceFallbackSignals()), [sky?.evidence]);
  const activeEvidence = evidenceSignals.find((signal) => signal.id === activeEvidenceId) ?? null;
  const activeEvidenceExplanation = activeEvidence
    ? skySignalExplanation({
        signal: activeEvidence,
        report,
        fallbackThemeLabels: sky?.themeLabels ?? [],
      })
    : null;
  const detailLines = (reading?.whyThisCard ?? [report.astrologyNote, report.summary])
    .slice(0, 3)
    .map((line) => polishSkyLogicLine(line, sky?.selectedCardId ?? report.card.cardId, report.card.cardName));

  useEffect(() => {
    if (activeEvidenceId && !evidenceSignals.some((signal) => signal.id === activeEvidenceId)) {
      setActiveEvidenceId(null);
    }
  }, [activeEvidenceId, evidenceSignals]);

  return (
    <section
      className="relative min-w-0 rounded-[24px] border px-4 py-2"
      style={{
        background: REFERENCE_CARD_BACKGROUND,
        borderColor: REFERENCE_CARD_BORDER,
        boxShadow: REFERENCE_CARD_SHADOW,
      }}
    >
      <span
        aria-hidden
        className="absolute inset-x-10 top-0 h-px rounded-full"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.48), transparent)" }}
      />
      <div className="min-h-[48px] pr-[128px] min-[420px]:pr-[136px]">
        <div className="min-w-0">
          <h3 className="font-serif text-[18.5px] font-normal leading-none" style={{ color: REFERENCE_TYPE.ink }}>
            Why this hint?
          </h3>
          <div className="mt-2 flex flex-nowrap gap-2.5">
            {evidenceSignals.map((signal, index) => {
              const selected = activeEvidenceId === signal.id;
              return (
                <button
                  type="button"
                  key={signal.id}
                  aria-pressed={selected}
                  onClick={() => {
                    triggerFeedback("select");
                    setActiveEvidenceId((current) => (current === signal.id ? null : signal.id));
                  }}
                  className="hint-pressable inline-flex min-h-[25px] max-w-full min-w-0 items-center gap-1 rounded-full border px-2 font-sans text-[8.4px] leading-none active:scale-[0.98] min-[420px]:gap-1.5 min-[420px]:px-2.5 min-[420px]:text-[9.4px]"
                  style={{
                    color: selected ? REFERENCE_TYPE.inkSoft : REFERENCE_TYPE.muted,
                    background: selected ? "rgba(255, 253, 250, 0.70)" : "rgba(255, 250, 246, 0.38)",
                    borderColor: selected ? "rgba(178, 127, 184, 0.13)" : "rgba(198, 165, 142, 0.055)",
                    boxShadow: selected
                      ? "inset 0 1px 0 rgba(255,255,255,0.48), 0 7px 16px rgba(145, 102, 143, 0.025)"
                      : "inset 0 1px 0 rgba(255,255,255,0.34)",
                  }}
                >
                  <span style={{ color: index === 0 ? "#d39b69" : "#a77caf" }}>{skySignalSymbol(signal, index)}</span>
                  <span className="truncate whitespace-nowrap">{signal.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {activeEvidence && activeEvidenceExplanation ? (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="relative mt-2 rounded-[17px] border px-3 py-2.5"
          style={{
            background: "rgba(255,253,249,0.55)",
            borderColor: "rgba(198, 165, 142, 0.048)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.34)",
          }}
        >
          <p className="font-sans text-[8.2px] font-medium uppercase tracking-[0.18em]" style={{ color: REFERENCE_TYPE.faint }}>
            {activeEvidence.label}
          </p>
          <div className="mt-1.5 grid gap-1.5">
            <p className="font-sans text-[9.8px] font-normal leading-snug" style={{ color: REFERENCE_TYPE.body }}>
              <span className="mr-1 font-medium uppercase tracking-[0.14em]" style={{ color: REFERENCE_TYPE.purpleDeep }}>
                Why
              </span>
              {activeEvidenceExplanation.why}
            </p>
            <p className="font-sans text-[9.8px] font-normal leading-snug" style={{ color: REFERENCE_TYPE.muted }}>
              <span className="mr-1 font-medium uppercase tracking-[0.14em]" style={{ color: "#b58d71" }}>
                Brings
              </span>
              {activeEvidenceExplanation.brings}
            </p>
          </div>
        </motion.div>
      ) : null}

      <button
        type="button"
        onClick={() => {
          triggerFeedback("select");
          setExpanded((open) => !open);
        }}
        aria-expanded={expanded}
        className="hint-pressable absolute right-4 top-2.5 flex w-max min-w-[102px] flex-col items-end text-right active:scale-[0.98] min-[420px]:right-5 min-[420px]:min-w-[116px]"
        style={{ position: "absolute", color: REFERENCE_TYPE.purpleDeep }}
      >
        <span className="inline-flex items-center gap-1 whitespace-nowrap font-serif text-[14px] font-normal" style={{ color: REFERENCE_TYPE.purpleDeep }}>
          Sky Evidence ✦
          <ChevronDown
            size={12}
            strokeWidth={2}
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 180ms ease" }}
          />
        </span>
        <span className="-mt-1.5">
          <ReferenceSkyEvidenceArt />
        </span>
      </button>

      {expanded ? (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="mt-3 rounded-[18px] border px-3.5 py-2.5"
          style={{
            background: "linear-gradient(145deg, rgba(255,252,248,0.34), rgba(255,246,241,0.23))",
            borderColor: "rgba(198, 165, 142, 0.045)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.24)",
          }}
        >
          <div className="grid gap-2">
            {detailLines.map((line, index) => (
              <p key={`${line}-${index}`} className="font-sans text-[10.6px] leading-snug" style={{ color: REFERENCE_TYPE.body }}>
                <span className="mr-1.5 text-[9px] uppercase tracking-[0.14em]" style={{ color: "#b58d71" }}>
                  {index + 1}
                </span>
                {line}
              </p>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/app/astrology"
              onPointerDown={() => triggerFeedback("select")}
              className="hint-pressable inline-flex h-8 items-center rounded-full border px-3 font-serif text-[12px] active:scale-[0.98]"
              style={{
                color: "#836a7d",
                background: "rgba(255, 251, 246, 0.52)",
                borderColor: "rgba(198, 165, 142, 0.085)",
              }}
            >
              Open sky map
            </Link>
            {sky ? (
              <Link
                href="/app/ask"
                onPointerDown={() => triggerFeedback("select")}
                className="hint-pressable inline-flex h-8 items-center rounded-full px-3 font-serif text-[12px] active:scale-[0.98]"
                style={{
                  color: "#fff8f4",
                  background: "linear-gradient(145deg, #9775a8, #765985)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.28), 0 10px 18px rgba(104,72,119,0.12)",
                }}
              >
                Ask about this hint
              </Link>
            ) : null}
          </div>
        </motion.div>
      ) : null}
    </section>
  );
}

function ReferenceSpaces({ cards }: { cards: RoomShortcutData[] }) {
  return (
    <section className="min-w-0 pt-0.5">
      <div className="mb-1.5 flex items-center gap-3 px-1">
        <p className="shrink-0 font-sans text-[9.5px] font-medium uppercase tracking-[0.24em]" style={{ color: REFERENCE_TYPE.label }}>
          Your spaces
        </p>
        <span className="h-px flex-1" style={{ background: "linear-gradient(90deg, rgba(181,150,128,0.22), rgba(181,150,128,0.06), transparent)" }} />
        <span aria-hidden className="text-[15px] leading-none" style={{ color: "rgba(214, 160, 95, 0.46)" }}>
          ✦
        </span>
      </div>
      <div className="grid min-w-0 grid-cols-4 gap-2">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ delay: index * 0.05, duration: 0.38, ease: "easeOut" }}
              className="min-w-0"
            >
              <Link href={card.href} onPointerDown={() => triggerFeedback("select")} className="block h-full">
                <div
                  className="hint-pressable relative isolate flex h-[110px] flex-col items-center overflow-hidden rounded-[18px] border px-2 py-2.5 text-center active:scale-[0.98] min-[420px]:h-[116px] min-[420px]:px-2.5"
                  style={{
                    background: REFERENCE_CARD_BACKGROUND,
                    borderColor: REFERENCE_CARD_BORDER,
                    boxShadow: "0 10px 24px rgba(100,77,60,0.016), inset 0 1px 0 rgba(255,255,255,0.42)",
                  }}
                >
                  <span
                    aria-hidden
                    className="absolute inset-x-4 top-0 h-px rounded-full"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.46), transparent)" }}
                  />
                  <span
                    className="relative mx-auto grid size-[40px] shrink-0 place-items-center overflow-hidden rounded-full border min-[420px]:size-[44px]"
                    style={{
                      color: card.color,
                      background: `radial-gradient(circle at 33% 24%, rgba(255,255,255,0.78), transparent 34%), radial-gradient(circle at 68% 78%, color-mix(in srgb, ${card.color} 16%, transparent), transparent 52%), ${card.tint}`,
                      borderColor: `color-mix(in srgb, ${card.color} 5%, rgba(188,156,132,0.055))`,
                      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.34), inset 0 -10px 18px rgba(98,72,92,0.024), 0 7px 14px color-mix(in srgb, ${card.color} 3%, transparent)`,
                    }}
                  >
                    <span
                      aria-hidden
                      className="absolute inset-[6px] rounded-full border"
                      style={{ borderColor: "rgba(255,255,255,0.30)" }}
                    />
                    <Icon size={18} strokeWidth={1.2} />
                  </span>
                  <h3 className="mt-2 w-full text-center font-serif text-[12px] font-normal leading-tight min-[420px]:text-[12.8px]" style={{ color: REFERENCE_TYPE.ink }}>
                    {card.title}
                  </h3>
                  <p className="mx-auto mt-0.5 max-w-[70px] text-center font-sans text-[7.7px] font-normal leading-[1.22] min-[420px]:max-w-[78px] min-[420px]:text-[8.3px] min-[420px]:leading-[1.24]" style={{ color: REFERENCE_TYPE.muted }}>
                    {card.body}
                  </p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function ReferenceHomePage({
  report,
  date,
  language,
  roomShortcuts,
  dailyCardRevealed,
  dailyCardRevealing,
  dailyReceiptReady,
  dailyRevealOverlayOpen,
  onReveal,
  onCloseRevealOverlay,
  onCardRevealed,
}: {
  report: DailyReport;
  date: string;
  language: string;
  roomShortcuts: RoomShortcutData[];
  dailyCardRevealed: boolean;
  dailyCardRevealing: boolean;
  dailyReceiptReady: boolean;
  dailyRevealOverlayOpen: boolean;
  onReveal: () => void | Promise<void>;
  onCloseRevealOverlay: () => void;
  onCardRevealed: () => void;
}) {
  return (
    <div
      className="reference-home-crisp relative h-full w-full overflow-x-hidden overflow-y-auto overscroll-none pb-[calc(8.75rem+var(--hint-safe-bottom))]"
      style={{
        background:
          "radial-gradient(520px 380px at 8% -4%, rgba(237,222,213,0.26), transparent 72%), radial-gradient(460px 340px at 94% 4%, rgba(230,203,167,0.15), transparent 74%), radial-gradient(560px 480px at 52% 55%, rgba(216,196,185,0.060), transparent 76%), linear-gradient(180deg, #fcf9f4 0%, #f8f3ed 52%, #f5eee7 100%)",
      }}
    >
      <ReferenceOrbitBackdrop />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(95, 72, 51, 0.030) 0 0.45px, transparent 0.7px), radial-gradient(circle at 70% 72%, rgba(126, 93, 68, 0.022) 0 0.55px, transparent 0.9px), linear-gradient(90deg, rgba(255,255,255,0.16), transparent 42%, rgba(120,86,60,0.018))",
          backgroundSize: "7px 7px, 11px 11px, 100% 100%",
          opacity: 0.50,
          mixBlendMode: "multiply",
        }}
      />
      <div className="relative z-10 mx-auto w-full max-w-[430px] px-[23px] pt-[calc(2.1rem+var(--hint-safe-top))]">
        <header className="mb-2 flex items-start justify-between gap-5">
          <div className="min-w-0 pl-[9px]">
            <p className="font-sans text-[9.2px] font-medium uppercase tracking-[0.24em]" style={{ color: REFERENCE_TYPE.label }}>
              {formatReferenceDate(date, language)}
            </p>
            <h1 className="mt-1.5 font-serif text-[37px] font-normal leading-[0.92]" style={{ color: REFERENCE_TYPE.ink }}>
              Today
            </h1>
            <p className="mt-1.5 font-serif text-[14.2px] font-normal leading-none" style={{ color: REFERENCE_TYPE.muted }}>
              A small signal from today’s sky.
            </p>
          </div>
          <ReferenceHintLogo />
        </header>

        <div className="grid min-w-0 gap-4">
          <ReferenceHero
            report={report}
            revealed={dailyCardRevealed}
            revealing={dailyCardRevealing}
            receiptReady={dailyReceiptReady}
            onReveal={onReveal}
          />
          <ReferenceEnergyPanel report={report} revealed={dailyCardRevealed} />
          <ReferenceEvidencePanel report={report} />
          <ReferenceSpaces cards={roomShortcuts} />
        </div>
      </div>
      <ReferenceDailyRevealOverlay
        open={dailyRevealOverlayOpen}
        revealing={dailyCardRevealing}
        report={report}
        onClose={onCloseRevealOverlay}
        onCardRevealed={onCardRevealed}
      />
    </div>
  );
}

export function HomeDashboard() {
  const { language, t } = useLanguage();
  const { profile } = useProfile();
  const initialDailySignalComplete = useMemo(
    () => hasCompletedDailySignalIntro(getAnonId(), getLocalDateString()),
    [],
  );
  const [birthProfile, setBirthProfile] = useState(() => readBirthProfile());
  const [ritual, setRitual] = useState(() => getRitualProgress());
  const [dailyCardRevealed, setDailyCardRevealed] = useState(initialDailySignalComplete);
  const [dailyCardRevealing, setDailyCardRevealing] = useState(false);
  const [dailyRevealOverlayOpen, setDailyRevealOverlayOpen] = useState(false);
  const [signalIntroComplete, setSignalIntroComplete] = useState(initialDailySignalComplete);
  const [dailyReceipt, setDailyReceipt] = useState<DailyReceipt | null>(null);
  const [dailyReceiptReady, setDailyReceiptReady] = useState(false);
  const activeBirthDetails = profile?.birthDate || birthProfile
    ? {
        birthDate: profile?.birthDate ?? birthProfile?.birthDate,
        birthTime: profile?.birthTime ?? birthProfile?.birthTime,
        birthPlace: profile?.birthPlace ?? birthProfile?.birthPlace,
        latitude: birthProfile?.latitude,
        longitude: birthProfile?.longitude,
        timezoneOffset: birthProfile?.timezoneOffset,
      }
    : null;
  const dailyHistory = useMemo(
    () => listLocalDailyReadingMemory().slice(0, 30),
    [dailyCardRevealed, dailyReceipt?.dailyKey],
  );
  const report = useMemo(
    () => {
      const baseReport = getDailyReport({
        anonId: getAnonId(),
        date: dailyReceipt?.dailyKey ? parseServerDailyKey(dailyReceipt.dailyKey) : undefined,
        language,
        birthDetails: activeBirthDetails ?? undefined,
        dailyHistory,
        ritualStreak: ritual.currentStreak,
      });
      if (!dailyReceipt?.assignedCardId) return baseReport;
      return {
        ...baseReport,
        card: {
          ...getDailyPullById(dailyReceipt.assignedCardId, language),
          skyGuided: baseReport.card.skyGuided,
        },
      };
    },
    [
      activeBirthDetails?.birthDate,
      activeBirthDetails?.birthPlace,
      activeBirthDetails?.birthTime,
      activeBirthDetails?.latitude,
      activeBirthDetails?.longitude,
      activeBirthDetails?.timezoneOffset,
      dailyHistory,
      dailyReceipt?.assignedCardId,
      dailyReceipt?.dailyKey,
      language,
      ritual.currentStreak,
    ],
  );

  useEffect(() => {
    let mounted = true;
    setDailyReceiptReady(false);
    getOrCreateDailyReceipt("daily-card", {
      fallbackAssignedCardId: report.card.cardId,
    }).then((receipt) => {
      if (!mounted) return;
      const receiptAnonId = receipt.anonId || getAnonId();
      const openedToday = Boolean(receipt.openedAt);
      setDailyReceipt(receipt);
      setDailyCardRevealed(openedToday);
      setSignalIntroComplete(
        openedToday || hasCompletedDailySignalIntro(receiptAnonId, receipt.dailyKey),
      );
      if (openedToday) markDailySignalIntroComplete(receiptAnonId, receipt.dailyKey);
      setDailyReceiptReady(true);
    });
    return () => {
      mounted = false;
    };
  }, [report.card.cardId]);

  useEffect(() => {
    return subscribeToRitualProgress(() => setRitual(getRitualProgress()));
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

  async function revealDailyCard() {
    if (dailyCardRevealing) return;
    if (dailyCardRevealed) {
      setDailyRevealOverlayOpen(true);
      return;
    }
    setDailyCardRevealing(true);
    setDailyRevealOverlayOpen(true);
    try {
      const openedReceipt = await openDailyReceipt("daily-card", {
        fallbackAssignedCardId: report.card.cardId,
      });
      markDailySignalIntroComplete(openedReceipt.anonId || getAnonId(), openedReceipt.dailyKey);
      setDailyReceipt(openedReceipt);
      const openedCard = openedReceipt.assignedCardId
        ? {
            ...getDailyPullById(openedReceipt.assignedCardId, language),
            skyGuided: report.card.skyGuided,
          }
        : report.card;
      saveLocalDailyReading(
        openedCard,
        openedReceipt.dailyKey ? parseServerDailyKey(openedReceipt.dailyKey) : new Date(),
      );
    } finally {
      setDailyCardRevealing(false);
    }
  }

  function completeSignalIntro() {
    markDailySignalIntroComplete(dailyReceipt?.anonId || getAnonId(), dailyReceipt?.dailyKey ?? getLocalDateString());
    setSignalIntroComplete(true);
  }

  function closeDailyRevealOverlay() {
    completeSignalIntro();
    setDailyRevealOverlayOpen(false);
  }

  function markDailyCardRevealed() {
    completeSignalIntro();
    setDailyCardRevealed(true);
  }

  function handleToggleRitualTask(index: number) {
    setRitual(toggleRitualTask(index, report.date));
  }

  const profileName = profile?.name ?? birthProfile?.name;

  const roomShortcuts: RoomShortcutData[] = [
    {
      title: "Tarot Room",
      body: "Ask a question, pull a spread",
      href: "/app/tarot",
      icon: Sparkles,
      color: "#9b82b7",
      tint: "linear-gradient(145deg, rgba(205,188,222,0.46), rgba(169,136,198,0.26))",
    },
    {
      title: "Astrology",
      body: "Your chart and tonight's transits",
      href: "/app/astrology",
      icon: Moon,
      color: "#c99b82",
      tint: "linear-gradient(145deg, rgba(237,203,185,0.46), rgba(218,157,126,0.22))",
    },
    {
      title: "Collection",
      body: "Cards and readings you've kept",
      href: "/app/collection",
      icon: Library,
      color: "#bd985a",
      tint: "linear-gradient(145deg, rgba(237,213,163,0.48), rgba(215,175,102,0.20))",
    },
    {
      title: "Personalities",
      body: "Your inner types and patterns",
      href: "/app/personalities",
      icon: UsersRound,
      color: "#759c91",
      tint: "linear-gradient(145deg, rgba(198,224,215,0.48), rgba(133,181,166,0.20))",
    },
  ];

  return (
    <ReferenceHomePage
      report={report}
      date={report.date}
      language={language}
      roomShortcuts={roomShortcuts}
      dailyCardRevealed={dailyCardRevealed}
      dailyCardRevealing={dailyCardRevealing}
      dailyReceiptReady={dailyReceiptReady}
      dailyRevealOverlayOpen={dailyRevealOverlayOpen}
      onReveal={revealDailyCard}
      onCloseRevealOverlay={closeDailyRevealOverlay}
      onCardRevealed={markDailyCardRevealed}
    />
  );
}
