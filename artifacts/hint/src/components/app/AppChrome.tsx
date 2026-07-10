import type {
  ButtonHTMLAttributes,
  ComponentType,
  HTMLAttributes,
  ReactNode,
} from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useLanguage } from "../../lib/i18n";

/**
 * AppChrome — shared mobile-app primitives for the app-shell pages.
 * Screens sit directly in the phone canvas; primary navigation lives in
 * the bottom tab bar, so this wrapper keeps top spacing compact.
 */

export function AppScreen({ children }: { children: ReactNode }) {
  return (
    <div
      className="hint-app-scroll h-full w-full flex flex-col items-center pb-[calc(7.75rem+var(--hint-safe-bottom))] scroll-pt-[calc(1.25rem+var(--hint-safe-top))]"
      style={{ background: "transparent" }}
    >
      <div className="w-full max-w-[var(--hint-app-width)] px-3.5 pt-[calc(1rem+var(--hint-safe-top))] sm:px-4">
        {children}
      </div>
    </div>
  );
}

export function BackLink({
  href = "/app",
  label,
}: {
  href?: string;
  label?: string;
}) {
  const { t } = useLanguage();

  return (
    <Link
      href={href}
      className="hint-glass-button hint-tap-sparkle inline-flex min-h-9 items-center gap-1 rounded-full border px-3 py-1 font-sans text-[12px] font-bold transition active:scale-[0.98]"
      style={{
        color: "var(--hint-text)",
        background: "color-mix(in srgb, var(--hint-surface-soft) 86%, transparent)",
        borderColor: "color-mix(in srgb, var(--hint-rose) 20%, var(--hint-border))",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.28)",
        backdropFilter: "blur(20px) saturate(1.25)",
        WebkitBackdropFilter: "blur(20px) saturate(1.25)",
      }}
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
  showBack = true,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  sigil?: ComponentType;
  backHref?: string;
  backLabel?: string;
  showBack?: boolean;
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="mb-5"
    >
      {showBack ? (
        <div className="mb-3">
          <BackLink href={backHref} label={backLabel} />
        </div>
      ) : null}
      <div className="flex items-center gap-3">
        {Sigil && (
          <div
            className="hint-glass-card hint-app-card hint-shimmer-border flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px]"
            style={{
              background: "var(--hint-liquid-panel-strong)",
              border: "1px solid var(--hint-liquid-border)",
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
              className="mb-1.5 font-sans text-[10px] font-black uppercase tracking-[0.18em]"
              style={{ color: "var(--hint-rose)" }}
            >
              {eyebrow}
            </p>
          )}
          <h1
            className="hint-app-title font-serif text-[29px] font-normal leading-none"
            style={{ color: "var(--hint-text)" }}
          >
            {title}
          </h1>
        </div>
      </div>
      {subtitle && (
        <p
          className="mt-2.5 max-w-md font-sans text-[13px] leading-relaxed"
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
      className={`hint-glass-card hint-app-card hint-card-lift relative overflow-hidden rounded-[26px] ${padded ? "p-4" : ""} ${className}`}
      style={{
        background: hero
          ? "var(--hint-surface-strong)"
          : "var(--hint-liquid-panel)",
        backdropFilter: "blur(38px) saturate(1.46) brightness(1.04)",
        WebkitBackdropFilter: "blur(38px) saturate(1.46) brightness(1.04)",
        border: "1px solid var(--hint-liquid-border)",
        boxShadow: "var(--hint-liquid-shadow)",
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

export function GlassButton({
  children,
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={`hint-glass-button hint-tap-sparkle inline-flex min-h-11 items-center justify-center rounded-full px-4 font-sans text-[12px] font-black uppercase tracking-[0.12em] transition ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function GlassNavSurface({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`hint-glass-nav rounded-[30px] ${className}`} {...props}>
      {children}
    </div>
  );
}

export function GlassModalShell({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`hint-glass-modal p-5 ${className}`} {...props}>
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
        borderColor: "color-mix(in srgb, var(--hint-rose, #b85d86) 28%, var(--hint-border))",
        boxShadow:
          "0 12px 32px rgba(31,22,40,0.22), inset 0 0 24px color-mix(in srgb, var(--hint-rose, #b85d86) 8%, transparent)",
      }}
    >
      <div
        className="absolute inset-[7px] rounded-[8px] border"
        style={{ borderColor: "color-mix(in srgb, var(--hint-rose, #b85d86) 18%, transparent)" }}
      />
      <div
        className={`relative flex items-center justify-center rounded-full border ${compact ? "h-7 w-7" : "h-11 w-11"}`}
        style={{
          color: "var(--hint-rose)",
          borderColor: "color-mix(in srgb, var(--hint-rose, #b85d86) 28%, var(--hint-border))",
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--hint-rose, #b85d86) 14%, transparent), transparent 68%)",
        }}
      >
        <span className="font-serif text-[18px] leading-none">✦</span>
        <span
          className={`absolute rounded-full border ${compact ? "h-10 w-10" : "h-16 w-16"}`}
          style={{ borderColor: "color-mix(in srgb, var(--hint-lavender, #8071b8) 12%, transparent)" }}
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
        style={{ background: "var(--hint-rose)" }}
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
