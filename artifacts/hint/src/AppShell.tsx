import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  CalendarDays,
  History,
  Home,
  Sparkles,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import {
  PointerProvider,
  RoomLight,
  Particles,
  Vignette,
  Grain,
  Haze,
  Moonlight,
} from "./modules/hold/atmosphere";
import { AppLaunchIntro } from "./components/app/AppLaunchIntro";
import type { LaunchIntroVariant } from "./components/app/AppLaunchIntro";
import { CelestialBackdrop } from "./components/app/CelestialBackdrop";
import { trackEvent } from "./lib/analytics";
import {
  getInitialHintTheme,
  HINT_THEME_STORAGE_KEY,
  type HintTheme,
} from "./components/app/theme";
import {
  getHintPreferences,
  HINT_PREFERENCES_UPDATED_EVENT,
} from "./lib/preferences";
import { useLanguage } from "./lib/i18n";
import { triggerFeedback } from "./lib/feedback";

/** Full-screen flows own their navigation, so the global bottom nav is hidden there. */
const NAV_HIDDEN_ROUTES = ["/tarot", "/ask", "/login", "/app/tarot", "/app/ask", "/app/login"];
const HINT_LAUNCH_SEEN_STORAGE_KEY = "hint_launch_seen_v2";
const ENABLE_LAUNCH_INTRO = true;

function hasLaunchIntroPreviewFlag(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("launchIntro") === "first";
}

function getLaunchIntroVariant(): LaunchIntroVariant {
  return "cinematic";
}

/**
 * AppShell — the persistent room. Atmosphere is mounted once at the app
 * level so routes can crossfade without the particles/moonlight resetting.
 * Children are placed above the atmosphere on z-20.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [theme, setTheme] = useState<HintTheme>(getInitialHintTheme);
  const [reduceMotion, setReduceMotion] = useState(
    () => getHintPreferences().reduceMotion,
  );
  const [isFirstLaunch, setIsFirstLaunch] = useState(() => {
    if (typeof window === "undefined") return false;
    if (hasLaunchIntroPreviewFlag()) return true;
    try {
      return window.localStorage.getItem(HINT_LAUNCH_SEEN_STORAGE_KEY) !== "1";
    } catch {
      return true;
    }
  });
  const [showLaunchIntro, setShowLaunchIntro] = useState(true);
  const [launchIntroLeaving, setLaunchIntroLeaving] = useState(false);
  const [launchIntroRunKey, setLaunchIntroRunKey] = useState(0);
  const isLaunchIntroPreview = hasLaunchIntroPreviewFlag();
  const launchIntroVariant = getLaunchIntroVariant();
  const isProductRoute = !["/privacy", "/terms", "/disclaimer", "/contact", "/about"].includes(location);
  const showNav = isProductRoute && !NAV_HIDDEN_ROUTES.some(
    (r) => location === r || location.startsWith(r + "/"),
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
    document.documentElement.dataset.hintReduceMotion = reduceMotion ? "true" : "false";
  }, [reduceMotion]);

  useEffect(() => {
    const syncPreferences = () => {
      setTheme(getInitialHintTheme());
      setReduceMotion(getHintPreferences().reduceMotion);
    };

    window.addEventListener(HINT_PREFERENCES_UPDATED_EVENT, syncPreferences);
    window.addEventListener("storage", syncPreferences);
    return () => {
      window.removeEventListener(HINT_PREFERENCES_UPDATED_EVENT, syncPreferences);
      window.removeEventListener("storage", syncPreferences);
    };
  }, []);

  useEffect(() => {
    if (!hasLaunchIntroPreviewFlag()) return;
    setIsFirstLaunch(true);
    setLaunchIntroLeaving(false);
    setShowLaunchIntro(true);
    setLaunchIntroRunKey((key) => key + 1);
  }, [location]);

  useEffect(() => {
    if (!showLaunchIntro) return;

    const shouldReduceLaunchMotion = reduceMotion && !isLaunchIntroPreview;
    const leaveAfter = shouldReduceLaunchMotion ? 360 : isLaunchIntroPreview ? 4240 : isFirstLaunch ? 2580 : 1920;
    const hideAfter = shouldReduceLaunchMotion ? 520 : isLaunchIntroPreview ? 4680 : isFirstLaunch ? 2820 : 2140;
    const leaveTimer = window.setTimeout(() => setLaunchIntroLeaving(true), leaveAfter);
    const hideTimer = window.setTimeout(() => setShowLaunchIntro(false), hideAfter);
    try {
      window.localStorage.setItem(HINT_LAUNCH_SEEN_STORAGE_KEY, "1");
    } catch {
      // Local storage can be unavailable in private browsing.
    }

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(hideTimer);
    };
  }, [isFirstLaunch, isLaunchIntroPreview, launchIntroRunKey, reduceMotion, showLaunchIntro]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
    document.querySelectorAll(".overflow-y-auto").forEach((element) => {
      if (element instanceof HTMLElement) {
        element.scrollTo({ top: 0, left: 0 });
      }
    });
  }, [location]);

  return (
    <PointerProvider>
      <div
        data-hint-theme={theme}
        className="hint-app-shell-root fixed inset-0 overflow-hidden"
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

        {showNav ? (
          <AppNavigationChrome location={location} theme={theme} />
        ) : null}

        {ENABLE_LAUNCH_INTRO && isProductRoute && showLaunchIntro ? (
          <AppLaunchIntro
            theme={theme}
            leaving={launchIntroLeaving}
            firstLaunch={isFirstLaunch}
            preview={isLaunchIntroPreview}
            variant={launchIntroVariant}
          />
        ) : null}
      </div>
    </PointerProvider>
  );
}

function AppNavigationChrome({
  location,
  theme,
}: {
  location: string;
  theme: HintTheme;
}) {
  const isDark = theme === "dark";
  const { t } = useLanguage();
  const chromeSurface = "var(--hint-dock-bg, var(--hint-nav-bg, var(--hint-liquid-panel)))";
  const chromeBorder = "var(--hint-dock-border, var(--hint-liquid-border, var(--hint-border)))";
  const chromeShadow = "var(--hint-dock-shadow, var(--hint-nav-shadow, var(--hint-liquid-shadow)))";
  const appTabs: AppTabItem[] = [
    { href: "/app", label: t("nav.today"), icon: Home, exact: true },
    { href: "/app/daily", label: t("nav.daily"), icon: CalendarDays },
    { href: "/app/ask", label: "Ask", icon: Sparkles, featured: true },
    { href: "/app/readings", label: t("nav.history"), icon: History },
    { href: "/app/profile", label: t("me.settings"), icon: UserRound },
  ];
  return (
    <nav
      aria-label="App"
      data-app-tabbar
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-2 pb-[calc(var(--hint-safe-bottom)+0.625rem)] sm:px-4"
    >
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-[calc(5.75rem+var(--hint-safe-bottom))]"
        style={{
          background: "var(--hint-dock-veil)",
        }}
      />
      <div
        className="hint-glass-nav hint-app-dock pointer-events-auto mx-auto grid h-[72px] w-full max-w-[var(--hint-app-width)] grid-cols-5 gap-1 rounded-[30px] border p-1.5"
        style={{
          background: chromeSurface,
          borderColor: chromeBorder,
          boxShadow: chromeShadow,
          backdropFilter: "blur(46px) saturate(1.85) brightness(1.06) contrast(1.03)",
          WebkitBackdropFilter: "blur(46px) saturate(1.85) brightness(1.06) contrast(1.03)",
        }}
      >
        {appTabs.map((tab) => (
          <AppTab key={tab.href} item={tab} active={isActiveAppTab(location, tab)} isDark={isDark} />
        ))}
      </div>
    </nav>
  );
}

type AppTabItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  featured?: boolean;
};

function HintAiMark({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden
      className="grid size-[22px] place-items-center rounded-[9px] font-serif text-[13px] font-black leading-none"
      style={{
        background: active
          ? "linear-gradient(135deg, rgba(255,255,255,0.72), rgba(255,255,255,0.26))"
          : "linear-gradient(135deg, rgba(255,255,255,0.64), rgba(255,255,255,0.20))",
        color: "var(--hint-special-action-text)",
        boxShadow:
          "inset 0 0 0 1px rgba(255,255,255,0.62), 0 5px 14px color-mix(in srgb, var(--hint-rose, #cf4f92) 16%, transparent)",
      }}
    >
      H
    </span>
  );
}

function AppTab({ item, active, isDark }: { item: AppTabItem; active: boolean; isDark: boolean }) {
  const Icon = item.icon;
  const featured = item.featured === true;
  const featuredActive = featured && active;
  const featuredBackground = isDark
    ? "linear-gradient(135deg, rgba(255,241,247,0.76) 0%, rgba(243,169,202,0.56) 40%, rgba(203,189,244,0.50) 70%, rgba(185,223,220,0.48) 100%)"
    : "linear-gradient(135deg, rgba(255,244,203,0.72) 0%, rgba(255,196,220,0.60) 40%, rgba(212,201,247,0.54) 70%, rgba(176,235,229,0.50) 100%)";
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      data-active={active ? "true" : "false"}
      data-featured={featured ? "true" : "false"}
      onPointerDown={() => triggerFeedback(featured ? "select" : "tap")}
      className="hint-app-tab hint-pressable hint-tap-sparkle relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-[23px] px-1 text-center transition hover:-translate-y-0.5 active:scale-[0.98]"
      style={{
        color: featured
          ? "var(--hint-special-action-text)"
          : active
            ? "var(--hint-text)"
            : "var(--hint-muted)",
        background: featured
          ? featuredBackground
          : active
          ? isDark
            ? "linear-gradient(145deg, rgba(255,255,255,0.16), rgba(255,255,255,0.06) 58%, rgba(185,223,220,0.08))"
            : "linear-gradient(145deg, rgba(255,255,255,0.58), rgba(255,255,255,0.24) 58%, rgba(232,249,247,0.20))"
          : "transparent",
        border: featured || active ? "1px solid color-mix(in srgb, var(--hint-liquid-highlight) 72%, var(--hint-special-action-border, transparent))" : "1px solid transparent",
        boxShadow: featured
          ? featuredActive
            ? "0 16px 38px color-mix(in srgb, var(--hint-rose, #cf4f92) 24%, transparent), 0 6px 18px color-mix(in srgb, var(--hint-aqua, #b9dfdc) 12%, transparent), inset 0 1px 1px rgba(255,255,255,0.72), inset 0 -10px 18px rgba(255,255,255,0.12), inset 0 0 0 1px color-mix(in srgb, var(--hint-special-action-border) 72%, white)"
            : "0 13px 30px color-mix(in srgb, var(--hint-rose, #cf4f92) 18%, transparent), 0 4px 14px color-mix(in srgb, var(--hint-aqua, #b9dfdc) 10%, transparent), inset 0 1px 1px rgba(255,255,255,0.66), inset 0 -8px 16px rgba(255,255,255,0.10), inset 0 0 0 1px color-mix(in srgb, var(--hint-special-action-border) 64%, white)"
          : active
          ? "0 14px 30px color-mix(in srgb, var(--hint-gold, #cba866) 10%, transparent), 0 5px 18px color-mix(in srgb, var(--hint-plum, #302238) 8%, transparent), inset 0 1px 1px rgba(255,255,255,0.72), inset 0 -8px 16px rgba(82,64,92,0.05), inset 0 0 0 1px color-mix(in srgb, var(--hint-liquid-highlight) 62%, transparent)"
          : "none",
        filter: featured && !featuredActive ? "saturate(0.96) brightness(1.01)" : undefined,
        backdropFilter: active || featured ? "blur(30px) saturate(1.52) brightness(1.04)" : undefined,
        WebkitBackdropFilter: active || featured ? "blur(30px) saturate(1.52) brightness(1.04)" : undefined,
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-2 top-1 h-px rounded-full opacity-80"
        style={{ background: active ? "linear-gradient(90deg, transparent, rgba(255,255,255,0.58), transparent)" : "transparent" }}
      />
      {featured ? (
        <HintAiMark active={active} />
      ) : (
        <Icon className="size-[18px] shrink-0" strokeWidth={active ? 2.35 : 1.9} />
      )}
      <span className="max-w-full truncate font-sans text-[9.5px] font-black leading-none sm:text-[10px]">
        {item.label}
      </span>
    </Link>
  );
}

function isActiveAppTab(location: string, tab: AppTabItem) {
  if (tab.exact) return location === "/app" || location === "/";
  return location === tab.href || location.startsWith(`${tab.href}/`);
}
