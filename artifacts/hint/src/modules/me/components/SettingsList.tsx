import { useState } from "react";
import {
  Palette,
  Sparkles,
  Wind,
  Volume2,
  Lock,
  Trash2,
  Info,
  ChevronRight,
  ShieldAlert,
  LifeBuoy,
  Mail,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "wouter";
import { ACCENT, GLASS } from "../../hold/atmosphere";
import { SectionLabel, GlassPanel } from "../../../components/app/AppChrome";
import { LanguageToggle } from "../../../components/LanguageToggle";
import { CONTACT_EMAIL } from "../../../components/LegalNotice";
import { useLanguage } from "../../../lib/i18n";
import { apiUrl } from "../../../lib/api";
import { getAnonId } from "../../../lib/identity";
import {
  setHintThemePreference,
  useHintPreferences,
} from "../../../lib/preferences";
import {
  getInitialHintTheme,
  type HintTheme,
} from "../../../components/app/theme";

interface Row {
  icon: LucideIcon;
  label: string;
  detail?: string;
  href?: string;
  danger?: boolean;
  comingSoon?: boolean;
  onClick?: () => void;
}

async function clearHistory(confirmMessage: string) {
  const ok = window.confirm(confirmMessage);
  if (!ok) return;
  const anonId = getAnonId();
  try {
    await fetch(apiUrl(`/history?anonId=${encodeURIComponent(anonId)}`), {
      method: "DELETE",
    });
  } catch {
    // Local cleanup still gives the user a fresh private slate if the API is offline.
  }
  try {
    localStorage.clear();
  } catch {
    // ignore — nothing more we can do
  }
  window.location.reload();
}

export function SettingsList() {
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [theme, setTheme] = useState<HintTheme>(getInitialHintTheme);
  const { preferences, setPreference } = useHintPreferences();
  const { t } = useLanguage();

  function chooseTheme(nextTheme: HintTheme) {
    setTheme(nextTheme);
    setHintThemePreference(nextTheme);
  }

  const rows: Row[] = [
    {
      icon: Palette,
      label: t("me.more.appearance"),
      detail: t("me.settings.appearanceDetail"),
      onClick: () => setAppearanceOpen((open) => !open),
    },
    {
      icon: UserRound,
      label: "Log in / Sign up",
      detail: "Verify email or phone, or connect a social login.",
      href: "/login",
    },
    {
      icon: Sparkles,
      label: "Tarot room",
      detail: "Change your saved deck, room mood, and background.",
      href: "/app/tarot?setup=1",
    },
    { icon: Lock, label: t("me.privacyPolicy"), detail: t("me.settings.privacyDetail"), href: "/privacy" },
    { icon: Info, label: t("me.terms"), detail: t("me.termsDetail"), href: "/terms" },
    {
      icon: ShieldAlert,
      label: "Disclaimer",
      detail: "Entertainment-only boundaries and professional advice limits.",
      href: "/disclaimer",
    },
    { icon: LifeBuoy, label: t("me.support"), detail: t("me.supportDetail"), href: "/contact" },
    { icon: Mail, label: t("me.contact"), detail: CONTACT_EMAIL, href: "/contact" },
    {
      icon: Trash2,
      label: t("me.clearHistory"),
      detail: t("me.clearHistoryDetail"),
      danger: true,
      onClick: () => void clearHistory(t("me.clearConfirm")),
    },
    { icon: Info, label: t("me.about"), detail: t("me.aboutDetail"), href: "/about" },
  ];

  return (
    <section>
      <SectionLabel>{t("me.settings")}</SectionLabel>
      <GlassPanel padded={false}>
        {rows.map((row, index) => (
          <div key={row.label}>
            <SettingsRow row={row} isFirst={index === 0} />
            {row.label === t("me.more.appearance") && appearanceOpen ? (
              <div
                className="mx-4 mb-4 rounded-[8px] border p-4"
                style={{
                  borderColor: GLASS.border,
                  background: "rgba(255,255,255,0.035)",
                }}
              >
                <div className="mb-4 grid grid-cols-2 gap-2">
                  {(["dark", "bright"] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => chooseTheme(option)}
                      className="rounded-[8px] border px-3 py-3 text-left font-sans text-[12px] font-semibold transition-colors"
                      style={{
                        borderColor:
                          theme === option ? "rgba(206,178,110,0.65)" : GLASS.border,
                        color: theme === option ? "rgba(255,232,170,0.98)" : GLASS.text,
                        background:
                          theme === option ? "rgba(206,178,110,0.12)" : "rgba(0,0,0,0.14)",
                      }}
                    >
                      {option === "dark" ? "Dark room" : "Bright room"}
                    </button>
                  ))}
                </div>

                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="font-serif text-[13px]" style={{ color: GLASS.text }}>
                    Language
                  </span>
                  <LanguageToggle menuPlacement="bottom" />
                </div>

                <PreferenceSwitch
                  icon={Wind}
                  label={t("me.reduceMotion")}
                  description="Reduce major motion in the website and tarot room."
                  checked={preferences.reduceMotion}
                  onChange={(checked) => setPreference("reduceMotion", checked)}
                />
                <PreferenceSwitch
                  icon={Volume2}
                  label={t("me.sound")}
                  description="Controls browser vibration/haptics where the device supports it."
                  checked={preferences.soundAndHaptics}
                  onChange={(checked) => setPreference("soundAndHaptics", checked)}
                />
              </div>
            ) : null}
          </div>
        ))}
      </GlassPanel>

      <div
        className="mt-4 flex items-start gap-3 rounded-[8px] px-4 py-3.5"
        style={{ background: GLASS.panel, border: `1px solid ${GLASS.border}` }}
      >
        <ShieldAlert size={15} color={GLASS.faint} className="mt-0.5 shrink-0" />
        <p className="font-sans text-[11.5px] leading-relaxed" style={{ color: GLASS.faint }}>
          {t("me.disclaimer")}
        </p>
      </div>
    </section>
  );
}

function SettingsRow({ row, isFirst }: { row: Row; isFirst: boolean }) {
  const Icon = row.icon;
  const content = (
    <>
      <Icon
        size={17}
        color={row.danger ? "rgba(214,140,140,0.9)" : ACCENT.aqua}
        className="shrink-0 opacity-90"
      />
      <span
        className="flex-1 font-serif text-[14px]"
        style={{ color: row.danger ? "rgba(224,168,168,0.95)" : GLASS.text }}
      >
        <span className="block">{row.label}</span>
        {row.detail && (
          <span
            className="mt-0.5 block font-sans text-[11px] leading-snug"
            style={{ color: row.danger ? "rgba(224,168,168,0.72)" : GLASS.faint }}
          >
            {row.detail}
          </span>
        )}
      </span>
      {row.comingSoon ? (
        <span
          className="rounded-full border px-2 py-1 font-sans text-[9px] uppercase tracking-[0.12em]"
          style={{
            borderColor: GLASS.border,
            color: GLASS.faint,
            background: "rgba(255,255,255,0.035)",
          }}
        >
          Soon
        </span>
      ) : (
        <ChevronRight size={15} color={GLASS.faint} />
      )}
    </>
  );

  const className =
    "flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.03]";
  const style = { borderTop: isFirst ? "none" : `1px solid ${GLASS.border}` };

  if (row.href) {
    return (
      <Link href={row.href} className={className} style={style}>
        {content}
      </Link>
    );
  }

  if (row.comingSoon) {
    return (
      <div
        aria-disabled="true"
        className={`${className} cursor-default opacity-65 hover:bg-transparent`}
        style={style}
      >
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={row.onClick}
      className={className}
      style={style}
      data-testid={row.danger ? "button-clear-history" : undefined}
    >
      {content}
    </button>
  );
}

function PreferenceSwitch({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: LucideIcon;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-4 border-t py-3" style={{ borderColor: GLASS.border }}>
      <Icon size={16} color={ACCENT.aqua} className="shrink-0 opacity-90" />
      <span className="flex-1">
        <span className="block font-serif text-[13px]" style={{ color: GLASS.text }}>
          {label}
        </span>
        <span className="block font-sans text-[11px] leading-snug" style={{ color: GLASS.faint }}>
          {description}
        </span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
        style={{
          background: checked ? "rgba(100,156,158,0.55)" : "rgba(255,255,255,0.1)",
          border: `1px solid ${checked ? "rgba(100,156,158,0.7)" : GLASS.border}`,
        }}
      >
        <span
          className="absolute top-0.5 rounded-full transition-transform"
          style={{
            width: 18,
            height: 18,
            transform: `translateX(${checked ? 22 : 3}px)`,
            background: "rgba(246,248,252,0.95)",
          }}
        />
      </button>
    </div>
  );
}
