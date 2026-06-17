import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, CalendarDays, HelpCircle, Settings, Sparkles } from "lucide-react";
import { ACCENT, GLASS } from "../hold/atmosphere";
import { AppScreen, GlassPanel, SectionLabel } from "../../components/app/AppChrome";
import { useGetUserStats } from "@workspace/api-client-react";
import { useProfile } from "../../lib/useProfile";
import { saveBirthProfileFromAccountProfile } from "../../lib/astro/userBirthProfile";
import { getAnonId } from "../../lib/identity";
import { ProfileForm } from "../../components/app/ProfileForm";
import { ProfileCard } from "./components/ProfileCard";
import { MembershipCard } from "./components/MembershipCard";
import { TrustCard } from "./components/TrustCard";
import { BalanceGrid } from "./components/BalanceGrid";
import { ProfileBanner } from "./components/ProfileBanner";
import { RecordsGrid } from "./components/RecordsGrid";
import { MoreGrid } from "./components/MoreGrid";
import { SettingsList } from "./components/SettingsList";
import { useLanguage } from "../../lib/i18n";
import {
  listLocalDailyReadings,
  subscribeToLocalDailyReadings,
} from "../readings/localDailyReadings";
import {
  listLocalQuestionHistory,
  subscribeToLocalQuestionHistory,
} from "../readings/localQuestionHistory";
import {
  listLocalTarotReadings,
  subscribeToLocalTarotReadings,
} from "../readings/localTarotReadings";

function StatusPill({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: typeof Sparkles;
  value: string | number;
  label: string;
  tone: string;
}) {
  return (
    <div
      className="hint-card-lift min-w-0 rounded-[18px] border px-3 py-3"
      style={{
        background: "color-mix(in srgb, var(--hint-surface-soft) 82%, transparent)",
        borderColor: "var(--hint-border)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="grid size-8 shrink-0 place-items-center rounded-full border"
          style={{
            color: tone,
            background: `color-mix(in srgb, ${tone} 12%, var(--hint-surface-soft))`,
            borderColor: `color-mix(in srgb, ${tone} 28%, var(--hint-border))`,
          }}
        >
          <Icon size={15} />
        </span>
        <div className="min-w-0">
          <p className="font-serif text-[22px] leading-none tabular-nums" style={{ color: "var(--hint-text)" }}>
            {value}
          </p>
          <p className="mt-1 truncate font-sans text-[10px] font-black uppercase tracking-[0.08em]" style={{ color: "var(--hint-muted)" }}>
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}

function ProfileStatusPanel({
  localReadingCount,
  localPullCount,
  localQuestionCount,
  hasBirthDetails,
}: {
  localReadingCount: number;
  localPullCount: number;
  localQuestionCount: number;
  hasBirthDetails: boolean;
}) {
  return (
    <GlassPanel className="hint-shimmer-border">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <SectionLabel>Status</SectionLabel>
          <h2 className="mt-2 font-serif text-[26px] leading-none" style={{ color: "var(--hint-text)" }}>
            Your Hint memory
          </h2>
        </div>
        <span
          className="hint-status-pill rounded-full border px-3 py-1.5 font-sans text-[10px] font-black uppercase tracking-[0.12em]"
          style={{ color: hasBirthDetails ? "var(--hint-gold)" : "var(--hint-muted)" }}
        >
          {hasBirthDetails ? "Personalized" : "Birth details needed"}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <StatusPill icon={BookOpen} value={localReadingCount} label="Readings" tone="#d98aaa" />
        <StatusPill icon={CalendarDays} value={localPullCount} label="Daily" tone="#cda866" />
        <StatusPill icon={HelpCircle} value={localQuestionCount} label="Questions" tone="#9b98c9" />
      </div>
    </GlassPanel>
  );
}

/**
 * MeView — the user's personal Hint account hub: profile, membership,
 * balance, archive banner, records, more tools, and settings. Profile name /
 * birth details and the Records counts are real (scoped to the anonymous id);
 * membership, balance and the secondary grids are forward-looking placeholders.
 */
export function MeView() {
  const anonId = getAnonId();
  const { profile, saveProfile, isSaving } = useProfile();
  const { data: stats } = useGetUserStats({ anonId });
  const [editing, setEditing] = useState(false);
  const { t } = useLanguage();
  const [localDailyCount, setLocalDailyCount] = useState(() => listLocalDailyReadings(anonId).length);
  const [localTarotCount, setLocalTarotCount] = useState(() => listLocalTarotReadings(anonId).length);
  const [localQuestionCount, setLocalQuestionCount] = useState(() => listLocalQuestionHistory(anonId).length);
  const localReadingCount = useMemo(
    () => localDailyCount + localTarotCount,
    [localDailyCount, localTarotCount],
  );

  useEffect(() => {
    return subscribeToLocalDailyReadings(() => {
      setLocalDailyCount(listLocalDailyReadings(anonId).length);
    });
  }, [anonId]);

  useEffect(() => {
    return subscribeToLocalTarotReadings(() => {
      setLocalTarotCount(listLocalTarotReadings(anonId).length);
    });
  }, [anonId]);

  useEffect(() => {
    return subscribeToLocalQuestionHistory(() => {
      setLocalQuestionCount(listLocalQuestionHistory(anonId).length);
    });
  }, [anonId]);

  async function handleSave(input: Parameters<typeof saveProfile>[0]) {
    const saved = await saveProfile(input);
    saveBirthProfileFromAccountProfile(saved, anonId);
    setEditing(false);
  }

  function scrollToSettings() {
    document
      .getElementById("me-settings")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <AppScreen>
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mb-7 flex items-start justify-between gap-4"
      >
        <div>
          <h1 className="font-serif text-[28px] leading-none" style={{ color: GLASS.text }}>
            {t("me.title")}
          </h1>
          <p className="mt-2 max-w-md font-sans text-[13px] leading-relaxed" style={{ color: GLASS.muted }}>
            {t("me.subtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={scrollToSettings}
          className="w-9 h-9 rounded-[8px] flex items-center justify-center"
          style={{ background: GLASS.panel, border: `1px solid ${GLASS.border}` }}
          aria-label={t("me.settings")}
          data-testid="button-open-settings"
        >
          <Settings size={16} color={ACCENT.aqua} />
        </button>
      </motion.header>

      {editing ? (
        <section className="mb-8">
          <SectionLabel>{t("me.editProfile")}</SectionLabel>
          <GlassPanel hero>
            <ProfileForm
              initial={profile}
              submitLabel={t("me.saveChanges")}
              onSubmit={handleSave}
              isSaving={isSaving}
              onCancel={() => setEditing(false)}
            />
          </GlassPanel>
        </section>
      ) : (
        <div className="flex flex-col gap-8">
          <ProfileStatusPanel
            localReadingCount={localReadingCount}
            localPullCount={localDailyCount}
            localQuestionCount={localQuestionCount}
            hasBirthDetails={Boolean(profile?.birthDate)}
          />
          <ProfileCard profile={profile} stats={stats} onEdit={() => setEditing(true)} />
          <RecordsGrid
            stats={stats}
            localReadingCount={localReadingCount}
            localPullCount={localDailyCount}
            localQuestionCount={localQuestionCount}
          />
          <BalanceGrid />
          <ProfileBanner />
          <TrustCard />
          <MembershipCard />
          <MoreGrid />
          <div id="me-settings" className="scroll-mt-6">
            <SettingsList />
          </div>
        </div>
      )}
    </AppScreen>
  );
}
