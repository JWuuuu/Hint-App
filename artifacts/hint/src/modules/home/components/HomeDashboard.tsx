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
import { ModuleGrid } from "./ModuleGrid";
import { FeedCards } from "./FeedCards";
import { CardSigil } from "../../hold/components/CardSigil";
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

type PortalCardData = {
  title: string;
  label: string;
  body: string;
  href: string;
  icon: LucideIcon;
  color: string;
};

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
            "linear-gradient(90deg, transparent 0%, rgba(134,214,199,0.10) 28%, rgba(255,244,214,0.20) 50%, rgba(239,166,116,0.10) 68%, transparent 100%)",
          mixBlendMode: "screen",
        }}
        animate={{ x: wide ? ["-50vw", "115vw"] : ["-35%", "720%"], opacity: [0, 0.62, 0] }}
        transition={{ duration: wide ? 7.2 : 4.8, repeat: Infinity, repeatDelay: wide ? 2.4 : 1.5, ease: "easeInOut" }}
      />
      <motion.span
        className="absolute inset-x-[-12%] top-0 h-40"
        style={{
          background:
            "radial-gradient(circle at 18% 42%, rgba(203,168,102,0.18), transparent 28%), radial-gradient(circle at 62% 34%, rgba(134,214,199,0.18), transparent 24%), radial-gradient(circle at 82% 56%, rgba(255,255,255,0.12), transparent 18%)",
          filter: "blur(10px)",
        }}
        animate={{ x: ["-3%", "3%", "-3%"], opacity: [0.36, 0.62, 0.36] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
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
          href="/profile"
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
      className="tarot-flip mx-auto aspect-[46/71] w-[132px] max-w-full sm:w-[158px] lg:w-[176px]"
      style={{
        filter: "drop-shadow(0 18px 28px rgba(31, 25, 34, 0.18))",
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
          {revealed ? <CardSigil cardId={report.card.cardId} /> : null}
        </div>
      </motion.div>
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

function CircularScore({
  score,
  label,
  tone,
  size = "sm",
}: {
  score: number;
  label: string;
  tone: string;
  size?: "sm" | "lg";
}) {
  const dimensionClass = size === "lg" ? "size-[124px] sm:size-[136px]" : "size-[72px] sm:size-[82px]";
  const valueClass = size === "lg" ? "text-[44px] sm:text-[50px]" : "text-[22px] sm:text-[25px]";

  return (
    <div className="flex flex-col items-center text-center">
      <motion.div
        className={`grid place-items-center rounded-full ${dimensionClass}`}
        style={{
          background: `conic-gradient(${tone} ${score * 3.6}deg, color-mix(in srgb, var(--hint-border) 54%, transparent) 0deg)`,
          boxShadow: `0 0 24px color-mix(in srgb, ${tone} 26%, transparent)`,
        }}
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.42, ease: "easeOut" }}
      >
        <div
          className="grid size-[78%] place-items-center rounded-full"
          style={{ background: "color-mix(in srgb, var(--hint-input-bg) 92%, transparent)" }}
        >
          <span className={`font-serif leading-none tabular-nums ${valueClass}`} style={{ color: tone }}>
            {score}
          </span>
        </div>
      </motion.div>
      <p className="mt-2 font-sans text-[10.5px] font-semibold leading-none" style={{ color: "var(--hint-text)" }}>
        {label}
      </p>
    </div>
  );
}

function PillScore({ score, label, tone }: { score: number; label: string; tone: string }) {
  return (
    <div className="flex min-w-0 flex-col items-center">
      <div
        className="flex h-[76px] w-7 items-end overflow-hidden rounded-full"
        style={{ background: `color-mix(in srgb, ${tone} 14%, white 4%, transparent)` }}
      >
        <motion.div
          className="w-full rounded-full"
          style={{
            height: `${score}%`,
            background: tone,
            boxShadow: `0 0 14px color-mix(in srgb, ${tone} 48%, transparent)`,
          }}
          initial={{ height: 0 }}
          animate={{ height: `${score}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </div>
      <p className="mt-2 font-serif text-[22px] leading-none tabular-nums" style={{ color: "var(--hint-text)" }}>
        {score}
      </p>
      <p className="mt-1 truncate text-center font-sans text-[10.5px] font-semibold leading-none" style={{ color: "var(--hint-muted)" }}>
        {label}
      </p>
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
  onReveal: () => void;
  birthPersonalized: boolean;
  lockNotice?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimeoutRef = useRef<number | null>(null);
  const holdIntervalRef = useRef<number | null>(null);
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

  function clearHoldTimers() {
    if (holdTimeoutRef.current !== null) window.clearTimeout(holdTimeoutRef.current);
    if (holdIntervalRef.current !== null) window.clearInterval(holdIntervalRef.current);
    holdTimeoutRef.current = null;
    holdIntervalRef.current = null;
  }

  function cancelHold() {
    clearHoldTimers();
    if (!revealed) setHoldProgress(0);
  }

  function revealDailyCard() {
    clearHoldTimers();
    setHoldProgress(1);
    if (!revealed) onReveal();
  }

  function beginHoldReveal() {
    if (revealed) return;
    clearHoldTimers();
    const holdMs = 620;
    const startedAt = window.performance.now();
    setHoldProgress(0.08);
    holdIntervalRef.current = window.setInterval(() => {
      const elapsed = window.performance.now() - startedAt;
      setHoldProgress(Math.min(1, elapsed / holdMs));
    }, 48);
    holdTimeoutRef.current = window.setTimeout(revealDailyCard, holdMs);
  }

  function revealFromKeyboard(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (revealed) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    revealDailyCard();
  }

  useEffect(() => {
    if (!revealed) setExpanded(false);
  }, [revealed]);

  useEffect(() => clearHoldTimers, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.16, duration: 0.76, ease: "easeOut" }}
      className="relative overflow-hidden rounded-[18px] border px-3 py-3.5 lg:rounded-[28px] lg:px-10 lg:py-8"
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
            "radial-gradient(560px 380px at 18% 28%, rgba(122,226,214,0.18), transparent 68%), radial-gradient(480px 320px at 86% 8%, rgba(239,166,116,0.13), transparent 68%)",
        }}
      />
      <TodayShineLayer />

      <div className="relative">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] lg:text-[11px] lg:tracking-[0.24em]" style={{ color: ACCENT.gold }}>
              Today's Tarot Score
            </p>
            <h2 className="mt-1 font-serif text-[28px] leading-none sm:text-[36px] lg:text-[48px]" style={{ color: "var(--hint-text)" }}>
              Draw your sky card
            </h2>
          </div>
            {revealed && (
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                className="rounded-full border px-3 py-2 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] transition hover:translate-y-[-1px]"
                style={{
                  color: "var(--hint-text)",
                  background: "color-mix(in srgb, var(--hint-surface-soft) 88%, transparent)",
                  borderColor: "var(--hint-border-strong)",
                }}
              >
                {expanded ? "Less" : "More"}
              </button>
            )}
        </div>

        <div className="grid gap-5 lg:grid-cols-[230px_minmax(0,1fr)] lg:items-stretch">
          <div className="text-center">
            <button
              type="button"
              onPointerDown={beginHoldReveal}
              onPointerUp={cancelHold}
              onPointerLeave={cancelHold}
              onPointerCancel={cancelHold}
              onKeyDown={revealFromKeyboard}
              className="mx-auto block rounded-[20px] outline-none transition-transform duration-200 hover:translate-y-[-2px] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--hint-aqua)_80%,white)]"
              aria-label={revealed ? `Daily tarot card: ${report.card.cardName}` : "Press and hold to draw today's sky card"}
            >
              <ThemeAwareDailyCard report={report} revealed={revealed} />
            </button>
            <button
              type="button"
              onPointerDown={beginHoldReveal}
              onPointerUp={cancelHold}
              onPointerLeave={cancelHold}
              onPointerCancel={cancelHold}
              onKeyDown={revealFromKeyboard}
              className="relative mt-4 inline-flex h-10 w-full max-w-[16rem] items-center justify-center overflow-hidden rounded-full border px-4 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] sm:w-auto"
              style={{
                color: "var(--hint-text)",
                borderColor: "var(--hint-border-strong)",
                background: "color-mix(in srgb, var(--hint-surface) 78%, transparent)",
              }}
              aria-label={revealed ? "Daily sky card revealed" : "Press and hold to draw today's sky card"}
            >
              {!revealed && (
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 transition-transform duration-75"
                  style={{
                    width: "100%",
                    background: "color-mix(in srgb, var(--hint-gold, #cba866) 22%, transparent)",
                    transform: `scaleX(${holdProgress})`,
                    transformOrigin: "left center",
                  }}
                />
              )}
              <span className="relative">{revealed ? "Card revealed" : "Hold to draw"}</span>
            </button>
            {!birthPersonalized && (
              <Link
                href="/profile"
                className="mt-3 inline-flex w-full max-w-[16rem] items-center justify-center rounded-full border px-4 py-2.5 font-sans text-[12px] font-semibold"
                style={{
                  color: "var(--hint-text)",
                  background: "color-mix(in srgb, var(--hint-surface-soft) 88%, transparent)",
                  borderColor: "color-mix(in srgb, var(--hint-gold, #cba866) 34%, var(--hint-border))",
                }}
              >
                Add birth details
              </Link>
            )}
            {lockNotice && (
              <p className="mx-auto mt-3 max-w-[16rem] font-sans text-[11px] leading-relaxed" style={{ color: "var(--hint-muted)" }}>
                {lockNotice}
              </p>
            )}
            {revealed && report.card.skyGuided && (
              <div className="mx-auto mt-3 w-full max-w-[16rem]">
                <SkyEvidence
                  signals={report.card.skyGuided.evidence}
                  themes={report.card.skyGuided.themes}
                  why={skyReading?.whyThisCard.join(" ")}
                  compact
                />
              </div>
            )}
          </div>

          <div className="grid gap-3">
            <div
              className="rounded-[18px] border p-3 sm:p-4"
              style={{
                background: "color-mix(in srgb, var(--hint-input-bg) 82%, transparent)",
                borderColor: "var(--hint-border)",
              }}
            >
              {revealed ? (
                <div className="grid gap-4 sm:grid-cols-[130px_minmax(0,1fr)] sm:items-end">
                  <div>
                    <p className="font-serif text-[18px] leading-none" style={{ color: "var(--hint-text)" }}>
                      Overall
                    </p>
                    <p className="mt-2 font-serif text-[72px] leading-none tabular-nums sm:text-[82px]" style={{ color: "var(--hint-score-ink)", textShadow: "var(--hint-score-shadow)" }}>
                      {report.overallScore}
                    </p>
                  </div>
                  <div className="grid grid-cols-5 gap-2 sm:gap-3">
                    {report.scores.map((score, index) => (
                      <motion.div
                        key={score.key}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.38, ease: "easeOut" }}
                        className="min-w-0"
                      >
                        <PillScore score={score.score} label={score.label} tone={score.tone} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center">
                  <p className="font-serif text-[26px] leading-tight" style={{ color: "var(--hint-text)" }}>
                    Scores are hidden in the card.
                  </p>
                  <p className="mx-auto mt-2 max-w-md font-sans text-[13px] leading-relaxed" style={{ color: "var(--hint-muted)" }}>
                    Today's tarot card is selected from your sky pattern first. Draw it to reveal the overall score and five life-area scores.
                  </p>
                </div>
              )}
            </div>

            <div
              className="rounded-[18px] border p-4"
              style={{
                background: "color-mix(in srgb, var(--hint-input-bg) 76%, transparent)",
                borderColor: "var(--hint-border)",
              }}
            >
              <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: ACCENT.gold }}>
                Tarot interpretation
              </p>
              <h3 className="mt-1 font-serif text-[24px] leading-none" style={{ color: "var(--hint-text)" }}>
                {revealed ? report.card.cardName : "Waiting for the reveal"}
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
            </div>
          </div>
        </div>

        {revealed && expanded && (
          <motion.div
            key="today-score-more"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, ease: "easeOut" }}
            className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]"
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
                href="/ask"
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

            <div className="grid grid-cols-3 gap-2 sm:grid-cols-3 lg:grid-cols-3">
              {report.lucky.map((item) => (
                <div
                  key={item.key}
                  className="flex min-h-[124px] flex-col items-center justify-center rounded-[8px] p-3 text-center"
                  style={{
                    background: "var(--hint-lucky-tile-bg)",
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
      className="relative scroll-mt-28 overflow-hidden rounded-[22px] border px-4 py-5 sm:rounded-[28px] sm:px-7 sm:py-7 lg:px-8"
      style={{
        background:
          "linear-gradient(115deg, color-mix(in srgb, var(--hint-surface) 86%, transparent), color-mix(in srgb, var(--hint-input-bg) 70%, transparent))",
        borderColor: "var(--hint-border)",
        boxShadow: "var(--hint-elevated-shadow)",
      }}
    >
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
          <h2 className="font-serif text-[32px] leading-none sm:text-[44px]" style={{ color: "var(--hint-text)" }}>
            Energy tasks
          </h2>
          <p className="font-serif text-[15px] italic sm:text-[18px]" style={{ color: "var(--hint-muted)" }}>
            complete three small check-ins to finish today's ritual
          </p>
        </div>
        <Link
          href="/profile"
          className="font-sans text-[12px] font-semibold uppercase tracking-[0.22em]"
          style={{ color: "var(--hint-faint)" }}
        >
          All rewards →
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr] lg:items-start">
        <div>
          <div
            className="rounded-[18px] border p-3 sm:p-4"
            style={{
              background: "color-mix(in srgb, var(--hint-input-bg) 80%, transparent)",
              borderColor: "var(--hint-border)",
            }}
          >
            <div className="grid gap-1">
              {tasks.slice(0, 3).map((task, index) => {
                const checked = ritual.todayTaskCompletions.includes(index);
                return (
                  <button
                    key={task.text}
                    type="button"
                    onClick={() => onToggleTask(index)}
                    className="grid grid-cols-[38px_1fr] items-center gap-3 rounded-[12px] px-2 py-3 text-left transition hover:bg-white/5"
                  >
                    <span
                      className="grid size-7 place-items-center rounded-[8px] border"
                      style={{
                        background: checked ? "linear-gradient(135deg, #8ee2d4, #f3cf82)" : "rgba(255,255,255,0.08)",
                        borderColor: checked ? "rgba(142,226,212,0.72)" : "color-mix(in srgb, var(--hint-border-strong) 78%, transparent)",
                        color: checked ? "#172422" : "var(--hint-faint)",
                      }}
                    >
                      {checked ? <Check size={17} strokeWidth={2.5} /> : null}
                    </span>
                    <span className="min-w-0">
                      <span
                        className="font-serif text-[17px] leading-snug sm:text-[20px]"
                        style={{
                          color: checked ? "var(--hint-faint)" : "var(--hint-text)",
                          textDecoration: checked ? "line-through" : "none",
                          textDecorationThickness: "2px",
                        }}
                      >
                        {task.text}
                      </span>
                      <span className="ml-2 font-sans text-[12px] font-semibold" style={{ color: "var(--hint-faint)" }}>
                        ({task.reason})
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-7 items-start gap-2">
            {ritual.week.map((day, index) => {
              const done = day.completed;
              return (
                <div key={day.date} className="text-center">
                  <motion.div
                    className="mx-auto grid size-8 place-items-center rounded-full sm:size-10"
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
                  <p className="mt-2 font-sans text-[10px] font-semibold sm:text-[11px]" style={{ color: "var(--hint-muted)" }}>
                    {day.label}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-5">
            <div className="mb-3 flex items-center justify-between gap-4">
              <p className="font-sans text-[13px] sm:text-[14px]" style={{ color: "var(--hint-text)" }}>
                {rewardText}
              </p>
              <p className="font-sans text-[13px]" style={{ color: "var(--hint-faint)" }}>
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

        <div className="grid gap-3">
          <RewardStat icon={Star} value={`${ritual.starLevel}`} label="Star level" />
          <RewardStat icon={Gift} value={`${ritual.readingCredits}`} label="Credits" />
          <RewardStat icon={Sparkles} value={`${ritual.currentStreak}`} label="Day streak" />
          <div
            className="rounded-[18px] border p-4"
            style={{
              background: "var(--hint-me-plus-surface)",
              borderColor: "var(--hint-me-plus-border)",
              boxShadow: "var(--hint-me-plus-shadow)",
            }}
          >
            <p className="font-serif text-[21px] leading-tight" style={{ color: "var(--hint-text)" }}>
              Weekly reward
            </p>
            <p className="mt-2 font-sans text-[12px] leading-relaxed sm:text-[13px]" style={{ color: "var(--hint-muted)" }}>
              Complete all three tasks each day. Seven completed days unlock 10 credits; a 30-day streak raises your star level by one.
            </p>
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
      className="flex items-center gap-3 rounded-[16px] border p-3.5"
      style={{
        background: "color-mix(in srgb, var(--hint-surface-soft) 82%, transparent)",
        borderColor: "var(--hint-border)",
      }}
    >
      <div className="grid size-10 place-items-center rounded-[12px]" style={{ background: "rgba(228, 198, 138, 0.16)", color: ACCENT.gold }}>
        <Icon size={16} />
      </div>
      <div>
        <p className="font-serif text-[24px] leading-none" style={{ color: "var(--hint-text)" }}>
          {value}
        </p>
        <p className="font-sans text-[12px]" style={{ color: "var(--hint-muted)" }}>
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
            href="/daily"
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
        card: getDailyPullById(dailyReceipt.assignedCardId, language),
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
      href: "/daily",
      icon: Moon,
      color: ACCENT.lavender,
    },
  ];

  return (
    <div className="relative h-full w-full overflow-y-auto overscroll-none pb-16">
      <TodayShineLayer wide />
      <div className={`relative z-10 mx-auto w-full max-w-lg px-3 sm:max-w-3xl sm:px-6 lg:max-w-6xl lg:pt-28 ${dailyCardRevealed ? "pt-20" : "pt-24"}`}>
        <motion.section
          id="today"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.75, ease: "easeOut" }}
          className={`relative scroll-mt-24 overflow-visible pt-2 lg:mb-8 lg:scroll-mt-28 lg:pt-3 ${dailyCardRevealed ? "mb-3" : "mb-5"}`}
        >
          <div className={`${dailyCardRevealed ? "py-2" : "py-3"} lg:py-8`}>
            <div className="relative z-10">
              <p className="font-sans text-[10px] font-medium uppercase tracking-[0.12em] lg:text-[11px]" style={{ color: ACCENT.gold }}>
                {t("home.eyebrow")}
              </p>
              <h1
                className={`mt-2 max-w-4xl font-serif leading-[0.98] lg:mt-4 lg:text-[72px] ${dailyCardRevealed ? "text-[24px]" : "text-[32px]"}`}
                style={{ color: "var(--hint-text)", textShadow: "0 0 32px rgba(228,198,138,0.12)" }}
              >
                {t("home.title")}
              </h1>
              <p className={`max-w-2xl font-sans leading-relaxed lg:mt-4 lg:text-[16px] ${dailyCardRevealed ? "mt-2 line-clamp-1 text-[11px]" : "mt-3 text-[12px]"}`} style={{ color: "var(--hint-muted)" }}>
                {t("home.subtitle")}
              </p>
            </div>
          </div>
        </motion.section>

        <section id="your-card" className="mb-7 scroll-mt-28 lg:mb-10">
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

        <div className="mb-10">
          <RitualStreakPanel
            ritual={ritual}
            tasks={report.tasks}
            onToggleTask={handleToggleRitualTask}
          />
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
          <FeedCards dailyCardRevealed={dailyCardRevealed} />
        </section>
      </div>
    </div>
  );
}
