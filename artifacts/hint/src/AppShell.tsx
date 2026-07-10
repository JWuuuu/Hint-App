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
const HINT_ONBOARDING_COMPLETE_STORAGE_KEY = "hint_onboarding_complete_v3";
const ENABLE_LAUNCH_INTRO = true;
const CREAM_STYLE_ROUTES = [
  "/app/daily",
  "/app/readings",
  "/readings",
  "/app/profile",
  "/app/astrology",
  "/app/collection",
  "/app/personalities",
] as const;

function hasLaunchIntroPreviewFlag(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("launchIntro") === "first";
}

function getLaunchIntroVariant(): LaunchIntroVariant {
  return "cinematic";
}

function isCreamStyleRoute(location: string): boolean {
  const pathname = location.split(/[?#]/, 1)[0]?.replace(/\/+$/, "") || "/";
  return CREAM_STYLE_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function onboardingOwnsScreen(): boolean {
  if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("onboarding") === "reset") return true;
  try {
    return window.localStorage.getItem(HINT_ONBOARDING_COMPLETE_STORAGE_KEY) !== "1";
  } catch {
    return true;
  }
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
  const creamStyleRoute = !referenceHomeRoute && isCreamStyleRoute(location);
  const showNav = isProductRoute && !onboardingOwnsScreen() && !NAV_HIDDEN_ROUTES.some(
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
        data-hint-cream-route={creamStyleRoute ? "true" : undefined}
        className={[
          "hint-app-shell-root fixed inset-0 overflow-hidden",
          creamStyleRoute ? "hint-cream-route" : "",
        ].join(" ")}
      >
        {!referenceHomeRoute && !creamStyleRoute ? (
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
          <AppNavigationChrome location={location} theme={theme} creamStyleRoute={creamStyleRoute} />
        ) : null}

        {ENABLE_LAUNCH_INTRO && isProductRoute && !referenceHomeRoute && !creamStyleRoute && showLaunchIntro ? (
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
  creamStyleRoute,
}: {
  location: string;
  theme: HintTheme;
  creamStyleRoute: boolean;
}) {
  const isDark = theme === "dark";
  const { t } = useLanguage();
  const referenceHome = location === "/app" || location === "/";
  const lightChrome = referenceHome || creamStyleRoute;
  const chromeSurface = referenceHome
    ? "linear-gradient(180deg, rgba(255,254,251,0.74), rgba(250,245,239,0.62))"
    : "var(--hint-dock-bg, var(--hint-nav-bg, var(--hint-liquid-panel)))";
  const chromeBorder = referenceHome
    ? "rgba(218,199,187,0.170)"
    : "var(--hint-dock-border, var(--hint-liquid-border, var(--hint-border)))";
  const chromeShadow = referenceHome
    ? "0 16px 36px rgba(102, 79, 67, 0.044), 0 5px 14px rgba(177,137,190,0.018), inset 0 1px 0 rgba(255,255,255,0.56), inset 0 -12px 22px rgba(129,91,111,0.012)"
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
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-[21px] pb-[calc(var(--hint-safe-bottom)+0.35rem)]"
    >
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-[calc(5.25rem+var(--hint-safe-bottom))]"
        style={{
          background: "var(--hint-dock-veil)",
        }}
      />
      <div
        className="hint-glass-nav hint-app-dock pointer-events-auto mx-auto grid h-[52px] w-full max-w-[var(--hint-app-width)] grid-cols-5 gap-1 overflow-visible rounded-[28px] border p-1.5"
        data-reference-home={referenceHome ? "true" : "false"}
        style={{
          background: chromeSurface,
          borderColor: chromeBorder,
          boxShadow: chromeShadow,
          backdropFilter: "blur(46px) saturate(1.75) brightness(1.06) contrast(1.02)",
          WebkitBackdropFilter: "blur(46px) saturate(1.75) brightness(1.06) contrast(1.02)",
        }}
      >
        {appTabs.map((tab) => (
          <AppTab
            key={tab.href}
            item={tab}
            active={isActiveAppTab(location, tab)}
            isDark={lightChrome ? false : isDark}
            referenceHome={lightChrome}
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

function HintAiMark({ active, referenceHome = false }: { active: boolean; referenceHome?: boolean }) {
  return (
    <span
      aria-hidden
      className={[
        "relative grid place-items-center overflow-hidden rounded-full",
        referenceHome ? "size-[54px]" : "size-[52px]",
      ].join(" ")}
      style={{
        background: active
          ? "radial-gradient(circle at 34% 20%, rgba(255,244,252,0.94), rgba(204,164,211,0.64) 40%, rgba(128,92,145,0.88) 100%)"
          : "radial-gradient(circle at 34% 20%, rgba(255,243,252,0.90), rgba(207,163,216,0.56) 42%, rgba(132,98,151,0.80) 100%)",
        color: "#fff8f4",
        boxShadow:
          "0 0 0 5px rgba(255,255,255,0.52), 0 11px 22px rgba(105,77,120,0.105), 0 0 24px rgba(195,145,206,0.12), inset 0 1px 0 rgba(255,255,255,0.54), inset 0 -10px 20px rgba(63,38,83,0.085), inset 0 0 0 1px rgba(255,255,255,0.34)",
      }}
    >
      <span
        aria-hidden
        className="absolute inset-[6px] rounded-full border"
        style={{ borderColor: "rgba(255,255,255,0.34)" }}
      />
      <Sparkles size={25} strokeWidth={1.6} />
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
        featured ? "h-[52px] overflow-visible rounded-[26px]" : "h-[52px] gap-0.5 rounded-[26px]",
      ].join(" ")}
      style={{
        color: featured
          ? "var(--hint-special-action-text)"
          : active
            ? isDark ? "#f8f1e8" : "#3f3a44"
            : isDark ? "rgba(248,241,232,0.62)" : "#807982",
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
        <span className={[
          "hint-app-tab-orb pointer-events-none absolute left-1/2 -translate-x-1/2",
          referenceHome ? "top-[-18px]" : "top-[-25px]",
        ].join(" ")}>
          <HintAiMark active={active} referenceHome={referenceHome} />
        </span>
      ) : (
        <Icon className="size-[21px] shrink-0" strokeWidth={active ? 2.05 : 1.65} />
      )}
      {featured && referenceHome ? (
        <span className="sr-only">{item.label}</span>
      ) : (
        <span
          className={[
            "hint-app-tab-label max-w-full truncate font-sans font-medium leading-none",
            featured ? "absolute inset-x-0 bottom-[4px] text-[10px]" : "text-[11px]",
          ].join(" ")}
        >
          {item.label}
        </span>
      )}
    </Link>
  );
}

function isActiveAppTab(location: string, tab: AppTabItem) {
  if (tab.exact) return location === "/app" || location === "/";
  return location === tab.href || location.startsWith(`${tab.href}/`);
}
