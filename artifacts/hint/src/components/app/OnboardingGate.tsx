import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Check,
  Clock3,
  Heart,
  Mail,
  MapPin,
  MoonStar,
  Sparkles,
  UserRound,
} from "lucide-react";
import { saveLocalAccount, useLocalAccount } from "../../lib/auth";
import { saveBirthProfileFromAccountProfile } from "../../lib/astro/userBirthProfile";
import { useProfile } from "../../lib/useProfile";

const ONBOARDING_COMPLETE_KEY = "hint_onboarding_complete_v3";
const ONBOARDING_PREFERENCES_KEY = "hint_onboarding_preferences_v1";

type OnboardingStep = "welcome" | "profile" | "focus" | "account";
type FocusChoice = "relationships" | "career" | "self" | "decision";

const STEPS: OnboardingStep[] = ["welcome", "profile", "focus", "account"];
const FOCUS_OPTIONS: Array<{ id: FocusChoice; label: string; detail: string; icon: typeof Heart }> = [
  { id: "relationships", label: "Love & relationships", detail: "Connection, boundaries, and closeness", icon: Heart },
  { id: "career", label: "Career & study", detail: "Direction, timing, and momentum", icon: BriefcaseBusiness },
  { id: "self", label: "Self & patterns", detail: "Emotions, habits, and inner growth", icon: MoonStar },
  { id: "decision", label: "A decision", detail: "See the situation from a clearer angle", icon: BookOpen },
];

function onboardingIsComplete() {
  try {
    return window.localStorage.getItem(ONBOARDING_COMPLETE_KEY) === "1";
  } catch {
    return false;
  }
}

function isValidBirthDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime())
    && date.getFullYear() === year
    && date.getMonth() + 1 === month
    && date.getDate() === day
    && date <= new Date();
}

function emailIsValid(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function OnboardingGate({ children }: { children: ReactNode }) {
  const [location, navigate] = useLocation();
  const account = useLocalAccount();
  const { anonId, profile, saveProfile, isSaving } = useProfile();
  const forceReset = useMemo(() => new URLSearchParams(window.location.search).get("onboarding") === "reset", [location]);
  const pathname = location.split(/[?#]/, 1)[0] ?? "";
  const isStandaloneAuth = pathname.endsWith("/login") || pathname.endsWith("/signup");
  const [finished, setFinished] = useState(false);
  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [name, setName] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [focus, setFocus] = useState<FocusChoice | null>(null);
  const [email, setEmail] = useState(account?.email ?? "");
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const shouldShow = !isStandaloneAuth && !finished && (forceReset || !onboardingIsComplete());

  useEffect(() => {
    if (!profile) return;
    setName((current) => current || profile.name || "");
    const [year = "", month = "", day = ""] = (profile.birthDate || "").split("-");
    setBirthYear((current) => current || year);
    setBirthMonth((current) => current || month);
    setBirthDay((current) => current || day);
    setBirthTime((current) => current || profile.birthTime || "");
    setBirthPlace((current) => current || profile.birthPlace || "");
  }, [profile]);

  useEffect(() => {
    if (account?.email) setEmail((current) => current || account.email || "");
  }, [account?.email]);

  function goBack() {
    setError(null);
    setPendingCode(null);
    setCode("");
    const index = STEPS.indexOf(step);
    setStep(STEPS[Math.max(0, index - 1)] ?? "welcome");
  }

  async function saveIdentity() {
    const birthDate = birthYear && birthMonth && birthDay ? `${birthYear}-${birthMonth}-${birthDay}` : "";
    if (!name.trim()) {
      setError("Tell us what you would like Hint to call you.");
      return;
    }
    if (!isValidBirthDate(birthDate)) {
      setError("Enter a complete birth date that is not in the future.");
      return;
    }

    setError(null);
    const saved = await saveProfile({
      name: name.trim(),
      birthDate,
      birthTime: birthTime || undefined,
      birthPlace: birthPlace.trim() || undefined,
    });
    if (birthPlace.trim()) saveBirthProfileFromAccountProfile(saved, anonId);
    setStep("focus");
  }

  function saveFocus() {
    if (!focus) {
      setError("Choose one area to begin with.");
      return;
    }
    try {
      window.localStorage.setItem(ONBOARDING_PREFERENCES_KEY, JSON.stringify({ focus }));
    } catch {
      // Keep moving if local storage is unavailable.
    }
    setError(null);
    setStep("account");
  }

  function requestCode() {
    if (!emailIsValid(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setPendingCode(String(Math.floor(100000 + Math.random() * 900000)));
    setCode("");
    setError(null);
  }

  function finishOnboarding(identifier = email) {
    if (identifier) {
      saveLocalAccount({
        provider: "email",
        identifier,
        email: identifier,
        name: name.trim() || profile?.name || account?.name,
        verifiedAt: new Date().toISOString(),
      });
    }
    try {
      window.localStorage.setItem(ONBOARDING_COMPLETE_KEY, "1");
    } catch {
      // The app still opens for this session.
    }
    setFinished(true);
    navigate("/app", { replace: true });
  }

  function verifyCode() {
    if (!pendingCode || code.trim() !== pendingCode) {
      setError("That code does not match. Try the six digits shown below.");
      return;
    }
    finishOnboarding(email.trim().toLowerCase());
  }

  if (!shouldShow) return <>{children}</>;
  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="hint-onboarding fixed inset-0 z-[80] overflow-hidden" data-testid="onboarding-flow">
      <div className="hint-onboarding-spotlight" aria-hidden />
      <div className="hint-onboarding-stars" aria-hidden>
        {Array.from({ length: 18 }, (_, index) => <i key={index} />)}
      </div>

      <main className="hint-onboarding-scroll hint-app-scroll relative z-10 mx-auto h-full w-full max-w-[430px] overflow-y-auto">
        {step !== "welcome" ? (
          <header className="sticky top-0 z-20 flex items-center justify-between px-5 pb-3 pt-[calc(var(--hint-safe-top)+0.9rem)] backdrop-blur-xl">
            <button type="button" onClick={goBack} className="hint-onboarding-icon-button" aria-label="Go back">
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-1.5" aria-label={`Step ${stepIndex} of 3`}>
              {[1, 2, 3].map((item) => (
                <span key={item} className="h-1 rounded-full transition-all" style={{ width: item === stepIndex ? 28 : 7, background: item <= stepIndex ? "#7d596f" : "rgba(74,54,68,0.16)" }} />
              ))}
            </div>
            <span className="grid size-10 place-items-center font-serif text-[15px] text-[#785c6e]">H</span>
          </header>
        ) : null}

        {step === "welcome" ? (
          <section className="flex min-h-full flex-col px-6 pb-[calc(var(--hint-safe-bottom)+1.5rem)] pt-[calc(var(--hint-safe-top)+1.4rem)]">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.22em] text-[#7a6673]">
              <span>Hint</span>
              <span>Private by design</span>
            </div>

            <div className="hint-onboarding-orbit-stage relative mx-auto mt-7 flex w-full flex-1 items-center justify-center">
              <div className="hint-onboarding-orbit hint-onboarding-orbit-one" aria-hidden />
              <div className="hint-onboarding-orbit hint-onboarding-orbit-two" aria-hidden />
              <span className="hint-onboarding-zodiac left-[8%] top-[24%]">LEO</span>
              <span className="hint-onboarding-zodiac right-[3%] top-[42%]">PISCES</span>
              <span className="hint-onboarding-zodiac bottom-[17%] left-[12%]">LIBRA</span>
              <div className="hint-onboarding-card" aria-label="Hint card">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Hint</span>
                <span className="font-serif text-[70px] leading-none">H</span>
                <Sparkles size={17} strokeWidth={1.45} />
              </div>
            </div>

            <div className="relative z-10 mt-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9a7189]">A reading that starts with you</p>
              <h1 className="mt-3 max-w-[350px] font-serif text-[42px] leading-[0.98] text-[#30252f]">A clearer signal, shaped around your sky.</h1>
              <p className="mt-4 max-w-[340px] text-[14px] leading-6 text-[#796d76]">Share only what changes the reading. Hint uses your birth date and one intention to make the experience personal.</p>
              <button type="button" onClick={() => setStep("profile")} className="hint-onboarding-primary mt-7" data-testid="button-start-onboarding">
                Begin <ArrowRight size={17} />
              </button>
              <p className="mt-3 text-center text-[10.5px] text-[#9a8d95]">About 60 seconds</p>
            </div>
          </section>
        ) : null}

        {step === "profile" ? (
          <section className="hint-onboarding-step">
            <StepHeading eyebrow="Your sky" title="Start with the details that matter." body="Your date sets your sun sign. Birth time and city refine your rising sign and houses." />
            <div className="mt-8 grid gap-5">
              <OnboardingField label="What should Hint call you?" icon={UserRound}>
                <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" autoComplete="name" data-testid="onboarding-name" />
              </OnboardingField>
              <label className="block min-w-0">
                <span className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#796873]"><MoonStar size={13} strokeWidth={1.7} />Birthday</span>
                <span className="hint-onboarding-date-grid">
                  <span className="hint-onboarding-input">
                    <select aria-label="Birth month" value={birthMonth} onChange={(event) => setBirthMonth(event.target.value)} data-testid="onboarding-birth-month">
                      <option value="">Month</option>
                      {Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0")).map((month) => <option key={month} value={month}>{month}</option>)}
                    </select>
                  </span>
                  <span className="hint-onboarding-input">
                    <select aria-label="Birth day" value={birthDay} onChange={(event) => setBirthDay(event.target.value)} data-testid="onboarding-birth-day">
                      <option value="">Day</option>
                      {Array.from({ length: 31 }, (_, index) => String(index + 1).padStart(2, "0")).map((day) => <option key={day} value={day}>{day}</option>)}
                    </select>
                  </span>
                  <span className="hint-onboarding-input">
                    <select aria-label="Birth year" value={birthYear} onChange={(event) => setBirthYear(event.target.value)} data-testid="onboarding-birth-year">
                      <option value="">Year</option>
                      {Array.from({ length: new Date().getFullYear() - 1899 }, (_, index) => String(new Date().getFullYear() - index)).map((year) => <option key={year} value={year}>{year}</option>)}
                    </select>
                  </span>
                </span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <OnboardingField label="Birth time" detail="Optional" icon={Clock3}>
                  <input type="time" value={birthTime} onChange={(event) => setBirthTime(event.target.value)} data-testid="onboarding-birthtime" />
                </OnboardingField>
                <OnboardingField label="Birth city" detail="Optional" icon={MapPin}>
                  <input value={birthPlace} onChange={(event) => setBirthPlace(event.target.value)} placeholder="City" autoComplete="address-level2" data-testid="onboarding-birthplace" />
                </OnboardingField>
              </div>
            </div>
            <InlineError message={error} />
            <button type="button" onClick={() => void saveIdentity()} disabled={isSaving} className="hint-onboarding-primary mt-7" data-testid="button-save-onboarding-profile">
              {isSaving ? "Saving..." : "Continue"} <ArrowRight size={17} />
            </button>
            <p className="mt-4 text-[11px] leading-5 text-[#958890]">Time and city are optional. You can add or change them later from Profile.</p>
          </section>
        ) : null}

        {step === "focus" ? (
          <section className="hint-onboarding-step">
            <StepHeading eyebrow="One intention" title="What should Hint notice first?" body="Choose the area you want your first readings to lean toward. You can change this later." />
            <div className="mt-8 grid gap-3" role="radiogroup" aria-label="Reading focus">
              {FOCUS_OPTIONS.map((option) => {
                const Icon = option.icon;
                const selected = focus === option.id;
                return (
                  <button key={option.id} type="button" role="radio" aria-checked={selected} onClick={() => { setFocus(option.id); setError(null); }} className="hint-onboarding-choice" data-selected={selected ? "true" : "false"} data-testid={`onboarding-focus-${option.id}`}>
                    <span className="hint-onboarding-choice-icon"><Icon size={18} strokeWidth={1.7} /></span>
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block text-[14px] font-semibold text-[#3d3039]">{option.label}</span>
                      <span className="mt-0.5 block text-[11.5px] text-[#8a7a84]">{option.detail}</span>
                    </span>
                    <span className="hint-onboarding-radio">{selected ? <Check size={13} /> : null}</span>
                  </button>
                );
              })}
            </div>
            <InlineError message={error} />
            <button type="button" onClick={saveFocus} className="hint-onboarding-primary mt-7" data-testid="button-save-onboarding-focus">
              Continue <ArrowRight size={17} />
            </button>
          </section>
        ) : null}

        {step === "account" ? (
          <section className="hint-onboarding-step">
            <StepHeading eyebrow="Keep your space" title="Sign in to save your Hint." body="Your profile, readings, and preferences stay connected when you return." />
            {account?.email && !pendingCode ? (
              <div className="mt-8">
                <button type="button" className="hint-onboarding-account" onClick={() => finishOnboarding(account.email)}>
                  <span className="hint-onboarding-choice-icon"><Mail size={18} /></span>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block text-[11px] uppercase tracking-[0.14em] text-[#9a7b8e]">Continue as</span>
                    <span className="mt-1 block truncate text-[14px] font-semibold text-[#3d3039]">{account.email}</span>
                  </span>
                  <ArrowRight size={17} />
                </button>
                <button type="button" onClick={() => { setEmail(""); setPendingCode(""); }} className="mt-4 w-full py-2 text-[12px] font-semibold text-[#7d596f]">Use a different email</button>
              </div>
            ) : (
              <div className="mt-8">
                <OnboardingField label="Email" icon={Mail}>
                  <input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setPendingCode(null); setCode(""); setError(null); }} placeholder="you@example.com" autoComplete="email" inputMode="email" data-testid="onboarding-email" />
                </OnboardingField>
                {pendingCode ? (
                  <div className="mt-5">
                    <OnboardingField label="Six-digit code" icon={Sparkles}>
                      <input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" inputMode="numeric" autoComplete="one-time-code" data-testid="onboarding-code" />
                    </OnboardingField>
                    <p className="mt-3 rounded-[8px] border border-[#d8c5ce] bg-white/45 px-4 py-3 text-[11.5px] leading-5 text-[#75656f]">Beta sign-in code: <strong className="tracking-[0.18em] text-[#694b5d]">{pendingCode}</strong></p>
                  </div>
                ) : null}
                <InlineError message={error} />
                <button type="button" onClick={pendingCode ? verifyCode : requestCode} className="hint-onboarding-primary mt-7" data-testid="button-onboarding-auth">
                  {pendingCode ? "Verify & enter Hint" : "Send sign-in code"} <ArrowRight size={17} />
                </button>
                {pendingCode ? <button type="button" onClick={requestCode} className="mt-3 w-full py-2 text-[11.5px] font-semibold text-[#7d596f]">Send a new code</button> : null}
              </div>
            )}
            <div className="mt-8 flex items-start gap-2.5 border-t border-[#d8cbd1] pt-5 text-[10.5px] leading-5 text-[#94858d]">
              <Check size={14} className="mt-0.5 shrink-0 text-[#8a687c]" />
              <p>No password. No marketing questions. Only the details used to personalize and keep your readings.</p>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}

function StepHeading({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9a7189]">{eyebrow}</p><h1 className="mt-3 max-w-[350px] font-serif text-[38px] leading-[1.02] text-[#30252f]">{title}</h1><p className="mt-4 max-w-[355px] text-[13.5px] leading-6 text-[#7e7179]">{body}</p></div>;
}

function OnboardingField({ label, detail, icon: Icon, children }: { label: string; detail?: string; icon: typeof UserRound; children: ReactNode }) {
  return <label className="block min-w-0"><span className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#796873]"><Icon size={13} strokeWidth={1.7} />{label}{detail ? <span className="ml-auto text-[9px] font-medium normal-case tracking-normal text-[#a6969f]">{detail}</span> : null}</span><span className="hint-onboarding-input">{children}</span></label>;
}

function InlineError({ message }: { message: string | null }) {
  return message ? <p className="mt-4 text-[11.5px] font-medium leading-5 text-[#9a4f68]">{message}</p> : null;
}
