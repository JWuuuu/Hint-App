import { useState } from "react";
import { useLocation } from "wouter";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  Check,
  Clock3,
  KeyRound,
  LogIn,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { AppScreen } from "../../components/app/AppChrome";
import { ACCENT } from "../hold/atmosphere";
import { clearLocalAccount, saveLocalAccount, useLocalAccount, type LocalAccount } from "../../lib/auth";
import { saveBirthProfile, saveBirthProfileFromAccountProfile } from "../../lib/astro/userBirthProfile";
import {
  confirmFirebasePhoneVerification,
  firebaseAuthErrorMessage,
  isFirebaseAuthConfigured,
  requestFirebasePhoneVerification,
  signInWithFirebaseSocial,
  type FirebasePhoneConfirmation,
} from "../../lib/firebaseAuth";
import { ASTROLOGY_TESTER_ACCOUNT } from "../../lib/testerAccount";
import { useProfile } from "../../lib/useProfile";
import { useLanguage } from "../../lib/i18n";
import "./login-view.css";

type AuthMode = "login" | "signup";
type AuthMethod = "email" | "phone";
type SignupStep = "account" | "birth";
type SocialProvider = "apple" | "google" | "facebook";

type PendingVerification = {
  code?: string;
  method: AuthMethod;
  target: string;
  firebaseConfirmation?: FirebasePhoneConfirmation;
};

const SOCIAL_AUTH_URLS: Record<SocialProvider, string | undefined> = {
  apple: import.meta.env.VITE_APPLE_AUTH_URL,
  google: import.meta.env.VITE_GOOGLE_AUTH_URL,
  facebook: import.meta.env.VITE_FACEBOOK_AUTH_URL,
};

const SOCIAL_PROVIDERS: Array<{ id: SocialProvider; label: string; mark: string }> = [
  { id: "apple", label: "Apple", mark: "A" },
  { id: "google", label: "Google", mark: "G" },
  { id: "facebook", label: "Facebook", mark: "f" },
];

function emailIsValid(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function phoneIsValid(value: string) {
  return /^\+?\d[\d\s().-]{6,}$/.test(value.trim());
}

function birthDateIsValid(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}

function formatBirthDateInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

function normalizePhone(value: string) {
  return value.trim().replace(/[^\d+]/g, "");
}

function readInitialMode(accountExists: boolean): AuthMode {
  if (typeof window === "undefined") return accountExists ? "login" : "signup";
  const mode = new URLSearchParams(window.location.search).get("mode");
  if (mode === "login" || mode === "signup") return mode;
  const pathname = window.location.pathname.replace(/\/+$/, "");
  if (pathname.endsWith("/signup")) return "signup";
  return accountExists ? "login" : "signup";
}

function generateVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function methodTarget(method: AuthMethod, email: string, phone: string) {
  return method === "email" ? email.trim().toLowerCase() : normalizePhone(phone);
}

function accountLabel(account: LocalAccount | null) {
  if (!account) return null;
  return account.email ?? account.phone ?? account.identifier;
}

function providerLabel(provider: LocalAccount["provider"]) {
  if (provider === "email") return "Email";
  if (provider === "phone") return "Phone";
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

function isOnboardingSource() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("from") === "onboarding";
}

export function LoginView() {
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const account = useLocalAccount();
  const { anonId, saveProfile } = useProfile();
  const fromOnboarding = isOnboardingSource();
  const firebaseReady = isFirebaseAuthConfigured();
  const visibleSocialProviders = SOCIAL_PROVIDERS;
  const showTesterAccount = import.meta.env.DEV && !fromOnboarding;
  const showSecondaryActions = showTesterAccount || visibleSocialProviders.length > 0;
  const [mode, setMode] = useState<AuthMode>(() => readInitialMode(Boolean(account)));
  const [method, setMethod] = useState<AuthMethod>(account?.provider === "phone" ? "phone" : "email");
  const [email, setEmail] = useState(account?.email ?? "");
  const [phone, setPhone] = useState(account?.phone ?? "");
  const [name, setName] = useState(account?.name ?? "");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [signupStep, setSignupStep] = useState<SignupStep>("account");
  const [verificationCode, setVerificationCode] = useState("");
  const [pending, setPending] = useState<PendingVerification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

  const target = methodTarget(method, email, phone);
  const methodIsValid = method === "email" ? emailIsValid(email) : phoneIsValid(phone);
  const hasBirthDetails = birthDateIsValid(birthDate) && birthTime.trim().length > 0 && birthPlace.trim().length > 0;
  const canContinueSignupAccount = name.trim().length > 0 && methodIsValid;
  const canRequestCode =
    methodIsValid &&
    (mode === "login" || (name.trim().length > 0 && hasBirthDetails));
  const primaryDisabled = pending
    ? authBusy || verificationCode.trim().length !== 6
    : mode === "signup" && signupStep === "account"
      ? authBusy || !canContinueSignupAccount
      : authBusy || !canRequestCode;
  const primaryLabel = authBusy
    ? "Working..."
    : pending
    ? t("login.verifyCode")
    : mode === "signup" && signupStep === "account"
      ? "Continue to Sky"
      : t("login.requestCode");
  const authTitle = account
    ? "Private space ready."
    : pending
      ? "Check your code."
    : mode === "signup"
      ? signupStep === "account"
        ? "Create your private space."
        : "Set your sky."
      : "Welcome back.";
  const authSubtitle = account
    ? "Your readings, sky profile, and deck memory can stay connected here."
    : pending
      ? `Enter the verification code for ${target}.`
    : mode === "signup"
      ? signupStep === "account"
        ? "Save your readings, sky profile, and deck memory in one quiet place."
        : "Birth details power Astrology and the Sky Deck, so collect them before Today opens."
      : "Use the email or phone tied to your Hint profile.";

  function resetVerification(nextMethod = method) {
    setPending(null);
    setVerificationCode("");
    setNotice(null);
    setError(null);
    setMethod(nextMethod);
  }

  async function saveSignupBirthProfileIfReady(accountName = name.trim()) {
    if (mode !== "signup" || !accountName || !hasBirthDetails) return;
    const profileInput = {
      name: accountName,
      birthDate,
      birthTime: birthTime.trim() || undefined,
      birthPlace: birthPlace.trim() || undefined,
    };
    await saveProfile(profileInput);
    saveBirthProfileFromAccountProfile({ anonId, ...profileInput }, anonId);
  }

  async function handleRequestCode(event: React.FormEvent) {
    event.preventDefault();
    if (mode === "signup" && !name.trim()) {
      setError(t("login.error.name"));
      return;
    }
    if (!methodIsValid) {
      setError(method === "email" ? t("login.error.email") : t("login.error.phone"));
      return;
    }
    if (mode === "signup" && signupStep === "account") {
      setSignupStep("birth");
      setError(null);
      setNotice(null);
      return;
    }
    if (mode === "signup" && !birthDateIsValid(birthDate)) {
      setError(t("login.error.birthDate"));
      return;
    }
    if (mode === "signup" && (!birthTime.trim() || !birthPlace.trim())) {
      setError("Enter birth time and birth place so Hint can build your sky profile.");
      return;
    }

    if (method === "phone" && firebaseReady) {
      setAuthBusy(true);
      setError(null);
      setNotice("Sending a secure SMS code...");
      try {
        const confirmation = await requestFirebasePhoneVerification(target);
        setPending({ method, target, firebaseConfirmation: confirmation });
        setVerificationCode("");
        setNotice(t("login.notice.codeRequested").replace("{target}", target));
      } catch (authError) {
        setError(firebaseAuthErrorMessage(authError));
        setNotice(null);
      } finally {
        setAuthBusy(false);
      }
      return;
    }

    const code = generateVerificationCode();
    setPending({ method, target, code });
    setVerificationCode("");
    setError(null);
    setNotice(
      t("login.notice.codeRequested").replace("{target}", target),
    );
  }

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    if (!pending) {
      setError(t("login.error.requestFirst"));
      return;
    }

    if (!pending.firebaseConfirmation && verificationCode.trim() !== pending.code) {
      setError(t("login.error.codeMismatch"));
      return;
    }

    setAuthBusy(true);
    try {
      const verifiedAt = new Date().toISOString();
      const firebaseAccount = pending.firebaseConfirmation
        ? await confirmFirebasePhoneVerification(pending.firebaseConfirmation, verificationCode.trim())
        : null;
      const nextName = mode === "signup" ? name.trim() : account?.name;
      saveLocalAccount({
        provider: pending.method,
        identifier: firebaseAccount?.phone || pending.target,
        email: pending.method === "email" ? pending.target : firebaseAccount?.email,
        phone: pending.method === "phone" ? firebaseAccount?.phone || pending.target : undefined,
        name: nextName || firebaseAccount?.name,
        verifiedAt: firebaseAccount?.verifiedAt || verifiedAt,
      });
      await saveSignupBirthProfileIfReady(nextName || firebaseAccount?.name || "");
      setError(null);
      setNotice(null);
      navigate(fromOnboarding ? "/app" : "/app/profile");
    } catch (authError) {
      setError(firebaseAuthErrorMessage(authError));
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleUseTesterAccount() {
    saveLocalAccount({
      provider: "email",
      identifier: ASTROLOGY_TESTER_ACCOUNT.email,
      email: ASTROLOGY_TESTER_ACCOUNT.email,
      name: ASTROLOGY_TESTER_ACCOUNT.name,
      verifiedAt: new Date().toISOString(),
    });
    await saveProfile({ ...ASTROLOGY_TESTER_ACCOUNT.profile });
    saveBirthProfile({ ...ASTROLOGY_TESTER_ACCOUNT.birthProfile });
    setError(null);
    setNotice(t("login.notice.testerLoaded"));
    navigate(fromOnboarding ? "/app" : "/app/astrology?tab=birth");
  }

  function handleSignOut() {
    clearLocalAccount();
    setEmail("");
    setPhone("");
    setName("");
    setBirthDate("");
    setBirthTime("");
    setBirthPlace("");
    setMode("signup");
    setSignupStep("account");
    resetVerification("email");
  }

  async function handleSocialProvider(provider: SocialProvider) {
    const url = SOCIAL_AUTH_URLS[provider];
    const label = SOCIAL_PROVIDERS.find((item) => item.id === provider)?.label ?? provider;

    if (provider === "google" || provider === "apple") {
      if (!firebaseReady && !url) {
        setError(null);
        setNotice("Add the VITE_FIREBASE_* values and enable this provider in Firebase Auth before this can create a real account.");
        return;
      }

      if (firebaseReady) {
        setAuthBusy(true);
        setError(null);
        setNotice(`Opening ${label} sign-in...`);
        try {
          const firebaseAccount = await signInWithFirebaseSocial(provider);
          const accountName = name.trim() || firebaseAccount.name;
          saveLocalAccount({
            ...firebaseAccount,
            name: accountName,
          });
          await saveSignupBirthProfileIfReady(accountName || "");
          setNotice(null);
          navigate(fromOnboarding ? "/app" : "/app/profile");
        } catch (authError) {
          setError(firebaseAuthErrorMessage(authError));
          setNotice(null);
        } finally {
          setAuthBusy(false);
        }
        return;
      }
    }

    if (!url) {
      setError(null);
      setNotice(
        t("login.notice.oauthMissing")
          .replace("{provider}", label)
          .replace("{providerKey}", provider.toUpperCase()),
      );
      return;
    }

    const separator = url.includes("?") ? "&" : "?";
    window.location.assign(`${url}${separator}mode=${mode}`);
  }

  return (
    <AppScreen>
      <div className="hint-auth-background" data-hint-theme={fromOnboarding ? "bright" : undefined} aria-hidden="true" />
      <div className="hint-auth-page" data-hint-theme={fromOnboarding ? "bright" : undefined}>
        <header className="hint-auth-header">
          <button
            type="button"
            onClick={() => {
              if (fromOnboarding) {
                window.history.back();
                return;
              }
              navigate("/app/profile");
            }}
            className="hint-auth-back hint-pressable"
          >
            <ChevronLeft size={17} />
            {fromOnboarding ? "Back" : t("me.settings")}
          </button>
          <div className="hint-auth-brand">
            <span className="hint-auth-sigil">
              {account ? <ShieldCheck size={20} /> : mode === "signup" ? <UserPlus size={20} /> : <LogIn size={20} />}
            </span>
            <div>
              <p>{fromOnboarding ? "Your space" : t("me.account")}</p>
              <h1>{authTitle}</h1>
            </div>
          </div>
          <p className="hint-auth-subtitle">{authSubtitle}</p>
        </header>

        {account ? (
          <section className="hint-auth-card hint-auth-account-card">
            <div className="hint-auth-account-row">
              <span className="hint-auth-account-icon">
                <ShieldCheck size={19} />
              </span>
              <div>
                <p className="hint-auth-kicker">{t("login.signedInAs")}</p>
                <h2>{account.name || accountLabel(account)}</h2>
                <span>{providerLabel(account.provider)} - {accountLabel(account)}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate(fromOnboarding ? "/app" : "/app/profile")}
              className="hint-auth-primary hint-pressable"
            >
              {fromOnboarding ? "Continue to Hint" : t("login.backToProfile")}
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="hint-auth-secondary hint-pressable"
            >
              {fromOnboarding ? "Use a different account" : t("account.logout")}
            </button>
          </section>
        ) : (
          <section className="hint-auth-card">
            {!pending ? (
              <div className="hint-auth-mode" role="tablist" aria-label="Choose account mode">
                {(["signup", "login"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setMode(item);
                      setSignupStep("account");
                      resetVerification(method);
                    }}
                    data-active={mode === item}
                    role="tab"
                    aria-selected={mode === item}
                  >
                    {item === "signup" ? t("account.signup") : t("account.login")}
                  </button>
                ))}
              </div>
            ) : null}

            <form onSubmit={pending ? handleVerify : handleRequestCode} className="hint-auth-form">
              {mode === "signup" ? (
                <div className="hint-auth-stepper" aria-label="Signup progress">
                  {[
                    { id: "account", label: "Account" },
                    { id: "birth", label: "Sky" },
                    { id: "code", label: "Code" },
                  ].map((step, index) => {
                    const active =
                      (step.id === "account" && signupStep === "account" && !pending) ||
                      (step.id === "birth" && signupStep === "birth" && !pending) ||
                      (step.id === "code" && Boolean(pending));
                    const complete =
                      (step.id === "account" && signupStep === "birth") ||
                      (step.id !== "code" && Boolean(pending));
                    return (
                      <span key={step.id} data-active={active ? "true" : "false"} data-complete={complete ? "true" : "false"}>
                        <i>{index + 1}</i>
                        {step.label}
                      </span>
                    );
                  })}
                </div>
              ) : null}

              {mode === "signup" && signupStep === "account" ? (
                <div className="hint-auth-profile-pass">
                  <span>H</span>
                  <div>
                    <p>Private ritual</p>
                    <strong>Readings, astrology, and Sky Deck saved in your space.</strong>
                  </div>
                </div>
              ) : null}

              {mode === "signup" && signupStep === "birth" ? (
                <div className="hint-auth-account-summary">
                  <div>
                    <span>Account</span>
                    <strong>{name.trim() || "Your profile"}</strong>
                    <p>{target || "Verification destination"}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSignupStep("account");
                      setPending(null);
                      setNotice(null);
                      setError(null);
                    }}
                  >
                    Edit
                  </button>
                </div>
              ) : null}

              {mode === "signup" && signupStep === "account" ? (
                <>
                  <label className="hint-auth-field">
                    <span>{t("birthProfile.name")}</span>
                    <input
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder={t("login.namePlaceholder")}
                      autoComplete="name"
                      aria-invalid={error === t("login.error.name")}
                      className="hint-auth-input"
                      data-testid="input-login-name"
                    />
                  </label>

                  <div className="hint-auth-method" role="tablist" aria-label="Choose verification method">
                    {(["email", "phone"] as const).map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => resetVerification(item)}
                        data-active={method === item}
                        role="tab"
                        aria-selected={method === item}
                      >
                        {item === "email" ? <Mail size={14} /> : <Phone size={14} />}
                        {item === "email" ? t("login.email") : t("login.phone")}
                      </button>
                    ))}
                  </div>

                  {method === "email" ? (
                    <label className="hint-auth-field">
                      <span>{t("login.email")}</span>
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => {
                          resetVerification("email");
                          setEmail(event.target.value);
                        }}
                        placeholder="you@example.com"
                        autoComplete="email"
                        inputMode="email"
                        aria-invalid={error === t("login.error.email")}
                        className="hint-auth-input"
                        data-testid="input-login-email"
                      />
                    </label>
                  ) : (
                    <label className="hint-auth-field">
                      <span>{t("login.phone")}</span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(event) => {
                          resetVerification("phone");
                          setPhone(event.target.value);
                        }}
                        placeholder="+1 555 123 4567"
                        autoComplete="tel"
                        inputMode="tel"
                        aria-invalid={error === t("login.error.phone")}
                        className="hint-auth-input"
                        data-testid="input-login-phone"
                      />
                    </label>
                  )}
                </>
              ) : null}

              {mode === "signup" && signupStep === "birth" && !pending ? (
                <div className="hint-auth-birth-panel">
                  <div className="hint-auth-sky-preview" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="hint-auth-field-grid">
                    <label className="hint-auth-field">
                      <span>
                        <CalendarDays size={12} />
                        {t("birthProfile.birthDate")}
                      </span>
                      <input
                        type="text"
                        value={birthDate}
                        onChange={(event) => setBirthDate(formatBirthDateInput(event.target.value))}
                        placeholder="YYYY-MM-DD"
                        autoComplete="bday"
                        inputMode="numeric"
                        maxLength={10}
                        pattern="\d{4}-\d{2}-\d{2}"
                        aria-invalid={error === t("login.error.birthDate")}
                        className="hint-auth-input"
                        data-testid="input-login-birthdate"
                      />
                    </label>
                    <label className="hint-auth-field">
                      <span>
                        <Clock3 size={12} />
                        {t("birthProfile.birthTime")}
                      </span>
                      <input
                        value={birthTime}
                        onChange={(event) => setBirthTime(event.target.value)}
                        type="time"
                        className="hint-auth-input"
                        data-testid="input-login-birthtime"
                      />
                    </label>
                    <label className="hint-auth-field hint-auth-field-full">
                      <span>
                        <MapPin size={12} />
                        {t("birthProfile.birthPlace")}
                      </span>
                      <input
                        type="text"
                        value={birthPlace}
                        onChange={(event) => setBirthPlace(event.target.value)}
                        placeholder={t("login.birthPlacePlaceholder")}
                        autoComplete="address-level2"
                        className="hint-auth-input"
                        data-testid="input-login-birthplace"
                      />
                      <p>{t("login.birthHelp")}</p>
                    </label>
                  </div>
                </div>
              ) : null}

              {mode === "login" ? (
                <>
                  <div className="hint-auth-method" role="tablist" aria-label="Choose verification method">
                    {(["email", "phone"] as const).map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => resetVerification(item)}
                        data-active={method === item}
                        role="tab"
                        aria-selected={method === item}
                      >
                        {item === "email" ? <Mail size={14} /> : <Phone size={14} />}
                        {item === "email" ? t("login.email") : t("login.phone")}
                      </button>
                    ))}
                  </div>

                  {method === "email" ? (
                    <label className="hint-auth-field">
                      <span>{t("login.email")}</span>
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => {
                          resetVerification("email");
                          setEmail(event.target.value);
                        }}
                        placeholder="you@example.com"
                        autoComplete="email"
                        inputMode="email"
                        aria-invalid={error === t("login.error.email")}
                        className="hint-auth-input"
                        data-testid="input-login-email"
                      />
                    </label>
                  ) : (
                    <label className="hint-auth-field">
                      <span>{t("login.phone")}</span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(event) => {
                          resetVerification("phone");
                          setPhone(event.target.value);
                        }}
                        placeholder="+1 555 123 4567"
                        autoComplete="tel"
                        inputMode="tel"
                        aria-invalid={error === t("login.error.phone")}
                        className="hint-auth-input"
                        data-testid="input-login-phone"
                      />
                    </label>
                  )}
                </>
              ) : null}

            {pending ? (
              <label className="hint-auth-field">
                <span>
                  {t("login.verificationCode")}
                </span>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder={t("login.codePlaceholder")}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  aria-invalid={error === t("login.error.codeMismatch")}
                  className="hint-auth-input"
                  data-testid="input-login-code"
                />
                <p>
                  {pending.firebaseConfirmation ? (
                    "A secure SMS code was sent by Firebase. It may take a few seconds to arrive."
                  ) : (
                    <>
                      {t("login.betaCodePrefix")} <span style={{ color: ACCENT.gold }}>{pending.code}</span>. {t("login.betaCodeSuffix")}
                    </>
                  )}
                </p>
              </label>
            ) : null}

            {notice ? (
              <p className="hint-auth-callout">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                {notice}
              </p>
            ) : null}
            {error ? <p className="hint-auth-error">{error}</p> : null}

            <button
              type="submit"
              className="hint-auth-primary hint-pressable"
              disabled={primaryDisabled}
            >
              {pending ? <KeyRound size={15} /> : mode === "signup" ? <UserPlus size={15} /> : <Mail size={15} />}
              {primaryLabel}
            </button>
          </form>

            {showSecondaryActions ? (
              <div className="hint-auth-secondary-block">
                {showTesterAccount ? (
                  <button
                    type="button"
                    onClick={() => void handleUseTesterAccount()}
                    className="hint-auth-secondary hint-pressable"
                    data-testid="button-use-tester-account"
                  >
                    <ShieldCheck size={14} />
                    {t("login.useTester")}
                  </button>
                ) : null}

                {visibleSocialProviders.length > 0 ? (
                  <section>
                    <p className="hint-auth-kicker">{t("login.continueWith")}</p>
                    <div className="hint-auth-social-grid">
                      {visibleSocialProviders.map((provider) => (
                        <button
                          key={provider.id}
                          type="button"
                          onClick={() => void handleSocialProvider(provider.id)}
                          className="hint-auth-secondary hint-pressable"
                          disabled={authBusy}
                        >
                          <span>{provider.mark}</span>
                          {provider.label}
                        </button>
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>
            ) : null}

            <div id="hint-firebase-recaptcha" className="hint-auth-recaptcha" aria-hidden="true" />

            {!fromOnboarding ? (
              <div className="hint-auth-save-list">
                {[
                  t("login.saves.item1"),
                  t("login.saves.item3"),
                ].map((item) => (
                  <div key={item}>
                    <Check size={14} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        )}
        {account || !fromOnboarding ? (
          <section className="hint-auth-mini-preview" aria-label="What Hint unlocks">
            <div>
              <span>Astrology</span>
              <strong>Birth profile ready</strong>
            </div>
            <div>
              <span>Sky Deck</span>
              <strong>Saved to your account</strong>
            </div>
          </section>
        ) : null}
      </div>
    </AppScreen>
  );
}
