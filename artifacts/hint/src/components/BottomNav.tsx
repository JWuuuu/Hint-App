import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { ACCENT } from "../modules/hold/atmosphere";
import type { HintTheme } from "./app/theme";
import { LanguageToggle } from "./LanguageToggle";
import { useLanguage } from "../lib/i18n";
import { HintLogo } from "./app/HintLogo";

interface BottomNavProps {
  theme: HintTheme;
  onThemeToggle: () => void;
}

export function BottomNav({ theme, onThemeToggle }: BottomNavProps) {
  const [location] = useLocation();
  const { t } = useLanguage();
  const bright = theme === "bright";
  const ThemeIcon = bright ? Moon : Sun;

  const navItems = [
    { href: "/", label: t("nav.home") },
    { href: "/ask", label: t("nav.ask") },
    { href: "/readings", label: t("nav.readings") },
    { href: "/me", label: t("nav.me") },
  ];

  return (
    <motion.nav
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className="fixed inset-x-0 bottom-0 z-50 border-t px-4 pb-[max(env(safe-area-inset-bottom),0.5rem)] pointer-events-auto"
      style={{
        background: "rgba(8,11,20,0.74)",
        borderColor: "rgba(255,255,255,0.07)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
      }}
    >
      <div
          className="mx-auto flex min-h-[92px] w-full max-w-2xl flex-col gap-2 py-2"
        style={{
          color: "var(--hint-text)",
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <Link href="/" aria-label={t("nav.homeAria")} className="flex items-center">
            <HintLogo className="h-11 w-11 shadow-[0_10px_26px_rgba(8,18,36,0.16)]" />
          </Link>
          <HeaderControls
            bright={bright}
            onThemeToggle={onThemeToggle}
            ThemeIcon={ThemeIcon}
            switchLabel={bright ? t("theme.switchDark") : t("theme.switchBright")}
            themeLabel={bright ? t("theme.night") : t("theme.day")}
          />
        </div>

        <div className="flex min-w-0 items-center justify-around gap-3 overflow-x-auto">
          {navItems.map((item) => {
            const active = location === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex h-10 min-w-11 shrink-0 items-center justify-center font-sans text-[11px] font-medium tracking-[0.04em] transition-colors"
                style={{
                  color: active ? "var(--hint-text)" : "var(--hint-muted)",
                }}
              >
                <span
                  className="absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full transition-transform"
                  style={{
                    background: active ? "var(--hint-gold-bright)" : "transparent",
                    boxShadow: active ? "0 0 8px rgba(203,168,102,0.5)" : "none",
                    transform: active ? "translateX(-50%) scale(1)" : "translateX(-50%) scale(0)",
                  }}
                />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
}

function HeaderControls({
  bright,
  onThemeToggle,
  ThemeIcon,
  switchLabel,
  themeLabel,
}: {
  bright: boolean;
  onThemeToggle: () => void;
  ThemeIcon: typeof Moon;
  switchLabel: string;
  themeLabel: string;
}) {
  return (
    <div className="flex items-center gap-2 md:order-3">
      <LanguageToggle menuPlacement="bottom" />
      <button
        type="button"
        onClick={onThemeToggle}
        aria-label={switchLabel}
        title={switchLabel}
        className="inline-flex h-11 items-center gap-2 rounded-[8px] border px-3 font-serif text-[10px] uppercase tracking-[0.18em] transition-colors md:h-8"
        style={{
          color: "var(--hint-text)",
          background: "var(--hint-surface-soft)",
          borderColor: "var(--hint-border)",
        }}
      >
        <ThemeIcon size={14} strokeWidth={1.8} style={{ color: bright ? ACCENT.lavender : ACCENT.gold }} />
        {themeLabel}
      </button>
    </div>
  );
}
