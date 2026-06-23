import { useState, type ReactNode } from "react";
import {
  CalendarDays,
  ChevronRight,
  FileText,
  Globe2,
  Info,
  KeyRound,
  LifeBuoy,
  Lock,
  Mail,
  Moon,
  Palette,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  UserRound,
  Volume2,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { Link } from "wouter";
import type { Profile } from "@workspace/api-client-react";
import { ACCENT, GLASS } from "../../hold/atmosphere";
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
import { useLocalAccount, type LocalAccount } from "../../../lib/auth";

interface Row {
  id: string;
  icon: LucideIcon;
  label: string;
  detail?: string;
  href?: string;
  danger?: boolean;
  control?: ReactNode;
  onClick?: () => void;
}

function accountLabel(account: LocalAccount) {
  return account.email ?? account.phone ?? account.identifier;
}

function providerLabel(provider: LocalAccount["provider"]) {
  if (provider === "email") return "Email";
  if (provider === "phone") return "Phone";
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

function profileDetail(profile: Profile | null, missingText: string) {
  if (!profile?.birthDate) return missingText;
  return [profile.birthDate, profile.birthTime, profile.birthPlace]
    .filter(Boolean)
    .join(" · ");
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
    // Best effort only.
  }
  window.location.reload();
}

export function SettingsList({
  profile,
  onEditProfile,
}: {
  profile: Profile | null;
  onEditProfile: () => void;
}) {
  const [theme, setTheme] = useState<HintTheme>(getInitialHintTheme);
  const { preferences, setPreference } = useHintPreferences();
  const account = useLocalAccount();
  const { t } = useLanguage();

  function chooseTheme(nextTheme: HintTheme) {
    setTheme(nextTheme);
    setHintThemePreference(nextTheme);
  }

  const profileRows: Row[] = [
    {
      id: "profile",
      icon: profile?.birthDate ? CalendarDays : UserRound,
      label: t("account.birthProfile"),
      detail: profileDetail(profile, t("account.birthMissing")),
      onClick: onEditProfile,
    },
    {
      id: "account",
      icon: account ? ShieldCheck : KeyRound,
      label: t("me.account"),
      detail: account
        ? `${providerLabel(account.provider)} · ${accountLabel(account)}`
        : t("me.settings.accountGuestDetail"),
      href: account ? "/app/login?mode=login" : "/app/login?mode=signup",
    },
  ];

  const appRows: Row[] = [
    {
      id: "tarot",
      icon: Sparkles,
      label: t("me.settings.tarotTitle"),
      detail: t("me.settings.tarotStatus"),
      href: "/app/tarot?setup=1",
    },
  ];

  const supportRows: Row[] = [
    { id: "privacy", icon: Lock, label: t("me.privacyPolicy"), detail: t("me.settings.privacyDetail"), href: "/privacy" },
    { id: "terms", icon: FileText, label: t("me.terms"), detail: t("me.termsDetail"), href: "/terms" },
    {
      id: "disclaimer",
      icon: ShieldAlert,
      label: t("me.settings.disclaimerTitle"),
      detail: t("me.settings.disclaimerDetail"),
      href: "/disclaimer",
    },
    { id: "support", icon: LifeBuoy, label: t("me.support"), detail: t("me.supportDetail"), href: "/contact" },
    { id: "contact", icon: Mail, label: t("me.contact"), detail: CONTACT_EMAIL, href: "/contact" },
    {
      id: "clear-history",
      icon: Trash2,
      label: t("me.clearHistory"),
      detail: t("me.clearHistoryDetail"),
      danger: true,
      onClick: () => void clearHistory(t("me.clearConfirm")),
    },
    { id: "about", icon: Info, label: t("me.about"), detail: t("me.aboutDetail"), href: "/about" },
  ];

  return (
    <div className="grid gap-5">
      <ProfileStatusGrid profile={profile} account={account} onEditProfile={onEditProfile} />
      <SettingsSection title={t("me.settings.groupProfile")} rows={profileRows} />

      <section>
        <SectionTitle>{t("me.settings.groupPreferences")}</SectionTitle>
        <div className="overflow-visible rounded-[22px] border" style={groupStyle}>
          <div className="px-4 py-3.5">
            <div className="flex items-start gap-3.5">
              <IconTile icon={Palette} />
              <div className="min-w-0 flex-1">
                <p className="font-serif text-[15px]" style={{ color: GLASS.text }}>
                  {t("me.more.appearance")}
                </p>
                <p className="mt-0.5 font-sans text-[11.5px] leading-snug" style={{ color: GLASS.faint }}>
                  {t("me.settings.appearanceDetail")}
                </p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <ThemeButton
                active={theme === "dark"}
                icon={Moon}
                label={t("me.settings.themeDark")}
                onClick={() => chooseTheme("dark")}
              />
              <ThemeButton
                active={theme === "bright"}
                icon={Sun}
                label={t("me.settings.themeBright")}
                onClick={() => chooseTheme("bright")}
              />
            </div>
          </div>

          <ControlRow
            icon={Globe2}
            label={t("language.switch")}
            detail={t("language.switchAria")}
            control={<LanguageToggle menuPlacement="bottom" />}
          />
          <ControlRow
            icon={Wind}
            label={t("me.reduceMotion")}
            detail={t("me.settings.motionDetail")}
            control={
              <ToggleSwitch
                label={t("me.reduceMotion")}
                checked={preferences.reduceMotion}
                onChange={(checked) => setPreference("reduceMotion", checked)}
              />
            }
          />
          <ControlRow
            icon={Volume2}
            label={t("me.sound")}
            detail={t("me.settings.soundDetail")}
            control={
              <ToggleSwitch
                label={t("me.sound")}
                checked={preferences.soundAndHaptics}
                onChange={(checked) => setPreference("soundAndHaptics", checked)}
              />
            }
          />
        </div>
      </section>

      <SettingsSection title={t("me.settings.groupApp")} rows={appRows} />
      <ExpandableSettingsSection
        title={t("me.settings.groupSafety")}
        detail={t("me.settings.privacySupportDetail")}
        rows={supportRows}
      />
    </div>
  );
}

const groupStyle = {
  background: "var(--hint-liquid-panel)",
  borderColor: "var(--hint-liquid-border)",
  boxShadow: "var(--hint-liquid-shadow)",
  backdropFilter: "blur(34px) saturate(1.36)",
  WebkitBackdropFilter: "blur(34px) saturate(1.36)",
} as const;

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 px-1 font-sans text-[11px] font-black uppercase tracking-[0.12em]" style={{ color: GLASS.faint }}>
      {children}
    </p>
  );
}

function IconTile({
  icon: Icon,
  danger = false,
}: {
  icon: LucideIcon;
  danger?: boolean;
}) {
  return (
    <span
      className="grid size-9 shrink-0 place-items-center rounded-[12px]"
      style={{
        background: danger
          ? "rgba(214,140,140,0.12)"
          : "color-mix(in srgb, var(--hint-surface-soft) 82%, transparent)",
        border: `1px solid ${GLASS.border}`,
      }}
    >
      <Icon size={17} color={danger ? "rgba(214,140,140,0.9)" : ACCENT.aqua} />
    </span>
  );
}

function SettingsSection({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <section>
      <SectionTitle>{title}</SectionTitle>
      <div className="overflow-hidden rounded-[22px] border" style={groupStyle}>
        {rows.map((row, index) => (
          <SettingsRow key={row.id} row={row} isFirst={index === 0} />
        ))}
      </div>
    </section>
  );
}

function ProfileStatusGrid({
  profile,
  account,
  onEditProfile,
}: {
  profile: Profile | null;
  account: LocalAccount | null;
  onEditProfile: () => void;
}) {
  const { t } = useLanguage();
  const profileName = profile?.name ?? account?.name ?? t("account.guest");
  const accountHref = account ? "/app/login?mode=login" : "/app/login?mode=signup";
  const items = [
    {
      id: "identity",
      icon: UserRound,
      label: t("account.briefProfile"),
      value: profile?.name || account?.name ? profileName : t("account.guest"),
      tone: ACCENT.aqua,
      onClick: onEditProfile,
    },
    {
      id: "birth",
      icon: CalendarDays,
      label: t("account.birthProfile"),
      value: profile?.birthDate ? t("me.saved") : t("account.birthMissing"),
      tone: ACCENT.gold,
      onClick: onEditProfile,
    },
    {
      id: "account",
      icon: account ? ShieldCheck : KeyRound,
      label: t("me.account"),
      value: account ? t("account.verified") : t("account.notSignedIn"),
      tone: account ? ACCENT.aqua : GLASS.faint,
      href: accountHref,
    },
  ];

  return (
    <section>
      <div className="grid grid-cols-3 gap-2">
        {items.map(({ id, icon: Icon, label, value, tone, href, onClick }) => {
          const content = (
            <>
              <span className="grid size-8 place-items-center rounded-[10px]" style={{ background: "color-mix(in srgb, var(--hint-surface-soft) 82%, transparent)", border: `1px solid ${GLASS.border}` }}>
                <Icon size={15} color={tone} />
              </span>
              <span className="mt-2 block truncate font-sans text-[9px] font-black uppercase tracking-[0.11em]" style={{ color: GLASS.faint }}>
                {label}
              </span>
              <span className="mt-1 block truncate font-serif text-[13px] leading-tight" style={{ color: GLASS.text }}>
                {value}
              </span>
            </>
          );
          const className = "min-w-0 rounded-[18px] border px-2.5 py-3 text-left transition active:scale-[0.98]";
          const style = {
            background: "var(--hint-liquid-panel)",
            borderColor: "var(--hint-liquid-border)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.20)",
          };
          return href ? (
            <Link key={id} href={href} className={className} style={style}>
              {content}
            </Link>
          ) : (
            <button key={id} type="button" onClick={onClick} className={className} style={style}>
              {content}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ExpandableSettingsSection({
  title,
  detail,
  rows,
}: {
  title: string;
  detail: string;
  rows: Row[];
}) {
  return (
    <section>
      <details className="overflow-hidden rounded-[22px] border" style={groupStyle}>
        <summary className="flex cursor-pointer list-none items-center gap-3.5 px-4 py-3.5">
          <IconTile icon={ShieldAlert} />
          <span className="min-w-0 flex-1">
            <span className="block font-serif text-[15px] leading-tight" style={{ color: GLASS.text }}>
              {title}
            </span>
            <span className="mt-0.5 line-clamp-1 block font-sans text-[11.5px] leading-snug" style={{ color: GLASS.faint }}>
              {detail}
            </span>
          </span>
          <span className="rounded-full border px-2.5 py-1 font-sans text-[10px] font-black" style={{ borderColor: GLASS.border, color: GLASS.faint }}>
            {rows.length}
          </span>
        </summary>
        <div style={{ borderTop: `1px solid ${GLASS.border}` }}>
          {rows.map((row, index) => (
            <SettingsRow key={row.id} row={row} isFirst={index === 0} />
          ))}
        </div>
      </details>
    </section>
  );
}

function SettingsRow({ row, isFirst }: { row: Row; isFirst: boolean }) {
  const content = (
    <>
      <IconTile icon={row.icon} danger={row.danger} />
      <span
        className="min-w-0 flex-1"
        style={{ color: row.danger ? "rgba(224,168,168,0.95)" : GLASS.text }}
      >
        <span className="block font-serif text-[15px] leading-tight">{row.label}</span>
        {row.detail && (
          <span
            className="mt-0.5 line-clamp-1 block font-sans text-[11.5px] leading-snug"
            style={{ color: row.danger ? "rgba(224,168,168,0.72)" : GLASS.faint }}
          >
            {row.detail}
          </span>
        )}
      </span>
      {row.control ?? <ChevronRight size={15} color={GLASS.faint} className="shrink-0" />}
    </>
  );

  const className = "flex min-h-[64px] w-full items-center gap-3.5 px-4 py-3 text-left transition active:bg-white/[0.06]";
  const style = { borderTop: isFirst ? "none" : `1px solid ${GLASS.border}` };

  if (row.href) {
    return (
      <Link href={row.href} className={className} style={style}>
        {content}
      </Link>
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

function ControlRow({
  icon,
  label,
  detail,
  control,
}: {
  icon: LucideIcon;
  label: string;
  detail: string;
  control: ReactNode;
}) {
  return (
    <div className="flex min-h-[64px] items-center gap-3.5 border-t px-4 py-3" style={{ borderColor: GLASS.border }}>
      <IconTile icon={icon} />
      <span className="min-w-0 flex-1">
        <span className="block font-serif text-[15px] leading-tight" style={{ color: GLASS.text }}>
          {label}
        </span>
        <span className="mt-0.5 line-clamp-1 block font-sans text-[11.5px] leading-snug" style={{ color: GLASS.faint }}>
          {detail}
        </span>
      </span>
      <span className="shrink-0">{control}</span>
    </div>
  );
}

function ThemeButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-11 items-center justify-center gap-2 rounded-[14px] border px-3 py-2 font-sans text-[12px] font-bold transition active:scale-[0.98]"
      style={{
        borderColor: active ? "color-mix(in srgb, var(--hint-rose) 34%, var(--hint-border))" : GLASS.border,
        color: active ? "var(--hint-special-action-text)" : GLASS.text,
        background: active
          ? "var(--hint-special-action-bg)"
          : "color-mix(in srgb, var(--hint-surface-soft) 86%, transparent)",
        boxShadow: active
          ? "0 10px 22px color-mix(in srgb, var(--hint-rose) 16%, transparent), inset 0 1px 0 rgba(255,255,255,0.50)"
          : "inset 0 1px 0 rgba(255,255,255,0.16)",
      }}
    >
      <Icon size={14} />
      <span className="min-w-0 truncate">{label}</span>
    </button>
  );
}

function ToggleSwitch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative h-7 w-12 shrink-0 rounded-full transition-colors"
      style={{
        background: checked
          ? "var(--hint-special-action-bg)"
          : "color-mix(in srgb, var(--hint-surface-soft) 86%, transparent)",
        border: `1px solid ${checked ? "color-mix(in srgb, var(--hint-rose) 34%, var(--hint-border))" : GLASS.border}`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22)",
      }}
    >
      <span
        className="absolute left-0.5 top-0.5 rounded-full transition-transform"
        style={{
          width: 22,
          height: 22,
          transform: `translateX(${checked ? 20 : 0}px)`,
          background: "rgba(246,248,252,0.95)",
          boxShadow: "0 4px 12px rgba(55,38,65,0.20), inset 0 1px 0 rgba(255,255,255,0.92)",
        }}
      />
    </button>
  );
}
