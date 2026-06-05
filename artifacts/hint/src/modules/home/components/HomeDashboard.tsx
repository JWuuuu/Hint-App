import { useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowRight,
  Library,
  MessageCircle,
  Moon,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useGetUserStats } from "@workspace/api-client-react";
import { ACCENT, GOLD } from "../../hold/atmosphere";
import { getAnonId } from "../../../lib/identity";
import { getDailyReport } from "../data/dailyReport";
import { ModuleGrid } from "./ModuleGrid";
import { FeedCards } from "./FeedCards";
import { CardSigil } from "../../hold/components/CardSigil";
import { useLanguage } from "../../../lib/i18n";
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
            <div
              className="shrink-0 rounded-[14px] border px-3 py-2 text-center lg:hidden"
              style={{
                background: "var(--hint-card-inner)",
                borderColor: "var(--hint-border)",
              }}
            >
              <p
                className="font-serif text-[38px] leading-none tabular-nums"
                style={{
                  color: "var(--hint-score-ink)",
                  textShadow: "var(--hint-score-shadow)",
                }}
              >
                {report.overallScore}
              </p>
              <p className="font-sans text-[11px] font-medium" style={{ color: "var(--hint-muted)" }}>
                {t("daily.score")}
              </p>
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
          <div
            className="absolute -right-1 top-6 rounded-[14px] border px-3 py-2 text-center"
            style={{
              background: "color-mix(in srgb, var(--hint-surface) 86%, transparent)",
              borderColor: "var(--hint-border)",
              boxShadow: "0 18px 34px rgba(0,0,0,0.16)",
            }}
          >
            <p
              className="font-serif text-[42px] leading-none tabular-nums"
              style={{
                color: "var(--hint-score-ink)",
                textShadow: "var(--hint-score-shadow)",
              }}
            >
              {report.overallScore}
            </p>
            <p className="font-sans text-[11px] font-medium" style={{ color: "var(--hint-muted)" }}>
              {t("daily.score")}
            </p>
          </div>
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
  const report = useMemo(
    () => getDailyReport({ anonId: getAnonId(), language }),
    [language],
  );
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
      <div className="mx-auto w-full max-w-lg px-4 pt-24 sm:max-w-3xl sm:px-6 md:pt-24 lg:max-w-6xl">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.75, ease: "easeOut" }}
          className="relative mb-8 overflow-visible border-b pb-8 pt-3"
          style={{
            borderColor: "var(--hint-border)",
          }}
        >
          <div
            aria-hidden
            className="absolute left-0 top-0 h-px w-full"
            style={{ background: `linear-gradient(90deg, transparent, ${GOLD.edge}, transparent)` }}
          />
          <div className="py-5">
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

            <div className="mt-7">
              <DailyHintHero report={report} />
            </div>
          </div>
        </motion.section>

        <section className="mb-7">
          <div className="grid gap-3 md:grid-cols-3">
            {startCards.map((card, index) => (
              <PortalCard key={card.title} card={card} index={index} />
            ))}
          </div>
        </section>

        <section className="mb-8">
          <PatternPanel />
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
