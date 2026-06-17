import { Link } from "wouter";
import { AppScreen, GlassPanel, SectionLabel } from "../../components/app/AppChrome";
import { ACCENT, GLASS } from "../../modules/hold/atmosphere";

const EMBER = "#f1a66b";

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
      <GlassPanel>
        <SectionLabel>Profile hub</SectionLabel>
        <p className="mt-3 max-w-lg font-sans text-[14px] leading-relaxed" style={{ color: GLASS.muted }}>
          Use the profile page for the currently implemented settings and records. Membership and token actions should stay as clean placeholder states until payment logic is real.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/app/profile" className="inline-flex h-11 items-center rounded-full px-5 font-sans text-[13px] font-black" style={{ color: "#fffaf2", background: EMBER }}>
            Open profile
          </Link>
          <Link href="/app/readings" className="inline-flex h-11 items-center rounded-full border px-5 font-sans text-[13px] font-black" style={{ color: GLASS.text, borderColor: GLASS.border }}>
            Saved readings
          </Link>
        </div>
      </GlassPanel>
    </AppScreen>
  );
}
