import { Link } from "wouter";
import { AppScreen, GlassPanel, SectionLabel } from "../../components/app/AppChrome";
import { LanguageToggle } from "../../components/LanguageToggle";
import { ACCENT, GLASS } from "../../modules/hold/atmosphere";

export function SettingsView() {
  return (
    <AppScreen>
      <header className="mb-7">
        <p className="font-sans text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: ACCENT.gold }}>
          Settings
        </p>
        <h1 className="mt-2 font-serif text-[30px] leading-none" style={{ color: GLASS.text }}>
          Account controls
        </h1>
        <p className="mt-3 max-w-xl font-sans text-[13px] leading-relaxed" style={{ color: GLASS.muted }}>
          Profile, language, birth details, local records, membership, and token settings are grouped under the profile hub while dedicated payment systems are still placeholders.
        </p>
      </header>
      <GlassPanel className="mb-4">
        <SectionLabel>App language</SectionLabel>
        <div className="mt-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-serif text-[20px] leading-tight" style={{ color: GLASS.text }}>
              Language
            </p>
            <p className="mt-1 font-sans text-[12px] leading-relaxed" style={{ color: GLASS.muted }}>
              Choose the language for Hint copy and app labels.
            </p>
          </div>
          <LanguageToggle menuPlacement="bottom" />
        </div>
      </GlassPanel>
      <GlassPanel className="hint-shimmer-border">
        <SectionLabel>Profile hub</SectionLabel>
        <p className="mt-3 max-w-lg font-sans text-[14px] leading-relaxed" style={{ color: GLASS.muted }}>
          Use the profile page for the currently implemented settings and records. Membership and token actions should stay as clean placeholder states until payment logic is real.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/app/profile" className="hint-soft-button hint-tap-sparkle inline-flex h-11 items-center rounded-full px-5 font-sans text-[13px] font-black">
            Open profile
          </Link>
          <Link href="/app/readings" className="hint-ghost-button hint-tap-sparkle inline-flex h-11 items-center rounded-full border px-5 font-sans text-[13px] font-black">
            Saved readings
          </Link>
        </div>
      </GlassPanel>
    </AppScreen>
  );
}
