import { useEffect, useState } from "react";

const AUTH_STORAGE_KEY = "hint_local_auth_v1";
const AUTH_UPDATED_EVENT = "hint:local-auth-updated";

export type LocalAccount = {
  identifier: string;
  provider: "email" | "phone" | "google" | "apple" | "facebook";
  email?: string;
  phone?: string;
  name?: string;
  verifiedAt?: string;
  createdAt: string;
  lastSignedInAt: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string) {
  return phone.trim().replace(/[^\d+]/g, "");
}

function normalizeIdentifier(input: { provider: LocalAccount["provider"]; identifier: string }) {
  if (input.provider === "email") return normalizeEmail(input.identifier);
  if (input.provider === "phone") return normalizePhone(input.identifier);
  return input.identifier.trim();
}

export function getLocalAccount(): LocalAccount | null {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalAccount & { email?: string };
    if (!parsed.identifier && parsed.email) {
      return {
        ...parsed,
        identifier: normalizeEmail(parsed.email),
        provider: "email",
        email: normalizeEmail(parsed.email),
      };
    }
    return parsed as LocalAccount;
  } catch {
    return null;
  }
}

export function saveLocalAccount(input: {
  identifier: string;
  provider: LocalAccount["provider"];
  email?: string;
  phone?: string;
  name?: string;
  verifiedAt?: string;
}): LocalAccount {
  const existing = getLocalAccount();
  const now = new Date().toISOString();
  const identifier = normalizeIdentifier(input);
  const account: LocalAccount = {
    identifier,
    provider: input.provider,
    email: input.email ? normalizeEmail(input.email) : input.provider === "email" ? identifier : undefined,
    phone: input.phone ? normalizePhone(input.phone) : input.provider === "phone" ? identifier : undefined,
    name: input.name?.trim() || existing?.name || undefined,
    verifiedAt: input.verifiedAt ?? existing?.verifiedAt ?? now,
    createdAt: existing?.createdAt ?? now,
    lastSignedInAt: now,
  };

  try {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(account));
    window.dispatchEvent(new Event(AUTH_UPDATED_EVENT));
  } catch {
    // The app still treats the submitted account as the current session value.
  }

  return account;
}

export function clearLocalAccount() {
  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.dispatchEvent(new Event(AUTH_UPDATED_EVENT));
  } catch {
    // Best effort only.
  }
}

export function useLocalAccount() {
  const [account, setAccount] = useState<LocalAccount | null>(getLocalAccount);

  useEffect(() => {
    const sync = () => setAccount(getLocalAccount());
    window.addEventListener(AUTH_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(AUTH_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return account;
}
