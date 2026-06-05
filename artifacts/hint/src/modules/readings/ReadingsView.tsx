import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ACCENT, GLASS } from "../hold/atmosphere";
import { AppScreen, ScreenHeader, GlassPanel, SectionLabel } from "../../components/app/AppChrome";
import { useListReadings } from "@workspace/api-client-react";
import type { ReadingSummary } from "@workspace/api-client-react";
import { getAnonId } from "../../lib/identity";
import { useLanguage, type HintLanguage } from "../../lib/i18n";
import {
  listLocalDailyReadings,
  subscribeToLocalDailyReadings,
} from "./localDailyReadings";

/**
 * ReadingsView — the room's memory. A real archive of every tarot reading the
 * user has sat with, newest first, scoped to their anonymous id.
 */

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
    return { cardName: reading.cardName, whisper: reading.whisper };
  }

  const cardName = CARD_NAMES_ZH[reading.cardName] ?? reading.cardName;
  return {
    cardName,
    whisper: `这次解读的核心提示来自「${cardName}」。旧记录会保留原始生成内容，但这里先用中文帮你回到这张牌的重点。`,
  };
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
    <div
      className={`flex gap-4 rounded-[8px] ${featured ? "px-5 py-5" : "px-4 py-4"}`}
      style={{ background: GLASS.panel, border: `1px solid ${GLASS.border}` }}
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
    </div>
  );
}

function EmptyPanel({ children }: { children: string }) {
  return (
    <div
      className="rounded-[8px] px-4 py-5 text-center font-sans text-[13px] leading-relaxed"
      style={{
        background: "rgba(255,255,255,0.035)",
        border: `1px dashed ${GLASS.border}`,
        color: GLASS.muted,
      }}
    >
      {children}
    </div>
  );
}

export function ReadingsView() {
  const { language, t } = useLanguage();
  const anonId = getAnonId();
  const { data, isLoading } = useListReadings({ anonId });
  const [localReadings, setLocalReadings] = useState<ReadingSummary[]>(() =>
    listLocalDailyReadings(anonId),
  );
  const readings = useMemo(() => {
    const apiReadings = (data ?? []) as ReadingSummary[];
    const byId = new Map<string, ReadingSummary>();
    [...localReadings, ...apiReadings].forEach((reading) => {
      byId.set(reading.id, reading);
    });
    return [...byId.values()].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [data, localReadings]);
  const savedReadings = useMemo(
    () =>
      ((data ?? []) as ReadingSummary[]).sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [data],
  );
  const lastReading = readings[0];
  const recentHistory = readings.slice(1, 7);

  useEffect(() => {
    return subscribeToLocalDailyReadings(() => {
      setLocalReadings(listLocalDailyReadings(anonId));
    });
  }, [anonId]);

  return (
    <AppScreen>
      <ScreenHeader
        eyebrow={t("readings.eyebrow")}
        title={t("readings.title")}
        subtitle={t("readings.subtitle")}
      />

      <div className="mb-7">
        <Link
          href="/tarot"
          className="inline-flex h-11 items-center justify-center rounded-[999px] px-5 font-sans text-[14px] font-medium"
          style={{
            color: "#08070B",
            background: "linear-gradient(145deg, rgba(243,212,144,0.98), rgba(122,226,214,0.92))",
            boxShadow: "0 14px 30px rgba(0,0,0,0.22)",
          }}
        >
          {t("readings.new")}
        </Link>
      </div>

      {isLoading ? (
        <p className="font-serif italic text-[13px] py-8 text-center" style={{ color: GLASS.muted }}>
          {t("readings.loading")}
        </p>
      ) : readings.length === 0 ? (
        <section className="mb-10">
          <SectionLabel>{t("readings.section")}</SectionLabel>
          <GlassPanel hero>
            <p className="font-sans text-[13px] leading-relaxed text-center mb-4" style={{ color: GLASS.muted }}>
              {t("readings.empty")}
            </p>
            <Link
              href="/tarot"
              className="inline-flex items-center justify-center w-full h-11 rounded-[8px] font-serif text-[12px] uppercase tracking-[0.24em]"
              style={{
                background: "rgba(206,178,110,0.12)",
                border: "1px solid rgba(206,178,110,0.3)",
                color: ACCENT.gold,
              }}
            >
              {t("readings.enter")}
            </Link>
          </GlassPanel>
        </section>
      ) : (
        <>
          <section className="mb-9">
            <SectionLabel>{t("readings.last")}</SectionLabel>
            {lastReading && (
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
            )}
          </section>

          <section className="mb-9">
            <SectionLabel>{t("readings.recent")}</SectionLabel>
            {recentHistory.length === 0 ? (
              <EmptyPanel>{t("readings.recentEmpty")}</EmptyPanel>
            ) : (
              <div className="flex flex-col gap-3">
                {recentHistory.map((reading, i) => (
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
                      todayLabel={t("readings.today")}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          <section className="mb-10">
            <SectionLabel>{t("readings.saved")}</SectionLabel>
            {savedReadings.length === 0 ? (
              <EmptyPanel>{t("readings.savedEmpty")}</EmptyPanel>
            ) : (
              <div className="flex flex-col gap-3">
                {savedReadings.map((reading, i) => (
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
                      todayLabel={t("readings.today")}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </AppScreen>
  );
}
