import { useEffect, useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Link, useLocation, useRoute } from "wouter";
import { BookOpen, CalendarDays, HelpCircle } from "lucide-react";
import { ACCENT, GLASS } from "../hold/atmosphere";
import { AppScreen, ScreenHeader, GlassPanel, SectionLabel } from "../../components/app/AppChrome";
import { useListReadings } from "@workspace/api-client-react";
import type { ReadingSummary } from "@workspace/api-client-react";
import { getAnonId } from "../../lib/identity";
import { useLanguage, type HintLanguage } from "../../lib/i18n";
import {
  getLocalDailyReading,
  listLocalDailyReadings,
  subscribeToLocalDailyReadings,
} from "./localDailyReadings";
import {
  listLocalQuestionHistory,
  subscribeToLocalQuestionHistory,
  type QuestionHistoryItem,
} from "./localQuestionHistory";
import {
  getLocalTarotReading,
  listLocalTarotReadings,
  subscribeToLocalTarotReadings,
  type LocalTarotReading,
} from "./localTarotReadings";
import type { SpreadType } from "../hold/chat/types";
import type { RitualCard } from "../tarot/logic/createHiddenDeck";
import { getTarotCardImage } from "../tarot/logic/cardImageMap";
import { SPREAD_CHOICES } from "../hold/useHoldFlow";
import { TarotHintReadingChat } from "../tarot/components/TarotHintReadingChat";
import { readBirthProfile } from "../../lib/astro/userBirthProfile";
import type { BirthProfile } from "../../types/astrology";

/**
 * ReadingsView — the room's memory. A real archive of every tarot reading the
 * user has sat with, newest first, scoped to their anonymous id.
 */

type HistoryTab = "all" | "tarot" | "daily" | "astrology" | "questions";

function fmt(iso: string, todayLabel: string): string {
  const d = new Date(iso);
  const today = new Date();
  if (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  ) {
    return todayLabel;
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const CARD_NAMES_ZH: Record<string, string> = {
  "The Fool": "愚者",
  "The Magician": "魔术师",
  "The High Priestess": "女祭司",
  "The Empress": "皇后",
  "The Emperor": "皇帝",
  "The Hierophant": "教皇",
  "The Lovers": "恋人",
  "The Chariot": "战车",
  Strength: "力量",
  "The Hermit": "隐士",
  "Wheel of Fortune": "命运之轮",
  Justice: "正义",
  "The Hanged Man": "倒吊人",
  Death: "死神",
  Temperance: "节制",
  "The Devil": "恶魔",
  "The Tower": "高塔",
  "The Star": "星星",
  "The Moon": "月亮",
  "The Sun": "太阳",
  Judgement: "审判",
  "The World": "世界",
};

function displayReading(reading: ReadingSummary, language: HintLanguage) {
  if (language !== "zh") {
    return { cardName: reading.cardName, whisper: sanitizeReadingCopy(reading.whisper) };
  }

  const cardName = CARD_NAMES_ZH[reading.cardName] ?? reading.cardName;
  return {
    cardName,
    whisper: `这次解读的核心提示来自「${cardName}」。旧记录会保留原始生成内容，但这里先用中文帮你回到这张牌的重点。`,
  };
}

function sanitizeReadingCopy(copy = "") {
  return copy
    .replace(/^Short Answer\s*:?\s*/i, "")
    .replace(/^What does the card mean\?\s*/i, "")
    .replace(/^For this question,\s*the answer is:\s*/i, "The saved reading points to: ")
    .trim();
}

function ReadingCard({
  reading,
  language,
  todayLabel,
  featured = false,
}: {
  reading: ReadingSummary;
  language: HintLanguage;
  todayLabel: string;
  featured?: boolean;
}) {
  const displayed = displayReading(reading, language);

  return (
    <Link
      href={`/app/readings/${reading.id}`}
      className={`hint-liquid-panel flex gap-3.5 rounded-[22px] ${featured ? "px-4 py-4" : "px-3.5 py-3.5"}`}
      style={{ borderColor: GLASS.border }}
    >
      <span
        className="shrink-0 font-serif text-[10px] uppercase tracking-[0.22em] w-14 pt-0.5"
        style={{ color: GLASS.faint }}
      >
        {fmt(reading.createdAt, todayLabel)}
      </span>
      <span
        className="shrink-0 w-px self-stretch"
        style={{ background: GLASS.border }}
        aria-hidden
      />
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <p
            className={`font-serif ${featured ? "text-[18px]" : "text-[14.5px]"}`}
            style={{ color: GLASS.text }}
          >
            {displayed.cardName}
          </p>
          <p
            className="font-sans text-[10px] uppercase tracking-[0.14em]"
            style={{ color: GLASS.faint }}
          >
            {reading.spreadType}
          </p>
        </div>
        {reading.question && (
          <p className="font-sans text-[12px] leading-snug" style={{ color: GLASS.faint }}>
            {reading.question}
          </p>
        )}
        <p
          className={`font-sans leading-relaxed ${featured ? "text-[13px]" : "text-[12px]"}`}
          style={{ color: GLASS.muted }}
        >
          {displayed.whisper}
        </p>
      </div>
    </Link>
  );
}

function tarotToSummary(reading: LocalTarotReading): ReadingSummary {
  return {
    id: reading.id,
    cardName: reading.spreadLabel,
    whisper: sanitizeReadingCopy(reading.shortAnswer),
    spreadType: reading.spreadType,
    question: reading.question,
    territory: reading.focusLabel ?? "tarot",
    createdAt: reading.createdAt,
  };
}

function questionFromTarotReading(reading: LocalTarotReading): QuestionHistoryItem | null {
  const question = reading.question?.trim();
  if (!question) return null;
  return {
    id: `reading-question-${reading.id}`,
    anonId: reading.anonId,
    question,
    focus: reading.focusLabel ?? reading.spreadLabel,
    spreadType: reading.spreadType as SpreadType,
    readingId: reading.id,
    createdAt: reading.createdAt,
  };
}

function mergeQuestionHistory(
  stored: QuestionHistoryItem[],
  tarotReadings: LocalTarotReading[],
): QuestionHistoryItem[] {
  const byKey = new Map<string, QuestionHistoryItem>();
  for (const item of stored) {
    byKey.set(item.readingId ?? item.id, item);
  }
  for (const reading of tarotReadings) {
    const item = questionFromTarotReading(reading);
    if (!item) continue;
    byKey.set(item.readingId ?? item.id, item);
  }
  return [...byKey.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function tarotReadingToRitualCards(reading: LocalTarotReading): RitualCard[] {
  return reading.cards.map((card, index) => ({
    visualId: `${reading.id}-${index}-${card.cardId}`,
    cardId: card.cardId,
    name: card.name,
    orientation: card.orientation,
    x: 50,
    y: 50,
    rotation: 0,
    rotate: 0,
    zIndex: index,
    selected: true,
    revealed: true,
  }));
}

function displayQuestionMeaning(reading: LocalTarotReading): string {
  const question = reading.question?.trim();
  if (!question) return reading.questionMeaning;
  return reading.questionMeaning
    .replace(`For "${question}", `, "For this question, ")
    .replace(`For “${question}”, `, "For this question, ");
}

const SPREAD_LABELS: Record<SpreadType, string> = {
  single: "One card",
  three: "Three cards",
  relationship: "Connection",
  futureLover: "Future Lover",
  peachBlossom: "Peach Blossom",
  reconciliation: "Reconciliation",
  trueHeart: "True Heart",
  loveTree: "Love Tree",
  xRelationship: "X Relationship",
};

function QuestionCard({
  item,
  todayLabel,
}: {
  item: QuestionHistoryItem;
  todayLabel: string;
}) {
  return (
    <div
      className="hint-liquid-panel rounded-[22px] px-4 py-4"
      style={{ borderColor: GLASS.border }}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span
          className="font-serif text-[10px] uppercase tracking-[0.22em]"
          style={{ color: GLASS.faint }}
        >
          {fmt(item.createdAt, todayLabel)}
        </span>
        <span
          className="rounded-full border px-2.5 py-1 font-sans text-[10px] font-semibold uppercase tracking-[0.12em]"
          style={{
            color: ACCENT.gold,
            borderColor: "rgba(206,178,110,0.26)",
            background: "rgba(206,178,110,0.09)",
          }}
        >
          {SPREAD_LABELS[item.spreadType] ?? item.spreadType}
        </span>
      </div>
      <p className="font-serif text-[17px] leading-snug" style={{ color: GLASS.text }}>
        {item.question}
      </p>
      <p className="mt-2 font-sans text-[12px] leading-relaxed" style={{ color: GLASS.faint }}>
        {item.focus}
      </p>
      <Link
        href={`/app/readings/${item.readingId ?? item.id}`}
        className="hint-soft-button mt-4 inline-flex h-10 items-center justify-center rounded-full px-4 font-sans text-[12px] font-bold"
        style={{
          color: "var(--hint-special-action-text)",
        }}
      >
        Open
      </Link>
    </div>
  );
}

function EmptyPanel({ children }: { children: ReactNode }) {
  return (
    <div
      className="rounded-[22px] px-4 py-5 text-center font-sans text-[13px] leading-relaxed"
      style={{
        background: "color-mix(in srgb, var(--hint-surface-soft) 72%, transparent)",
        border: `1px dashed ${GLASS.border}`,
        color: GLASS.muted,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
      }}
    >
      {children}
    </div>
  );
}

function MemoryStat({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: typeof BookOpen;
  value: number;
  label: string;
  tone: string;
}) {
  return (
    <div
      className="min-w-0 rounded-[14px] border px-2 py-2"
      style={{
        background: "color-mix(in srgb, var(--hint-surface-soft) 78%, transparent)",
        borderColor: "var(--hint-border)",
      }}
    >
      <div className="flex flex-col items-center text-center">
        <span
          className="grid size-7 place-items-center rounded-full border"
          style={{
            color: tone,
            background: `color-mix(in srgb, ${tone} 12%, var(--hint-surface-soft))`,
            borderColor: `color-mix(in srgb, ${tone} 30%, var(--hint-border))`,
          }}
        >
          <Icon size={13} />
        </span>
        <div className="mt-1.5 min-w-0">
          <p className="font-serif text-[18px] leading-none tabular-nums" style={{ color: "var(--hint-text)" }}>
            {value}
          </p>
          <p className="mt-0.5 whitespace-nowrap font-sans text-[7.5px] font-black uppercase tracking-[0.04em]" style={{ color: "var(--hint-muted)" }}>
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}

function HistoryMemoryPanel({
  readingCount,
  dailyCount,
  questionCount,
}: {
  readingCount: number;
  dailyCount: number;
  questionCount: number;
}) {
  return (
    <GlassPanel padded={false} className="mb-5 hint-shimmer-border p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <SectionLabel>Memory</SectionLabel>
          <h2 className="mt-1.5 font-serif text-[21px] leading-none" style={{ color: "var(--hint-text)" }}>
            Your Hint memory
          </h2>
        </div>
        <span
          className="rounded-full border px-2.5 py-1 font-sans text-[9px] font-black uppercase tracking-[0.1em]"
          style={{
            color: "var(--hint-gold)",
            borderColor: "var(--hint-border)",
            background: "color-mix(in srgb, var(--hint-surface-soft) 72%, transparent)",
          }}
        >
          History
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <MemoryStat icon={BookOpen} value={readingCount} label="Reads" tone="#d98aaa" />
        <MemoryStat icon={CalendarDays} value={dailyCount} label="Daily" tone="#cda866" />
        <MemoryStat icon={HelpCircle} value={questionCount} label="Asks" tone="#9b98c9" />
      </div>
    </GlassPanel>
  );
}

function buildAstrologyArchive(profile: BirthProfile | null) {
  return [
    {
      id: "birth",
      title: profile ? "Birth profile saved" : "Birth profile",
      label: profile ? `${profile.birthDate} · ${profile.birthPlace}` : "Add birth details",
      body: profile
        ? "Your account birth details are ready for charts, transits, together, and reports."
        : "Add birth date, time, and place once, then reuse it across Astrology.",
      href: "/app/astrology?tab=birth",
    },
    {
      id: "chart",
      title: "Chart graph",
      label: "Natal wheel",
      body: "Return to the visual chart and element balance whenever you need the map.",
      href: "/app/astrology?tab=chart",
    },
    {
      id: "transits",
      title: "Transit checks",
      label: "Date-based sky",
      body: "Look up a transit window for any date, not only today.",
      href: "/app/astrology?tab=transits",
    },
    {
      id: "together",
      title: "Together invites",
      label: "Synastry",
      body: "Open relationship maps and invite another person into the web flow.",
      href: "/app/astrology?tab=together",
    },
    {
      id: "reports",
      title: "Astrology reports",
      label: "Long reads",
      body: "Keep birth, transit, and relationship report previews in one place.",
      href: "/app/astrology?tab=reports",
    },
  ];
}

function ReadingList({
  readings,
  language,
  todayLabel,
  empty,
  limit,
}: {
  readings: ReadingSummary[];
  language: HintLanguage;
  todayLabel: string;
  empty: string;
  limit?: number;
}) {
  const rows = typeof limit === "number" ? readings.slice(0, limit) : readings;
  if (!rows.length) return <EmptyPanel>{empty}</EmptyPanel>;

  return (
    <div className="flex flex-col gap-3">
      {rows.map((reading, i) => (
        <motion.div
          key={reading.id}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: Math.min(i, 6) * 0.05 }}
        >
          <ReadingCard
            reading={reading}
            language={language}
            todayLabel={todayLabel}
          />
        </motion.div>
      ))}
    </div>
  );
}

function QuestionList({
  items,
  todayLabel,
  empty,
  limit,
}: {
  items: QuestionHistoryItem[];
  todayLabel: string;
  empty: string;
  limit?: number;
}) {
  const rows = typeof limit === "number" ? items.slice(0, limit) : items;
  if (!rows.length) return <EmptyPanel>{empty}</EmptyPanel>;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {rows.map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: Math.min(i, 6) * 0.05 }}
        >
          <QuestionCard item={item} todayLabel={todayLabel} />
        </motion.div>
      ))}
    </div>
  );
}

function AstrologyArchiveGrid({ profile }: { profile: BirthProfile | null }) {
  const items = buildAstrologyArchive(profile);
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.56, ease: "easeOut", delay: Math.min(index, 6) * 0.04 }}
        >
          <Link
            href={item.href}
            className="hint-liquid-panel block rounded-[22px] p-4 transition-[transform,opacity] duration-200 hover:-translate-y-0.5"
            style={{ borderColor: GLASS.border }}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="font-sans text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: ACCENT.gold }}>
                Astrology
              </span>
              <span className="rounded-full border px-2.5 py-1 font-sans text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: GLASS.faint, borderColor: GLASS.border, background: "rgba(255,255,255,0.04)" }}>
                {item.label}
              </span>
            </div>
            <p className="font-serif text-[20px] leading-tight" style={{ color: GLASS.text }}>
              {item.title}
            </p>
            <p className="mt-2 font-sans text-[12.5px] leading-relaxed" style={{ color: GLASS.muted }}>
              {item.body}
            </p>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}

export function ReadingsView() {
  const { language, t } = useLanguage();
  const anonId = getAnonId();
  const { data, isLoading } = useListReadings({ anonId });
  const [activeTab, setActiveTab] = useState<HistoryTab>("all");
  const [localReadings, setLocalReadings] = useState<ReadingSummary[]>(() =>
    listLocalDailyReadings(anonId),
  );
  const [questionHistory, setQuestionHistory] = useState<QuestionHistoryItem[]>(() =>
    listLocalQuestionHistory(anonId),
  );
  const [tarotReadings, setTarotReadings] = useState<LocalTarotReading[]>(() =>
    listLocalTarotReadings(anonId),
  );
  const [birthProfile, setBirthProfile] = useState<BirthProfile | null>(() => readBirthProfile());
  const apiReadings = useMemo(() => (data ?? []) as ReadingSummary[], [data]);
  const tarotHistory = useMemo(
    () =>
      tarotReadings
        .map(tarotToSummary)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [tarotReadings],
  );
  const dailyHistory = useMemo(
    () =>
      [...localReadings].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [localReadings],
  );
  const readings = useMemo(() => {
    const byId = new Map<string, ReadingSummary>();
    [...tarotHistory, ...dailyHistory, ...apiReadings].forEach((reading) => {
      byId.set(reading.id, reading);
    });
    return [...byId.values()].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [apiReadings, dailyHistory, tarotHistory]);
  const displayedQuestionHistory = useMemo(
    () => mergeQuestionHistory(questionHistory, tarotReadings),
    [questionHistory, tarotReadings],
  );
  const lastReading = readings[0];
  const recentHistory = readings.slice(1, 7);
  const historyTabs = useMemo(
    () => [
      { key: "all" as const, label: t("readings.tab.all"), count: readings.length + displayedQuestionHistory.length + buildAstrologyArchive(birthProfile).length },
      { key: "tarot" as const, label: t("readings.tab.tarot"), count: tarotHistory.length },
      { key: "daily" as const, label: t("readings.tab.daily"), count: dailyHistory.length },
      { key: "astrology" as const, label: t("readings.tab.astrology"), count: buildAstrologyArchive(birthProfile).length },
      { key: "questions" as const, label: t("readings.tab.questions"), count: displayedQuestionHistory.length },
    ],
    [birthProfile, dailyHistory.length, displayedQuestionHistory.length, readings.length, t, tarotHistory.length],
  );

  useEffect(() => {
    return subscribeToLocalDailyReadings(() => {
      setLocalReadings(listLocalDailyReadings(anonId));
    });
  }, [anonId]);

  useEffect(() => {
    return subscribeToLocalQuestionHistory(() => {
      setQuestionHistory(listLocalQuestionHistory(anonId));
    });
  }, [anonId]);

  useEffect(() => {
    return subscribeToLocalTarotReadings(() => {
      setTarotReadings(listLocalTarotReadings(anonId));
    });
  }, [anonId]);

  useEffect(() => {
    const syncBirthProfile = () => setBirthProfile(readBirthProfile());
    window.addEventListener("hint.birthProfile.updated", syncBirthProfile);
    window.addEventListener("storage", syncBirthProfile);
    return () => {
      window.removeEventListener("hint.birthProfile.updated", syncBirthProfile);
      window.removeEventListener("storage", syncBirthProfile);
    };
  }, []);

  return (
    <AppScreen>
      <ScreenHeader
        eyebrow={t("readings.eyebrow")}
        title={t("readings.title")}
        subtitle={t("readings.subtitle")}
        showBack={false}
      />

      <HistoryMemoryPanel
        readingCount={readings.length}
        dailyCount={dailyHistory.length}
        questionCount={displayedQuestionHistory.length}
      />

      <div
        className="mb-7 flex gap-2 overflow-x-auto rounded-[14px] border p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          background: "rgba(255,255,255,0.045)",
          borderColor: GLASS.border,
        }}
      >
        {historyTabs.map((tab) => (
          <TabButton key={tab.key} active={activeTab === tab.key} onClick={() => setActiveTab(tab.key)}>
            <span>{tab.label}</span>
            <span
              className="ml-2 rounded-full px-2 py-0.5 text-[10px]"
              style={{ background: activeTab === tab.key ? "rgba(206,178,110,0.16)" : "rgba(255,255,255,0.05)" }}
            >
              {tab.count}
            </span>
          </TabButton>
        ))}
      </div>

      {isLoading && readings.length === 0 && displayedQuestionHistory.length === 0 ? (
        <p className="font-serif italic text-[13px] py-8 text-center" style={{ color: GLASS.muted }}>
          {t("readings.loading")}
        </p>
      ) : activeTab === "questions" ? (
        <section className="mb-10">
          <SectionLabel>{t("readings.questions")}</SectionLabel>
          <QuestionList
            items={displayedQuestionHistory}
            todayLabel={t("readings.today")}
            empty={t("readings.questionsEmpty")}
          />
        </section>
      ) : activeTab === "astrology" ? (
        <section className="mb-10">
          <SectionLabel>{t("readings.astrologyHistory")}</SectionLabel>
          <AstrologyArchiveGrid profile={birthProfile} />
        </section>
      ) : activeTab === "daily" ? (
        <section className="mb-10">
          <SectionLabel>{t("readings.dailyCalendarHistory")}</SectionLabel>
          <ReadingList
            readings={dailyHistory}
            language={language}
            todayLabel={t("readings.today")}
            empty={t("readings.dailyEmpty")}
          />
        </section>
      ) : activeTab === "tarot" ? (
        <section className="mb-10">
          <SectionLabel>{t("readings.tarotHistory")}</SectionLabel>
          <ReadingList
            readings={tarotHistory}
            language={language}
            todayLabel={t("readings.today")}
            empty={t("readings.tarotEmpty")}
          />
        </section>
      ) : (
        <>
          <section className="mb-9">
            <SectionLabel>{t("readings.last")}</SectionLabel>
            {lastReading ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <ReadingCard
                  reading={lastReading}
                  language={language}
                  todayLabel={t("readings.today")}
                  featured
                />
              </motion.div>
            ) : (
              <EmptyPanel>{t("readings.empty")}</EmptyPanel>
            )}
          </section>

          <section className="mb-9">
            <SectionLabel>{t("readings.tab.astrology")}</SectionLabel>
            <AstrologyArchiveGrid profile={birthProfile} />
          </section>

          <section className="mb-9">
            <SectionLabel>{t("readings.tab.tarot")}</SectionLabel>
            <ReadingList
              readings={tarotHistory}
              language={language}
              todayLabel={t("readings.today")}
              empty={t("readings.tarotEmpty")}
              limit={4}
            />
          </section>

          <section className="mb-9">
            <SectionLabel>{t("readings.dailyCalendar")}</SectionLabel>
            <ReadingList
              readings={dailyHistory}
              language={language}
              todayLabel={t("readings.today")}
              empty={t("readings.dailyEmpty")}
              limit={4}
            />
          </section>

          <section className="mb-9">
            <SectionLabel>{t("readings.recent")}</SectionLabel>
            <ReadingList
              readings={recentHistory}
              language={language}
              todayLabel={t("readings.today")}
              empty={t("readings.recentEmpty")}
            />
          </section>

          <section className="mb-10">
            <SectionLabel>{t("readings.questions")}</SectionLabel>
            <QuestionList
              items={displayedQuestionHistory}
              todayLabel={t("readings.today")}
              empty={t("readings.questionsEmpty")}
              limit={4}
            />
          </section>
        </>
      )}
    </AppScreen>
  );
}

export function ReadingDetailView() {
  const { t } = useLanguage();
  const [location] = useLocation();
  const [, appParams] = useRoute("/app/readings/:id");
  const [, legacyParams] = useRoute("/readings/:id");
  const pathId =
    location.match(/^\/app\/readings\/([^/?#]+)/)?.[1] ??
    location.match(/^\/readings\/([^/?#]+)/)?.[1];
  const id = appParams?.id ?? legacyParams?.id ?? pathId ?? "";
  const anonId = getAnonId();
  const [chatOpen, setChatOpen] = useState(false);
  const { data } = useListReadings({ anonId });
  const tarotReading = getLocalTarotReading(id, anonId);
  const dailyReading = getLocalDailyReading(id, anonId);
  const question = listLocalQuestionHistory(anonId).find((item) => item.id === id);
  const apiReading = ((data ?? []) as ReadingSummary[]).find((reading) => reading.id === id);
  const fallbackReading = dailyReading ?? apiReading;

  if (tarotReading) {
    const spread = SPREAD_CHOICES.find((choice) => choice.id === tarotReading.spreadType) ?? SPREAD_CHOICES[0]!;
    const selectedCards = tarotReadingToRitualCards(tarotReading);

    if (chatOpen) {
      return (
        <div className="absolute inset-x-0 bottom-0 top-32 z-30 overflow-hidden lg:top-28">
          <button
            type="button"
            onClick={() => setChatOpen(false)}
            className="absolute left-4 top-3 z-50 inline-flex h-10 items-center justify-center rounded-full border px-4 font-sans text-[12px] font-semibold"
            style={{
              color: "#f7ead0",
              borderColor: "rgba(228,193,116,0.28)",
              background: "rgba(1,2,7,0.72)",
              boxShadow: "0 12px 28px rgba(0,0,0,0.28)",
            }}
          >
            {t("readings.backToDetail")}
          </button>
          <TarotHintReadingChat
            selectedCards={selectedCards}
            spread={spread}
            cardArtId={tarotReading.cardArtId ?? "original"}
            question={tarotReading.question}
            story={tarotReading.story}
            focusLabel={tarotReading.focusLabel}
            archiveOnOpen={false}
          />
        </div>
      );
    }

    return (
      <AppScreen>
        <ScreenHeader
          eyebrow={t("readings.detail")}
          title={tarotReading.spreadLabel}
          subtitle={tarotReading.focusLabel ?? t("readings.savedTarot")}
          backHref="/app/readings"
          backLabel={t("nav.history")}
        />
        <ReadingDetailMeta
          spreadType={tarotReading.spreadLabel}
          createdAt={tarotReading.createdAt}
          question={tarotReading.question}
        />
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setChatOpen(true)}
            className="inline-flex h-11 items-center justify-center rounded-[999px] px-5 font-sans text-[14px] font-medium"
            style={{
              color: "#08070B",
              background: "linear-gradient(145deg, rgba(255,239,199,0.98), rgba(244,175,203,0.88))",
              boxShadow: "0 14px 30px rgba(150,92,126,0.18)",
            }}
          >
            {t("readings.returnToChat")}
          </button>
        </div>
        <section className="mb-6">
          <SectionLabel>{t("readings.cardsDrawn")}</SectionLabel>
          <GlassPanel>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {tarotReading.cards.map((card, index) => {
                const image = getTarotCardImage(card.cardId, tarotReading.cardArtId ?? "original");
                return (
                  <div key={`${card.cardId}-${index}`} className="min-w-0 text-center">
                    <div
                      className="mx-auto h-[132px] w-[82px] overflow-hidden rounded-[8px] border"
                      style={{
                        borderColor: "rgba(206,178,110,0.42)",
                        background: "rgba(0,0,0,0.22)",
                      }}
                    >
                      {image ? (
                        <img
                          src={image}
                          alt={card.name}
                          className={`h-full w-full object-cover ${card.orientation === "reversed" ? "rotate-180" : ""}`}
                        />
                      ) : null}
                    </div>
                    <p className="mt-2 font-sans text-[9px] uppercase tracking-[0.16em]" style={{ color: ACCENT.gold }}>
                      {card.positionLabel}
                    </p>
                    <p className="truncate font-serif text-[13px]" style={{ color: GLASS.text }}>
                      {card.name}
                    </p>
                  </div>
                );
              })}
            </div>
          </GlassPanel>
        </section>
        <section className="mb-6">
          <SectionLabel>{t("readings.answer")}</SectionLabel>
          <GlassPanel>
            <p className="font-serif text-[18px] leading-relaxed" style={{ color: GLASS.text }}>
              {sanitizeReadingCopy(tarotReading.shortAnswer)}
            </p>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {tarotReading.cardMeanings.map((meaning, index) => (
                <p
                  key={`${tarotReading.id}-meaning-${index}`}
                  className="rounded-[8px] border px-3 py-2.5 font-sans text-[13px] leading-relaxed"
                  style={{ borderColor: GLASS.border, color: GLASS.muted }}
                >
                  {meaning}
                </p>
              ))}
            </div>
            <p className="mt-4 font-sans text-[14px] leading-relaxed" style={{ color: GLASS.muted }}>
              {displayQuestionMeaning(tarotReading)}
            </p>
          </GlassPanel>
        </section>
      </AppScreen>
    );
  }

  if (fallbackReading) {
    return (
      <AppScreen>
        <ScreenHeader
          eyebrow={t("readings.detail")}
          title={fallbackReading.cardName}
          subtitle={t("readings.savedReading")}
          backHref="/app/readings"
          backLabel={t("nav.history")}
        />
        <ReadingDetailMeta
          spreadType={String(fallbackReading.spreadType)}
          createdAt={fallbackReading.createdAt}
          question={fallbackReading.question ?? undefined}
        />
        <GlassPanel hero>
          <p className="font-sans text-[14px] leading-relaxed" style={{ color: GLASS.muted }}>
            {sanitizeReadingCopy(fallbackReading.whisper)}
          </p>
        </GlassPanel>
      </AppScreen>
    );
  }

  if (question) {
    return (
      <AppScreen>
        <ScreenHeader
          eyebrow={t("readings.questionDetail")}
          title={SPREAD_LABELS[question.spreadType] ?? question.spreadType}
          subtitle={question.focus}
          backHref="/app/readings"
          backLabel={t("nav.history")}
        />
        <ReadingDetailMeta
          spreadType={SPREAD_LABELS[question.spreadType] ?? question.spreadType}
          createdAt={question.createdAt}
          question={question.question}
        />
        <GlassPanel hero>
          <p className="font-sans text-[14px] leading-relaxed" style={{ color: GLASS.muted }}>
            {question.focus}
          </p>
        </GlassPanel>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScreenHeader
        eyebrow={t("nav.history")}
        title={t("readings.notFound")}
        subtitle={t("readings.notFoundBody")}
        backHref="/app/readings"
        backLabel={t("nav.history")}
      />
      <EmptyPanel>{t("readings.notFoundHint")}</EmptyPanel>
    </AppScreen>
  );
}

function ReadingDetailMeta({
  spreadType,
  createdAt,
  question,
}: {
  spreadType: string;
  createdAt: string;
  question?: string;
}) {
  const { t } = useLanguage();

  return (
    <section className="mb-6">
      <SectionLabel>{t("readings.summary")}</SectionLabel>
      <GlassPanel>
        <div className="grid gap-3 font-sans text-[13px] sm:grid-cols-3" style={{ color: GLASS.muted }}>
          <p>
            <span className="block text-[10px] uppercase tracking-[0.18em]" style={{ color: GLASS.faint }}>
              {t("readings.meta.spread")}
            </span>
            {spreadType}
          </p>
          <p>
            <span className="block text-[10px] uppercase tracking-[0.18em]" style={{ color: GLASS.faint }}>
              {t("readings.meta.time")}
            </span>
            {new Date(createdAt).toLocaleString()}
          </p>
          <p>
            <span className="block text-[10px] uppercase tracking-[0.18em]" style={{ color: GLASS.faint }}>
              {t("readings.meta.question")}
            </span>
            {question || t("readings.meta.noQuestion")}
          </p>
        </div>
      </GlassPanel>
    </section>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-11 shrink-0 items-center rounded-full px-3.5 font-sans text-[13px] font-bold transition active:scale-[0.98]"
      style={{
        color: active ? "var(--hint-special-action-text)" : GLASS.muted,
        background: active ? "var(--hint-special-action-bg)" : "color-mix(in srgb, var(--hint-surface-soft) 54%, transparent)",
        boxShadow: active ? "0 10px 22px color-mix(in srgb, var(--hint-rose) 14%, transparent), inset 0 1px 0 rgba(255,255,255,0.48)" : "inset 0 1px 0 rgba(255,255,255,0.12)",
      }}
    >
      {children}
    </button>
  );
}
