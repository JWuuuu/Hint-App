import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  LogIn,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { useLocalAccount } from "../../lib/auth";
import "./onboarding-gate.css";

const ONBOARDING_STORAGE_KEY = "hint_first_run_onboarding_v1";

type IntroPage = {
  eyebrow: string;
  title: string;
  body: string;
  steps: string[];
  preview: {
    title: string;
    note: string;
  };
};

const INTRO_PAGES: IntroPage[] = [
  {
    eyebrow: "Welcome to Hint",
    title: "Let's shape Hint around you.",
    body: "Set your name, sky profile, and deck memory before Today opens.",
    steps: ["Account", "Sky", "Deck"],
    preview: {
      title: "3 quiet steps",
      note: "Your space stays personal from the first reading.",
    },
  },
];

function readOnboardingComplete() {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(ONBOARDING_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeOnboardingComplete() {
  try {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "1");
  } catch {
    // First-run onboarding should not block entry if storage is unavailable.
  }
}

function resetOnboardingComplete() {
  try {
    window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  } catch {
    // Best effort only.
  }
}

function currentProductPath(location: string) {
  const pathname = location.split(/[?#]/, 1)[0]?.replace(/\/+$/, "") || "/";
  return pathname.startsWith("/app")
    ? pathname.slice("/app".length) || "/"
    : pathname;
}

function onboardingQueryMode() {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("onboarding");
  return value === "first" || value === "reset" ? value : null;
}

export function OnboardingGate({ children }: { children: ReactNode }) {
  const [location, navigate] = useLocation();
  const account = useLocalAccount();
  const queryMode = onboardingQueryMode();
  const forcedPreview = queryMode === "first";
  const explicitOnboardingMode = forcedPreview || queryMode === "reset";
  const [complete, setComplete] = useState(() => readOnboardingComplete());
  const [introIndex, setIntroIndex] = useState(0);
  const [stage, setStage] = useState<"intro" | "account" | "welcome">(() =>
    readOnboardingComplete() ? "account" : "intro",
  );
  const path = currentProductPath(location);
  const isAuthRoute = path === "/login" || path === "/signup";
  const shouldShowOnboarding = explicitOnboardingMode || !account;
  const activeIntro = INTRO_PAGES[introIndex] ?? INTRO_PAGES[0];
  const displayName = useMemo(() => {
    const name = account?.name?.trim();
    if (name) return name.split(/\s+/)[0];
    return "there";
  }, [account]);

  useEffect(() => {
    if (queryMode !== "reset") return;
    resetOnboardingComplete();
    setComplete(false);
    setIntroIndex(0);
    setStage("intro");
  }, [queryMode]);

  useEffect(() => {
    if (!account || explicitOnboardingMode) return;
    writeOnboardingComplete();
    setComplete(true);
  }, [account, explicitOnboardingMode]);

  useEffect(() => {
    if (account || explicitOnboardingMode || !complete) return;
    setStage("account");
  }, [account, complete, explicitOnboardingMode]);

  useEffect(() => {
    if (!shouldShowOnboarding || isAuthRoute) {
      delete document.documentElement.dataset.hintOnboarding;
      return;
    }

    document.documentElement.dataset.hintOnboarding = "true";
    return () => {
      delete document.documentElement.dataset.hintOnboarding;
    };
  }, [isAuthRoute, shouldShowOnboarding]);

  useEffect(() => {
    if (!shouldShowOnboarding || isAuthRoute || stage !== "account") return;
    navigate("/app/signup?mode=signup&from=onboarding");
  }, [isAuthRoute, navigate, shouldShowOnboarding, stage]);

  if (!shouldShowOnboarding) return <>{children}</>;
  if (isAuthRoute) return <>{children}</>;

  function goNext() {
    if (stage === "intro" && introIndex < INTRO_PAGES.length - 1) {
      setIntroIndex((index) => index + 1);
      return;
    }
    if (stage === "intro") {
      startAuth("signup");
      return;
    }
    if (stage === "account") {
      setStage("welcome");
      return;
    }
    finishOnboarding();
  }

  function goBack() {
    if (stage === "welcome") {
      setStage("intro");
      setIntroIndex(INTRO_PAGES.length - 1);
      return;
    }
    if (stage === "account") {
      setStage("intro");
      setIntroIndex(INTRO_PAGES.length - 1);
      return;
    }
    setIntroIndex((index) => Math.max(0, index - 1));
  }

  function finishOnboarding() {
    if (!forcedPreview) {
      writeOnboardingComplete();
      setComplete(true);
    }
    delete document.documentElement.dataset.hintOnboarding;
    navigate("/app");
  }

  function startAuth(mode: "login" | "signup") {
    navigate(`/app/${mode}?mode=${mode}&from=onboarding`);
  }

  return (
    <div
      className="hint-onboarding-shell"
      data-stage={stage}
      data-hint-theme="bright"
    >
      <div className="hint-onboarding-bg" aria-hidden="true">
        <span className="hint-onboarding-silk hint-onboarding-silk-a" />
        <span className="hint-onboarding-silk hint-onboarding-silk-b" />
        <span className="hint-onboarding-silk hint-onboarding-silk-c" />
        <span className="hint-onboarding-orbit hint-onboarding-orbit-a" />
        <span className="hint-onboarding-orbit hint-onboarding-orbit-b" />
        <span className="hint-onboarding-orbit hint-onboarding-orbit-c" />
        <span className="hint-onboarding-foil hint-onboarding-foil-a" />
        <span className="hint-onboarding-foil hint-onboarding-foil-b" />
        <span className="hint-onboarding-foil hint-onboarding-foil-c" />
        <span className="hint-onboarding-foil hint-onboarding-foil-d" />
        <span className="hint-onboarding-foil hint-onboarding-foil-e" />
      </div>

      <main
        className={`hint-onboarding-phone${stage === "intro" ? " onboarding-screen" : ""}`}
        aria-label="Welcome to Hint"
      >
        {stage === "intro" ? null : (
          <div className="hint-onboarding-topbar">
            <button
              type="button"
              onClick={goBack}
              className="hint-onboarding-icon-button"
              aria-label="Back"
            >
              <ChevronLeft size={18} />
            </button>
            <StepIndicator />
            <span aria-hidden="true" />
          </div>
        )}

        <AnimatePresence mode="wait">
          {stage === "intro" ? (
            <IntroPanel
              key={`intro-${introIndex}`}
              page={activeIntro}
              introIndex={introIndex}
              onNext={goNext}
            />
          ) : stage === "account" ? (
            <AccountPanel key="account" onAuth={startAuth} />
          ) : (
            <WelcomePanel
              key="welcome"
              displayName={displayName}
              accountReady={Boolean(account)}
              onEnter={finishOnboarding}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function IntroPanel({
  page,
  introIndex,
  onNext,
}: {
  page: IntroPage;
  introIndex: number;
  onNext: () => void;
}) {
  return (
    <motion.section
      className="hint-onboarding-panel onboarding-screen-panel"
      initial={{ opacity: 0, x: 26, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20, scale: 0.98 }}
      transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="top-stage">
        <StepIndicator className="top-stage-stepper" />
        <div
          className="hint-onboarding-hero hint-onboarding-oracle-hero"
          data-page={introIndex}
          aria-hidden="true"
        >
          <div className="hint-onboarding-oracle-portal">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="hint-onboarding-oracle-orbits">
            <span />
            <span />
            <span />
          </div>
          <div className="hint-onboarding-oracle-card">
            <span className="hint-onboarding-oracle-label">Hint</span>
            <span className="hint-onboarding-oracle-arc" />
            <span className="hint-onboarding-oracle-star hint-onboarding-oracle-star-a" />
            <span className="hint-onboarding-oracle-star hint-onboarding-oracle-star-b" />
            <span className="hint-onboarding-oracle-star hint-onboarding-oracle-star-c" />
            <span className="hint-onboarding-oracle-glyph">H</span>
            <span className="hint-onboarding-oracle-baseline" />
            <span className="hint-onboarding-oracle-thread" />
            <span className="hint-onboarding-oracle-moon" />
          </div>
        </div>
      </div>

      <section className="story hint-onboarding-copy">
        <p className="hint-onboarding-eyebrow">{page.eyebrow}</p>
        <h1>{page.title}</h1>
        <p>{page.body}</p>
      </section>

      <section className="bottom-cluster">
        <div className="hint-onboarding-setup-card">
          <div>
            <span>Setup</span>
            <strong>{page.preview.title}</strong>
          </div>
          <div className="hint-onboarding-setup-items">
            {page.steps.map((step) => (
              <span key={step}>
                <i aria-hidden="true" />
                {step}
              </span>
            ))}
          </div>
          <p>{page.preview.note}</p>
        </div>

        <button
          type="button"
          onClick={onNext}
          className="hint-onboarding-primary hint-pressable"
        >
          {introIndex === INTRO_PAGES.length - 1 ? "Start Setup" : "Continue"}
          <ArrowRight size={17} />
        </button>
      </section>
    </motion.section>
  );
}

function StepIndicator({ className = "" }: { className?: string }) {
  return (
    <div
      className={`hint-onboarding-step-indicator${className ? ` ${className}` : ""}`}
      aria-label="Setup steps"
    >
      <span>Account</span>
      <i aria-hidden="true">·</i>
      <span>Sky</span>
      <i aria-hidden="true">·</i>
      <span>Deck</span>
    </div>
  );
}

function AccountPanel({
  onAuth,
}: {
  onAuth: (mode: "login" | "signup") => void;
}) {
  return (
    <motion.section
      className="hint-onboarding-panel"
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -18, scale: 0.98 }}
      transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="hint-onboarding-account-mark" aria-hidden="true">
        <div className="hint-onboarding-account-card">
          <span className="hint-onboarding-account-avatar">
            <UserPlus size={24} />
          </span>
          <span className="hint-onboarding-account-line hint-onboarding-account-line-a" />
          <span className="hint-onboarding-account-line hint-onboarding-account-line-b" />
          <span className="hint-onboarding-account-seal">
            <Check size={14} />
          </span>
        </div>
      </div>

      <div className="hint-onboarding-copy">
        <p className="hint-onboarding-eyebrow">Your space</p>
        <h1>Create your private space.</h1>
        <p>
          Save your readings, sky profile, and deck memory in one quiet place.
        </p>
      </div>

      <div className="hint-onboarding-auth-actions">
        <button
          type="button"
          onClick={() => onAuth("signup")}
          className="hint-onboarding-primary hint-pressable"
        >
          <UserPlus size={17} />
          Sign up
        </button>
        <button
          type="button"
          onClick={() => onAuth("login")}
          className="hint-onboarding-secondary hint-pressable"
        >
          <LogIn size={17} />
          Log in
        </button>
      </div>

      <div className="hint-onboarding-checklist">
        {[
          "Email or phone verification",
          "Birth date for astrology",
          "Sky Deck tied to your profile",
        ].map((item) => (
          <span key={item}>
            <Check size={14} />
            {item}
          </span>
        ))}
      </div>
    </motion.section>
  );
}

function WelcomePanel({
  displayName,
  accountReady,
  onEnter,
}: {
  displayName: string;
  accountReady: boolean;
  onEnter: () => void;
}) {
  return (
    <motion.section
      className="hint-onboarding-panel"
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -18, scale: 0.98 }}
      transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="hint-onboarding-welcome-mark" aria-hidden="true">
        <span className="hint-onboarding-welcome-ring" />
        <div className="hint-onboarding-home-mini">
          <span className="hint-onboarding-home-orb">
            <Sparkles size={24} />
          </span>
          <span className="hint-onboarding-home-line hint-onboarding-home-line-a" />
          <span className="hint-onboarding-home-line hint-onboarding-home-line-b" />
          <span className="hint-onboarding-home-score" />
        </div>
      </div>

      <div className="hint-onboarding-copy">
        <p className="hint-onboarding-eyebrow">Welcome to Hint</p>
        <h1>
          {accountReady
            ? `You're ready, ${displayName}.`
            : "You're ready to enter."}
        </h1>
        <p>
          Today is the main page: one card, one signal, and a few rooms to
          explore when you want a deeper answer.
        </p>
      </div>

      <div className="hint-onboarding-preview-card">
        <span>Today</span>
        <strong>Your Hint is waiting</strong>
        <p>
          Open the daily ritual, ask a question, or step into tarot when
          something needs more detail.
        </p>
      </div>

      <button
        type="button"
        onClick={onEnter}
        className="hint-onboarding-primary hint-pressable"
      >
        Enter Today
        <ArrowRight size={17} />
      </button>
    </motion.section>
  );
}
