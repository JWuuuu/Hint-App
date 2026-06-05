import { motion } from "framer-motion";
import { Link } from "wouter";
import { ACCENT, SOFT_GOLD } from "../../hold/atmosphere";
import type { ModuleDefinition } from "../types/home.types";
import { useLanguage } from "../../../lib/i18n";

type Variant = "grid" | "library";

interface Props {
  module: ModuleDefinition;
  index: number;
  baseDelay?: number;
  variant?: Variant;
}

function StatusBadge({ locked }: { locked: boolean }) {
  const { t } = useLanguage();
  return (
    <span
      className="absolute right-3 top-3 text-[8px] uppercase tracking-widest font-bold"
      style={{ color: locked ? ACCENT.lavender : ACCENT.aqua }}
    >
      {locked ? t("module.status.soon") : t("module.status.open")}
    </span>
  );
}

export function ModuleTile({ module, index, baseDelay = 0, variant = "grid" }: Props) {
  const { t } = useLanguage();
  const locked = module.href === null;
  const Sigil = module.sigil;
  const isLibrary = variant === "library";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: baseDelay + index * 0.05, duration: 0.5 }}
      whileHover={!locked ? { y: -2, scale: 1.02 } : undefined}
      whileTap={!locked ? { scale: 0.98 } : undefined}
      className={`relative h-full min-h-[178px] flex flex-col overflow-hidden rounded-[14px] cursor-pointer ${
        isLibrary ? "items-start justify-between p-4" : "items-center justify-between p-4"
      }`}
      style={{
        background: locked
          ? "var(--hint-card-surface-muted)"
          : "var(--hint-card-surface)",
        border: `1px solid ${locked ? "var(--hint-border)" : "var(--hint-border-strong)"}`,
        opacity: locked ? 0.62 : 1,
        boxShadow: locked
          ? "inset 0 1px 0 rgba(255,255,255,0.03)"
          : "var(--hint-elevated-shadow)",
      }}
    >
      <div
        className="absolute inset-[8px] rounded-[9px] border opacity-70"
        style={{
          borderColor: locked ? "var(--hint-border)" : "rgba(206,178,110,0.34)",
        }}
      />
      <div
        className="absolute left-3 top-3 h-3 w-3 rotate-45 border"
        style={{ borderColor: locked ? "var(--hint-border)" : "rgba(206,178,110,0.48)" }}
      />
      <div
        className="absolute bottom-3 right-3 h-3 w-3 rotate-45 border"
        style={{ borderColor: locked ? "var(--hint-border)" : "rgba(206,178,110,0.48)" }}
      />
      <div
        className={`relative mt-5 w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
          isLibrary ? "" : ""
        }`}
        style={{
          background: locked
            ? "var(--hint-surface-soft)"
            : "rgba(206, 178, 110, 0.12)",
          border: `1px solid ${locked ? "var(--hint-border)" : "rgba(206, 178, 110, 0.18)"}`,
          color: locked ? "var(--hint-faint)" : SOFT_GOLD,
        }}
      >
        <div className="w-6 h-6">
          <Sigil />
        </div>
      </div>

      <div className={`relative ${isLibrary ? "text-left" : "text-center"} w-full`}>
        <h3
          className="font-serif text-[17px] leading-tight"
          style={{ color: "var(--hint-text)" }}
        >
          {t(`module.${module.id}.${variant === "grid" ? "shortTitle" : "title"}`) !== `module.${module.id}.${variant === "grid" ? "shortTitle" : "title"}`
            ? t(`module.${module.id}.${variant === "grid" ? "shortTitle" : "title"}`)
            : t(`module.${module.id}.title`)}
        </h3>

        {(isLibrary || !locked) && (
          <p
            className={`font-sans text-[11.5px] leading-snug mt-2 ${isLibrary ? "text-left" : "text-center"}`}
            style={{ color: "var(--hint-muted)" }}
          >
            {t(`module.${module.id}.hint`)}
          </p>
        )}
      </div>

      {isLibrary ? <StatusBadge locked={locked} /> : locked && <StatusBadge locked />}
    </motion.div>
  );
}

export function ModuleTileWrapper({ module, index, baseDelay, variant }: Props) {
  if (module.href) {
    return (
      <Link href={module.href} className="block h-full">
        <ModuleTile module={module} index={index} baseDelay={baseDelay} variant={variant} />
      </Link>
    );
  }
  return (
    <div className="h-full">
      <ModuleTile module={module} index={index} baseDelay={baseDelay} variant={variant} />
    </div>
  );
}
