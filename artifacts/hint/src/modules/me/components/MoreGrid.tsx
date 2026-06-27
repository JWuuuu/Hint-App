import {
  MessageSquare,
  UserRound,
  Sparkles,
  Ticket,
  ShieldCheck,
  Gift,
  Palette,
  Lock,
  LifeBuoy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "wouter";
import { ACCENT, GLASS } from "../../hold/atmosphere";
import { SectionLabel } from "../../../components/app/AppChrome";
import { useLanguage } from "../../../lib/i18n";

const ITEMS: { icon: LucideIcon; labelKey: string; href?: string; comingSoon?: boolean }[] = [
  { icon: MessageSquare, labelKey: "me.more.feedback", href: "/contact" },
  { icon: UserRound, labelKey: "me.account", href: "/app/login" },
  { icon: Sparkles, labelKey: "me.more.creator", comingSoon: true },
  { icon: Ticket, labelKey: "me.more.invite", comingSoon: true },
  { icon: ShieldCheck, labelKey: "me.more.trust", href: "/disclaimer" },
  { icon: Gift, labelKey: "me.more.gift", comingSoon: true },
  { icon: Sparkles, labelKey: "section.astrology.label", href: "/app/astrology" },
  { icon: Palette, labelKey: "me.more.appearance", href: "/app/profile#me-settings" },
  { icon: Lock, labelKey: "me.more.privacy", href: "/privacy" },
  { icon: LifeBuoy, labelKey: "me.more.support", href: "/contact" },
];

export function MoreGrid() {
  const { t } = useLanguage();

  return (
    <section>
      <SectionLabel>{t("me.more")}</SectionLabel>
      <div
        className="grid grid-cols-4 gap-y-5 gap-x-2 rounded-[8px] py-5 px-2"
        style={{ background: GLASS.panel, border: `1px solid ${GLASS.border}` }}
      >
        {ITEMS.map((it) => {
          const Icon = it.icon;
          const content = (
            <>
              <span
                className="flex h-11 w-11 items-center justify-center rounded-[8px]"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${GLASS.border}`,
                }}
              >
                <Icon size={18} color={ACCENT.aqua} className="opacity-90" />
              </span>
              <span className="font-sans text-[10.5px] text-center leading-tight" style={{ color: GLASS.muted }}>
                {t(it.labelKey)}
              </span>
              {it.comingSoon ? (
                <span className="font-sans text-[8px] uppercase tracking-[0.12em]" style={{ color: GLASS.faint }}>
                  Soon
                </span>
              ) : null}
            </>
          );

          return it.href ? (
            <Link
              key={it.labelKey}
              href={it.href}
              className="flex flex-col items-center gap-2 transition-opacity hover:opacity-80"
            >
              {content}
            </Link>
          ) : (
            <div
              key={it.labelKey}
              aria-disabled="true"
              className="flex cursor-default flex-col items-center gap-1.5 opacity-60"
            >
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}
