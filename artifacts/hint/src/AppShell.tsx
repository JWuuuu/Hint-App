import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, Moon, Sun, X } from "lucide-react";
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
  const showWebsiteNav = location === "/";
  const showImmersiveLanguage = !(
    location === "/tarot" || location.startsWith("/tarot/")
  );

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
        ) : showImmersiveLanguage ? (
          <div className="fixed right-5 top-5 z-50">
            <LanguageToggle menuPlacement="bottom" />
          </div>
        ) : null}
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
  const [activeHash, setActiveHash] = useState(() =>
    typeof window === "undefined" ? "#today" : window.location.hash || "#today",
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const homeNavItems = [
    { href: "#today", label: "Today", section: true },
    { href: "#your-card", label: "Your card", section: true },
    { href: "#signals", label: "Signals", section: true },
    { href: "#rewards", label: "Rewards", section: true },
    { href: "/readings", label: "Readings", section: false },
    { href: "/me", label: "Me", section: false },
  ];

  useEffect(() => {
    const updateActiveHash = () => {
      setActiveHash(window.location.hash || "#today");
      setMenuOpen(false);
    };

    updateActiveHash();
    window.addEventListener("hashchange", updateActiveHash);
    return () => window.removeEventListener("hashchange", updateActiveHash);
  }, []);

  return (
    <div className="pointer-events-none fixed left-0 right-0 top-0 z-50 px-2 py-1.5 lg:px-5 lg:py-3">
      <nav
        aria-label="Primary"
        className="pointer-events-auto relative mx-auto grid w-full max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-2 rounded-[18px] border px-2 py-1.5 lg:flex lg:gap-5 lg:rounded-full lg:px-4 lg:py-2"
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
          aria-current="page"
          data-active="true"
          className="row-start-1 inline-flex w-fit min-w-0 shrink-0 justify-self-start items-center gap-2 rounded-[14px] border py-1 pl-1 pr-2.5 font-serif text-[18px] leading-none lg:gap-3 lg:rounded-full lg:py-1.5 lg:pl-1.5 lg:pr-4 lg:text-[24px]"
          style={{
            color: "var(--hint-text)",
            background: isDark ? "rgba(241,166,107,0.12)" : "rgba(255,255,255,0.88)",
            borderColor: isDark ? "rgba(241,166,107,0.35)" : "rgba(116,89,58,0.14)",
            boxShadow: isDark
              ? "inset 0 0 0 1px rgba(255,250,242,0.08)"
              : "0 10px 22px rgba(80,54,42,0.08), inset 0 0 0 1px rgba(255,255,255,0.72)",
          }}
          aria-label="Hint home"
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
          {homeNavItems.map((item) => (
            <HomeNavLink
              key={item.href}
              href={item.href}
              active={item.section && activeHash === item.href}
              isDark={isDark}
            >
              {item.label}
            </HomeNavLink>
          ))}
        </div>

        <div className="col-start-3 row-start-1 flex shrink-0 items-center justify-self-end gap-2 lg:static lg:col-auto lg:row-auto lg:ml-0 lg:gap-3">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="inline-grid size-9 place-items-center rounded-full border lg:hidden"
            style={{
              borderColor: "var(--hint-border)",
              color: "var(--hint-text)",
              background: "var(--hint-surface-soft)",
            }}
          >
            {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
          <div
            className="hidden items-center gap-1 rounded-full border p-1 lg:flex"
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
            className="grid size-9 place-items-center rounded-full border lg:hidden"
            style={{ borderColor: "var(--hint-border)", color: "var(--hint-text)", background: "var(--hint-surface-soft)" }}
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <Link
            href="/tarot"
            className="hidden h-12 items-center justify-center gap-2 rounded-full px-6 font-sans text-[14px] font-semibold lg:inline-flex"
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

        {menuOpen && (
          <div
            className="col-span-3 row-start-2 grid gap-1 rounded-[14px] border p-1 lg:hidden"
            style={{
              background: isDark ? "rgba(255,255,255,0.055)" : "rgba(255,255,255,0.72)",
              borderColor: "var(--hint-border)",
            }}
          >
            {homeNavItems.map((item) => (
              <MobileHomeNavLink
                key={item.href}
                href={item.href}
                active={item.section && activeHash === item.href}
                isDark={isDark}
                onNavigate={() => setMenuOpen(false)}
              >
                {item.label}
              </MobileHomeNavLink>
            ))}
          </div>
        )}
      </nav>
    </div>
  );
}

function HomeNavLink({
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
  return (
    <HomeNavAnchor href={href} active={active} isDark={isDark}>
      {children}
    </HomeNavAnchor>
  );
}

function MobileHomeNavLink({
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

  if (href.startsWith("/")) {
    return (
      <Link href={href} data-active="false" className={className} style={style} onClick={onNavigate}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} aria-current={active ? "page" : undefined} className={className} style={style} onClick={onNavigate}>
      {children}
    </a>
  );
}

function HomeNavAnchor({
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
    "flex h-9 min-w-[88px] shrink-0 items-center justify-center rounded-[10px] px-3 text-center font-sans text-[12px] font-semibold leading-tight transition hover:-translate-y-0.5 active:translate-y-0 sm:min-w-0 sm:px-1 sm:text-[11px] md:h-10 md:min-w-[82px] md:rounded-full md:px-3 md:text-[13px] lg:min-w-[96px]";
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

  if (href.startsWith("/")) {
    return (
      <Link href={href} data-active="false" className={className} style={style}>
        {children}
      </Link>
    );
  }

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
