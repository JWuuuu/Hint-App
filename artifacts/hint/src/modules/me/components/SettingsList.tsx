import { useState } from "react";
import {
  Palette,
  Wind,
  Volume2,
  Lock,
  Trash2,
  Info,
  ChevronRight,
  ShieldAlert,
  LifeBuoy,
  Mail,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "wouter";
import { ACCENT, GLASS } from "../../hold/atmosphere";
import { SectionLabel, GlassPanel } from "../../../components/app/AppChrome";
import { useLanguage } from "../../../lib/i18n";
import { apiUrl } from "../../../lib/api";
import { getAnonId } from "../../../lib/identity";

interface Row {
  icon: LucideIcon;
  label: string;
  detail?: string;
  href?: string;
  danger?: boolean;
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
  const [reduceMotion, setReduceMotion] = useState(false);
  const [sound, setSound] = useState(true);
  const { t } = useLanguage();

  const rows: Row[] = [
    { icon: Palette, label: t("me.more.appearance"), detail: t("me.settings.appearanceDetail") },
    { icon: Lock, label: t("me.privacyPolicy"), detail: t("me.settings.privacyDetail"), href: "/privacy" },
    { icon: Info, label: t("me.terms"), detail: t("me.termsDetail"), href: "/terms" },
    { icon: ShieldAlert, label: "Disclaimer", detail: "Entertainment-only boundaries and professional advice limits.", href: "/disclaimer" },
    { icon: LifeBuoy, label: t("me.support"), detail: t("me.supportDetail") },
    { icon: Mail, label: t("me.contact"), detail: t("me.contactDetail"), href: "/contact" },
    {
      icon: Trash2,
      label: t("me.clearHistory"),
      detail: t("me.clearHistoryDetail"),
      danger: true,
      onClick: () => void clearHistory(t("me.clearConfirm")),
    },
    { icon: Info, label: t("me.about"), detail: t("me.aboutDetail") },
  ];

  const toggles: { icon: LucideIcon; label: string; on: boolean; set: (v: boolean) => void }[] = [
    { icon: Wind, label: t("me.reduceMotion"), on: reduceMotion, set: setReduceMotion },
    { icon: Volume2, label: t("me.sound"), on: sound, set: setSound },
  ];

  return (
    <section>
      <SectionLabel>{t("me.settings")}</SectionLabel>
      <GlassPanel padded={false}>
        {toggles.map((t, i) => {
          const Icon = t.icon;
          return (
            <div
              key={t.label}
              className="flex items-center gap-4 px-5 py-4"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${GLASS.border}` }}
            >
              <Icon size={17} color={ACCENT.aqua} className="shrink-0 opacity-90" />
              <span className="flex-1 font-serif text-[14px]" style={{ color: GLASS.text }}>
                {t.label}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={t.on}
                aria-label={t.label}
                onClick={() => t.set(!t.on)}
                className="relative w-11 h-6 rounded-full transition-colors shrink-0"
                style={{
                  background: t.on ? "rgba(100,156,158,0.55)" : "rgba(255,255,255,0.1)",
                  border: `1px solid ${t.on ? "rgba(100,156,158,0.7)" : GLASS.border}`,
                }}
              >
                <span
                  className="absolute top-0.5 w-4.5 h-4.5 rounded-full transition-all"
                  style={{
                    width: 18,
                    height: 18,
                    left: t.on ? 22 : 3,
                    background: "rgba(246,248,252,0.95)",
                  }}
                />
              </button>
            </div>
          );
        })}

        {rows.map((r) => {
          const Icon = r.icon;
          const content = (
            <>
              <Icon
                size={17}
                color={r.danger ? "rgba(214,140,140,0.9)" : ACCENT.aqua}
                className="shrink-0 opacity-90"
              />
              <span
                className="flex-1 font-serif text-[14px]"
                style={{ color: r.danger ? "rgba(224,168,168,0.95)" : GLASS.text }}
              >
                <span className="block">{r.label}</span>
                {r.detail && (
                  <span
                    className="block mt-0.5 font-sans text-[11px] leading-snug"
                    style={{ color: r.danger ? "rgba(224,168,168,0.72)" : GLASS.faint }}
                  >
                    {r.detail}
                  </span>
                )}
              </span>
              <ChevronRight size={15} color={GLASS.faint} />
            </>
          );

          const className =
            "w-full flex items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.03]";
          const style = { borderTop: `1px solid ${GLASS.border}` };

          return r.href ? (
            <Link key={r.label} href={r.href} className={className} style={style}>
              {content}
            </Link>
          ) : (
            <button
              key={r.label}
              type="button"
              onClick={r.onClick}
              className={className}
              style={style}
              data-testid={r.danger ? "button-clear-history" : undefined}
            >
              {content}
            </button>
          );
        })}
      </GlassPanel>

      <div
        className="flex items-start gap-3 mt-4 px-4 py-3.5 rounded-[8px]"
        style={{ background: GLASS.panel, border: `1px solid ${GLASS.border}` }}
      >
        <ShieldAlert size={15} color={GLASS.faint} className="shrink-0 mt-0.5" />
        <p className="font-sans text-[11.5px] leading-relaxed" style={{ color: GLASS.faint }}>
          {t("me.disclaimer")}
        </p>
      </div>
    </section>
  );
}
