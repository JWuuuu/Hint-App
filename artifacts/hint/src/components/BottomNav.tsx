import type { ReactNode } from "react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Menu, Moon, Sun, X } from "lucide-react";
import type { HintTheme } from "./app/theme";
import { useLanguage } from "../lib/i18n";
import { HintLogo } from "./app/HintLogo";

interface BottomNavProps {
  theme: HintTheme;
  onThemeToggle: () => void;
}

export function BottomNav({ theme, onThemeToggle }: BottomNavProps) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useLanguage();
  const bright = theme === "bright";
  const isDark = theme === "dark";
  const homeRelatedRoutes = new Set([
    "/",
    "/rooms",
    "/daily-pull",
    "/journal",
    "/astrology",
    "/compatibility",
    "/dream",
    "/privacy",
    "/terms",
    "/disclaimer",
    "/contact",
  ]);

  const navItems = [
    { href: "/#today", label: t("nav.today"), section: true },
    { href: "/#rewards", label: t("nav.rewards"), section: true },
    { href: "/readings", label: t("nav.history"), section: false },
    { href: "/me", label: t("nav.me"), section: false },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className="pointer-events-none fixed left-0 right-0 top-0 z-50 px-2 py-1.5 lg:px-5 lg:py-3"
    >
      <nav
        aria-label="Primary"
        className="pointer-events-auto relative mx-auto grid w-full max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-2 rounded-[18px] border px-2 py-1.5 lg:flex lg:items-center lg:gap-5 lg:rounded-full lg:px-4 lg:py-2"
        style={{
          background: isDark
            ? "rgba(12, 16, 28, 0.88)"
            : "rgba(255, 249, 239, 0.90)",
          borderColor: isDark
            ? "rgba(229, 205, 149, 0.26)"
            : "rgba(116, 89, 58, 0.14)",
          backdropFilter: "blur(24px) saturate(1.22)",
          WebkitBackdropFilter: "blur(24px) saturate(1.22)",
          boxShadow: isDark
            ? "0 16px 42px rgba(0, 0, 0, 0.24)"
            : "0 18px 44px rgba(80, 54, 42, 0.12)",
        }}
      >
        <Link
          href="/"
          aria-current={location === "/" ? "page" : undefined}
          data-active={location === "/" ? "true" : "false"}
          className="row-start-1 inline-flex w-fit min-w-0 shrink-0 justify-self-start items-center gap-2 rounded-[14px] border py-1 pl-1 pr-2.5 font-serif text-[18px] leading-none lg:gap-3 lg:rounded-full lg:py-1.5 lg:pl-1.5 lg:pr-4 lg:text-[24px]"
          style={{
            color: "var(--hint-text)",
            background: location === "/"
              ? isDark
                ? "rgba(241,166,107,0.12)"
                : "rgba(255,255,255,0.88)"
              : "transparent",
            borderColor: location === "/"
              ? isDark
                ? "rgba(241,166,107,0.35)"
                : "rgba(116,89,58,0.14)"
              : "transparent",
            boxShadow: location === "/"
              ? isDark
                ? "inset 0 0 0 1px rgba(255,250,242,0.08)"
                : "0 10px 22px rgba(80,54,42,0.08), inset 0 0 0 1px rgba(255,255,255,0.72)"
              : "none",
          }}
          aria-label={t("nav.homeAria")}
        >
          <HintLogo className="size-8 rounded-[10px] border border-white/25 shadow-[0_10px_24px_rgba(0,0,0,0.2)] lg:size-10 lg:rounded-[13px]" />
          Hint
        </Link>

        <div
          className="hidden min-w-0 rounded-[14px] border p-1 lg:flex lg:w-auto lg:flex-1 lg:justify-center lg:gap-2 lg:rounded-full"
          style={{
            background: isDark ? "rgba(255,255,255,0.055)" : "rgba(255,255,255,0.72)",
            borderColor: "var(--hint-border)",
          }}
        >
          {navItems.map((item) => {
            const active =
              item.href === "/#today"
                ? homeRelatedRoutes.has(location)
                : !item.section && (location === item.href || location.startsWith(`${item.href}/`));

            return (
              <NavItemLink key={item.href} href={item.href} active={active} isDark={isDark}>
                {item.label}
              </NavItemLink>
            );
          })}
        </div>

        <div className="col-start-3 row-start-1 flex shrink-0 items-center justify-self-end gap-2 lg:static lg:col-auto lg:row-auto lg:ml-0 lg:gap-3">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
            className="inline-grid size-9 place-items-center rounded-full border lg:hidden"
            style={{
              borderColor: "var(--hint-border)",
              color: "var(--hint-text)",
              background: "var(--hint-surface-soft)",
            }}
          >
            {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
          <HeaderControls bright={bright} onThemeToggle={onThemeToggle} />
          <Link
            href="/tarot"
            className="hidden h-12 items-center justify-center gap-2 rounded-full px-6 font-sans text-[14px] font-semibold lg:inline-flex"
            style={{
              color: "#fffaf2",
              background: isDark ? "#f1a66b" : "#292331",
              boxShadow: isDark ? "0 14px 28px rgba(241,166,107,0.18)" : "0 14px 28px rgba(41,35,49,0.14)",
            }}
          >
            {t("nav.openTarot")}
            <ArrowMark />
          </Link>
        </div>

        {menuOpen && (
          <div
            className="col-span-3 row-start-2 grid gap-1 rounded-[14px] border p-1 lg:hidden"
            style={{
              background: isDark ? "rgba(255,255,255,0.055)" : "rgba(255,255,255,0.72)",
              borderColor: "var(--hint-border)",
            }}
          >
            {navItems.map((item) => {
              const active =
                item.href === "/#today"
                  ? homeRelatedRoutes.has(location)
                  : !item.section && (location === item.href || location.startsWith(`${item.href}/`));

              return (
                <MobileNavItemLink
                  key={item.href}
                  href={item.href}
                  active={active}
                  isDark={isDark}
                  onNavigate={() => setMenuOpen(false)}
                >
                  {item.label}
                </MobileNavItemLink>
              );
            })}
          </div>
        )}
      </nav>
    </motion.div>
  );
}

function MobileNavItemLink({
  href,
  active,
  isDark,
  onNavigate,
  children,
}: {
  href: string;
  active: boolean;
  isDark: boolean;
  onNavigate: () => void;
  children: ReactNode;
}) {
  const className =
    "flex h-11 items-center justify-between rounded-[11px] px-4 font-sans text-[13px] font-semibold";
  const style = {
    color: active ? (isDark ? "#fffaf2" : "#241d18") : "var(--hint-text)",
    background: active
      ? isDark
        ? "linear-gradient(135deg, rgba(241,166,107,0.98), rgba(246,194,143,0.94))"
        : "linear-gradient(135deg, rgba(239,162,96,0.96), rgba(246,194,143,0.92))"
      : "transparent",
  };

  if (href.startsWith("/#")) {
    return (
      <a href={href} aria-current={active ? "page" : undefined} className={className} style={style} onClick={onNavigate}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={className} style={style} onClick={onNavigate}>
      {children}
    </Link>
  );
}

function NavItemLink({
  href,
  active,
  isDark,
  children,
}: {
  href: string;
  active: boolean;
  isDark: boolean;
  children: ReactNode;
}) {
  const className =
    "flex h-10 min-w-0 items-center justify-center rounded-[10px] px-1 text-center font-sans text-[11px] font-semibold leading-tight transition hover:-translate-y-0.5 active:translate-y-0 lg:h-10 lg:min-w-[82px] lg:rounded-full lg:px-3 lg:text-[13px] xl:min-w-[96px]";
  const style = {
    color: active ? (isDark ? "#fffaf2" : "#241d18") : "var(--hint-text)",
    background: active
      ? isDark
        ? "linear-gradient(135deg, rgba(241,166,107,0.98), rgba(246,194,143,0.94))"
        : "linear-gradient(135deg, rgba(239,162,96,0.96), rgba(246,194,143,0.92))"
      : "transparent",
    boxShadow: active
      ? isDark
        ? "0 10px 22px rgba(241,166,107,0.18), inset 0 0 0 1px rgba(255,250,242,0.22)"
        : "0 10px 22px rgba(224,146,80,0.22), inset 0 0 0 1px rgba(116,89,58,0.16)"
      : "none",
  };

  if (href.startsWith("/#")) {
    return (
      <a
        href={href}
        aria-current={active ? "page" : undefined}
        data-active={active ? "true" : "false"}
        className={className}
        style={style}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      data-active={active ? "true" : "false"}
      className={className}
      style={style}
    >
      {children}
    </Link>
  );
}

function HeaderControls({
  bright,
  onThemeToggle,
}: {
  bright: boolean;
  onThemeToggle: () => void;
}) {
  const { t } = useLanguage();

  return (
    <>
      <div
        className="hidden items-center gap-1 rounded-full border p-1 lg:flex"
        style={{
          background: bright ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.06)",
          borderColor: "var(--hint-border)",
        }}
      >
        <ThemePillButton active={bright} ariaLabel={t("theme.switchBright")} onClick={() => !bright && onThemeToggle()}>
          <Sun aria-hidden="true" className="size-4" />
        </ThemePillButton>
        <ThemePillButton active={!bright} ariaLabel={t("theme.switchDark")} onClick={() => bright && onThemeToggle()}>
          <Moon aria-hidden="true" className="size-4" />
        </ThemePillButton>
      </div>
      <button
        type="button"
        onClick={onThemeToggle}
        aria-label={bright ? t("theme.switchDark") : t("theme.switchBright")}
        className="grid size-9 place-items-center rounded-full border lg:hidden"
        style={{ borderColor: "var(--hint-border)", color: "var(--hint-text)", background: "var(--hint-surface-soft)" }}
      >
        {bright ? <Moon className="size-4" /> : <Sun className="size-4" />}
      </button>
    </>
  );
}

function ThemePillButton({
  active,
  ariaLabel,
  onClick,
  children,
}: {
  active: boolean;
  ariaLabel: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="grid size-9 place-items-center rounded-full transition"
      style={{
        background: active ? "linear-gradient(135deg, #efa260, #f6c28f)" : "transparent",
        color: active ? "#fffaf2" : "var(--hint-muted)",
        boxShadow: active ? "0 8px 18px rgba(224, 146, 80, 0.2)" : "none",
      }}
    >
      {children}
    </button>
  );
}

function ArrowMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 10h11" />
      <path d="m11 5 5 5-5 5" />
    </svg>
  );
}
