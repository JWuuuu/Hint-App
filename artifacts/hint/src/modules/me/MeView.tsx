import { useState } from "react";
import { motion } from "framer-motion";
import { Settings } from "lucide-react";
import { ACCENT, GLASS } from "../hold/atmosphere";
import { AppScreen, GlassPanel, SectionLabel } from "../../components/app/AppChrome";
import { useGetUserStats } from "@workspace/api-client-react";
import { useProfile } from "../../lib/useProfile";
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

  async function handleSave(input: Parameters<typeof saveProfile>[0]) {
    await saveProfile(input);
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
          <ProfileCard profile={profile} stats={stats} onEdit={() => setEditing(true)} />
          <TrustCard />
          <MembershipCard />
          <BalanceGrid />
          <ProfileBanner />
          <RecordsGrid stats={stats} />
          <MoreGrid />
          <div id="me-settings" className="scroll-mt-6">
            <SettingsList />
          </div>
        </div>
      )}
    </AppScreen>
  );
}
