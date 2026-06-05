import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Moon, Sun } from "lucide-react";
import {
  PointerProvider,
  RoomLight,
  Particles,
  Vignette,
  Grain,
  Haze,
  Moonlight,
} from "./modules/hold/atmosphere";
import { BottomNav } from "./components/BottomNav";
import { LanguageToggle } from "./components/LanguageToggle";
import { CelestialBackdrop } from "./components/app/CelestialBackdrop";
import { HintLogo } from "./components/app/HintLogo";
import { trackEvent } from "./lib/analytics";
import {
  getInitialHintTheme,
  HINT_THEME_STORAGE_KEY,
  type HintTheme,
} from "./components/app/theme";
import { useLanguage } from "./lib/i18n";

/** Immersive room routes own the full screen (their own back link + pinned
 *  inputs), so the global bottom nav is hidden there. */
const IMMERSIVE_ROUTES = ["/tarot", "/ask"];

/**
 * AppShell — the persistent room. Atmosphere is mounted once at the app
 * level so routes can crossfade without the particles/moonlight resetting.
 * Children are placed above the atmosphere on z-20.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [theme, setTheme] = useState<HintTheme>(getInitialHintTheme);
  const showNav = !IMMERSIVE_ROUTES.some(
    (r) => location === r || location.startsWith(r + "/"),
  );
  const showWebsiteNav = false;

  useEffect(() => {
    trackEvent("app_opened", {
      route: location,
      theme,
    });
    // Track one app open per page load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.dataset.hintTheme = theme;
    document.documentElement.classList.toggle("dark", theme === "dark");

    try {
      window.localStorage.setItem(HINT_THEME_STORAGE_KEY, theme);
    } catch {
      // Local storage can be unavailable in private browsing.
    }
  }, [theme]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
    document.querySelectorAll(".overflow-y-auto").forEach((element) => {
      if (element instanceof HTMLElement) {
        element.scrollTo({ top: 0, left: 0 });
      }
    });
  }, [location]);

  const toggleTheme = () => {
    setTheme((current) => (current === "dark" ? "bright" : "dark"));
  };

  return (
    <PointerProvider>
      <div
        data-hint-theme={theme}
        className="fixed inset-0 overflow-hidden"
      >
        {/* Atmosphere stack — back to front */}
        <CelestialBackdrop theme={theme} />
        <Moonlight />
        <Haze />
        <Particles />
        <RoomLight />
        <Vignette />
        <Grain />

        {/* Route content sits above the atmosphere.
            Pages own their own scroll model — AppShell does not impose
            one, so chat-style pages can pin an input to the bottom while
            scrollable pages (like the home dashboard) handle their own
            overflow. */}
        <div className="absolute inset-0 z-20">
          {children}
        </div>

        {showWebsiteNav ? (
          <WebsiteHomeNav theme={theme} onThemeSelect={setTheme} />
        ) : showNav ? (
          <BottomNav theme={theme} onThemeToggle={toggleTheme} />
        ) : (
          <div className="fixed right-5 top-5 z-50">
            <LanguageToggle menuPlacement="bottom" />
          </div>
        )}
      </div>
    </PointerProvider>
  );
}

function WebsiteHomeNav({
  theme,
  onThemeSelect,
}: {
  theme: HintTheme;
  onThemeSelect: (theme: HintTheme) => void;
}) {
  const isDark = theme === "dark";

  return (
    <div className="pointer-events-none fixed left-0 right-0 top-0 z-50 px-3 py-3 sm:px-5">
      <nav
        aria-label="Primary"
        className="pointer-events-auto mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 rounded-[999px] border px-3 py-2 sm:flex-nowrap sm:gap-5 sm:px-4"
        style={{
          background: isDark
            ? "rgba(12, 16, 28, 0.78)"
            : "rgba(255, 249, 239, 0.78)",
          borderColor: isDark
            ? "rgba(229, 205, 149, 0.22)"
            : "rgba(255,255,255,0.84)",
          backdropFilter: "blur(24px) saturate(1.22)",
          WebkitBackdropFilter: "blur(24px) saturate(1.22)",
          boxShadow: isDark
            ? "0 16px 42px rgba(0, 0, 0, 0.24)"
            : "0 18px 44px rgba(80, 54, 42, 0.12)",
        }}
      >
        <Link
          href="/"
          className="order-1 inline-flex shrink-0 items-center gap-3 rounded-full pr-2 font-serif text-[22px] leading-none sm:order-none sm:text-[24px]"
          style={{ color: "var(--hint-text)" }}
          aria-label="Hint home"
        >
          <HintLogo className="size-10 rounded-[13px] border border-white/25 shadow-[0_10px_24px_rgba(0,0,0,0.2)]" />
          Hint
        </Link>

        <div className="order-3 flex w-full min-w-0 items-center gap-2 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:order-none sm:w-auto sm:flex-1 sm:justify-center sm:gap-6">
          <HomeNavLink href="#today">
            Today
          </HomeNavLink>
          <HomeNavLink href="#your-card">
            Your card
          </HomeNavLink>
          <HomeNavLink href="#signals">
            Signals
          </HomeNavLink>
          <HomeNavLink href="#rewards">
            Rewards
          </HomeNavLink>
        </div>

        <div className="order-2 ml-auto flex shrink-0 items-center gap-3 sm:order-none sm:ml-0">
          <div
            className="hidden items-center gap-1 rounded-full border p-1 sm:flex"
            style={{
              background: isDark
                ? "rgba(255,255,255,0.06)"
                : "rgba(255,255,255,0.72)",
              borderColor: "var(--hint-border)",
            }}
          >
            <ThemePillButton active={!isDark} label="Day" onClick={() => onThemeSelect("bright")}>
              <Sun aria-hidden="true" className="size-4" />
            </ThemePillButton>
            <ThemePillButton active={isDark} label="Night" onClick={() => onThemeSelect("dark")}>
              <Moon aria-hidden="true" className="size-4" />
            </ThemePillButton>
          </div>
          <button
            type="button"
            onClick={() => onThemeSelect(isDark ? "bright" : "dark")}
            aria-label={isDark ? "Switch to day mode" : "Switch to night mode"}
            className="grid size-10 place-items-center rounded-full border sm:hidden"
            style={{ borderColor: "var(--hint-border)", color: "var(--hint-text)", background: "var(--hint-surface-soft)" }}
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <Link
            href="/tarot"
            className="hidden h-12 items-center justify-center gap-2 rounded-full px-6 font-sans text-[14px] font-semibold sm:inline-flex"
            style={{
              color: "#fffaf2",
              background: isDark ? "#f1a66b" : "#292331",
              boxShadow: isDark ? "0 14px 28px rgba(241,166,107,0.18)" : "0 14px 28px rgba(41,35,49,0.14)",
            }}
          >
            Open app
            <ArrowMark />
          </Link>
        </div>
      </nav>
    </div>
  );
}

function HomeNavLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className="shrink-0 rounded-full px-2 py-2 font-sans text-[13px] font-semibold transition hover:-translate-y-0.5 active:translate-y-0"
      style={{
        color: "var(--hint-muted)",
      }}
    >
      {children}
    </a>
  );
}

function ThemePillButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Switch to ${label.toLowerCase()} mode`}
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
