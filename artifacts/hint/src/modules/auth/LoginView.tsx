import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  AlertCircle,
  ArrowRight,
  Check,
  KeyRound,
  LogIn,
  Mail,
  Phone,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { AppScreen, GlassPanel, ScreenHeader, SectionLabel } from "../../components/app/AppChrome";
import { ACCENT, GLASS } from "../hold/atmosphere";
import { clearLocalAccount, saveLocalAccount, useLocalAccount, type LocalAccount } from "../../lib/auth";
import { saveBirthProfile, saveBirthProfileFromAccountProfile } from "../../lib/astro/userBirthProfile";
import { ASTROLOGY_TESTER_ACCOUNT } from "../../lib/testerAccount";
import { useProfile } from "../../lib/useProfile";
import { useLanguage } from "../../lib/i18n";

type AuthMode = "login" | "signup";
type AuthMethod = "email" | "phone";
type SocialProvider = "apple" | "google" | "facebook";

type PendingVerification = {
  code: string;
  method: AuthMethod;
  target: string;
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

export function LoginView() {
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const account = useLocalAccount();
  const { anonId, saveProfile } = useProfile();
  const [mode, setMode] = useState<AuthMode>(() => readInitialMode(Boolean(account)));
  const [method, setMethod] = useState<AuthMethod>(account?.provider === "phone" ? "phone" : "email");
  const [email, setEmail] = useState(account?.email ?? "");
  const [phone, setPhone] = useState(account?.phone ?? "");
  const [name, setName] = useState(account?.name ?? "");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [pending, setPending] = useState<PendingVerification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const target = methodTarget(method, email, phone);
  const canRequestCode =
    (method === "email" ? emailIsValid(email) : phoneIsValid(phone)) &&
    (mode === "login" || (name.trim().length > 0 && birthDateIsValid(birthDate)));

  function resetVerification(nextMethod = method) {
    setPending(null);
    setVerificationCode("");
    setNotice(null);
    setError(null);
    setMethod(nextMethod);
  }

  function handleRequestCode(event: React.FormEvent) {
    event.preventDefault();
    if (mode === "signup" && !name.trim()) {
      setError(t("login.error.name"));
      return;
    }
    if (mode === "signup" && !birthDateIsValid(birthDate)) {
      setError(t("login.error.birthDate"));
      return;
    }
    if (!canRequestCode) {
      setError(method === "email" ? t("login.error.email") : t("login.error.phone"));
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
    if (verificationCode.trim() !== pending.code) {
      setError(t("login.error.codeMismatch"));
      return;
    }

    const verifiedAt = new Date().toISOString();
    saveLocalAccount({
      provider: pending.method,
      identifier: pending.target,
      email: pending.method === "email" ? pending.target : undefined,
      phone: pending.method === "phone" ? pending.target : undefined,
      name: mode === "signup" ? name : account?.name,
      verifiedAt,
    });
    if (mode === "signup") {
      const profileInput = {
        name: name.trim(),
        birthDate,
        birthTime: birthTime.trim() || undefined,
        birthPlace: birthPlace.trim() || undefined,
      };
      await saveProfile(profileInput);
      saveBirthProfileFromAccountProfile({ anonId, ...profileInput }, anonId);
    }
    setError(null);
    setNotice(null);
    navigate("/app/profile");
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
    navigate("/app/astrology?tab=birth");
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
    resetVerification("email");
  }

  function handleSocialProvider(provider: SocialProvider) {
    const url = SOCIAL_AUTH_URLS[provider];
    const label = SOCIAL_PROVIDERS.find((item) => item.id === provider)?.label ?? provider;
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
      <ScreenHeader
        eyebrow={t("me.account")}
        title={account ? t("login.accountSaved") : t("login.title")}
        subtitle={t("login.subtitle")}
        sigil={account ? ShieldCheck : LogIn}
        backHref="/app/profile"
        backLabel={t("me.settings")}
      />

      <div className="flex flex-col gap-4">
        <GlassPanel hero>
          <div className="flex flex-wrap gap-2">
            {(["signup", "login"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setMode(item);
                  resetVerification(method);
                }}
                className="rounded-full border px-4 py-2 font-sans text-[12px] font-black uppercase tracking-[0.12em]"
                style={{
                  background: mode === item ? "rgba(203,168,102,0.18)" : "rgba(255,255,255,0.04)",
                  borderColor: mode === item ? "rgba(203,168,102,0.58)" : GLASS.border,
                  color: mode === item ? ACCENT.gold : GLASS.muted,
                }}
              >
                {item === "signup" ? t("account.signup") : t("account.login")}
              </button>
            ))}
          </div>

          <div className="mt-5">
            <p className="font-serif text-[10px] uppercase tracking-[0.28em]" style={{ color: GLASS.muted }}>
              {t("login.verifyDirectly")}
            </p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {(["email", "phone"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => resetVerification(item)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border font-sans text-[12px] font-black uppercase tracking-[0.1em]"
                style={{
                  background: method === item ? "rgba(100,156,158,0.16)" : "rgba(255,255,255,0.04)",
                  borderColor: method === item ? "rgba(100,156,158,0.38)" : GLASS.border,
                  color: method === item ? ACCENT.aqua : GLASS.muted,
                }}
              >
                {item === "email" ? <Mail size={14} /> : <Phone size={14} />}
                {item === "email" ? t("login.email") : t("login.phone")}
              </button>
            ))}
          </div>

          <form onSubmit={pending ? handleVerify : handleRequestCode} className="mt-4 grid gap-4">
            {mode === "signup" ? (
              <label className="block">
                <span className="font-serif text-[10px] uppercase tracking-[0.28em]" style={{ color: GLASS.muted }}>
                  {t("birthProfile.name")}
                </span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={t("login.namePlaceholder")}
                  autoComplete="name"
                  className="mt-2 h-12 w-full rounded-[8px] bg-transparent px-4 font-serif text-[15px] outline-none"
                  style={{ background: "rgba(0,0,0,0.25)", border: `1px solid ${GLASS.border}`, color: GLASS.text }}
                />
              </label>
            ) : null}

            {mode === "signup" ? (
              <div className="grid gap-4">
                <label className="block">
                  <span className="font-serif text-[10px] uppercase tracking-[0.28em]" style={{ color: GLASS.muted }}>
                    {t("birthProfile.birthDate")}
                  </span>
                  <input
                    value={birthDate}
                    onChange={(event) => setBirthDate(formatBirthDateInput(event.target.value))}
                    placeholder="YYYY-MM-DD"
                    autoComplete="bday"
                    inputMode="numeric"
                    maxLength={10}
                    className="mt-2 h-12 w-full rounded-[8px] bg-transparent px-4 font-serif text-[15px] outline-none"
                    style={{ background: "rgba(0,0,0,0.25)", border: `1px solid ${GLASS.border}`, color: GLASS.text }}
                  />
                </label>
                <label className="block">
                  <span className="font-serif text-[10px] uppercase tracking-[0.28em]" style={{ color: GLASS.muted }}>
                    {t("birthProfile.birthTime")}
                  </span>
                  <input
                    value={birthTime}
                    onChange={(event) => setBirthTime(event.target.value)}
                    type="time"
                    className="mt-2 h-12 w-full rounded-[8px] bg-transparent px-4 font-serif text-[15px] outline-none"
                    style={{ background: "rgba(0,0,0,0.25)", border: `1px solid ${GLASS.border}`, color: GLASS.text }}
                  />
                </label>
                <label className="block">
                  <span className="font-serif text-[10px] uppercase tracking-[0.28em]" style={{ color: GLASS.muted }}>
                    {t("birthProfile.birthPlace")}
                  </span>
                  <input
                    value={birthPlace}
                    onChange={(event) => setBirthPlace(event.target.value)}
                    placeholder={t("login.birthPlacePlaceholder")}
                    autoComplete="address-level2"
                    className="mt-2 h-12 w-full rounded-[8px] bg-transparent px-4 font-serif text-[15px] outline-none"
                    style={{ background: "rgba(0,0,0,0.25)", border: `1px solid ${GLASS.border}`, color: GLASS.text }}
                  />
                  <p className="mt-2 font-sans text-[11px] leading-relaxed" style={{ color: GLASS.faint }}>
                    {t("login.birthHelp")}
                  </p>
                </label>
              </div>
            ) : null}

            {method === "email" ? (
              <label className="block">
                <span className="font-serif text-[10px] uppercase tracking-[0.28em]" style={{ color: GLASS.muted }}>
                  {t("login.email")}
                </span>
                <input
                  value={email}
                  onChange={(event) => {
                    resetVerification("email");
                    setEmail(event.target.value);
                  }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  inputMode="email"
                  className="mt-2 h-12 w-full rounded-[8px] bg-transparent px-4 font-serif text-[15px] outline-none"
                  style={{ background: "rgba(0,0,0,0.25)", border: `1px solid ${GLASS.border}`, color: GLASS.text }}
                />
              </label>
            ) : (
              <label className="block">
                <span className="font-serif text-[10px] uppercase tracking-[0.28em]" style={{ color: GLASS.muted }}>
                  {t("login.phone")}
                </span>
                <input
                  value={phone}
                  onChange={(event) => {
                    resetVerification("phone");
                    setPhone(event.target.value);
                  }}
                  placeholder="+1 555 123 4567"
                  autoComplete="tel"
                  inputMode="tel"
                  className="mt-2 h-12 w-full rounded-[8px] bg-transparent px-4 font-serif text-[15px] outline-none"
                  style={{ background: "rgba(0,0,0,0.25)", border: `1px solid ${GLASS.border}`, color: GLASS.text }}
                />
              </label>
            )}

            {pending ? (
              <label className="block">
                <span className="font-serif text-[10px] uppercase tracking-[0.28em]" style={{ color: GLASS.muted }}>
                  {t("login.verificationCode")}
                </span>
                <input
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder={t("login.codePlaceholder")}
                  inputMode="numeric"
                  className="mt-2 h-12 w-full rounded-[8px] bg-transparent px-4 font-serif text-[15px] outline-none"
                  style={{ background: "rgba(0,0,0,0.25)", border: `1px solid ${GLASS.border}`, color: GLASS.text }}
                />
                <p className="mt-2 font-sans text-[11px] leading-relaxed" style={{ color: GLASS.faint }}>
                  {t("login.betaCodePrefix")} <span style={{ color: ACCENT.gold }}>{pending.code}</span>. {t("login.betaCodeSuffix")}
                </p>
              </label>
            ) : null}

            {notice ? (
              <p className="flex gap-2 rounded-[8px] border p-3 font-sans text-[12px] leading-relaxed" style={{ borderColor: GLASS.border, color: GLASS.muted }}>
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                {notice}
              </p>
            ) : null}
            {error ? <p className="font-sans text-[12px]" style={{ color: ACCENT.lavender }}>{error}</p> : null}

            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] font-serif text-[12px] uppercase tracking-[0.22em] transition-opacity disabled:opacity-45"
              style={{
                background: "rgba(206,178,110,0.14)",
                border: "1px solid rgba(206,178,110,0.34)",
                color: ACCENT.gold,
              }}
              disabled={!pending && !canRequestCode}
            >
              {pending ? <KeyRound size={15} /> : mode === "signup" ? <UserPlus size={15} /> : <Mail size={15} />}
              {pending ? t("login.verifyCode") : t("login.requestCode")}
            </button>
          </form>

          {account ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="mt-4 font-sans text-[12px] font-semibold"
              style={{ color: GLASS.faint }}
            >
              {t("login.signOutOf").replace("{account}", accountLabel(account) ?? "")}
            </button>
          ) : null}

          <div className="mt-5 grid gap-4 border-t pt-5" style={{ borderColor: GLASS.border }}>
            <button
              type="button"
              onClick={() => void handleUseTesterAccount()}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-[8px] border font-serif text-[11px] uppercase tracking-[0.16em] transition-opacity hover:opacity-85"
              style={{
                background: "rgba(100,156,158,0.12)",
                borderColor: "rgba(100,156,158,0.3)",
                color: ACCENT.aqua,
              }}
              data-testid="button-use-tester-account"
            >
              <ShieldCheck size={14} />
              {t("login.useTester")}
            </button>

            <section>
              <p className="font-serif text-[10px] uppercase tracking-[0.28em]" style={{ color: GLASS.muted }}>
                {t("login.continueWith")}
              </p>
              <div className="mt-3 grid gap-2">
                {SOCIAL_PROVIDERS.map((provider) => (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => handleSocialProvider(provider.id)}
                    className="flex h-11 items-center justify-center gap-2 rounded-[8px] border font-sans text-[12px] font-black transition-opacity hover:opacity-85"
                    style={{
                      background: "rgba(255,255,255,0.045)",
                      borderColor: GLASS.border,
                      color: GLASS.text,
                    }}
                  >
                    <span className="grid size-5 place-items-center rounded-full border text-[11px]" style={{ borderColor: GLASS.border }}>
                      {provider.mark}
                    </span>
                    {provider.label}
                  </button>
                ))}
              </div>
            </section>
          </div>
        </GlassPanel>

        <section>
          <SectionLabel>{t("login.whatThisSaves")}</SectionLabel>
          <GlassPanel>
            <div className="grid gap-4">
              {[
                t("login.saves.item1"),
                t("login.saves.item2"),
                t("login.saves.item3"),
                t("login.saves.item4"),
              ].map((item) => (
                <div key={item} className="flex gap-3">
                  <Check size={16} color={ACCENT.aqua} className="mt-0.5 shrink-0" />
                  <p className="font-sans text-[12.5px] leading-relaxed" style={{ color: GLASS.muted }}>
                    {item}
                  </p>
                </div>
              ))}
            </div>
            <Link
              href="/app/profile"
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] font-serif text-[12px] uppercase tracking-[0.2em]"
              style={{ background: "rgba(100,156,158,0.14)", border: "1px solid rgba(100,156,158,0.28)", color: ACCENT.aqua }}
            >
              {t("login.backToProfile")}
              <ArrowRight size={15} />
            </Link>
          </GlassPanel>
        </section>
      </div>
    </AppScreen>
  );
}
