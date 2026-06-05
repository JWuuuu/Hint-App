import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Archive } from "lucide-react";
import { ACCENT, GLASS } from "../../hold/atmosphere";
import { useLanguage } from "../../../lib/i18n";

export function ProfileBanner() {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <Link href="/readings" className="block">
        <div
          className="relative rounded-[8px] overflow-hidden p-5 flex items-center gap-4"
          style={{
            background: "var(--hint-me-archive-surface)",
            border: `1px solid ${GLASS.border}`,
            boxShadow: "var(--hint-me-archive-shadow)",
          }}
        >
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none opacity-70"
            style={{
              background: "var(--hint-me-archive-stars)",
            }}
          />
          <div
            className="relative w-11 h-11 rounded-[8px] flex items-center justify-center shrink-0"
            style={{
              background: "rgba(196,169,98,0.12)",
              border: "1px solid rgba(196,169,98,0.3)",
            }}
          >
            <Archive size={20} color={ACCENT.gold} />
          </div>
          <div className="relative min-w-0 flex-1">
            <p className="font-serif text-[15.5px]" style={{ color: GLASS.text }}>
              {t("me.archiveTitle")}
            </p>
            <p className="font-sans text-[12px] mt-0.5 leading-snug" style={{ color: GLASS.muted }}>
              {t("me.archiveBody")}
            </p>
          </div>
          <ArrowRight size={18} color={GLASS.faint} className="relative shrink-0" />
        </div>
      </Link>
    </motion.div>
  );
}
