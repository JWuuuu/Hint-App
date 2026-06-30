import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowRight,
  BookOpen,
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
import { generateSkyCardReading } from "../../../lib/readings/generateSkyCardReading";
import {
  listLocalDailyReadings,
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
const REFERENCE_HOME_COPY = {
  date: "SATURDAY, JUN 27",
  theme: "Detach",
  themeLine: "Today asks you to step back before choosing.",
  evidence: ["Venus conjunct Saturn", "Moon in the 9th house"],
  scores: {
    overall: 71,
    love: 73,
    wealth: 74,
    career: 77,
    study: 64,
    people: 66,
  },
} as const;
const REFERENCE_ENERGY_COPY = {
  overall: 68,
  scores: {
    love: 66,
    career: 68,
    study: 70,
    people: 74,
  },
} as const;

const REFERENCE_CARD_BACKGROUND =
  "radial-gradient(circle at 18% -8%, rgba(255,255,255,0.46), transparent 46%), radial-gradient(circle at 84% 112%, rgba(230,209,194,0.038), transparent 54%), linear-gradient(145deg, rgba(255,254,251,0.38), rgba(249,243,236,0.22))";
const REFERENCE_CARD_BORDER = "rgba(185, 153, 128, 0.034)";
const REFERENCE_CARD_SHADOW =
  "0 12px 34px rgba(93, 72, 58, 0.014), 0 1px 4px rgba(151,112,154,0.006), inset 0 1px 0 rgba(255,255,255,0.40), inset 0 -18px 42px rgba(190,142,122,0.006)";

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
        style={{ background: "rgba(231, 208, 205, 0.075)" }}
      />
      <span
        className="absolute right-[-7rem] top-[-1rem] h-[22rem] w-[22rem] rounded-full blur-3xl"
        style={{ background: "rgba(229, 207, 176, 0.092)" }}
      />
      <span
        className="absolute inset-0"
        style={{
          background: "linear-gradient(118deg, transparent 0%, rgba(255,255,255,0.17) 45%, transparent 64%)",
          opacity: 0.42,
        }}
      />
      <svg viewBox="0 0 440 1120" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <g fill="none" stroke="rgba(190, 146, 102, 0.078)" strokeLinecap="round" strokeWidth="0.78">
          <path d="M245 82 C309 24 374 77 425 18" />
          <path d="M253 88 C304 111 365 112 417 75" />
          <ellipse cx="376" cy="74" rx="62" ry="39" transform="rotate(-22 376 74)" opacity="0.78" />
          <path d="M356 393 C419 345 468 349 504 399" opacity="0.55" />
          <path d="M-44 804 C70 724 171 740 246 828" opacity="0.52" />
          <path d="M-24 930 C86 846 190 864 274 962" opacity="0.35" />
        </g>
        <g fill="none" stroke="rgba(255, 255, 255, 0.42)" strokeLinecap="round" strokeWidth="0.72">
          <path d="M430 -10 C379 22 314 43 254 88" />
          <path d="M226 96 C267 72 306 75 343 105" opacity="0.52" />
        </g>
        <g fill="rgba(191, 143, 93, 0.17)">
          <circle cx="268" cy="42" r="2" />
          <circle cx="332" cy="32" r="1.15" />
          <circle cx="392" cy="107" r="1.35" />
          <circle cx="423" cy="25" r="1.05" />
          <circle cx="348" cy="79" r="1.1" />
        </g>
        <g fill="rgba(218, 174, 116, 0.11)">
          <circle cx="312" cy="302" r="1.05" />
          <circle cx="382" cy="384" r="1.25" />
          <circle cx="52" cy="676" r="1" />
          <circle cx="399" cy="748" r="1.1" />
        </g>
        <g stroke="rgba(214, 160, 95, 0.13)" strokeLinecap="round" strokeWidth="0.82">
          <path d="M350 58 L350 67 M345 62.5 L354.5 62.5" />
          <path d="M390 88 L390 94 M387 91 L393 91" />
          <path d="M205 846 L205 854 M201 850 L209 850" />
        </g>
      </svg>
      <span className="absolute left-[56%] top-[7.2rem] h-4 w-4 rounded-full" style={{ background: "linear-gradient(145deg, #d5b3ad, #8f7aae)", boxShadow: "0 16px 40px rgba(133,101,153,0.10)", opacity: 0.58 }} />
      <span className="absolute left-[33%] top-[7.35rem] text-[22px]" style={{ color: "rgba(212, 164, 99, 0.30)" }}>✦</span>
    </div>
  );
}

function ReferenceHintLogo() {
  return (
    <Link
      href="/app/profile"
      aria-label="Open profile"
      onPointerDown={() => triggerFeedback("select")}
      className="hint-pressable relative grid size-[56px] shrink-0 place-items-center overflow-hidden rounded-full border text-center active:scale-95"
      style={{
        color: "#2d2934",
        background: "linear-gradient(145deg, rgba(255,254,250,0.50), rgba(248,239,230,0.28))",
        borderColor: "rgba(191, 159, 132, 0.14)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.58), 0 12px 26px rgba(98,78,64,0.038)",
      }}
    >
      <span
        aria-hidden
        className="absolute inset-x-2 top-1 h-px rounded-full"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.86), transparent)" }}
      />
      <span className="grid justify-items-center">
        <Sparkles size={18} strokeWidth={1.55} />
        <span className="font-serif text-[14px] leading-none">hint</span>
      </span>
    </Link>
  );
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
  const cardTitle = report.card.cardName.replace(/^The\s+/i, "");
  const revealedCardImage =
    getTarotCardImage(report.card.cardId, "original") ??
    getTarotCardImage(report.card.cardId, "hint-classic");

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
      style={{ position: "absolute", overflow: "visible", right: 75, top: 49, height: 174, width: 78 }}
      whileTap={receiptReady && !revealing ? { scale: 0.985 } : undefined}
    >
      <motion.span
        className="relative block h-full w-full"
        animate={{
          y: [0, -4, 0],
          rotate: revealed ? [-0.2, 0.4, -0.2] : [-0.9, -0.2, -0.9],
          rotateY: revealing ? [0, 78, 0] : revealed ? [0, -3, 0] : [-4, 1.5, -4],
        }}
        transition={{
          y: { duration: 5.6, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 5.6, repeat: Infinity, ease: "easeInOut" },
          rotateY: revealing ? { duration: 0.9, ease: [0.45, 0, 0.2, 1] } : { duration: 6.8, repeat: Infinity, ease: "easeInOut" },
        }}
        style={{
          transformStyle: "preserve-3d",
          filter: revealed
            ? "drop-shadow(0 30px 36px rgba(72,45,98,0.15)) drop-shadow(0 0 48px rgba(255,240,207,0.70))"
            : "drop-shadow(0 30px 38px rgba(72,45,98,0.14)) drop-shadow(0 0 48px rgba(255,240,207,0.68))",
        }}
      >
      <span
        aria-hidden
        className="absolute inset-[-10px] rounded-[20px]"
        style={{
          background: "linear-gradient(90deg, rgba(255,249,224,0.62), rgba(255,246,232,0.14))",
          filter: "blur(8px)",
          transform: "translateX(7px)",
        }}
      />
      <motion.span
        aria-hidden
        className="absolute left-1/2 top-1/2 h-[180px] w-[158px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "conic-gradient(from 45deg, transparent 0deg, rgba(255,244,211,0.34) 54deg, transparent 92deg, rgba(205,169,219,0.20) 168deg, transparent 228deg, rgba(255,244,211,0.30) 306deg, transparent 360deg)",
          filter: "blur(7px)",
          mixBlendMode: "screen",
        }}
        animate={{
          opacity: revealing ? [0, 0.92, 0.36] : revealed ? [0.20, 0.36, 0.20] : [0.08, 0.20, 0.08],
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
        className="absolute -right-[8px] top-[12px] h-[calc(100%-16px)] w-[82%] rounded-[13px] border"
        style={{
          background: "linear-gradient(155deg, rgba(247,229,220,0.30), rgba(132,92,161,0.24))",
          borderColor: "rgba(255,238,209,0.13)",
          transform: "skewY(0.8deg)",
          boxShadow: "9px 13px 24px rgba(77,50,105,0.075)",
        }}
      />
      <span
        aria-hidden
        className="absolute -right-[5px] top-[7px] h-[calc(100%-8px)] w-3 rounded-r-[13px] border"
        style={{
          background: "linear-gradient(90deg, rgba(255,246,226,0.72), rgba(167,124,183,0.38) 42%, rgba(86,58,113,0.50))",
          borderColor: "rgba(255,233,203,0.22)",
          boxShadow: "inset 2px 0 0 rgba(255,255,255,0.22)",
        }}
      />
      <motion.div
        className="relative h-full w-full overflow-hidden rounded-[13px] border"
        animate={{ scale: revealed ? [1, 1.035, 1.01] : 1 }}
        transition={{ duration: 0.52, ease: "easeOut" }}
        style={{
          background: revealed
            ? "radial-gradient(circle at 48% 37%, rgba(255,249,223,0.62), transparent 24%), linear-gradient(160deg, rgba(255,248,241,0.84), rgba(234,210,230,0.72) 45%, rgba(166,119,183,0.70))"
            : "radial-gradient(circle at 52% 51%, rgba(255,239,175,0.78), transparent 17%), radial-gradient(circle at 48% 36%, rgba(255,255,255,0.48), transparent 25%), radial-gradient(circle at 82% 14%, rgba(255,255,255,0.24), transparent 20%), linear-gradient(158deg, rgba(237,214,233,0.74), rgba(178,129,193,0.66) 48%, rgba(110,83,153,0.74) 100%)",
          backgroundPosition: "center",
          backgroundSize: "cover",
          borderColor: "rgba(255,240,213,0.86)",
          boxShadow:
            revealed
              ? "inset 0 1px 0 rgba(255,255,255,0.72), inset 0 0 0 1px rgba(160,113,151,0.12), inset 0 -20px 34px rgba(119,78,126,0.13)"
            : "inset 0 1px 0 rgba(255,255,255,0.76), inset 0 0 0 1px rgba(255,238,206,0.30), inset 0 -22px 34px rgba(87,55,103,0.060)",
        }}
      >
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
          style={{ opacity: revealed ? 0.18 : 1 }}
        >
          <defs>
            <linearGradient id="reference-card-foil" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#fff4d2" stopOpacity="0.82" />
              <stop offset="0.48" stopColor="#fff4d2" stopOpacity="0.28" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0.56" />
            </linearGradient>
            <radialGradient id="reference-card-star" cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor="#fffff6" stopOpacity="0.98" />
              <stop offset="0.42" stopColor="#ffe897" stopOpacity="0.94" />
              <stop offset="1" stopColor="#ffe897" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect x="11" y="10" width="84" height="152" rx="9" fill="none" stroke="url(#reference-card-foil)" strokeWidth="1.05" />
          <rect x="18" y="21" width="70" height="130" rx="7" fill="none" stroke="#ffeecc" strokeOpacity="0.27" strokeWidth="0.72" />
          <g fill="none" stroke="#ffeecc" strokeOpacity="0.34" strokeLinecap="round" strokeWidth="0.72">
            <path d="M28 22 C34 17 41 17 47 22" />
            <path d="M59 22 C65 17 72 17 78 22" />
            <path d="M28 150 C34 155 41 155 47 150" />
            <path d="M59 150 C65 155 72 155 78 150" />
            <path d="M53 34 C64 58 66 114 53 138 C40 114 42 58 53 34Z" opacity="0.50" />
            <path d="M24 86 C42 75 64 75 82 86 C64 97 42 97 24 86Z" opacity="0.34" />
            <path d="M34 40 C45 64 46 110 34 132" opacity="0.11" />
            <path d="M72 40 C61 64 60 110 72 132" opacity="0.11" />
          </g>
          <g fill="#fff7dc" opacity="0.68">
            <circle cx="31" cy="58" r="1" />
            <circle cx="43" cy="45" r="0.85" />
            <circle cx="57" cy="55" r="0.92" />
            <circle cx="73" cy="43" r="0.85" />
            <circle cx="30" cy="124" r="0.78" />
            <circle cx="46" cy="112" r="0.86" />
            <circle cx="58" cy="121" r="0.78" />
            <circle cx="76" cy="111" r="0.86" />
          </g>
          <circle cx="53" cy="86" r="34" fill="url(#reference-card-star)" opacity="0.42" />
          <g fill="#fff4cf" opacity="0.95">
            <path d="M53 56 L58 80 L83 86 L58 92 L53 116 L48 92 L23 86 L48 80Z" />
            <path d="M53 45 L55 82 L63 86 L55 90 L53 127 L51 90 L43 86 L51 82Z" opacity="0.48" />
            <circle cx="53" cy="86" r="3.7" />
            <circle cx="32" cy="36" r="1.1" />
            <circle cx="78" cy="51" r="0.9" />
            <circle cx="72" cy="132" r="1.05" />
            <circle cx="35" cy="116" r="0.85" />
          </g>
          <g stroke="#fff7de" strokeOpacity="0.78" strokeLinecap="round" strokeWidth="0.75">
            <path d="M27 69 L27 75 M24 72 L30 72" />
            <path d="M80 99 L80 107 M76 103 L84 103" />
            <path d="M68 31 L68 35 M66 33 L70 33" opacity="0.72" />
          </g>
        </svg>
        <span
          className="absolute inset-y-0 left-0 w-[46%]"
          style={{ background: "linear-gradient(105deg, rgba(255,255,255,0.22), rgba(255,255,255,0.04) 54%, transparent)" }}
        />
        <motion.div
          className="absolute inset-[9px] flex flex-col items-center justify-between rounded-[9px] border px-2.5 py-2.5 text-center"
          initial={false}
          animate={{ opacity: revealed ? 1 : 0, y: revealed ? 0 : 6 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          style={{
            color: "#332d38",
            background:
              "radial-gradient(circle at 50% 29%, rgba(255,246,210,0.64), transparent 28%), linear-gradient(180deg, rgba(255,252,247,0.42), rgba(246,225,238,0.20))",
            borderColor: "rgba(189, 143, 176, 0.30)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.58)",
          }}
        >
          <span className="font-sans text-[5.8px] font-black uppercase tracking-[0.22em]" style={{ color: "#a87e68" }}>
            Today&apos;s Hint
          </span>
          <span
            className="relative grid h-[78px] w-[46px] place-items-center overflow-hidden rounded-[5px] border font-serif text-[24px] leading-none"
            style={{
              color: "#7e5b92",
              background: "radial-gradient(circle at 34% 22%, rgba(255,255,255,0.96), rgba(229,201,232,0.62))",
              borderColor: "rgba(170, 124, 171, 0.24)",
              boxShadow: "0 12px 22px rgba(129,88,145,0.13), inset 0 1px 0 rgba(255,255,255,0.72)",
            }}
          >
            {revealedCardImage ? (
              <SafeImage
                src={revealedCardImage}
                alt=""
                loading="eager"
                className="h-full w-full object-cover"
                fallbackClassName="h-full w-full"
                fallbackLabel="Card"
              >
                <CardSigil cardId={report.card.cardId} />
              </SafeImage>
            ) : (
              "H"
            )}
          </span>
          <span className="line-clamp-2 font-serif text-[11px] leading-[1.04]">{cardTitle}</span>
        </motion.div>
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
      className={["pointer-events-none grid place-items-center overflow-hidden rounded-[28px]", className].join(" ")}
      style={{ position: "absolute", inset: 0 }}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 right-0 w-full"
        style={{
          background:
            "linear-gradient(90deg, rgba(250,224,235,0) 0%, rgba(228,197,224,0.06) 36%, rgba(174,133,190,0.24) 68%, rgba(134,97,168,0.54) 100%)",
        }}
      />
      <span
        aria-hidden
        className="absolute inset-0 opacity-[0.70]"
        style={{
          background:
            "radial-gradient(circle at 72% 58%, rgba(255,247,205,0.24), transparent 25%), radial-gradient(circle at 83% 24%, rgba(255,255,255,0.13), transparent 18%), radial-gradient(circle at 61% 42%, rgba(214,174,218,0.10), transparent 48%), linear-gradient(90deg, rgba(253,226,236,0) 0%, rgba(239,204,224,0.04) 32%, rgba(126,90,160,0.48) 100%)",
        }}
      />
      <svg viewBox="0 0 208 232" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <g fill="none" strokeLinecap="round">
          <path d="M22 129 C68 78 150 70 205 109" stroke="rgba(255,237,194,0.22)" strokeWidth="0.95" />
          <path d="M38 157 C91 130 151 129 206 154" stroke="rgba(255,249,224,0.24)" strokeWidth="0.82" />
          <path d="M80 72 C125 43 170 44 210 69" stroke="rgba(255,244,215,0.10)" strokeWidth="0.7" />
          <ellipse cx="142" cy="128" rx="96" ry="27" transform="rotate(-23 142 128)" stroke="rgba(255,247,218,0.22)" strokeWidth="0.66" />
          <ellipse cx="143" cy="130" rx="75" ry="19" transform="rotate(18 143 130)" stroke="rgba(255,236,199,0.16)" strokeWidth="0.68" />
          <path d="M55 186 C91 211 170 208 211 169" stroke="rgba(255,248,224,0.13)" strokeWidth="0.68" />
        </g>
        <g fill="rgba(255,248,220,0.48)">
          <circle cx="62" cy="96" r="1.5" />
          <circle cx="162" cy="70" r="1.3" />
          <circle cx="178" cy="137" r="1.5" />
          <circle cx="124" cy="186" r="1.2" />
          <circle cx="98" cy="82" r="1" />
          <circle cx="190" cy="176" r="0.9" />
          <circle cx="43" cy="161" r="1.1" />
        </g>
        <g stroke="rgba(255,245,212,0.36)" strokeLinecap="round">
          <path d="M54 68 L54 78 M49 73 L59 73" />
          <path d="M182 93 L182 101 M178 97 L186 97" />
          <path d="M96 113 L96 119 M93 116 L99 116" opacity="0.54" />
        </g>
      </svg>
      <motion.svg
        aria-hidden
        viewBox="0 0 210 188"
        className="absolute right-[20px] top-[38px] z-[2] h-[176px] w-[214px]"
        animate={{
          opacity: revealing ? [0.42, 0.72, 0.58] : [0.24, 0.40, 0.24],
          rotate: revealing ? [0, 10, 0] : [0, 2, 0],
        }}
        transition={{ duration: revealing ? 1.05 : 6.4, repeat: revealing ? 0 : Infinity, ease: "easeInOut" }}
      >
        <g fill="none" strokeLinecap="round">
          <ellipse cx="118" cy="100" rx="88" ry="25" transform="rotate(-24 118 100)" stroke="#fff2c9" strokeOpacity="0.18" strokeWidth="0.8" />
          <ellipse cx="120" cy="106" rx="79" ry="19" transform="rotate(19 120 106)" stroke="#fff6db" strokeOpacity="0.20" strokeWidth="0.72" />
          <ellipse cx="115" cy="132" rx="74" ry="15" stroke="#ffe4bd" strokeOpacity="0.13" strokeWidth="0.72" />
          <path d="M33 128 C63 148 154 150 198 119" stroke="#fff2c9" strokeOpacity="0.10" strokeWidth="0.7" />
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
      <span
        aria-hidden
        className="absolute bottom-[24px] right-[36px] h-[50px] w-[174px] rounded-full"
        style={{
          background: "radial-gradient(ellipse, rgba(255,248,222,0.66), rgba(255,229,190,0.22) 52%, transparent 74%)",
          filter: "blur(1.4px)",
        }}
      />
      <span
        aria-hidden
        className="absolute bottom-[45px] right-[82px] h-2.5 w-20 rounded-full"
        style={{ background: "rgba(255,248,219,0.42)", filter: "blur(3px)" }}
      />
      <motion.svg
        viewBox="0 0 182 58"
        className="absolute bottom-[18px] right-[32px] h-[58px] w-[182px]"
        animate={{ opacity: revealing ? [0.42, 0.74, 0.58] : [0.28, 0.44, 0.28], scale: revealing ? [0.94, 1.05, 1] : [1, 1.018, 1] }}
        transition={{ duration: revealing ? 1 : 4.8, repeat: revealing ? 0 : Infinity, ease: "easeInOut" }}
      >
        <g fill="none" stroke="rgba(255,235,199,0.25)" strokeWidth="0.82">
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
        style={{ background: "linear-gradient(90deg, rgba(255,248,244,0.46), rgba(250,235,238,0.26) 42%, rgba(250,235,238,0.08) 70%, rgba(250,235,238,0))" }}
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
  function handleRevealClick() {
    triggerFeedback(revealed ? "tap" : "reveal");
    if (revealed) {
      document.getElementById("today-summary")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    void Promise.resolve(onReveal()).then(() => {
      window.setTimeout(() => {
        document.getElementById("today-summary")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 720);
    });
  }
  const heroTitle = revealed ? "open." : "waiting.";
  const heroCopy = revealed ? "Your card is ready. Follow the signal below." : "The universe left you a little note.";

  return (
    <section
      className="relative mb-2.5 overflow-hidden rounded-[28px] border"
      style={{
        minHeight: 254,
        background:
          "radial-gradient(circle at 75% 75%, rgba(255,235,194,0.18), transparent 30%), linear-gradient(105deg, rgba(255,248,244,0.84) 0%, rgba(250,228,236,0.66) 46%, rgba(174,132,188,0.50) 100%)",
        borderColor: "rgba(204, 142, 183, 0.115)",
        boxShadow: "0 20px 48px rgba(116, 80, 120, 0.032), inset 0 1px 0 rgba(255,255,255,0.42), inset 0 -20px 48px rgba(107,76,119,0.022)",
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
      <div className="relative min-h-[254px]">
        <div className="relative z-10 flex min-h-[254px] w-[58%] flex-col pl-7 pr-0 pt-[48px]">
          <h2 className="font-serif text-[32px] leading-[1.05]" style={{ color: "#2f2b37" }}>
            Your Hint<br />
            is <span className="italic" style={{ color: "#a982b0" }}>{heroTitle}</span>
          </h2>
          <p
            className={[
              "max-w-[9.5rem] font-serif leading-snug",
              revealed ? "mt-2 line-clamp-2 text-[12px]" : "mt-3 text-[13.5px]",
            ].join(" ")}
            style={{ color: "#4c4650" }}
          >
            {heroCopy}
          </p>
          {revealed ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="mt-3 inline-flex max-w-[180px] items-center gap-1.5 rounded-full border px-3 py-1 font-sans text-[9px] font-black uppercase tracking-[0.14em]"
              style={{
                color: "#8c668c",
                background: "rgba(255, 250, 246, 0.34)",
                borderColor: "rgba(187, 139, 174, 0.14)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.46)",
              }}
            >
              <Sparkles size={12} strokeWidth={1.8} />
              <span className="truncate">{report.card.cardName}</span>
            </motion.div>
          ) : null}
          <button
            type="button"
            disabled={!receiptReady || revealing}
            onClick={handleRevealClick}
            aria-busy={revealing ? "true" : "false"}
            className={[
              "hint-pressable inline-flex h-[38px] w-full max-w-[154px] items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 font-serif text-[12px] active:scale-[0.98] disabled:opacity-75",
              revealed ? "mt-3" : "mt-4",
            ].join(" ")}
            style={{
              color: "#fff8f4",
              background: "linear-gradient(145deg, #9a75ad 0%, #7f5e94 48%, #684879 100%)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.30), inset 0 -8px 16px rgba(67,42,80,0.12), 0 14px 26px rgba(104,72,119,0.18)",
            }}
          >
            {revealed ? "View Today’s Hint" : revealing ? "Opening Today’s Hint" : receiptReady ? "Reveal Today’s Hint" : "Preparing Today’s Hint"}
            <span aria-hidden className="shrink-0 text-[16px] leading-none">✦</span>
          </button>
        </div>
        <ReferenceHeroArt
          className="absolute inset-0"
          revealed={revealed}
          revealing={revealing}
          receiptReady={receiptReady}
          report={report}
          onCardActivate={handleRevealClick}
        />
      </div>
    </section>
  );
}

function ReferenceScoreItem({ score, isLast }: { score: DailyScore; isLast: boolean }) {
  const Icon = REFERENCE_SCORE_ICONS[score.key];

  return (
    <div className={["min-w-0 px-1.5 text-center", isLast ? "" : "border-r"].join(" ")} style={{ borderColor: "rgba(198, 165, 142, 0.105)" }}>
      <div className="flex min-w-0 items-center justify-center gap-1.5">
        <Icon className="shrink-0" size={15.5} strokeWidth={1.7} style={{ color: score.tone }} />
        <p className="truncate font-sans text-[10.5px] font-medium leading-none" style={{ color: "#5e5860" }}>
          {score.label}
        </p>
      </div>
      <p className="mt-1.5 text-center font-serif text-[20px] leading-none tabular-nums" style={{ color: "#2f2b37" }}>
        {score.score}
      </p>
    </div>
  );
}

function ReferenceEnergyValue({ score }: { score: number }) {
  return (
    <div className="relative mt-3 flex items-end">
      <span className="font-serif text-[50px] leading-[0.82] tabular-nums" style={{ color: "#b77caf" }}>
        {score}
      </span>
      <span className="mb-[4px] ml-1 font-serif text-[14px] leading-none" style={{ color: "#736c72" }}>
        /100
      </span>
      <span
        aria-hidden
        className="absolute left-[68px] top-[17px] text-[19px]"
        style={{ color: "rgba(230, 188, 118, 0.48)" }}
      >
        ✦
      </span>
    </div>
  );
}

function ReferenceMoonScene() {
  return (
    <div
      aria-hidden
      className="relative size-[84px] shrink-0 overflow-hidden rounded-full"
      style={{
        background: "linear-gradient(145deg, rgba(60, 38, 80, 0.72), rgba(34, 28, 54, 0.92))",
        boxShadow: "0 16px 26px rgba(72, 46, 84, 0.10), inset 0 1px 0 rgba(255,255,255,0.18)",
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
  const scores = report.scores.map((score) => ({
    ...score,
    score: REFERENCE_HOME_COPY.scores[score.key],
  }));

  return (
    <section
      id="today-summary"
      className="relative mb-3 overflow-hidden rounded-[26px] border px-4 py-4"
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
      <div className="relative grid grid-cols-[102px_minmax(0,1fr)_84px] items-center gap-4">
        <div className="relative min-w-0">
          <p className="font-sans text-[9.5px] font-black uppercase tracking-[0.13em]" style={{ color: "#6c646c" }}>
            Today’s energy
          </p>
          <ReferenceEnergyValue score={REFERENCE_HOME_COPY.scores.overall} />
        </div>
        <div
          className="min-w-0 border-l pl-5"
          style={{ borderColor: "rgba(198, 158, 129, 0.13)" }}
        >
          <p className="font-sans text-[9.5px] font-black uppercase tracking-[0.13em]" style={{ color: "#6c646c" }}>
            Today’s theme
          </p>
          <p className="mt-2 font-serif text-[25px] leading-none" style={{ color: "#2f2a35" }}>
            {REFERENCE_HOME_COPY.theme}
          </p>
          <p className="mt-2 max-w-[128px] font-serif text-[14px] leading-[1.28]" style={{ color: "#756d75" }}>
            {REFERENCE_HOME_COPY.themeLine}
          </p>
        </div>
        <ReferenceMoonScene />
      </div>
      <button
        type="button"
        onClick={() => {
          triggerFeedback("select");
          setDetailsOpen((open) => !open);
        }}
        aria-expanded={detailsOpen}
        aria-label="Tap to see more details"
        className="hint-pressable relative mt-4 flex w-full items-center gap-2 rounded-[20px] border px-3 py-2.5 text-left active:scale-[0.99]"
        style={{
          background: "linear-gradient(145deg, rgba(255,252,248,0.42), rgba(250,242,236,0.20))",
          borderColor: "rgba(199, 160, 128, 0.10)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.50), 0 10px 22px rgba(96, 75, 61, 0.012)",
        }}
      >
        <div className="grid min-w-0 flex-1 grid-cols-5 items-center">
          {scores.map((score, index) => (
            <ReferenceScoreItem key={score.key} score={score} isLast={index === scores.length - 1} />
          ))}
        </div>
        <span
          className="grid size-8 shrink-0 place-items-center rounded-full"
          style={{
            color: "#fff8fb",
            background: "linear-gradient(145deg, rgba(202, 145, 196, 0.76), rgba(166, 103, 178, 0.86))",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.42), 0 8px 18px rgba(146,86,154,0.10)",
          }}
        >
          <motion.span animate={{ rotate: detailsOpen ? 180 : 0 }} transition={{ duration: 0.22, ease: "easeOut" }}>
            <ChevronDown size={17} strokeWidth={2} />
          </motion.span>
        </span>
      </button>
      <button
        type="button"
        onClick={() => {
          triggerFeedback("select");
          setDetailsOpen((open) => !open);
        }}
        className="hint-pressable mx-auto mt-2 flex items-center justify-center gap-2 px-2 py-1 font-sans text-[10.5px]"
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
              "radial-gradient(circle at 16% 8%, rgba(255,244,214,0.24), transparent 28%), radial-gradient(circle at 78% 18%, rgba(205,171,220,0.10), transparent 30%), linear-gradient(145deg, rgba(255,252,248,0.38), rgba(255,246,241,0.22))",
            borderColor: "rgba(196, 163, 137, 0.06)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.34), 0 10px 22px rgba(116,90,74,0.010)",
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
          <p className="font-serif text-[16px] leading-snug" style={{ color: "#3a3440" }}>
            {report.title}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
            {scores.map((score) => (
              <p key={score.key} className="flex items-center justify-between gap-3 font-sans text-[11px]" style={{ color: "#746970" }}>
                <span>{score.label}</span>
                <span className="font-serif text-[15px] tabular-nums" style={{ color: "#2f2b37" }}>{score.score}</span>
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
    <div aria-hidden className="pointer-events-none relative h-[52px] w-[82px] overflow-visible">
      <span
        className="absolute right-4 top-3 size-[42px] rounded-full"
        style={{
          background: "radial-gradient(circle at 34% 24%, #f7dee3 0%, #ead4df 36%, #c4a2d0 74%, #9f78ad 100%)",
          boxShadow: "0 14px 26px rgba(142, 96, 154, 0.13), inset 0 1px 0 rgba(255,255,255,0.62)",
        }}
      />
      <svg viewBox="0 0 112 78" className="absolute inset-0 h-full w-full overflow-visible">
        <g fill="none" strokeLinecap="round">
          <path
            d="M16 46 C37 30 76 24 100 34 C82 56 39 60 16 46Z"
            stroke="rgba(220, 169, 111, 0.40)"
            strokeWidth="1"
          />
          <path
            d="M12 48 C37 57 78 54 103 38"
            stroke="rgba(244, 214, 174, 0.68)"
            strokeWidth="1.15"
          />
          <path
            d="M24 51 C50 36 78 35 101 45"
            stroke="rgba(199, 151, 195, 0.30)"
            strokeWidth="1"
          />
        </g>
        <g fill="rgba(214, 160, 95, 0.54)">
          <circle cx="16" cy="47" r="1.3" />
          <circle cx="93" cy="36" r="1.1" />
          <circle cx="34" cy="22" r="0.9" />
          <circle cx="73" cy="17" r="1" />
        </g>
        <g stroke="rgba(226, 178, 124, 0.48)" strokeLinecap="round">
          <path d="M7 25 L7 31 M4 28 L10 28" />
          <path d="M102 57 L102 63 M99 60 L105 60" />
        </g>
      </svg>
      <span
        className="absolute bottom-1 right-9 size-1.5 rounded-full"
        style={{ background: "#f8e5bf", boxShadow: "0 0 16px rgba(248,229,191,0.86)" }}
      />
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

function ReferenceEvidencePanel({ report }: { report: DailyReport }) {
  const [expanded, setExpanded] = useState(false);
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
  const evidenceLabels = [...REFERENCE_HOME_COPY.evidence];
  const detailLines = (reading?.whyThisCard ?? [report.astrologyNote, report.summary])
    .slice(0, 3)
    .map((line) => polishSkyLogicLine(line, sky?.selectedCardId ?? report.card.cardId, report.card.cardName));

  return (
    <section
      className="relative mb-3 rounded-[22px] border px-5 py-3"
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
      <div className="min-h-[72px] pr-[96px]">
        <div className="min-w-0">
          <h3 className="font-serif text-[16px] leading-none" style={{ color: "#2f2b37" }}>
            Why this hint?
          </h3>
          <div className="mt-2.5 flex flex-nowrap gap-2">
            {evidenceLabels.map((label, index) => (
              <span
                key={`${label}-${index}`}
                className="inline-flex min-h-[23px] max-w-full min-w-0 items-center gap-1 rounded-full border px-2 font-sans text-[8.3px] leading-none"
                style={{
                  color: "#777077",
                  background: "rgba(255, 250, 246, 0.30)",
                  borderColor: "rgba(198, 165, 142, 0.048)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.30)",
                }}
              >
                <span style={{ color: index === 0 ? "#d39b69" : "#a77caf" }}>{index === 0 ? "☉" : "☽"}</span>
                <span className="whitespace-nowrap">{label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          triggerFeedback("select");
          setExpanded((open) => !open);
        }}
        aria-expanded={expanded}
        className="hint-pressable absolute right-5 top-2.5 flex w-[112px] flex-col items-end text-right active:scale-[0.98]"
        style={{ position: "absolute", right: 20, top: 10 }}
      >
        <span className="inline-flex items-center gap-1 whitespace-nowrap font-serif text-[13px]" style={{ color: "#a36b9a" }}>
          Sky Evidence ✦
          <ChevronDown
            size={12}
            strokeWidth={2}
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 180ms ease" }}
          />
        </span>
        <span className="mt-2">
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
            background: "linear-gradient(145deg, rgba(255,252,248,0.34), rgba(255,246,241,0.22))",
            borderColor: "rgba(198, 165, 142, 0.062)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.32)",
          }}
        >
          <div className="grid gap-2">
            {detailLines.map((line, index) => (
              <p key={`${line}-${index}`} className="font-sans text-[11px] leading-snug" style={{ color: "#5a5058" }}>
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
                background: "rgba(255, 251, 246, 0.54)",
                borderColor: "rgba(198, 165, 142, 0.16)",
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
                  background: "linear-gradient(145deg, #9873ad, #715083)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.32), 0 12px 20px rgba(104,72,119,0.18)",
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
    <section className="mb-3">
      <div className="mb-2 flex items-center gap-3 px-2">
        <p className="shrink-0 font-sans text-[10.5px] font-black uppercase tracking-[0.18em]" style={{ color: "#8d8284" }}>
          Your spaces
        </p>
        <span className="h-px flex-1" style={{ background: "rgba(191, 159, 132, 0.09)" }} />
        <span style={{ color: "#d1a56f" }}>✦</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ delay: index * 0.05, duration: 0.38, ease: "easeOut" }}
            >
              <Link href={card.href} onPointerDown={() => triggerFeedback("select")} className="block h-full">
                <div
                  className="hint-pressable relative isolate flex h-[128px] flex-col overflow-hidden rounded-[18px] border px-2.5 py-2.5 active:scale-[0.98]"
                  style={{
                    background: REFERENCE_CARD_BACKGROUND,
                    borderColor: REFERENCE_CARD_BORDER,
                    boxShadow: "0 12px 30px rgba(100,77,60,0.028), inset 0 1px 0 rgba(255,255,255,0.52)",
                  }}
                >
                  <span
                    aria-hidden
                    className="absolute inset-x-4 top-0 h-px rounded-full"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.46), transparent)" }}
                  />
                  <span
                    className="relative mx-auto grid size-[50px] shrink-0 place-items-center overflow-hidden rounded-full border"
                    style={{
                      color: card.color,
                      background: `radial-gradient(circle at 33% 24%, rgba(255,255,255,0.70), transparent 34%), radial-gradient(circle at 70% 78%, color-mix(in srgb, ${card.color} 20%, transparent), transparent 52%), ${card.tint}`,
                      borderColor: `color-mix(in srgb, ${card.color} 9%, rgba(188,156,132,0.08))`,
                      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.34), 0 8px 16px color-mix(in srgb, ${card.color} 5%, transparent)`,
                    }}
                  >
                    <span
                      aria-hidden
                      className="absolute inset-[7px] rounded-full border"
                      style={{ borderColor: "rgba(255,255,255,0.30)" }}
                    />
                    <Icon size={22} strokeWidth={1.35} />
                  </span>
                  <h3 className="mt-2 whitespace-nowrap font-serif text-[11.5px] leading-tight" style={{ color: "#2f2b37" }}>
                    {card.title}
                  </h3>
                  <p className="mt-1 line-clamp-3 font-sans text-[8.2px] leading-[1.16]" style={{ color: "#777077" }}>
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
  onReveal,
}: {
  report: DailyReport;
  date: string;
  language: string;
  roomShortcuts: RoomShortcutData[];
  dailyCardRevealed: boolean;
  dailyCardRevealing: boolean;
  dailyReceiptReady: boolean;
  onReveal: () => void | Promise<void>;
}) {
  return (
    <div
      className="relative h-full w-full overflow-y-auto overscroll-none pb-[calc(7.25rem+var(--hint-safe-bottom))]"
      style={{
        background:
          "radial-gradient(520px 380px at 8% -4%, rgba(237,222,213,0.48), transparent 72%), radial-gradient(460px 340px at 94% 4%, rgba(230,203,167,0.32), transparent 74%), radial-gradient(560px 480px at 52% 55%, rgba(216,196,185,0.13), transparent 76%), linear-gradient(180deg, #fbf7f0 0%, #f8f1e9 52%, #f4ede5 100%)",
      }}
    >
      <ReferenceOrbitBackdrop />
      <div className="relative z-10 mx-auto w-full max-w-[var(--hint-app-width)] px-6 pt-[calc(2rem+var(--hint-safe-top))]">
        <header className="mb-3 flex items-start justify-between gap-5">
          <div className="min-w-0">
            <p className="font-sans text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: "#625b61", textShadow: "0 1px 0 rgba(255,255,255,0.65)" }}>
              {REFERENCE_HOME_COPY.date}
            </p>
            <h1 className="mt-2 font-serif text-[40px] leading-[0.9]" style={{ color: "#2d2934", textShadow: "0 14px 30px rgba(61,45,57,0.07)" }}>
              Today
            </h1>
            <p className="mt-1.5 font-serif text-[15px] leading-none" style={{ color: "#6f6770" }}>
              A small signal from today’s sky.
            </p>
          </div>
          <ReferenceHintLogo />
        </header>

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
  const [signalIntroComplete, setSignalIntroComplete] = useState(initialDailySignalComplete);
  const [dailyReceipt, setDailyReceipt] = useState<DailyReceipt | null>(null);
  const [dailyReceiptReady, setDailyReceiptReady] = useState(false);
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
  const report = useMemo(
    () => {
      const baseReport = getDailyReport({
        anonId: getAnonId(),
        date: dailyReceipt?.dailyKey ? parseServerDailyKey(dailyReceipt.dailyKey) : undefined,
        language,
        birthDetails: activeBirthDetails ?? undefined,
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
    if (dailyCardRevealed || dailyCardRevealing) return;
    setDailyCardRevealing(true);
    setDailyCardRevealed(true);
    try {
      const openedReceipt = await openDailyReceipt("daily-card", {
        fallbackAssignedCardId: report.card.cardId,
      });
      markDailySignalIntroComplete(openedReceipt.anonId || getAnonId(), openedReceipt.dailyKey);
      setDailyReceipt(openedReceipt);
      saveLocalDailyReading(
        report.card,
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
      color: "#9f83be",
      tint: "rgba(174, 145, 202, 0.34)",
    },
    {
      title: "Astrology",
      body: "Your chart and tonight's transits",
      href: "/app/astrology",
      icon: Moon,
      color: "#d8a17d",
      tint: "rgba(229, 169, 133, 0.30)",
    },
    {
      title: "Collection",
      body: "Cards and readings you've kept",
      href: "/app/collection",
      icon: Library,
      color: "#c9a05f",
      tint: "rgba(225, 190, 120, 0.32)",
    },
    {
      title: "Personalities",
      body: "Your inner types and patterns",
      href: "/app/personalities",
      icon: UsersRound,
      color: "#7ba898",
      tint: "rgba(144, 190, 176, 0.30)",
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
      onReveal={revealDailyCard}
    />
  );
}
