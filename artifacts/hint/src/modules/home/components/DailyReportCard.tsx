import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Check,
  Coins,
  Heart,
  Sparkles,
  Users,
} from "lucide-react";
import { ACCENT } from "../../hold/atmosphere";
import { CardSigil } from "../../hold/components/CardSigil";
import { getAnonId, getLocalDateString } from "../../../lib/identity";
import { getDailyReport } from "../data/dailyReport";
import { localizeDailyPull } from "../data/dailyPulls";
import { getRitualProgress } from "../data/localRitualProgress";
import { getTarotCardImage } from "../../tarot/logic/cardImageMap";
import type { DailyPull, DailyScore, DailyScoreKey } from "../types/home.types";
import { useLanguage } from "../../../lib/i18n";
import { useProfile } from "../../../lib/useProfile";
import { readBirthProfile } from "../../../lib/astro/userBirthProfile";
import { LuckyIllustration } from "./LuckyIllustration";
import { SafeImage } from "../../../shared/ui/SafeImage";
import {
  listLocalDailyReadingMemory,
  subscribeToLocalDailyReadings,
} from "../../readings/localDailyReadings";
import type { DailyCardMemory } from "../../../lib/tarot/skyGuidedTarot";

const SCORE_ICONS: Record<DailyScoreKey, typeof Heart> = {
  love: Heart,
  wealth: Coins,
  career: BriefcaseBusiness,
  study: BookOpen,
  people: Users,
};

interface DailyReportCardProps {
  className?: string;
  detailed?: boolean;
  cardOverride?: DailyPull | null;
  dateOverride?: Date;
  dailyHistory?: DailyCardMemory[];
}

function ScoreBar({ score }: { score: DailyScore }) {
  const Icon = SCORE_ICONS[score.key];

  return (
    <div
      className="min-w-0 rounded-[12px] border px-2 py-1.5"
      style={{
        background: "color-mix(in srgb, var(--hint-card-inner) 82%, transparent)",
        borderColor: "var(--hint-border)",
      }}
    >
      <div className="mb-0.5 flex items-center justify-between gap-2">
        <span className="inline-flex min-w-0 items-center gap-1 overflow-hidden whitespace-nowrap font-sans text-[9.5px]" style={{ color: "var(--hint-muted)" }}>
          <Icon size={11} strokeWidth={1.8} style={{ color: score.tone }} />
          {score.label}
        </span>
        <span className="font-serif text-[13px] tabular-nums" style={{ color: "var(--hint-text)" }}>
          {score.score}
        </span>
      </div>
      <div
        className="h-1 overflow-hidden rounded-full"
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

function MiniDailyCard({ card, interactive = true }: { card: DailyPull; interactive?: boolean }) {
  const { t } = useLanguage();
  const cardImage =
    getTarotCardImage(card.cardId, "original") ??
    getTarotCardImage(card.cardId, "hint-classic");
  const content = (
    <div
      className="relative grid grid-cols-[50px_1fr] items-center gap-2.5 rounded-[16px] border p-2 sm:grid-cols-[58px_1fr_auto] sm:gap-3"
      style={{
        background: "var(--hint-input-bg)",
        borderColor: "var(--hint-border)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.20)",
      }}
    >
      <div
        className="relative h-[74px] overflow-hidden rounded-[11px] sm:h-[86px]"
        style={{
          background: "var(--hint-deck-card-bg)",
          border: "1px solid color-mix(in srgb, var(--hint-gold) 34%, var(--hint-border))",
          boxShadow: "0 12px 24px color-mix(in srgb, var(--hint-rose) 10%, transparent), inset 0 1px 0 rgba(255,255,255,0.38)",
        }}
      >
        <SafeImage
          src={cardImage}
          alt={card.cardName}
          loading="lazy"
          className="h-full w-full object-cover"
          fallbackClassName="rounded-[15px]"
          fallbackLabel="Tarot card"
        >
          <CardSigil cardId={card.cardId} />
        </SafeImage>
      </div>
      <div className="min-w-0">
        <p
          className="font-sans text-[8px] uppercase tracking-[0.16em] sm:text-[9px] sm:tracking-[0.18em]"
          style={{ color: ACCENT.gold }}
        >
          {t("daily.card")}
        </p>
        <h3 className="mt-0.5 font-serif text-[16px] leading-tight sm:text-[18px]" style={{ color: "var(--hint-text)" }}>
          {card.cardName}
        </h3>
        <p className="mt-0.5 line-clamp-2 font-sans text-[10px] leading-snug sm:text-[11px]" style={{ color: "var(--hint-muted)" }}>
          {card.whisper}
        </p>
      </div>
      {interactive ? (
        <ArrowRight
          size={18}
          strokeWidth={1.8}
          className="hidden transition-transform group-hover:translate-x-0.5 sm:block"
          style={{ color: "var(--hint-faint)" }}
        />
      ) : null}
    </div>
  );

  return (
    interactive ? (
      <Link href="/app/daily" className="group block">
        {content}
      </Link>
    ) : (
      content
    )
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

function CardGuidanceGrid({ card, why }: { card: DailyPull; why?: string }) {
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
        <CardGuidanceItem label="Why this card" value={why ?? card.themeNote} />
      </div>
    </div>
  );
}

export function DailyReportCard({
  className = "",
  detailed = false,
  cardOverride,
  dateOverride,
  dailyHistory,
}: DailyReportCardProps) {
  const { language, t } = useLanguage();
  const { profile } = useProfile();
  const [birthProfile, setBirthProfile] = useState(() => readBirthProfile());
  const [historyVersion, setHistoryVersion] = useState(0);
  const dateKey = dateOverride ? getLocalDateString(dateOverride) : undefined;
  const activeBirthDetails = profile?.birthDate || birthProfile
    ? {
        name: profile?.name ?? birthProfile?.name,
        birthDate: profile?.birthDate ?? birthProfile?.birthDate,
        birthTime: profile?.birthTime ?? birthProfile?.birthTime,
        birthPlace: profile?.birthPlace ?? birthProfile?.birthPlace,
        latitude: birthProfile?.latitude,
        longitude: birthProfile?.longitude,
        timezoneOffset: birthProfile?.timezoneOffset,
      }
    : null;
  const localDailyHistory = useMemo(
    () => dailyHistory ?? listLocalDailyReadingMemory().slice(0, 30),
    [dailyHistory, historyVersion],
  );
  const report = useMemo(
    () =>
      getDailyReport({
        anonId: getAnonId(),
        date: dateOverride,
        language,
        birthDetails: activeBirthDetails ?? undefined,
        dailyHistory: localDailyHistory,
        ritualStreak: getRitualProgress().currentStreak,
      }),
    [
      activeBirthDetails?.birthDate,
      activeBirthDetails?.birthPlace,
      activeBirthDetails?.birthTime,
      activeBirthDetails?.latitude,
      activeBirthDetails?.longitude,
      activeBirthDetails?.timezoneOffset,
      dateKey,
      language,
      localDailyHistory,
    ],
  );
  const card = cardOverride ? localizeDailyPull(cardOverride, language) : report.card;
  const cardWhy = card.skyGuided?.whyThisCard;
  const birthProfileLabel = activeBirthDetails?.birthDate
    ? `${activeBirthDetails.name || "Birth"} sky profile`
    : null;
  const [checked, setChecked] = useState<boolean[]>(() =>
    report.tasks.map(() => false),
  );

  useEffect(() => {
    const syncBirthProfile = () => setBirthProfile(readBirthProfile());
    window.addEventListener("hint.birthProfile.updated", syncBirthProfile);
    window.addEventListener("storage", syncBirthProfile);
    return () => {
      window.removeEventListener("hint.birthProfile.updated", syncBirthProfile);
      window.removeEventListener("storage", syncBirthProfile);
    };
  }, []);

  useEffect(
    () =>
      subscribeToLocalDailyReadings(() =>
        setHistoryVersion((version) => version + 1),
      ),
    [],
  );

  useEffect(() => {
    setChecked(report.tasks.map(() => false));
  }, [report.date, report.tasks]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.72, ease: "easeOut" }}
      className={`relative overflow-hidden rounded-[18px] border ${className}`}
      style={{
        background: "var(--hint-liquid-panel-strong)",
        borderColor: "var(--hint-border)",
        boxShadow: "var(--hint-elevated-shadow)",
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(360px 260px at 18% 8%, rgba(244,175,203,0.18), transparent 70%), radial-gradient(300px 260px at 90% 16%, rgba(213,194,242,0.15), transparent 72%), radial-gradient(300px 220px at 55% 0%, rgba(227,200,137,0.12), transparent 72%)",
        }}
      />
      <div className="relative p-3 sm:p-4 lg:p-5">
        <div className="mb-3 lg:hidden">
          <MiniDailyCard card={card} interactive={!detailed} />
        </div>

        <header className="mb-3 flex items-start justify-between gap-4 lg:mb-4">
          <div className="min-w-0">
            <p
              className="font-serif text-[9px] uppercase tracking-[0.22em] lg:text-[11px] lg:tracking-[0.34em]"
              style={{ color: ACCENT.aqua }}
            >
              {t("daily.eyebrow")}
            </p>
            {birthProfileLabel ? (
              <span
                className="mt-2 inline-flex rounded-full border px-2.5 py-1 font-sans text-[10px] font-black uppercase tracking-[0.12em]"
                style={{
                  color: "var(--hint-gold)",
                  borderColor: "color-mix(in srgb, var(--hint-gold) 28%, var(--hint-border))",
                  background: "color-mix(in srgb, var(--hint-gold) 9%, transparent)",
                }}
              >
                {birthProfileLabel}
              </span>
            ) : null}
            <h2 className="mt-1.5 font-serif text-[25px] leading-[1.02] sm:text-[28px] lg:mt-2 lg:text-[34px] lg:leading-none" style={{ color: "var(--hint-text)" }}>
              {report.title}
            </h2>
            {detailed ? (
              <p className="mt-2 max-w-xl font-sans text-[11px] leading-relaxed sm:text-[12px]" style={{ color: "var(--hint-muted)" }}>
                {t("dailyPull.method")}
              </p>
            ) : null}
          </div>
          <Link
            href="/app/daily"
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

        <div className="grid gap-3 lg:grid-cols-[0.95fr_1.05fr] lg:gap-5">
          <div className="min-w-0">
            <p className="font-sans text-[12px] leading-relaxed lg:text-[14px]" style={{ color: "var(--hint-muted)" }}>
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

          <div
            className="rounded-[18px] border p-2.5"
            style={{
              background: "color-mix(in srgb, var(--hint-input-bg) 76%, transparent)",
              borderColor: "var(--hint-border)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
            }}
          >
            <div className="mb-2 flex items-end justify-between gap-3">
              <div className="flex items-end gap-2">
                <span
                  className="font-serif text-[46px] leading-[0.85] tabular-nums lg:text-[76px]"
                  style={{
                    color: "var(--hint-score-ink)",
                    textShadow: "var(--hint-score-shadow)",
                  }}
                >
                  {report.overallScore}
                </span>
                <span className="pb-1 font-serif text-[13px] lg:pb-2.5 lg:text-[20px]" style={{ color: "var(--hint-score-ink)" }}>
                  {t("daily.score")}
                </span>
              </div>
              <span className="pb-1 font-sans text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: "var(--hint-faint)" }}>
                {report.scores.length} signals
              </span>
            </div>
            <div className="grid gap-1.5 min-[360px]:grid-cols-2 lg:grid-cols-1 lg:gap-3">
              {report.scores.map((score) => (
                <ScoreBar key={score.key} score={score} />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 lg:hidden">
          <div
            className="rounded-[15px] border p-3"
            style={{
              background: "color-mix(in srgb, var(--hint-card-inner) 82%, transparent)",
              borderColor: "var(--hint-border)",
            }}
          >
            <p className="font-sans text-[9px] uppercase tracking-[0.18em]" style={{ color: "var(--hint-faint)" }}>
              {t("daily.suggest")}
            </p>
            <p className="mt-1 font-serif text-[13px] leading-snug" style={{ color: "var(--hint-text)" }}>
              {report.suggestion}
            </p>
          </div>
          <div
            className="rounded-[15px] border p-3"
            style={{
              background: "color-mix(in srgb, var(--hint-card-inner) 82%, transparent)",
              borderColor: "var(--hint-border)",
            }}
          >
            <p className="font-sans text-[9px] uppercase tracking-[0.18em]" style={{ color: "var(--hint-faint)" }}>
              {t("daily.avoid")}
            </p>
            <p className="mt-1 font-serif text-[13px] leading-snug" style={{ color: "var(--hint-text)" }}>
              {report.avoid}
            </p>
          </div>
        </div>

        <div className="mt-4 hidden lg:block">
          <MiniDailyCard card={card} interactive={!detailed} />
        </div>

        {detailed && <CardGuidanceGrid card={card} why={cardWhy} />}

        <div className="mt-3 grid grid-cols-3 gap-2">
          {report.lucky.map((item) => (
            <div
              key={item.key}
              className="min-h-[112px] rounded-[20px] border px-2 py-3 text-center"
              style={{
                background: "var(--hint-lucky-tile-bg-strong)",
                borderColor: "var(--hint-border)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22)",
              }}
            >
              <LuckyIllustration item={item} size={40} />
              <p className="mt-2 font-sans text-[8px] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--hint-faint)" }}>
                {item.label}
              </p>
              <p className="mt-1 truncate font-serif text-[14px] leading-tight" style={{ color: "var(--hint-text)" }}>
                {item.value}
              </p>
              <p className="mx-auto mt-1 line-clamp-2 max-w-[8rem] font-sans text-[9px] leading-snug" style={{ color: "var(--hint-muted)" }}>
                {item.hint}
              </p>
            </div>
          ))}
        </div>

        {detailed && (
          <div className="hint-liquid-panel mt-4 rounded-[24px] p-3" style={{ borderColor: "var(--hint-border)" }}>
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
                  className="grid min-h-[48px] grid-cols-[28px_1fr] gap-3 rounded-[18px] p-2 text-left transition active:scale-[0.99]"
                >
                  <span
                    className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-[10px] border"
                    style={{
                      color: checked[index] ? "#06201e" : "var(--hint-faint)",
                      background: checked[index]
                        ? "var(--hint-special-action-bg)"
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
