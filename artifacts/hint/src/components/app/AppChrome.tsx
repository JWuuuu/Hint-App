import type { ReactNode, ComponentType } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ACCENT } from "../../modules/hold/atmosphere";
import { useLanguage } from "../../lib/i18n";

/**
 * AppChrome — shared premium-dark primitives for the app-shell pages
 * (Me, Readings, and the feature shells). All glassmorphic, sitting over
 * the app room background, with soft white/grey text. Kept separate from the
 * immersive ritual rooms (tarot/ask), which use the legacy candlelit set.
 */

export function AppScreen({ children }: { children: ReactNode }) {
  return (
    <div
      className="h-full w-full overflow-y-auto overscroll-none flex flex-col items-center pb-[calc(4rem+var(--hint-safe-bottom))]"
      style={{ background: "transparent" }}
    >
      <div className="w-full max-w-lg md:max-w-3xl lg:max-w-5xl px-4 pt-[calc(8rem+var(--hint-safe-top))] sm:px-6 md:pt-[calc(8rem+var(--hint-safe-top))] lg:pt-[calc(7rem+var(--hint-safe-top))]">
        {children}
      </div>
    </div>
  );
}

export function BackLink({
  href = "/",
  label,
}: {
  href?: string;
  label?: string;
}) {
  const { t } = useLanguage();

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 font-sans text-[12px] font-medium transition-opacity opacity-80 hover:opacity-100"
      style={{ color: ACCENT.aqua }}
    >
      ← {label ?? t("common.home")}
    </Link>
  );
}

export function ScreenHeader({
  eyebrow,
  title,
  subtitle,
  sigil: Sigil,
  backHref = "/",
  backLabel,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  sigil?: ComponentType;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="mb-9"
    >
      <div className="mb-6">
        <BackLink href={backHref} label={backLabel} />
      </div>
      <div className="flex items-center gap-4">
        {Sigil && (
          <div
            className="w-12 h-12 rounded-[8px] flex items-center justify-center shrink-0"
            style={{
              background:
                "linear-gradient(145deg, rgba(206,178,110,0.14), rgba(100,156,158,0.08))",
              border: "1px solid var(--hint-border)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          >
            <div className="w-6 h-6">
              <Sigil />
            </div>
          </div>
        )}
        <div className="min-w-0">
          {eyebrow && (
            <p
              className="font-sans text-[11px] font-medium uppercase tracking-[0.14em] mb-1.5"
              style={{ color: ACCENT.aqua }}
            >
              {eyebrow}
            </p>
          )}
          <h1
            className="font-serif text-[28px] leading-none font-normal"
            style={{ color: "var(--hint-text)" }}
          >
            {title}
          </h1>
        </div>
      </div>
      {subtitle && (
        <p
          className="font-sans text-[13.5px] leading-relaxed mt-3 max-w-md"
          style={{ color: "var(--hint-muted)" }}
        >
          {subtitle}
        </p>
      )}
    </motion.header>
  );
}

export function GlassPanel({
  children,
  className = "",
  hero = false,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  /** Use the warm ivory hero fill instead of the neutral panel fill. */
  hero?: boolean;
  padded?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[24px] ${padded ? "p-5" : ""} ${className}`}
      style={{
        background: hero
          ? "var(--hint-surface-strong)"
          : "var(--hint-glass, rgba(255,255,255,0.045))",
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        border: "1px solid var(--hint-glass-line, rgba(255,255,255,0.10))",
        boxShadow: "0 18px 52px rgba(0,0,0,0.26), inset 0 1px 0 rgba(255,255,255,0.08)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)",
        }}
      />
      {children}
    </div>
  );
}

export function CardBack({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      aria-hidden
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-[12px] border ${compact ? "h-[66px] w-[46px]" : "h-[118px] w-[78px]"} ${className}`}
      style={{
        background: "var(--hint-deck-card-bg)",
        borderColor: "rgba(203,168,102,0.28)",
        boxShadow:
          "0 10px 30px rgba(0,0,0,0.48), inset 0 0 24px rgba(203,168,102,0.07)",
      }}
    >
      <div
        className="absolute inset-[7px] rounded-[8px] border"
        style={{ borderColor: "rgba(203,168,102,0.22)" }}
      />
      <div
        className={`relative flex items-center justify-center rounded-full border ${compact ? "h-7 w-7" : "h-11 w-11"}`}
        style={{
          color: "var(--hint-gold)",
          borderColor: "rgba(203,168,102,0.28)",
          background:
            "radial-gradient(circle, rgba(203,168,102,0.10), transparent 68%)",
        }}
      >
        <span className="font-serif text-[18px] leading-none">✦</span>
        <span
          className={`absolute rounded-full border ${compact ? "h-10 w-10" : "h-16 w-16"}`}
          style={{ borderColor: "rgba(203,168,102,0.12)" }}
        />
      </div>
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4 px-1">
      <span
        className="w-1 h-1 rounded-full"
        style={{ background: ACCENT.gold }}
      />
      <p
        className="font-sans text-[11px] font-medium uppercase tracking-[0.14em]"
        style={{ color: "var(--hint-muted)" }}
      >
        {children}
      </p>
      <span
        className="flex-1 h-px"
        style={{
          background: "linear-gradient(to right, var(--hint-border), transparent)",
        }}
      />
    </div>
  );
}
