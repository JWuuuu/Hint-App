import { useEffect, useMemo, useRef, useState } from "react";
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
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { useGetUserStats } from "@workspace/api-client-react";
import { ACCENT, GOLD } from "../../hold/atmosphere";
import { getAnonId } from "../../../lib/identity";
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
import { getTarotCardImage } from "../../tarot/logic/cardImageMap";
import { useLanguage } from "../../../lib/i18n";
import { generateSkyCardReading } from "../../../lib/readings/generateSkyCardReading";
import {
  listLocalDailyReadings,
  saveLocalDailyReading,
} from "../../readings/localDailyReadings";
import { useProfile } from "../../../lib/useProfile";
import { readBirthProfile } from "../../../lib/astro/userBirthProfile";
import type { DailyReport, DailyScore } from "../types/home.types";
import { LuckyIllustration } from "./LuckyIllustration";
import { SkyEvidence } from "../../../components/tarot/SkyEvidence";
import { SafeImage } from "../../../shared/ui/SafeImage";

type RoomShortcutData = {
  title: string;
  body: string;
  href: string;
  icon: LucideIcon;
  color: string;
  tint: string;
};

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
          className="relative mt-3 inline-flex w-full items-center justify-center rounded-full border px-4 py-2.5 font-sans text-[12px] font-semibold"
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
}: {
  report: DailyReport;
  revealed: boolean;
  revealing?: boolean;
}) {
  const revealedCardImage =
    getTarotCardImage(report.card.cardId, "original") ??
    getTarotCardImage(report.card.cardId, "hint-classic");

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
          "tarot-flip relative z-20 aspect-[46/71] max-w-full",
          revealed ? "w-[136px] sm:w-[150px]" : "w-[142px] sm:w-[166px]",
        ].join(" ")}
        style={{
          filter: "drop-shadow(0 24px 38px rgba(31, 25, 34, 0.24)) drop-shadow(0 0 26px rgba(203,168,102,0.14))",
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
            background:
              "radial-gradient(circle at 50% 22%, color-mix(in srgb, var(--hint-gold, #cba866) 16%, transparent), transparent 36%), var(--hint-deck-card-bg)",
            borderColor: "color-mix(in srgb, var(--hint-gold, #cba866) 58%, var(--hint-border))",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16), inset 0 0 0 1px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.04)",
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
            background:
              "linear-gradient(160deg, #17111f 0%, #101827 48%, #092228 100%)",
            borderColor: "color-mix(in srgb, var(--hint-gold, #cba866) 70%, var(--hint-border))",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16), inset 0 0 0 1px rgba(0,0,0,0.28), 0 0 46px rgba(203,168,102,0.16)",
          }}
        >
          <div
            aria-hidden
            className="absolute inset-[10px] rounded-[14px] border"
            style={{ borderColor: "color-mix(in srgb, var(--hint-gold, #cba866) 34%, transparent)" }}
          />
          {revealed ? (
            <div className="absolute inset-[9px] overflow-hidden rounded-[14px] border" style={{ borderColor: "rgba(255,236,180,0.28)" }}>
              <SafeImage
                src={revealedCardImage}
                alt={report.card.cardName}
                loading="eager"
                className="h-full w-full object-cover"
                fallbackClassName="rounded-[14px]"
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
    setRevealing(true);
    revealTimerRef.current = window.setTimeout(() => {
      revealTimerRef.current = null;
      Promise.resolve(onReveal()).finally(() => {
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
              onClick={() => setExpanded((value) => !value)}
              className="rounded-full border px-2.5 py-1.5 font-sans text-[10px] font-semibold uppercase tracking-[0.12em] transition hover:translate-y-[-1px]"
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
              className="mx-auto block rounded-[20px] outline-none transition-transform duration-200 hover:translate-y-[-2px] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--hint-aqua)_80%,white)]"
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
                className="relative mt-3 inline-flex h-9 w-full max-w-[16rem] items-center justify-center overflow-hidden rounded-full border px-4 font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] sm:w-auto"
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
                className="mt-3 inline-flex w-full max-w-[16rem] items-center justify-center rounded-full border px-4 py-2.5 font-sans text-[12px] font-semibold"
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
                className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full font-sans text-[12px] font-semibold sm:w-auto sm:px-5"
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
          className="hint-status-pill shrink-0 rounded-full px-2.5 py-1.5 font-sans text-[9px] font-black uppercase tracking-[0.1em]"
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
                    onClick={() => onToggleTask(index)}
                    className="grid min-h-[44px] grid-cols-[30px_1fr] items-center gap-2 rounded-[13px] px-1.5 py-1.5 text-left transition active:scale-[0.99]"
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
      <Link href={card.href} className="block h-full">
        <div
          className="group relative flex min-h-[132px] flex-col justify-between overflow-hidden rounded-[24px] border p-4 transition-transform active:scale-[0.985]"
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
    <Link href="/app/astrology" className="block">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.52, ease: "easeOut" }}
        className="relative overflow-hidden rounded-[28px] border p-5"
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
          className="font-sans text-[11px] font-medium uppercase tracking-[0.1em]"
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
        className="hint-liquid-panel grid size-10 shrink-0 place-items-center rounded-full font-serif text-[17px] leading-none active:scale-95"
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
              <Link href={card.href} className="hint-liquid-panel flex min-h-[92px] flex-col justify-between rounded-[22px] px-2.5 py-3 active:scale-[0.97]">
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

export function HomeDashboard() {
  const { language, t } = useLanguage();
  const { profile } = useProfile();
  const [birthProfile, setBirthProfile] = useState(() => readBirthProfile());
  const [ritual, setRitual] = useState(() => getRitualProgress());
  const [dailyCardRevealed, setDailyCardRevealed] = useState(false);
  const [dailyReceipt, setDailyReceipt] = useState<DailyReceipt | null>(null);
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
    getOrCreateDailyReceipt("daily-card", {
      fallbackAssignedCardId: report.card.cardId,
    }).then((receipt) => {
      if (!mounted) return;
      setDailyReceipt(receipt);
      setDailyCardRevealed(Boolean(receipt.openedAt));
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
    if (dailyCardRevealed) return;
    setDailyCardRevealed(true);
    const openedReceipt = await openDailyReceipt("daily-card", {
      fallbackAssignedCardId: report.card.cardId,
    });
    setDailyReceipt(openedReceipt);
    saveLocalDailyReading(
      report.card,
      openedReceipt.dailyKey ? parseServerDailyKey(openedReceipt.dailyKey) : new Date(),
    );
  }

  function handleToggleRitualTask(index: number) {
    setRitual(toggleRitualTask(index, report.date));
  }

  const roomShortcuts: RoomShortcutData[] = [
    {
      title: "Tarot Room",
      body: "Ask a question, pull a spread",
      href: "/app/tarot",
      icon: Sparkles,
      color: ACCENT.gold,
      tint: "rgba(203,168,102,0.14)",
    },
    {
      title: "Astrology",
      body: "Your chart and tonight's transits",
      href: "/app/astrology",
      icon: Moon,
      color: ACCENT.lavender,
      tint: "rgba(178,152,179,0.14)",
    },
    {
      title: "Collection",
      body: "Cards and readings you've kept",
      href: "/app/collection",
      icon: Library,
      color: ACCENT.aqua,
      tint: "rgba(134,214,199,0.12)",
    },
    {
      title: "Personalities",
      body: "Your inner types and patterns",
      href: "/app/personalities",
      icon: UsersRound,
      color: ACCENT.lavender,
      tint: "rgba(178,152,179,0.14)",
    },
  ];
  const profileName = profile?.name ?? birthProfile?.name;

  return (
    <div className="relative h-full w-full overflow-y-auto overscroll-none pb-[calc(7rem+var(--hint-safe-bottom))]">
      <TodayShineLayer wide />
      <div className="relative z-10 mx-auto w-full max-w-[430px] px-3 pt-[calc(0.75rem+var(--hint-safe-top))] sm:px-4">
        <TodayAppHeader
          title={t("nav.today")}
          date={report.date}
          language={language}
          profileName={profileName}
        />

        <section id="your-card" className="mb-3 scroll-mt-28">
          <DailyHintSection
            report={report}
            revealed={dailyCardRevealed}
            onReveal={revealDailyCard}
            birthPersonalized={Boolean(activeBirthDetails?.birthDate)}
            lockNotice={
              dailyReceipt?.source === "local-fallback"
                ? "Backend daily lock is unavailable. This session is using local fallback state until the API returns."
                : undefined
            }
          />
        </section>

        <AppActionList cards={roomShortcuts} />

        <div className="mb-5">
          <RitualStreakPanel
            ritual={ritual}
            tasks={report.tasks}
            onToggleTask={handleToggleRitualTask}
          />
        </div>

        <section className="mb-8">
          <SectionHeader title={t("home.notes")} />
          <FeedCards dailyCardRevealed={dailyCardRevealed} />
        </section>
      </div>
    </div>
  );
}
