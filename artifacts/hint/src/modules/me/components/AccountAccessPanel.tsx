import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  CheckCircle2,
  KeyRound,
  LogOut,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { ACCENT, GLASS } from "../../hold/atmosphere";
import { GlassPanel, SectionLabel } from "../../../components/app/AppChrome";
import { clearLocalAccount, saveLocalAccount, useLocalAccount, type LocalAccount } from "../../../lib/auth";
import { saveBirthProfileFromAccountProfile } from "../../../lib/astro/userBirthProfile";
import { useProfile } from "../../../lib/useProfile";

type AuthMode = "login" | "signup";
type AuthMethod = "email" | "phone";

type PendingVerification = {
  code: string;
  method: AuthMethod;
  target: string;
};

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

function generateVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function methodTarget(method: AuthMethod, email: string, phone: string) {
  return method === "email" ? email.trim().toLowerCase() : normalizePhone(phone);
}

function accountLabel(account: LocalAccount) {
  return account.email ?? account.phone ?? account.identifier;
}

function providerLabel(provider: LocalAccount["provider"]) {
  if (provider === "email") return "Email";
  if (provider === "phone") return "Phone";
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

function Field({
  label,
  children,
  optional,
}: {
  label: string;
  children: ReactNode;
  optional?: boolean;
}) {
  return (
    <label className="block">
      <span
        className="mb-2 flex items-center gap-2 font-sans text-[10px] font-black uppercase tracking-[0.18em]"
        style={{ color: GLASS.muted }}
      >
        {label}
        {optional && <span className="normal-case tracking-normal" style={{ color: GLASS.faint }}>optional</span>}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "h-12 w-full rounded-[18px] px-3.5 font-sans text-[14px] outline-none transition-[border-color,background-color]";

const inputStyle = {
  background: "color-mix(in srgb, var(--hint-surface-soft) 86%, transparent)",
  border: "1px solid var(--hint-border)",
  color: "var(--hint-text)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
} as const;

export function AccountAccessPanel({ onEditProfile }: { onEditProfile: () => void }) {
  const account = useLocalAccount();
  const { anonId, profile, saveProfile } = useProfile();
  const [mode, setMode] = useState<AuthMode>(account ? "login" : "signup");
  const [method, setMethod] = useState<AuthMethod>(account?.provider === "phone" ? "phone" : "email");
  const [email, setEmail] = useState(account?.email ?? "");
  const [phone, setPhone] = useState(account?.phone ?? "");
  const [name, setName] = useState(account?.name ?? profile?.name ?? "");
  const [birthDate, setBirthDate] = useState(formatBirthDateInput(profile?.birthDate ?? ""));
  const [birthTime, setBirthTime] = useState(profile?.birthTime ?? "");
  const [birthPlace, setBirthPlace] = useState(profile?.birthPlace ?? "");
  const [verificationCode, setVerificationCode] = useState("");
  const [pending, setPending] = useState<PendingVerification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const target = methodTarget(method, email, phone);
  const canRequestCode =
    (method === "email" ? emailIsValid(email) : phoneIsValid(phone)) &&
    (mode === "login" || (name.trim().length > 0 && birthDateIsValid(birthDate)));
  const initials = useMemo(() => {
    const source = account?.name ?? profile?.name ?? account?.email ?? "Hint";
    return source
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [account?.email, account?.name, profile?.name]);

  function resetVerification(nextMethod = method) {
    setPending(null);
    setVerificationCode("");
    setNotice(null);
    setError(null);
    setMethod(nextMethod);
  }

  function handleRequestCode(event: FormEvent) {
    event.preventDefault();
    if (mode === "signup" && !name.trim()) {
      setError("Add your name before creating an account.");
      return;
    }
    if (mode === "signup" && !birthDateIsValid(birthDate)) {
      setError("Use a complete birth date in YYYY-MM-DD format.");
      return;
    }
    if (!canRequestCode) {
      setError(method === "email" ? "Enter a valid email address." : "Enter a valid phone number.");
      return;
    }

    const code = generateVerificationCode();
    setPending({ code, method, target });
    setVerificationCode("");
    setError(null);
    setNotice(`Verification code sent to ${target}. Beta code: ${code}`);
  }

  async function handleVerify(event: FormEvent) {
    event.preventDefault();
    if (!pending) {
      setError("Request a code first.");
      return;
    }
    if (verificationCode.trim() !== pending.code) {
      setError("That code does not match.");
      return;
    }

    const verifiedAt = new Date().toISOString();
    saveLocalAccount({
      provider: pending.method,
      identifier: pending.target,
      email: pending.method === "email" ? pending.target : undefined,
      phone: pending.method === "phone" ? pending.target : undefined,
      name: name.trim() || account?.name || profile?.name || undefined,
      verifiedAt,
    });

    if (mode === "signup") {
      const profileInput = {
        name: name.trim(),
        birthDate,
        birthTime: birthTime.trim() || undefined,
        birthPlace: birthPlace.trim() || undefined,
      };
      const saved = await saveProfile(profileInput);
      saveBirthProfileFromAccountProfile(saved, anonId);
    }

    setPending(null);
    setVerificationCode("");
    setError(null);
    setNotice("Account is ready.");
  }

  function handleSignOut() {
    clearLocalAccount();
    setMode("signup");
    setMethod("email");
    setEmail("");
    setPhone("");
    setVerificationCode("");
    setPending(null);
    setNotice("Signed out on this browser.");
    setError(null);
  }

  return (
    <section>
      <SectionLabel>Account</SectionLabel>
      <GlassPanel className="mt-3">
        {account ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div
                className="grid size-14 shrink-0 place-items-center rounded-[22px] border font-serif text-[20px]"
                style={{
                  background: "var(--hint-special-action-bg)",
                  borderColor: "color-mix(in srgb, var(--hint-rose) 28%, var(--hint-border))",
                  color: GLASS.text,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.46)",
                }}
              >
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-[24px] leading-none" style={{ color: GLASS.text }}>
                    Signed in
                  </h2>
                  <ShieldCheck size={17} color={ACCENT.aqua} />
                </div>
                <p className="mt-2 break-words font-sans text-[13px]" style={{ color: GLASS.muted }}>
                  {account.name || profile?.name || accountLabel(account)}
                </p>
                <p className="mt-1 break-words font-sans text-[12px]" style={{ color: GLASS.faint }}>
                  {providerLabel(account.provider)} · {accountLabel(account)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onEditProfile}
                className="hint-soft-button inline-flex h-11 items-center justify-center gap-2 rounded-full font-sans text-[12px] font-black uppercase tracking-[0.12em]"
                style={{
                  color: "var(--hint-special-action-text)",
                }}
              >
                <UserRound size={15} />
                Profile
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="hint-ghost-button inline-flex h-11 items-center justify-center gap-2 rounded-full font-sans text-[12px] font-black uppercase tracking-[0.12em]"
                style={{
                  color: GLASS.muted,
                }}
              >
                <LogOut size={15} />
                Sign out
              </button>
            </div>
            {notice && <p className="font-sans text-[12px]" style={{ color: GLASS.muted }}>{notice}</p>}
          </div>
        ) : (
          <form onSubmit={pending ? handleVerify : handleRequestCode} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2 rounded-full border p-1" style={{ background: "color-mix(in srgb, var(--hint-surface-soft) 72%, transparent)", borderColor: GLASS.border }}>
              {(["signup", "login"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setMode(item);
                    resetVerification();
                  }}
                  className="h-10 rounded-full font-sans text-[12px] font-black uppercase tracking-[0.12em] transition-[background-color,color] active:scale-[0.98]"
                  style={{
                    background: mode === item ? "var(--hint-special-action-bg)" : "transparent",
                    color: mode === item ? "var(--hint-special-action-text)" : GLASS.muted,
                    boxShadow: mode === item ? "inset 0 1px 0 rgba(255,255,255,0.46)" : "none",
                  }}
                >
                  {item === "signup" ? "Sign up" : "Log in"}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(["email", "phone"] as const).map((item) => {
                const Icon = item === "email" ? Mail : Phone;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => resetVerification(item)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full border font-sans text-[12px] font-black uppercase tracking-[0.1em] active:scale-[0.98]"
                    style={{
                      background: method === item ? "color-mix(in srgb, var(--hint-aqua) 18%, var(--hint-surface-soft))" : "color-mix(in srgb, var(--hint-surface-soft) 62%, transparent)",
                      borderColor: method === item ? "color-mix(in srgb, var(--hint-aqua) 36%, var(--hint-border))" : GLASS.border,
                      color: method === item ? ACCENT.aqua : GLASS.muted,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
                    }}
                  >
                    <Icon size={15} />
                    {item}
                  </button>
                );
              })}
            </div>

            {mode === "signup" && (
              <Field label="Name">
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={inputClass}
                  style={inputStyle}
                  autoComplete="name"
                  placeholder="Your name"
                />
              </Field>
            )}

            <Field label={method === "email" ? "Email" : "Phone"}>
              {method === "email" ? (
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={inputClass}
                  style={inputStyle}
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@example.com"
                />
              ) : (
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className={inputClass}
                  style={inputStyle}
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="+1 555 000 0000"
                />
              )}
            </Field>

            {mode === "signup" && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Birth date">
                  <input
                    value={birthDate}
                    onChange={(event) => setBirthDate(formatBirthDateInput(event.target.value))}
                    className={inputClass}
                    style={inputStyle}
                    inputMode="numeric"
                    autoComplete="bday"
                    maxLength={10}
                    placeholder="YYYY-MM-DD"
                  />
                </Field>
                <Field label="Birth time" optional>
                  <input
                    value={birthTime}
                    onChange={(event) => setBirthTime(event.target.value)}
                    className={inputClass}
                    style={inputStyle}
                    type="time"
                  />
                </Field>
                <div className="col-span-2">
                  <Field label="Birth place" optional>
                    <input
                      value={birthPlace}
                      onChange={(event) => setBirthPlace(event.target.value)}
                      className={inputClass}
                      style={inputStyle}
                      placeholder="City, country"
                    />
                  </Field>
                </div>
              </div>
            )}

            {pending && (
              <Field label="Verification code">
                <div className="flex gap-2">
                  <input
                    value={verificationCode}
                    onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    className={inputClass}
                    style={inputStyle}
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6 digits"
                  />
                  <button
                    type="button"
                    onClick={() => resetVerification()}
                    className="hint-ghost-button h-12 rounded-full px-3 font-sans text-[11px] font-black uppercase tracking-[0.1em]"
                    style={{ borderColor: GLASS.border, color: GLASS.muted }}
                  >
                    Reset
                  </button>
                </div>
              </Field>
            )}

            {notice && (
              <p className="flex items-start gap-2 font-sans text-[12px] leading-relaxed" style={{ color: GLASS.muted }}>
                <CheckCircle2 className="mt-0.5 shrink-0" size={14} color={ACCENT.aqua} />
                {notice}
              </p>
            )}
            {error && (
              <p className="font-sans text-[12px] leading-relaxed" style={{ color: ACCENT.lavender }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!pending && !canRequestCode}
              className="hint-soft-button inline-flex h-12 items-center justify-center gap-2 rounded-full font-sans text-[12px] font-black uppercase tracking-[0.14em] transition-[opacity,transform] disabled:opacity-45"
              style={{
                color: "var(--hint-special-action-text)",
              }}
            >
              <KeyRound size={15} color={ACCENT.gold} />
              {pending ? "Verify code" : "Request code"}
            </button>

            <p className="font-sans text-[11px] leading-relaxed" style={{ color: GLASS.faint }}>
              This account is stored for this browser while provider login is being wired.
            </p>
          </form>
        )}
      </GlassPanel>
    </section>
  );
}
