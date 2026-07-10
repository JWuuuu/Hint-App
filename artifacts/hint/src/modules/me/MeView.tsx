import { useState } from "react";
import { motion } from "framer-motion";
import { GLASS } from "../hold/atmosphere";
import { AppScreen, GlassPanel, SectionLabel } from "../../components/app/AppChrome";
import { useProfile } from "../../lib/useProfile";
import { saveBirthProfileFromAccountProfile } from "../../lib/astro/userBirthProfile";
import { getAnonId } from "../../lib/identity";
import { ProfileForm } from "../../components/app/ProfileForm";
import { ProfileCard } from "./components/ProfileCard";
import { SettingsList } from "./components/SettingsList";
import { useLanguage } from "../../lib/i18n";

/**
 * MeView - the user's personal account hub. History and memory live in
 * Readings so this screen can stay focused on identity and settings.
 */
export function MeView() {
  const anonId = getAnonId();
  const { profile, saveProfile, isSaving } = useProfile();
  const [editing, setEditing] = useState(false);
  const { t } = useLanguage();

  async function handleSave(input: Parameters<typeof saveProfile>[0]) {
    const saved = await saveProfile(input);
    saveBirthProfileFromAccountProfile(saved, anonId);
    setEditing(false);
  }

  return (
    <AppScreen>
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mb-4 px-1 pt-1"
      >
        <div>
          <h1 className="font-serif text-[34px] leading-none" style={{ color: GLASS.text }}>
            {t("me.settings")}
          </h1>
          <p className="mt-2 max-w-md font-sans text-[13px] leading-relaxed" style={{ color: GLASS.faint }}>
            {t("me.settings.subtitle")}
          </p>
        </div>
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
        <div className="flex flex-col gap-4">
          <ProfileCard profile={profile} onEdit={() => setEditing(true)} />
          <div id="me-settings" className="scroll-mt-6">
            <SettingsList />
          </div>
        </div>
      )}
    </AppScreen>
  );
}
