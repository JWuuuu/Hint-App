import { useState, type ReactNode } from "react";
import {
  ChevronRight,
  FileText,
  Globe2,
  Info,
  LifeBuoy,
  Lock,
  Mail,
  Moon,
  Palette,
  ShieldAlert,
  Sparkles,
  Sun,
  Trash2,
  Volume2,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { Link } from "wouter";
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

export function SettingsList() {
  const [theme, setTheme] = useState<HintTheme>(getInitialHintTheme);
  const { preferences, setPreference } = useHintPreferences();
  const { t } = useLanguage();

  function chooseTheme(nextTheme: HintTheme) {
    setTheme(nextTheme);
    setHintThemePreference(nextTheme);
  }

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
    <div className="grid gap-4">
      <section>
        <SectionTitle>{t("me.settings.groupPreferences")}</SectionTitle>
        <div className="overflow-visible rounded-[18px] border" style={groupStyle}>
          <div className="px-3.5 py-3">
            <div className="flex items-start gap-3.5">
              <IconTile icon={Palette} />
              <div className="min-w-0 flex-1">
                <p className="font-sans text-[15px] font-black" style={{ color: GLASS.text }}>
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
  backdropFilter: "blur(28px) saturate(1.22)",
  WebkitBackdropFilter: "blur(28px) saturate(1.22)",
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
      className="hint-icon-tile grid size-8 shrink-0 place-items-center rounded-[12px]"
      style={{
        background: danger
          ? "color-mix(in srgb, var(--hint-danger) 13%, var(--hint-control-bg))"
          : undefined,
      }}
    >
      <Icon size={17} color={danger ? "var(--hint-danger)" : ACCENT.aqua} />
    </span>
  );
}

function SettingsSection({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <section>
      <SectionTitle>{title}</SectionTitle>
      <div className="overflow-hidden rounded-[18px] border" style={groupStyle}>
        {rows.map((row, index) => (
          <SettingsRow key={row.id} row={row} isFirst={index === 0} />
        ))}
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
      <details className="overflow-hidden rounded-[18px] border" style={groupStyle}>
        <summary className="flex cursor-pointer list-none transform-gpu items-center gap-3.5 px-3.5 py-3 transition-[background,transform] duration-200 ease-out active:scale-[0.995]">
          <IconTile icon={ShieldAlert} />
          <span className="min-w-0 flex-1">
            <span className="block font-sans text-[14px] font-black leading-tight" style={{ color: GLASS.text }}>
              {title}
            </span>
            <span className="mt-0.5 line-clamp-1 block font-sans text-[11.5px] leading-snug" style={{ color: GLASS.faint }}>
              {detail}
            </span>
          </span>
          <ChevronRight size={15} color={GLASS.faint} className="shrink-0" />
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
        <span className="block font-sans text-[14px] font-black leading-tight">{row.label}</span>
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

  const className = "flex min-h-[58px] w-full transform-gpu items-center gap-3.5 px-3.5 py-3 text-left transition-[background,transform,opacity] duration-200 ease-out hover:-translate-y-0.5 active:scale-[0.992] active:bg-white/[0.06]";
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
    <div className="flex min-h-[58px] transform-gpu items-center gap-3.5 border-t px-3.5 py-3" style={{ borderColor: GLASS.border }}>
      <IconTile icon={icon} />
      <span className="min-w-0 flex-1">
        <span className="block font-sans text-[14px] font-black leading-tight" style={{ color: GLASS.text }}>
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
      className="hint-segment flex min-h-10 transform-gpu items-center justify-center gap-2 rounded-full px-3 py-2 font-sans text-[12px] font-bold transition-[background,border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 active:scale-[0.98]"
      data-active={active}
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
      className="relative h-7 w-12 shrink-0 transform-gpu rounded-full transition-colors duration-200 ease-out active:scale-[0.98]"
      style={{
        background: checked
          ? "var(--hint-special-action-bg)"
          : "color-mix(in srgb, var(--hint-surface-soft) 86%, transparent)",
        border: `1px solid ${checked ? "color-mix(in srgb, var(--hint-rose) 34%, var(--hint-border))" : GLASS.border}`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22)",
      }}
    >
      <span
        className="absolute left-0.5 top-0.5 rounded-full transition-transform duration-200 ease-out will-change-transform"
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
