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
  const referenceHomeRoute = location === "/app" || location === "/";
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
        {!referenceHomeRoute ? (
          <>
            {/* Atmosphere stack — back to front */}
            <CelestialBackdrop theme={theme} />
            <Moonlight />
            <Haze />
            <Particles />
            <RoomLight />
            <Vignette />
            <Grain />
          </>
        ) : null}

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

        {ENABLE_LAUNCH_INTRO && isProductRoute && !referenceHomeRoute && showLaunchIntro ? (
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
  const referenceHome = location === "/app" || location === "/";
  const chromeSurface = referenceHome
    ? "linear-gradient(180deg, rgba(255,254,251,0.66), rgba(250,244,238,0.50))"
    : "var(--hint-dock-bg, var(--hint-nav-bg, var(--hint-liquid-panel)))";
  const chromeBorder = referenceHome
    ? "rgba(218,199,187,0.22)"
    : "var(--hint-dock-border, var(--hint-liquid-border, var(--hint-border)))";
  const chromeShadow = referenceHome
    ? "0 12px 32px rgba(102, 79, 67, 0.042), 0 3px 12px rgba(177,137,190,0.018), inset 0 1px 0 rgba(255,255,255,0.48), inset 0 -16px 28px rgba(129,91,111,0.010)"
    : "var(--hint-dock-shadow, var(--hint-nav-shadow, var(--hint-liquid-shadow)))";
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
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-6 pb-[calc(var(--hint-safe-bottom)+0.5rem)]"
    >
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-[calc(4.75rem+var(--hint-safe-bottom))]"
        style={{
          background: "var(--hint-dock-veil)",
        }}
      />
      <div
        className="hint-glass-nav hint-app-dock pointer-events-auto mx-auto grid h-[66px] w-full max-w-[var(--hint-app-width)] grid-cols-5 gap-1 overflow-visible rounded-[33px] border p-1.5"
        data-reference-home={referenceHome ? "true" : "false"}
        style={{
          background: chromeSurface,
          borderColor: chromeBorder,
          boxShadow: chromeShadow,
          backdropFilter: "blur(50px) saturate(1.9) brightness(1.07) contrast(1.03)",
          WebkitBackdropFilter: "blur(50px) saturate(1.9) brightness(1.07) contrast(1.03)",
        }}
      >
        {appTabs.map((tab) => (
          <AppTab
            key={tab.href}
            item={tab}
            active={isActiveAppTab(location, tab)}
            isDark={referenceHome ? false : isDark}
            referenceHome={referenceHome}
          />
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
      className="relative grid size-[58px] place-items-center overflow-hidden rounded-full"
      style={{
        background: active
          ? "radial-gradient(circle at 34% 20%, rgba(255,244,252,0.96), rgba(205,158,215,0.68) 38%, rgba(117,82,140,0.96) 100%)"
          : "radial-gradient(circle at 34% 20%, rgba(255,243,252,0.90), rgba(203,157,212,0.60) 40%, rgba(125,91,148,0.92) 100%)",
        color: "#fff8f4",
        boxShadow:
          "0 0 0 5px rgba(255,255,255,0.58), 0 14px 30px rgba(105,77,120,0.22), inset 0 1px 0 rgba(255,255,255,0.58), inset 0 -10px 20px rgba(63,38,83,0.16), inset 0 0 0 1px rgba(255,255,255,0.40)",
      }}
    >
      <span
        aria-hidden
        className="absolute inset-[6px] rounded-full border"
        style={{ borderColor: "rgba(255,255,255,0.34)" }}
      />
      <Sparkles size={28} strokeWidth={1.65} />
    </span>
  );
}

function AppTab({
  item,
  active,
  isDark,
  referenceHome,
}: {
  item: AppTabItem;
  active: boolean;
  isDark: boolean;
  referenceHome: boolean;
}) {
  const Icon = item.icon;
  const featured = item.featured === true;
  const glassLift = featured || (active && !referenceHome);
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      data-active={active ? "true" : "false"}
      data-featured={featured ? "true" : "false"}
      onPointerDown={() => triggerFeedback(featured ? "select" : "tap")}
      className={[
        "hint-app-tab hint-pressable hint-tap-sparkle relative flex min-w-0 flex-col items-center justify-center px-1 text-center transition hover:-translate-y-0.5 active:scale-[0.98]",
        featured ? "h-[54px] overflow-visible rounded-[24px]" : "h-[54px] gap-1 rounded-[24px]",
      ].join(" ")}
      style={{
        color: featured
          ? "var(--hint-special-action-text)"
          : active
            ? isDark ? "#f8f1e8" : "#29252e"
            : isDark ? "rgba(248,241,232,0.62)" : "#7b747a",
        background: "transparent",
        border: "1px solid transparent",
        boxShadow: "none",
        filter: featured && !active ? "saturate(0.96) brightness(1.01)" : undefined,
        backdropFilter: glassLift ? "blur(30px) saturate(1.52) brightness(1.04)" : undefined,
        WebkitBackdropFilter: glassLift ? "blur(30px) saturate(1.52) brightness(1.04)" : undefined,
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-2 top-1 h-px rounded-full opacity-80"
        style={{ background: active ? "linear-gradient(90deg, transparent, rgba(255,255,255,0.58), transparent)" : "transparent" }}
      />
      {featured ? (
        <span className="hint-app-tab-orb pointer-events-none absolute left-1/2 top-[-30px] -translate-x-1/2">
          <HintAiMark active={active} />
        </span>
      ) : (
        <Icon className="size-[21px] shrink-0" strokeWidth={active ? 2.35 : 1.9} />
      )}
      <span
        className={[
          "hint-app-tab-label max-w-full truncate font-sans font-black leading-none",
          featured ? "absolute inset-x-0 bottom-[4px] text-[10px]" : "text-[11px]",
        ].join(" ")}
      >
        {item.label}
      </span>
    </Link>
  );
}

function isActiveAppTab(location: string, tab: AppTabItem) {
  if (tab.exact) return location === "/app" || location === "/";
  return location === tab.href || location.startsWith(`${tab.href}/`);
}
