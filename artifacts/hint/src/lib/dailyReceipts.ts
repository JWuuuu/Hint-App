import { apiUrl } from "./api";
import { getAnonId, getLocalDateString } from "./identity";

export type DailyReceiptFeature =
  | "daily-card"
  | "daily-tarot"
  | "sky-deck"
  | "energy-score"
  | "collection-rare-reward"
  | "animal-tarot";

export type DailyReceiptSource = "server" | "local-fallback";

export type DailyReceipt = {
  id?: string;
  userId?: string | null;
  anonymousDeviceId: string;
  anonId: string;
  dailyKey: string;
  featureType: DailyReceiptFeature;
  assignedCardId?: string | null;
  orientation?: "upright" | "reversed" | string | null;
  assignedAt: string;
  expiresAt: string;
  openedAt?: string | null;
  lastSeenAt?: string | null;
  serverTime?: string;
  source: DailyReceiptSource;
};

type ReceiptOptions = {
  anonId?: string;
  fallbackAssignedCardId?: string | null;
};

const FALLBACK_STORAGE_KEY = "hint_daily_receipt_fallbacks_v1";
const FALLBACK_EVENT = "hint:daily-receipt-fallback-updated";

function nextLocalMidnight(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
}

function readFallbackReceipts(): DailyReceipt[] {
  try {
    const raw = localStorage.getItem(FALLBACK_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeFallbackReceipts(receipts: DailyReceipt[]) {
  try {
    localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(receipts));
    window.dispatchEvent(new Event(FALLBACK_EVENT));
  } catch {
    // Fallback state is best-effort only; server receipts are authoritative.
  }
}

function makeFallbackReceipt(
  featureType: DailyReceiptFeature,
  { anonId = getAnonId(), fallbackAssignedCardId = null }: ReceiptOptions = {},
): DailyReceipt {
  const now = new Date();
  const dailyKey = getLocalDateString(now);
  const existing = readFallbackReceipts().find(
    (item) => item.anonId === anonId && item.featureType === featureType && item.dailyKey === dailyKey,
  );

  if (existing) return existing;

  const receipt: DailyReceipt = {
    anonymousDeviceId: anonId,
    anonId,
    dailyKey,
    featureType,
    assignedCardId: fallbackAssignedCardId,
    orientation: featureType === "daily-tarot" ? "upright" : null,
    assignedAt: now.toISOString(),
    expiresAt: nextLocalMidnight(now).toISOString(),
    lastSeenAt: now.toISOString(),
    source: "local-fallback",
  };

  writeFallbackReceipts([
    receipt,
    ...readFallbackReceipts().filter(
      (item) => !(item.anonId === anonId && item.featureType === featureType && item.dailyKey === dailyKey),
    ),
  ].slice(0, 120));
  return receipt;
}

async function requestReceipt(
  endpoint: "/api/daily-receipts/get-or-create" | "/api/daily-receipts/open",
  featureType: DailyReceiptFeature,
  { anonId = getAnonId() }: ReceiptOptions = {},
): Promise<DailyReceipt> {
  const response = await fetch(apiUrl(endpoint), {
    method: endpoint.endsWith("/open") ? "PATCH" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ anonId, anonymousDeviceId: anonId, featureType }),
  });

  if (!response.ok) {
    throw new Error(`Daily receipt request failed: ${response.status}`);
  }

  const receipt = (await response.json()) as Omit<DailyReceipt, "source">;
  return { ...receipt, source: "server" };
}

export async function getOrCreateDailyReceipt(
  featureType: DailyReceiptFeature,
  options: ReceiptOptions = {},
): Promise<DailyReceipt> {
  try {
    return await requestReceipt("/api/daily-receipts/get-or-create", featureType, options);
  } catch {
    return makeFallbackReceipt(featureType, options);
  }
}

export async function openDailyReceipt(
  featureType: DailyReceiptFeature,
  options: ReceiptOptions = {},
): Promise<DailyReceipt> {
  try {
    return await requestReceipt("/api/daily-receipts/open", featureType, options);
  } catch {
    const receipt = makeFallbackReceipt(featureType, options);
    const now = new Date().toISOString();
    const opened: DailyReceipt = {
      ...receipt,
      openedAt: receipt.openedAt ?? now,
      lastSeenAt: now,
    };
    writeFallbackReceipts([
      opened,
      ...readFallbackReceipts().filter(
        (item) => !(item.anonId === opened.anonId && item.featureType === opened.featureType && item.dailyKey === opened.dailyKey),
      ),
    ].slice(0, 120));
    return opened;
  }
}

export function parseServerDailyKey(dailyKey: string): Date {
  return new Date(`${dailyKey}T12:00:00`);
}

export function subscribeToDailyReceiptFallbacks(onChange: () => void): () => void {
  window.addEventListener(FALLBACK_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(FALLBACK_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
