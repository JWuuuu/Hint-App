import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { LogIn, LogOut, Moon, Settings, Sparkles, Sun, UserPlus, UserRound } from "lucide-react";
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
          <WebsiteHomeNav location={location} theme={theme} onThemeSelect={setTheme} />
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
  const [activeHash, setActiveHash] = useState(() =>
    typeof window === "undefined" ? "#today" : window.location.hash || "#today",
  );
  const homeNavItems = [
    { href: "/#today", label: t("nav.today"), section: true },
    { href: "/daily", label: t("nav.daily"), section: false },
    { href: "/app/tarot", label: t("nav.openTarot"), section: false },
    { href: "/sky-deck", label: "Sky Deck", section: false },
    { href: "/collection", label: "Collection", section: false },
    { href: "/astrology", label: t("nav.astrology"), section: false },
    { href: "/readings", label: t("nav.history"), section: false },
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
  const isActiveNavItem = (href: string, section: boolean) => {
    if (section) return (location === "/" || location === "/app") && activeHash === "#today";
    return location === href || location.startsWith(`${href}/`);
  };

  useEffect(() => {
    const updateActiveHash = () => {
      setActiveHash(window.location.hash || "#today");
    };

    updateActiveHash();
    window.addEventListener("hashchange", updateActiveHash);
    return () => window.removeEventListener("hashchange", updateActiveHash);
  }, []);

  return (
    <div className="pointer-events-none fixed left-0 right-0 top-0 z-50 px-2 pb-1.5 pt-[calc(var(--hint-safe-top)+0.375rem)] xl:px-5 xl:pb-3 xl:pt-[calc(var(--hint-safe-top)+0.75rem)]">
      <nav
        aria-label="Primary"
        className="pointer-events-auto relative mx-auto grid w-full max-w-[min(96vw,86rem)] grid-cols-[auto_1fr_auto] items-center gap-2 rounded-[18px] border px-2 py-1.5 xl:flex xl:gap-4 xl:rounded-full xl:px-4 xl:py-2"
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
          className="row-start-1 inline-flex w-fit min-w-0 shrink-0 justify-self-start items-center gap-2 rounded-[14px] border py-1 pl-1 pr-2.5 font-serif text-[18px] leading-none xl:gap-3 xl:rounded-full xl:py-1.5 xl:pl-1.5 xl:pr-4 xl:text-[24px]"
          style={{
            color: "var(--hint-text)",
            background: isDark ? "rgba(241,166,107,0.12)" : "rgba(255,255,255,0.88)",
            borderColor: isDark ? "rgba(241,166,107,0.35)" : "rgba(116,89,58,0.14)",
            boxShadow: isDark
              ? "inset 0 0 0 1px rgba(255,250,242,0.08)"
              : "0 10px 22px rgba(80,54,42,0.08), inset 0 0 0 1px rgba(255,255,255,0.72)",
          }}
          aria-label={t("nav.homeAria")}
        >
          <HintLogo className="size-8 rounded-[10px] border border-white/25 shadow-[0_10px_24px_rgba(0,0,0,0.2)] xl:size-10 xl:rounded-[13px]" />
          Hint
        </Link>

        <div
          className="hidden min-w-0 rounded-[14px] border p-1 xl:flex xl:w-auto xl:flex-1 xl:justify-center xl:gap-1.5 xl:rounded-full"
          style={{
            background: isDark ? "rgba(255,255,255,0.055)" : "rgba(255,255,255,0.72)",
            borderColor: "var(--hint-border)",
          }}
        >
          {homeNavItems.map((item) => (
            <HomeNavLink
              key={item.href}
              href={item.href}
              active={isActiveNavItem(item.href, item.section)}
              isDark={isDark}
            >
              {item.label}
            </HomeNavLink>
          ))}
        </div>

        <div className="col-start-3 row-start-1 flex shrink-0 items-center justify-self-end gap-2 xl:static xl:col-auto xl:row-auto xl:ml-0">
          <LanguageToggle compact menuPlacement="bottom" />
          <button
            type="button"
            onClick={() => onThemeSelect(isDark ? "bright" : "dark")}
            aria-pressed={isDark}
            aria-label={isDark ? t("theme.switchToDayFromNight") : t("theme.switchToNightFromDay")}
            className="hidden h-10 items-center gap-2 rounded-full border px-3 text-[12px] font-semibold xl:inline-flex"
            style={{
              background: isDark ? "rgba(241,166,107,0.14)" : "rgba(255,255,255,0.92)",
              borderColor: isDark ? "rgba(241,166,107,0.34)" : "rgba(116,89,58,0.20)",
              color: "var(--hint-text)",
              boxShadow: isDark ? "inset 0 1px 0 rgba(255,255,255,0.10), 0 10px 22px rgba(241,166,107,0.10)" : "0 10px 24px rgba(65,45,20,0.10)",
            }}
          >
            {isDark ? <Moon aria-hidden="true" className="size-4" /> : <Sun aria-hidden="true" className="size-4" />}
            {isDark ? t("theme.nightActive") : t("theme.dayActive")}
          </button>
          <button
            type="button"
            onClick={() => onThemeSelect(isDark ? "bright" : "dark")}
            aria-label={isDark ? t("theme.switchToDayFromNight") : t("theme.switchToNightFromDay")}
            className="grid size-9 place-items-center rounded-full border xl:hidden"
            style={{ borderColor: "var(--hint-border)", color: "var(--hint-text)", background: "var(--hint-surface-soft)" }}
          >
            {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
          </button>
          <AccountMenu profileActive={profileActive} isDark={isDark} />
          <Link
            href="/ask"
            className="hidden h-11 items-center justify-center gap-2 rounded-full px-5 font-sans text-[13px] font-semibold xl:inline-flex"
            style={{
              color: "#fffaf2",
              background: isDark ? "#f1a66b" : "#292331",
              boxShadow: isDark ? "0 14px 28px rgba(241,166,107,0.18)" : "0 14px 28px rgba(41,35,49,0.14)",
            }}
          >
            {t("home.askHint")}
            <ArrowMark />
          </Link>
        </div>

        <div
          className="col-span-3 row-start-2 flex justify-start gap-1 overflow-x-auto rounded-[14px] border p-1 [scrollbar-width:none] sm:justify-center [&::-webkit-scrollbar]:hidden xl:hidden"
          style={{
            background: isDark ? "rgba(255,255,255,0.055)" : "rgba(255,255,255,0.72)",
            borderColor: "var(--hint-border)",
          }}
        >
          {homeNavItems.map((item) => (
            <MobileHomeNavLink
              key={item.href}
              href={item.href}
              active={isActiveNavItem(item.href, item.section)}
              isDark={isDark}
            >
              {item.label}
            </MobileHomeNavLink>
          ))}
        </div>
      </nav>
    </div>
  );
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
        className="grid size-9 place-items-center rounded-full border transition-[transform,opacity] duration-200 hover:-translate-y-0.5 xl:size-11"
        style={{
          color: profileActive || open ? (isDark ? "#fffaf2" : "#241d18") : "var(--hint-text)",
          background: profileActive || open
            ? isDark
              ? "linear-gradient(135deg, rgba(241,166,107,0.98), rgba(246,194,143,0.94))"
              : "linear-gradient(135deg, rgba(239,162,96,0.96), rgba(246,194,143,0.92))"
            : "var(--hint-surface-soft)",
          borderColor: profileActive || open
            ? isDark
              ? "rgba(241,166,107,0.46)"
              : "rgba(116,89,58,0.18)"
            : "var(--hint-border)",
          boxShadow: profileActive || open
            ? isDark
              ? "0 14px 28px rgba(241,166,107,0.16)"
              : "0 14px 28px rgba(80,54,42,0.10)"
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
            <AccountMenuLink href="/profile" onNavigate={() => setOpen(false)} icon={<Settings className="size-4" />}>
              {t("account.viewProfile")}
            </AccountMenuLink>
            <AccountMenuLink href="/astrology?tab=birth" onNavigate={() => setOpen(false)} icon={<Sparkles className="size-4" />}>
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
                <AccountMenuLink href="/login?mode=login" onNavigate={() => setOpen(false)} icon={<LogIn className="size-4" />}>
                  {t("account.login")}
                </AccountMenuLink>
                <AccountMenuLink href="/login?mode=signup" onNavigate={() => setOpen(false)} icon={<UserPlus className="size-4" />}>
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
  children,
}: {
  href: string;
  active: boolean;
  isDark: boolean;
  children: ReactNode;
}) {
  const className =
    "flex h-9 shrink-0 items-center justify-center rounded-[11px] px-3.5 font-sans text-[12px] font-semibold";
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
      <a href={href} aria-current={active ? "page" : undefined} className={className} style={style}>
        {children}
      </a>
    );
  }

  if (href.startsWith("/")) {
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

  return (
    <a href={href} aria-current={active ? "page" : undefined} className={className} style={style}>
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
    "flex h-9 min-w-[88px] shrink-0 items-center justify-center rounded-[10px] px-3 text-center font-sans text-[12px] font-semibold leading-tight transition hover:-translate-y-0.5 active:translate-y-0 sm:min-w-0 sm:px-1 sm:text-[11px] md:h-10 md:min-w-[82px] md:rounded-full md:px-3 md:text-[13px] xl:min-w-[88px]";
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

  if (href.startsWith("/")) {
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

function ArrowMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 10h11" />
      <path d="m11 5 5 5-5 5" />
    </svg>
  );
}
