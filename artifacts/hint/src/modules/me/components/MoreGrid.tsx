import {
  MessageSquare,
  Sparkles,
  Ticket,
  ShieldCheck,
  Gift,
  Palette,
  Lock,
  LifeBuoy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ACCENT, GLASS } from "../../hold/atmosphere";
import { SectionLabel } from "../../../components/app/AppChrome";
import { useLanguage } from "../../../lib/i18n";

const ITEMS: { icon: LucideIcon; labelKey: string }[] = [
  { icon: MessageSquare, labelKey: "me.more.feedback" },
  { icon: Sparkles, labelKey: "me.more.creator" },
  { icon: Ticket, labelKey: "me.more.invite" },
  { icon: ShieldCheck, labelKey: "me.more.trust" },
  { icon: Gift, labelKey: "me.more.gift" },
  { icon: Palette, labelKey: "me.more.appearance" },
  { icon: Lock, labelKey: "me.more.privacy" },
  { icon: LifeBuoy, labelKey: "me.more.support" },
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
          return (
            <button
              key={it.labelKey}
              type="button"
              className="flex flex-col items-center gap-2 transition-opacity hover:opacity-80"
            >
              <span
                className="w-11 h-11 rounded-[8px] flex items-center justify-center"
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
            </button>
          );
        })}
      </div>
    </section>
  );
}
