import { Database, LifeBuoy, Lock, ShieldCheck, Trash2 } from "lucide-react";
import { ACCENT, GLASS } from "../../hold/atmosphere";
import { GlassPanel, SectionLabel } from "../../../components/app/AppChrome";
import { useLanguage } from "../../../lib/i18n";

const TRUST_ITEMS = [
  { icon: Lock, titleKey: "me.trust.privacyTitle", bodyKey: "me.trust.privacyBody" },
  { icon: Database, titleKey: "me.trust.storageTitle", bodyKey: "me.trust.storageBody" },
  { icon: Trash2, titleKey: "me.trust.clearTitle", bodyKey: "me.trust.clearBody" },
  { icon: LifeBuoy, titleKey: "me.trust.supportTitle", bodyKey: "me.trust.supportBody" },
] as const;

export function TrustCard() {
  const { t } = useLanguage();

  return (
    <section>
      <SectionLabel>{t("me.trust.title")}</SectionLabel>
      <GlassPanel>
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-[8px] flex items-center justify-center shrink-0"
            style={{
              background: "rgba(100,156,158,0.12)",
              border: `1px solid ${GLASS.border}`,
            }}
          >
            <ShieldCheck size={19} color={ACCENT.aqua} />
          </div>
          <div>
            <h3 className="font-serif text-[18px] leading-tight" style={{ color: GLASS.text }}>
              {t("me.trust.heading")}
            </h3>
            <p className="mt-1 font-sans text-[12.5px] leading-relaxed" style={{ color: GLASS.muted }}>
              {t("me.trust.body")}
            </p>
          </div>
        </div>

        <div
          className="grid gap-3 sm:grid-cols-2 mt-5 pt-5"
          style={{ borderTop: `1px solid ${GLASS.border}` }}
        >
          {TRUST_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.titleKey} className="flex items-start gap-3">
                <Icon size={16} color={ACCENT.gold} className="shrink-0 mt-0.5 opacity-90" />
                <div className="min-w-0">
                  <p className="font-serif text-[13.5px]" style={{ color: GLASS.text }}>
                    {t(item.titleKey)}
                  </p>
                  <p className="font-sans text-[11.5px] leading-relaxed" style={{ color: GLASS.faint }}>
                    {t(item.bodyKey)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </GlassPanel>
    </section>
  );
}
