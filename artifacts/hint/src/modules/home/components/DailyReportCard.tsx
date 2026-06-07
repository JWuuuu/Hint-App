import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowRight,
  Brain,
  BriefcaseBusiness,
  Check,
  Clock3,
  Coins,
  Compass,
  Heart,
  Palette,
  Sparkles,
  Users,
} from "lucide-react";
import { ACCENT } from "../../hold/atmosphere";
import { CardSigil } from "../../hold/components/CardSigil";
import { getAnonId } from "../../../lib/identity";
import { getDailyReport } from "../data/dailyReport";
import { localizeDailyPull } from "../data/dailyPulls";
import type { DailyPull, DailyScore, DailyScoreKey } from "../types/home.types";
import { useLanguage } from "../../../lib/i18n";
import { useProfile } from "../../../lib/useProfile";

const SCORE_ICONS: Record<DailyScoreKey, typeof Heart> = {
  love: Heart,
  resources: Coins,
  work: BriefcaseBusiness,
  focus: Brain,
  connection: Users,
};

const LUCKY_ICONS = {
  color: Palette,
  hour: Clock3,
  direction: Compass,
  number: Sparkles,
} as const;

interface DailyReportCardProps {
  className?: string;
  detailed?: boolean;
  cardOverride?: DailyPull | null;
}

function ScoreBar({ score }: { score: DailyScore }) {
  const Icon = SCORE_ICONS[score.key];

  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 font-sans text-[11px]" style={{ color: "var(--hint-muted)" }}>
          <Icon size={13} strokeWidth={1.8} style={{ color: score.tone }} />
          {score.label}
        </span>
        <span className="font-serif text-[17px] tabular-nums" style={{ color: "var(--hint-text)" }}>
          {score.score}
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full"
        style={{ background: "var(--hint-card-inner)" }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score.score}%` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${score.tone}, rgba(255,255,255,0.72))`,
            boxShadow: `0 0 16px ${score.tone}66`,
          }}
        />
      </div>
    </div>
  );
}

function MiniDailyCard({ card }: { card: DailyPull }) {
  const { t } = useLanguage();

  return (
    <Link href="/daily-pull" className="group block">
      <div
        className="relative grid grid-cols-[74px_1fr] items-center gap-3 rounded-[12px] border p-3 sm:grid-cols-[72px_1fr_auto] sm:gap-4"
        style={{
          background: "var(--hint-input-bg)",
          borderColor: "var(--hint-border)",
        }}
      >
        <div
          className="relative h-[104px] overflow-hidden rounded-[8px]"
          style={{
            background: "var(--hint-deck-card-bg)",
            border: "1px solid rgba(206,178,110,0.34)",
            boxShadow: "0 14px 26px rgba(0,0,0,0.22)",
          }}
        >
          <div className="absolute inset-[5px] rounded-[5px] border border-[rgba(206,178,110,0.34)]" />
          <CardSigil cardId={card.cardId} />
        </div>
        <div className="min-w-0">
          <p
            className="font-sans text-[9px] uppercase tracking-[0.22em] sm:text-[10px] sm:tracking-[0.24em]"
            style={{ color: ACCENT.gold }}
          >
            {t("daily.card")}
          </p>
          <h3 className="mt-1 font-serif text-[20px] leading-tight sm:text-[21px]" style={{ color: "var(--hint-text)" }}>
            {card.cardName}
          </h3>
          <p className="mt-1 line-clamp-2 font-sans text-[11px] leading-snug sm:mt-2 sm:text-[12px] sm:leading-relaxed" style={{ color: "var(--hint-muted)" }}>
            {card.whisper}
          </p>
        </div>
        <ArrowRight
          size={18}
          strokeWidth={1.8}
          className="hidden transition-transform group-hover:translate-x-0.5 sm:block"
          style={{ color: "var(--hint-faint)" }}
        />
      </div>
    </Link>
  );
}

function CardGuidanceItem({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  if (!value) return null;

  return (
    <div
      className="rounded-[12px] border p-3"
      style={{
        background: "var(--hint-card-inner)",
        borderColor: "var(--hint-border)",
      }}
    >
      <p
        className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: ACCENT.gold }}
      >
        {label}
      </p>
      <p
        className="mt-2 font-sans text-[11.5px] leading-snug sm:text-[12.5px] sm:leading-relaxed"
        style={{ color: "var(--hint-muted)" }}
      >
        {value}
      </p>
    </div>
  );
}

function CardGuidanceGrid({ card }: { card: DailyPull }) {
  const badges = [
    card.orientation === "upright" ? "Upright" : null,
    card.arcana === "major" ? "Bigger message" : card.arcana === "minor" ? "Daily guidance" : null,
    card.keyword,
  ].filter((badge): badge is string => Boolean(badge));

  return (
    <div
      className="mt-4 rounded-[14px] border p-3 sm:p-4"
      style={{
        background: "var(--hint-input-bg)",
        borderColor: "var(--hint-border)",
      }}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {badges.map((badge) => (
          <span
            key={badge}
            className="rounded-full border px-3 py-1.5 font-sans text-[11px] font-medium"
            style={{
              borderColor: "var(--hint-border)",
              background: "var(--hint-surface-soft)",
              color: "var(--hint-text)",
            }}
          >
            {badge}
          </span>
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        <CardGuidanceItem label="Do" value={card.do} />
        <CardGuidanceItem label="Avoid" value={card.avoid} />
        <CardGuidanceItem label="Love" value={card.love} />
        <CardGuidanceItem label="Work / study" value={card.work} />
        <CardGuidanceItem label="Self" value={card.self} />
        <CardGuidanceItem label="Why it matters" value={card.themeNote} />
      </div>
    </div>
  );
}

export function DailyReportCard({
  className = "",
  detailed = false,
  cardOverride,
}: DailyReportCardProps) {
  const { language, t } = useLanguage();
  const { profile } = useProfile();
  const report = useMemo(
    () =>
      getDailyReport({
        anonId: getAnonId(),
        language,
        birthDetails: profile
          ? {
              birthDate: profile.birthDate,
              birthTime: profile.birthTime,
              birthPlace: profile.birthPlace,
            }
          : undefined,
      }),
    [language, profile?.birthDate, profile?.birthTime, profile?.birthPlace],
  );
  const card = cardOverride ? localizeDailyPull(cardOverride, language) : report.card;
  const [checked, setChecked] = useState<boolean[]>(() =>
    report.tasks.map(() => false),
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.72, ease: "easeOut" }}
      className={`relative overflow-hidden rounded-[18px] border ${className}`}
      style={{
        background: "var(--hint-surface-strong)",
        borderColor: "var(--hint-border)",
        boxShadow: "var(--hint-elevated-shadow)",
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(360px 260px at 18% 8%, rgba(100,156,158,0.18), transparent 70%), radial-gradient(300px 260px at 90% 16%, rgba(196,169,98,0.16), transparent 72%)",
        }}
      />
      <div className="relative p-4 sm:p-5 lg:p-6">
        <div className="mb-4 lg:hidden">
          <MiniDailyCard card={card} />
        </div>

        <header className="mb-4 flex items-start justify-between gap-4 lg:mb-5">
          <div>
            <p
              className="font-serif text-[9px] uppercase tracking-[0.22em] lg:text-[11px] lg:tracking-[0.34em]"
              style={{ color: ACCENT.aqua }}
            >
              {t("daily.eyebrow")}
            </p>
            <h2 className="mt-1 max-w-[13ch] font-serif text-[20px] leading-tight sm:max-w-[24ch] sm:text-[24px] lg:mt-2 lg:max-w-none lg:text-[38px] lg:leading-none" style={{ color: "var(--hint-text)" }}>
              {report.title}
            </h2>
          </div>
          <Link
            href="/daily-pull"
            className="hidden h-9 shrink-0 items-center gap-1 rounded-full border px-3 font-sans text-[10px] uppercase tracking-[0.16em] lg:inline-flex"
            style={{
              color: "var(--hint-muted)",
              background: "var(--hint-surface-soft)",
              borderColor: "var(--hint-border)",
            }}
          >
            {t("daily.fullReport")}
            <ArrowRight size={13} />
          </Link>
        </header>

        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr] lg:gap-5">
          <div className="min-w-0">
            <div className="mb-3 flex items-end gap-2 lg:mb-7">
              <span
                className="font-serif text-[52px] leading-[0.9] tabular-nums sm:text-[60px] lg:text-[88px]"
                style={{
                  color: "var(--hint-score-ink)",
                  textShadow: "var(--hint-score-shadow)",
                }}
              >
                {report.overallScore}
              </span>
              <span className="pb-2 font-serif text-[16px] lg:pb-3 lg:text-[22px]" style={{ color: "var(--hint-score-ink)" }}>
                {t("daily.score")}
              </span>
            </div>
            <p className="line-clamp-2 font-sans text-[12px] leading-snug lg:line-clamp-none lg:text-[14px] lg:leading-relaxed" style={{ color: "var(--hint-muted)" }}>
              {report.summary}
            </p>
            <div className="mt-3 hidden grid-cols-2 gap-3 lg:grid">
              <div>
                <p className="font-sans text-[10px] uppercase tracking-[0.2em]" style={{ color: "var(--hint-faint)" }}>
                  {t("daily.suggest")}
                </p>
                <p className="mt-1 font-serif text-[14px] leading-snug" style={{ color: "var(--hint-text)" }}>
                  {report.suggestion}
                </p>
              </div>
              <div>
                <p className="font-sans text-[10px] uppercase tracking-[0.2em]" style={{ color: "var(--hint-faint)" }}>
                  {t("daily.avoid")}
                </p>
                <p className="mt-1 font-serif text-[14px] leading-snug" style={{ color: "var(--hint-text)" }}>
                  {report.avoid}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-2 lg:gap-3">
            {report.scores.map((score) => (
              <ScoreBar key={score.key} score={score} />
            ))}
          </div>
        </div>

        <div className="mt-5 hidden lg:block">
          <MiniDailyCard card={card} />
        </div>

        {detailed && <CardGuidanceGrid card={card} />}

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {report.lucky.map((item) => {
            const Icon = LUCKY_ICONS[item.key];
            return (
              <div
                key={item.key}
                className="rounded-[12px] border p-3"
                style={{
                  background: "var(--hint-card-inner)",
                  borderColor: "var(--hint-border)",
                }}
              >
                <Icon size={17} strokeWidth={1.8} style={{ color: ACCENT.gold }} />
                <p className="mt-2 font-sans text-[10px] uppercase tracking-[0.16em]" style={{ color: "var(--hint-faint)" }}>
                  {item.label}
                </p>
                <p className="mt-1 font-serif text-[17px] leading-none" style={{ color: "var(--hint-text)" }}>
                  {item.value}
                </p>
                <p className="mt-2 font-sans text-[11px] leading-snug" style={{ color: "var(--hint-muted)" }}>
                  {item.hint}
                </p>
              </div>
            );
          })}
        </div>

        {detailed && (
          <div className="mt-5 rounded-[12px] border p-4" style={{ background: "var(--hint-input-bg)", borderColor: "var(--hint-border)" }}>
            <div className="mb-3 flex items-center gap-2">
              <Sparkles size={15} style={{ color: ACCENT.gold }} />
              <h3 className="font-serif text-[18px]" style={{ color: "var(--hint-text)" }}>
                {t("daily.energyTasks")}
              </h3>
            </div>
            <div className="grid gap-2">
              {report.tasks.map((task, index) => (
                <button
                  key={task.text}
                  type="button"
                  onClick={() =>
                    setChecked((next) =>
                      next.map((value, i) => (i === index ? !value : value)),
                    )
                  }
                  className="grid grid-cols-[28px_1fr] gap-3 rounded-[10px] p-2 text-left transition-opacity hover:opacity-90"
                >
                  <span
                    className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-[7px] border"
                    style={{
                      color: checked[index] ? "#06201e" : "var(--hint-faint)",
                      background: checked[index]
                        ? "linear-gradient(145deg, rgba(122,226,214,0.95), rgba(243,212,144,0.9))"
                        : "var(--hint-surface-soft)",
                      borderColor: checked[index] ? "rgba(122,226,214,0.62)" : "var(--hint-border)",
                    }}
                  >
                    {checked[index] && <Check size={15} strokeWidth={2.2} />}
                  </span>
                  <span>
                    <span className="block font-serif text-[15px] leading-snug" style={{ color: "var(--hint-text)" }}>
                      {task.text}
                    </span>
                    <span className="mt-1 block font-sans text-[11.5px] leading-snug" style={{ color: "var(--hint-muted)" }}>
                      {task.reason}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="mt-4 font-sans text-[10.5px] leading-relaxed" style={{ color: "var(--hint-faint)" }}>
          {t("daily.disclaimer")}
        </p>
      </div>
    </motion.section>
  );
}
