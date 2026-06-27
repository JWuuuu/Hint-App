import { motion } from "framer-motion";
import { Link } from "wouter";
import { APP_IVORY, ACCENT } from "../../hold/atmosphere";
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
      className="hint-liquid-panel relative mb-2.5 flex min-h-[104px] w-full flex-col justify-between overflow-hidden rounded-[22px] px-4 py-3.5"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(circle at 12% 10%, color-mix(in srgb, var(--hint-rose, #f0b6cf) 12%, transparent), transparent 38%), radial-gradient(circle at 88% 8%, color-mix(in srgb, var(--hint-lavender, #c9b9f0) 10%, transparent), transparent 34%)",
        }}
      />
      <div className="relative">{children}</div>
    </motion.div>
  );

  return href ? <Link href={href} className="block">{content}</Link> : content;
}

function Eyebrow({ label, color }: { label: string; color: string }) {
  return (
    <span className="font-sans text-[10px] font-black uppercase tracking-[0.16em]" style={{ color }}>
      {label}
    </span>
  );
}

function Cta({ label, color }: { label: string; color: string }) {
  return (
    <span className="rounded-full px-2 py-1 font-sans text-[9px] font-black uppercase tracking-[0.1em]" style={{ color, background: "color-mix(in srgb, var(--hint-surface-soft) 74%, transparent)" }}>
      {label}
    </span>
  );
}

function Title({ children, italic }: { children: ReactNode; italic?: boolean }) {
  return (
    <h3
      className={`mb-1 font-serif text-[19px] leading-snug ${italic ? "italic" : ""}`}
      style={{ color: "var(--hint-text)" }}
    >
      {children}
    </h3>
  );
}

function Sub({ children }: { children: ReactNode }) {
  return (
    <p className="line-clamp-2 font-sans text-[12.5px] leading-relaxed" style={{ color: "var(--hint-muted)" }}>
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
      <FeedCardBase href={dailyCardRevealed ? "/daily" : "#your-card"} index={0}>
        <div className="mb-2.5 flex items-start justify-between gap-3">
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
        <div className="mb-2.5 flex items-start justify-between gap-3">
          <Eyebrow label={t("feed.relationshipEnergy")} color={ACCENT.lavender} />
          <Cta label={t("module.status.soon")} color={APP_IVORY.muted} />
        </div>
        <Title>{copy.compatibility}</Title>
        <Sub>{t("module.you-and-them.hint")}</Sub>
      </FeedCardBase>

      {/* One Thought Lingering */}
      <FeedCardBase index={2}>
        <div className="mb-2.5 flex items-start justify-between gap-3">
          <Eyebrow label={t("feed.oneThought")} color={APP_IVORY.bg} />
          <Cta label={t("module.status.soon")} color={APP_IVORY.muted} />
        </div>
        <Title>{copy.lingering}</Title>
        <Sub>{STILL_HERE_COPY[language]}</Sub>
      </FeedCardBase>

      {/* Dream Fragment */}
      <FeedCardBase index={3}>
        <div className="mb-2.5 flex items-start justify-between gap-3">
          <Eyebrow label={t("feed.dreamFragment")} color={ACCENT.aqua} />
          <Cta label={t("module.status.soon")} color={APP_IVORY.muted} />
        </div>
        <Title>{copy.dream}</Title>
        <Sub>{t("module.dreams.hint")}</Sub>
      </FeedCardBase>

      {/* Small Step Tonight */}
      <FeedCardBase index={4}>
        <div className="mb-2.5 flex items-start justify-between gap-3">
          <Eyebrow label={t("feed.smallStep")} color={ACCENT.gold} />
          <Cta label={t("module.status.soon")} color={APP_IVORY.muted} />
        </div>
        <Title>{copy.step}</Title>
        <Sub>{t("module.small-step.hint")}</Sub>
      </FeedCardBase>

      {/* Weekly Reflection — live, opens the ask room with tonight's prompt */}
      <FeedCardBase href="/app/ask" index={5}>
        <div className="mb-2.5 flex items-start justify-between gap-3">
          <Eyebrow label={t("feed.weeklyReflection")} color={ACCENT.lavender} />
          <Cta label={t("feed.ask")} color={ACCENT.aqua} />
        </div>
        <Title>{copy.growth}</Title>
        <Sub>{t("module.weekly-reflection.hint")}</Sub>
      </FeedCardBase>
    </div>
  );
}
