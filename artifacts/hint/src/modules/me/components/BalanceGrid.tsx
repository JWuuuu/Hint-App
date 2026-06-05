import { Coins, Star, FileText, Ticket } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ACCENT, GLASS } from "../../hold/atmosphere";
import { SectionLabel } from "../../../components/app/AppChrome";
import { useLanguage } from "../../../lib/i18n";

const ITEMS: { icon: LucideIcon; labelKey: string; value: string }[] = [
  { icon: Coins, labelKey: "me.credits", value: "0" },
  { icon: Star, labelKey: "me.stars", value: "0" },
  { icon: FileText, labelKey: "me.reports", value: "0" },
  { icon: Ticket, labelKey: "me.coupons", value: "1" },
];

export function BalanceGrid() {
  const { t } = useLanguage();

  return (
    <section>
      <SectionLabel>{t("me.balance")}</SectionLabel>
      <div
        className="grid grid-cols-4 rounded-[8px] overflow-hidden"
        style={{ background: GLASS.panel, border: `1px solid ${GLASS.border}` }}
      >
        {ITEMS.map((it, i) => {
          const Icon = it.icon;
          return (
            <button
              key={it.labelKey}
              type="button"
              className="flex flex-col items-center gap-1.5 py-4 transition-colors hover:bg-white/[0.03]"
              style={{ borderLeft: i === 0 ? "none" : `1px solid ${GLASS.border}` }}
            >
              <Icon size={19} color={ACCENT.gold} className="opacity-90" />
              <span className="font-serif text-[16px] tabular-nums" style={{ color: GLASS.text }}>
                {it.value}
              </span>
              <span className="font-sans text-[11px]" style={{ color: GLASS.faint }}>
                {t(it.labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
