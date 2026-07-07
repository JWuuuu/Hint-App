import { useState } from "react";
import { UserRound } from "lucide-react";
import { AppScreen, GlassPanel, ScreenHeader, SectionLabel } from "../../components/app/AppChrome";
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
      <ScreenHeader
        eyebrow="Personal room"
        title={t("me.settings")}
        subtitle={t("me.settings.subtitle")}
        sigil={UserRound}
        backHref="/app"
        backLabel={t("common.home")}
      />

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
