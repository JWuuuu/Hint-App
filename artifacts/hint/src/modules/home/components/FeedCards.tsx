import { motion } from "framer-motion";
import { Link } from "wouter";
import { APP_IVORY, ACCENT, GLASS } from "../../hold/atmosphere";
import { getFeedCopy } from "../data/feedCopy";
import { getDailyPull } from "../data/dailyPulls";
import { ReactNode } from "react";
import { useLanguage } from "../../../lib/i18n";

const STILL_HERE_COPY = {
  en: "It hasn't gone anywhere.",
  zh: "它还没有真正离开。",
  es: "Todavía no se ha ido.",
  ja: "それはまだ離れていません。",
  ko: "아직 완전히 떠나지 않았어요.",
};

function FeedCardBase({ children, href, index = 0 }: { children: ReactNode; href?: string; index?: number }) {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.6, delay: index * 0.09, ease: "easeOut" }}
      className="w-full rounded-[8px] p-5 mb-3 flex flex-col justify-between overflow-hidden relative group"
      style={{
        background: "var(--hint-surface-soft)",
        border: "1px solid var(--hint-border)",
        boxShadow: "0 12px 28px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      {/* Soft gradient hover effect */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: "linear-gradient(120deg, rgba(100,156,158,0.08), transparent 55%)" }}
      />
      {children}
    </motion.div>
  );

  return href ? <Link href={href} className="block">{content}</Link> : content;
}

function Eyebrow({ label, color }: { label: string; color: string }) {
  return (
    <span className="font-serif text-[11px] uppercase tracking-widest" style={{ color }}>
      {label}
    </span>
  );
}

function Cta({ label, color }: { label: string; color: string }) {
  return (
    <span className="font-sans text-[11px] uppercase font-bold" style={{ color }}>
      {label}
    </span>
  );
}

function Title({ children, italic }: { children: ReactNode; italic?: boolean }) {
  return (
    <h3
      className={`font-serif text-[20px] leading-snug mb-1 ${italic ? "italic" : ""}`}
      style={{ color: APP_IVORY.bg }}
    >
      {children}
    </h3>
  );
}

function Sub({ children }: { children: ReactNode }) {
  return (
    <p className="font-sans text-[13px] leading-relaxed" style={{ color: GLASS.muted }}>
      {children}
    </p>
  );
}

export function FeedCards({ dailyCardRevealed }: { dailyCardRevealed: boolean }) {
  const { language, t } = useLanguage();
  const copy = getFeedCopy(language);
  const pull = getDailyPull(new Date(), language);

  return (
    <div className="flex flex-col">
      {/* Tonight's Pull — live, opens the tarot room */}
      <FeedCardBase href={dailyCardRevealed ? "/daily-pull" : "#your-card"} index={0}>
        <div className="flex justify-between items-start mb-3">
          <Eyebrow label={t("feed.tonightPull")} color={ACCENT.gold} />
          <Cta label={t("feed.turn")} color={ACCENT.aqua} />
        </div>
        {dailyCardRevealed ? (
          <>
            <Title>{pull.cardName}</Title>
            <Sub>{pull.whisper}</Sub>
          </>
        ) : (
          <>
            <Title>{t("home.card.daily.title")}</Title>
            <Sub>{t("home.card.daily.body")}</Sub>
          </>
        )}
      </FeedCardBase>

      {/* Relationship Energy */}
      <FeedCardBase index={1}>
        <div className="flex justify-between items-start mb-3">
          <Eyebrow label={t("feed.relationshipEnergy")} color={ACCENT.lavender} />
          <Cta label={t("module.status.soon")} color={APP_IVORY.muted} />
        </div>
        <Title>{copy.compatibility}</Title>
        <Sub>{t("module.you-and-them.hint")}</Sub>
      </FeedCardBase>

      {/* One Thought Lingering */}
      <FeedCardBase index={2}>
        <div className="flex justify-between items-start mb-3">
          <Eyebrow label={t("feed.oneThought")} color={APP_IVORY.bg} />
          <Cta label={t("module.status.soon")} color={APP_IVORY.muted} />
        </div>
        <Title>{copy.lingering}</Title>
        <Sub>{STILL_HERE_COPY[language]}</Sub>
      </FeedCardBase>

      {/* Dream Fragment */}
      <FeedCardBase index={3}>
        <div className="flex justify-between items-start mb-3">
          <Eyebrow label={t("feed.dreamFragment")} color={ACCENT.aqua} />
          <Cta label={t("module.status.soon")} color={APP_IVORY.muted} />
        </div>
        <Title>{copy.dream}</Title>
        <Sub>{t("module.dreams.hint")}</Sub>
      </FeedCardBase>

      {/* Small Step Tonight */}
      <FeedCardBase index={4}>
        <div className="flex justify-between items-start mb-3">
          <Eyebrow label={t("feed.smallStep")} color={ACCENT.gold} />
          <Cta label={t("module.status.soon")} color={APP_IVORY.muted} />
        </div>
        <Title>{copy.step}</Title>
        <Sub>{t("module.small-step.hint")}</Sub>
      </FeedCardBase>

      {/* Weekly Reflection — live, opens the ask room with tonight's prompt */}
      <FeedCardBase href="/ask" index={5}>
        <div className="flex justify-between items-start mb-3">
          <Eyebrow label={t("feed.weeklyReflection")} color={ACCENT.lavender} />
          <Cta label={t("feed.ask")} color={ACCENT.aqua} />
        </div>
        <Title>{copy.growth}</Title>
        <Sub>{t("module.weekly-reflection.hint")}</Sub>
      </FeedCardBase>
    </div>
  );
}
