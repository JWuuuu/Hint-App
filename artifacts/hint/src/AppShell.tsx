import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  CalendarDays,
  Home,
  Library,
  LogIn,
  LogOut,
  MessageCircle,
  Moon,
  Orbit,
  Settings,
  Sparkles,
  Sun,
  UserPlus,
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
import { LanguageToggle } from "./components/LanguageToggle";
import { AppLaunchIntro } from "./components/app/AppLaunchIntro";
import { CelestialBackdrop } from "./components/app/CelestialBackdrop";
import { HintLogo } from "./components/app/HintLogo";
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
import { clearLocalAccount, useLocalAccount } from "./lib/auth";
import { useProfile } from "./lib/useProfile";
import { readBirthProfile } from "./lib/astro/userBirthProfile";
import { useLanguage } from "./lib/i18n";
import type { BirthProfile } from "./types/astrology";

/** Immersive room routes own the full screen (their own back link + pinned
 *  inputs), so the global bottom nav is hidden there. */
const IMMERSIVE_ROUTES = ["/tarot", "/ask", "/app/tarot", "/app/ask"];

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
  const [showLaunchIntro, setShowLaunchIntro] = useState(true);
  const [launchIntroLeaving, setLaunchIntroLeaving] = useState(false);
  const isProductRoute = !["/privacy", "/terms", "/disclaimer", "/contact", "/about"].includes(location);
  const showNav = isProductRoute && !IMMERSIVE_ROUTES.some(
    (r) => location === r || location.startsWith(r + "/"),
  );
  const showImmersiveLanguage = !(
    location === "/tarot" ||
    location.startsWith("/tarot/") ||
    location === "/app/tarot" ||
    location.startsWith("/app/tarot/")
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
    const leaveAfter = reduceMotion ? 360 : 2180;
    const hideAfter = reduceMotion ? 520 : 2740;
    const leaveTimer = window.setTimeout(() => setLaunchIntroLeaving(true), leaveAfter);
    const hideTimer = window.setTimeout(() => setShowLaunchIntro(false), hideAfter);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(hideTimer);
    };
  }, [reduceMotion]);

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
          <AppNavigationChrome location={location} theme={theme} onThemeSelect={setTheme} />
        ) : showImmersiveLanguage ? (
          <div className="fixed right-5 top-5 z-50">
            <LanguageToggle menuPlacement="bottom" />
          </div>
        ) : null}

        {isProductRoute && showLaunchIntro ? (
          <AppLaunchIntro theme={theme} leaving={launchIntroLeaving} />
        ) : null}
      </div>
    </PointerProvider>
  );
}

function AppNavigationChrome({
  location,
  theme,
  onThemeSelect,
}: {
  location: string;
  theme: HintTheme;
  onThemeSelect: (theme: HintTheme) => void;
}) {
  const isDark = theme === "dark";
  const { t } = useLanguage();
  const section = getAppSection(location, t);
  const appTabs: AppTabItem[] = [
    { href: "/app", label: t("nav.today"), icon: Home, exact: true },
    { href: "/app/daily", label: t("nav.daily"), icon: CalendarDays },
    { href: "/app/tarot", label: "Tarot", icon: Sparkles },
    { href: "/app/ask", label: "Ask Hint", icon: MessageCircle },
    { href: "/app/sky-deck", label: "Sky", icon: Orbit },
    { href: "/app/collection", label: "Cards", icon: Library },
    { href: "/app/profile", label: "Me", icon: UserRound },
  ];
  const profileActive =
    location === "/profile" ||
    location.startsWith("/profile/") ||
    location === "/me" ||
    location.startsWith("/me/") ||
    location === "/app/profile" ||
    location.startsWith("/app/profile/") ||
    location === "/app/me" ||
    location.startsWith("/app/me/");
  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-[calc(var(--hint-safe-top)+0.5rem)] sm:px-4">
        <header
          data-app-topbar
          className="hint-pearl-panel hint-shimmer-border hint-app-topbar pointer-events-auto mx-auto flex h-[62px] w-full max-w-[430px] items-center justify-between gap-3 rounded-[26px] border px-3"
          style={{
            background: "var(--hint-liquid-panel)",
            borderColor: "var(--hint-liquid-border)",
            boxShadow: "var(--hint-liquid-shadow)",
            backdropFilter: "blur(30px) saturate(1.32)",
            WebkitBackdropFilter: "blur(30px) saturate(1.32)",
          }}
        >
          <Link href="/app" aria-label={t("nav.homeAria")} className="hint-tap-sparkle flex min-w-0 items-center gap-2.5 rounded-[18px]">
            <HintLogo className="size-10 shrink-0 rounded-[15px] border border-white/25 shadow-[0_14px_30px_rgba(55,39,66,0.18)]" />
            <div className="min-w-0">
              <p className="truncate font-sans text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: "var(--hint-gold)" }}>
                {section.eyebrow}
              </p>
              <p className="truncate font-serif text-[19px] leading-none" style={{ color: "var(--hint-text)" }}>
                {section.title}
              </p>
            </div>
          </Link>

          <div className="flex shrink-0 items-center gap-1.5">
            {location === "/" || location === "/app" ? (
              <Link
                href="/app/daily"
                aria-label="Open Daily calendar"
                className="hint-tap-sparkle grid size-10 place-items-center rounded-full border transition hover:-translate-y-0.5 active:translate-y-0"
                style={{
                  borderColor: "var(--hint-border)",
                  color: "var(--hint-text)",
                  background: "color-mix(in srgb, var(--hint-surface-soft) 88%, transparent)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.24), 0 10px 22px color-mix(in srgb, var(--hint-rose, #f0b6cf) 12%, transparent)",
                }}
              >
                <CalendarDays className="size-4" aria-hidden />
              </Link>
            ) : null}
            <LanguageToggle compact menuPlacement="bottom" />
            <button
              type="button"
              onClick={() => onThemeSelect(isDark ? "bright" : "dark")}
              aria-pressed={isDark}
              aria-label={isDark ? t("theme.switchToDayFromNight") : t("theme.switchToNightFromDay")}
              className="grid size-10 place-items-center rounded-full border transition hover:-translate-y-0.5 active:translate-y-0"
              style={{
                borderColor: "var(--hint-border)",
                color: "var(--hint-text)",
                background: "color-mix(in srgb, var(--hint-surface-soft) 88%, transparent)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.24), 0 10px 22px color-mix(in srgb, var(--hint-rose, #f0b6cf) 12%, transparent)",
              }}
            >
              {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
            </button>
            <AccountMenu profileActive={profileActive} isDark={isDark} />
          </div>
        </header>
      </div>

      <nav
        aria-label="App"
        data-app-tabbar
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-2 pb-[calc(var(--hint-safe-bottom)+0.625rem)] sm:px-4"
      >
        <div
          className="hint-pearl-panel hint-app-dock pointer-events-auto mx-auto grid h-[78px] w-full max-w-[430px] grid-cols-7 gap-1 rounded-[30px] border p-1.5"
          style={{
            background: "var(--hint-liquid-panel)",
            borderColor: "var(--hint-liquid-border)",
            boxShadow: "var(--hint-liquid-shadow)",
            backdropFilter: "blur(30px) saturate(1.32)",
            WebkitBackdropFilter: "blur(30px) saturate(1.32)",
          }}
        >
          {appTabs.map((tab) => (
            <AppTab key={tab.href} item={tab} active={isActiveAppTab(location, tab)} isDark={isDark} />
          ))}
        </div>
      </nav>
    </>
  );

}

type AppTabItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

function AppTab({ item, active, isDark }: { item: AppTabItem; active: boolean; isDark: boolean }) {
  const Icon = item.icon;
  const featured = item.href === "/app/ask";
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      data-active={active ? "true" : "false"}
      data-featured={featured ? "true" : "false"}
      className={[
        "hint-app-tab hint-tap-sparkle relative flex min-w-0 flex-col items-center justify-center text-center transition active:translate-y-0",
        featured
          ? "hint-prism-action -translate-y-2 gap-0.5 rounded-[22px] px-1 shadow-lg hover:-translate-y-2.5"
          : "gap-1 rounded-[20px] px-1 hover:-translate-y-0.5",
      ].join(" ")}
      style={{
        color: featured
          ? "var(--hint-special-action-text)"
          : active
            ? (isDark ? "#fffaf2" : "#231b16")
            : "var(--hint-muted)",
        background: featured
          ? "var(--hint-special-action-bg)"
          : active
            ? isDark
              ? "linear-gradient(145deg, rgba(255,218,230,0.22), rgba(157,222,217,0.16))"
              : "linear-gradient(145deg, rgba(255,255,255,0.68), rgba(255,202,222,0.42), rgba(176,235,229,0.28))"
            : "transparent",
        boxShadow: featured
          ? "0 16px 38px color-mix(in srgb, var(--hint-gold, #cba866) 22%, transparent), inset 0 1px 0 rgba(255,255,255,0.48)"
          : active
            ? isDark
              ? "0 10px 26px rgba(240,182,207,0.14), inset 0 0 0 1px rgba(255,250,242,0.20)"
              : "0 10px 24px rgba(112,82,128,0.12), inset 0 0 0 1px rgba(255,255,255,0.62)"
            : "none",
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-2 top-1 h-px rounded-full opacity-80"
        style={{ background: active ? "linear-gradient(90deg, transparent, rgba(255,255,255,0.58), transparent)" : "transparent" }}
      />
      {featured ? (
        <span
          aria-hidden="true"
          className="grid size-6 place-items-center rounded-full font-serif text-[15px] leading-none"
          style={{
            background: "rgba(255,255,255,0.32)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.60), 0 8px 18px rgba(0,0,0,0.10)",
          }}
        >
          H
        </span>
      ) : (
        <Icon className="size-[17px] shrink-0" strokeWidth={active ? 2.35 : 1.9} />
      )}
      <span className="max-w-full truncate font-sans text-[9px] font-black leading-none sm:text-[10px]">
        {item.label}
      </span>
    </Link>
  );
}

function isActiveAppTab(location: string, tab: AppTabItem) {
  if (tab.exact) return location === "/app" || location === "/";
  return location === tab.href || location.startsWith(`${tab.href}/`);
}

function getAppSection(location: string, t: (key: string) => string) {
  if (location.startsWith("/app/daily")) return { eyebrow: "Daily", title: t("nav.daily") };
  if (location.startsWith("/app/tarot")) return { eyebrow: "Tarot Room", title: "Tarot" };
  if (location.startsWith("/app/animal-tarot")) return { eyebrow: "Animal Tarot", title: "Animal Spirit" };
  if (location.startsWith("/app/ask")) return { eyebrow: "Ask Hint", title: "Hint" };
  if (location.startsWith("/app/sky-deck")) return { eyebrow: "Sky Deck", title: "Sky Draw" };
  if (location.startsWith("/app/astrology")) return { eyebrow: "Astrology", title: t("nav.astrology") };
  if (location.startsWith("/app/collection")) return { eyebrow: "Collection", title: "Cards" };
  if (location.startsWith("/app/profile") || location.startsWith("/app/me")) return { eyebrow: "Profile", title: "Me" };
  if (location.startsWith("/app/settings")) return { eyebrow: "Settings", title: "Settings" };
  if (location.startsWith("/app/readings")) return { eyebrow: "History", title: t("nav.history") };
  return { eyebrow: "Hint", title: t("nav.today") };
}

function AccountMenu({ profileActive, isDark }: { profileActive: boolean; isDark: boolean }) {
  const account = useLocalAccount();
  const { profile } = useProfile();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [birthProfile, setBirthProfile] = useState<BirthProfile | null>(() => readBirthProfile());
  const menuRef = useRef<HTMLDivElement | null>(null);
  const guestName = t("account.guest");
  const displayName = account?.name || profile?.name || guestName;
  const accountLabel = account?.email ?? account?.phone ?? account?.identifier ?? t("account.notSignedIn");
  const providerLabel = account ? `${account.provider} ${t("account.verified")}` : t("account.guestSession");
  const birthDate = birthProfile?.birthDate ?? profile?.birthDate;
  const birthPlace = birthProfile?.birthPlace ?? profile?.birthPlace;
  const birthStatus = birthDate
    ? birthPlace
      ? `${birthDate} · ${birthPlace}`
      : birthDate
    : t("account.birthMissing");
  const initials = initialsFromName(displayName, guestName);

  useEffect(() => {
    const updateBirthProfile = () => setBirthProfile(readBirthProfile());
    window.addEventListener("hint.birthProfile.updated", updateBirthProfile);
    window.addEventListener("storage", updateBirthProfile);
    return () => {
      window.removeEventListener("hint.birthProfile.updated", updateBirthProfile);
      window.removeEventListener("storage", updateBirthProfile);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const closeOnPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", closeOnPointerDown);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnPointerDown);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function handleLogout() {
    clearLocalAccount();
    setOpen(false);
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-label={t("account.profileMenu")}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-current={profileActive ? "page" : undefined}
        onClick={() => setOpen((value) => !value)}
        className="hint-tap-sparkle grid size-10 place-items-center rounded-full border transition-[transform,opacity] duration-200 hover:-translate-y-0.5"
        style={{
          color: profileActive || open ? (isDark ? "#fffaf2" : "#241d18") : "var(--hint-text)",
          background: profileActive || open
            ? isDark
              ? "var(--hint-special-action-bg)"
              : "var(--hint-special-action-bg)"
            : "var(--hint-surface-soft)",
          borderColor: profileActive || open
            ? isDark
              ? "var(--hint-special-action-border)"
              : "var(--hint-special-action-border)"
            : "var(--hint-border)",
          boxShadow: profileActive || open
            ? isDark
              ? "0 14px 28px color-mix(in srgb, var(--hint-rose, #f0b6cf) 18%, transparent)"
              : "0 14px 28px color-mix(in srgb, var(--hint-rose, #f0b6cf) 12%, transparent)"
            : "none",
        }}
      >
        <UserRound aria-hidden="true" className="size-4 xl:size-5" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.75rem)] z-[90] w-[280px] max-w-[calc(100vw-1rem)] overflow-hidden rounded-[18px] border p-3"
          style={{
            background: isDark ? "rgba(12,16,28,0.96)" : "rgba(255,249,239,0.98)",
            borderColor: "var(--hint-border)",
            boxShadow: isDark
              ? "0 24px 60px rgba(0,0,0,0.34)"
              : "0 24px 60px rgba(80,54,42,0.18)",
            backdropFilter: "blur(22px) saturate(1.18)",
            WebkitBackdropFilter: "blur(22px) saturate(1.18)",
          }}
        >
          <div className="flex items-start gap-3 rounded-[14px] border p-3" style={{ borderColor: "var(--hint-border)", background: "var(--hint-surface-soft)" }}>
            <div
              className="grid size-11 shrink-0 place-items-center rounded-full border font-serif text-[16px]"
              style={{
                borderColor: isDark ? "rgba(241,166,107,0.32)" : "rgba(116,89,58,0.16)",
                background: isDark ? "rgba(241,166,107,0.14)" : "rgba(255,255,255,0.72)",
                color: "var(--hint-text)",
              }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-sans text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: "var(--hint-gold)" }}>
                {t("account.briefProfile")}
              </p>
              <p className="mt-1 truncate font-serif text-[18px] leading-tight" style={{ color: "var(--hint-text)" }}>
                {displayName}
              </p>
              <p className="mt-1 truncate font-sans text-[12px] font-semibold" style={{ color: "var(--hint-muted)" }}>
                {accountLabel}
              </p>
              <p className="mt-0.5 truncate font-sans text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--hint-faint)" }}>
                {providerLabel}
              </p>
            </div>
          </div>

          <div className="mt-3 rounded-[14px] border px-3 py-2" style={{ borderColor: "var(--hint-border)", background: "rgba(255,255,255,0.035)" }}>
            <p className="font-sans text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: "var(--hint-faint)" }}>
              {t("account.birthProfile")}
            </p>
            <p className="mt-1 truncate font-sans text-[12px] font-semibold" style={{ color: "var(--hint-muted)" }}>
              {birthStatus}
            </p>
          </div>

          <div className="mt-3 grid gap-2">
            <AccountMenuLink href="/app/profile" onNavigate={() => setOpen(false)} icon={<Settings className="size-4" />}>
              {t("account.viewProfile")}
            </AccountMenuLink>
            <AccountMenuLink href="/app/astrology?tab=birth" onNavigate={() => setOpen(false)} icon={<Sparkles className="size-4" />}>
              {t("account.editBirthProfile")}
            </AccountMenuLink>

            {account ? (
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="flex h-10 items-center justify-between rounded-[12px] border px-3 font-sans text-[13px] font-black transition-opacity hover:opacity-80"
                style={{ borderColor: "var(--hint-border)", color: "var(--hint-text)", background: "transparent" }}
              >
                <span className="inline-flex items-center gap-2">
                  <LogOut className="size-4" />
                  {t("account.logout")}
                </span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <AccountMenuLink href="/app/login?mode=login" onNavigate={() => setOpen(false)} icon={<LogIn className="size-4" />}>
                  {t("account.login")}
                </AccountMenuLink>
                <AccountMenuLink href="/app/login?mode=signup" onNavigate={() => setOpen(false)} icon={<UserPlus className="size-4" />}>
                  {t("account.signup")}
                </AccountMenuLink>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AccountMenuLink({
  href,
  icon,
  onNavigate,
  children,
}: {
  href: string;
  icon: ReactNode;
  onNavigate: () => void;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onNavigate}
      className="flex h-10 items-center justify-center gap-2 rounded-[12px] border px-3 font-sans text-[13px] font-black transition-opacity hover:opacity-80"
      style={{
        borderColor: "var(--hint-border)",
        color: "var(--hint-text)",
        background: "rgba(255,255,255,0.05)",
      }}
    >
      {icon}
      {children}
    </Link>
  );
}

function initialsFromName(name: string, guestName: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length || name === guestName) return "H";
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}
