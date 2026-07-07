import type { FirebaseOptions } from "firebase/app";
import type { Auth, ConfirmationResult, RecaptchaVerifier, User } from "firebase/auth";
import type { LocalAccount } from "./auth";

const FIREBASE_APP_NAME = "hint";
const RECAPTCHA_CONTAINER_ID = "hint-firebase-recaptcha";

type FirebaseSocialProvider = "google" | "apple";

export type FirebaseAccountPayload = {
  provider: LocalAccount["provider"];
  identifier: string;
  email?: string;
  phone?: string;
  name?: string;
  verifiedAt: string;
};

export type FirebasePhoneConfirmation = ConfirmationResult;

function envValue(key: string) {
  const value = import.meta.env[key];
  return typeof value === "string" ? value.trim() : "";
}

function firebaseConfig(): FirebaseOptions | null {
  const apiKey = envValue("VITE_FIREBASE_API_KEY");
  const authDomain = envValue("VITE_FIREBASE_AUTH_DOMAIN");
  const projectId = envValue("VITE_FIREBASE_PROJECT_ID");
  const appId = envValue("VITE_FIREBASE_APP_ID");

  if (!apiKey || !authDomain || !projectId || !appId) return null;

  return {
    apiKey,
    authDomain,
    projectId,
    appId,
    storageBucket: envValue("VITE_FIREBASE_STORAGE_BUCKET") || undefined,
    messagingSenderId: envValue("VITE_FIREBASE_MESSAGING_SENDER_ID") || undefined,
    measurementId: envValue("VITE_FIREBASE_MEASUREMENT_ID") || undefined,
  };
}

export function isFirebaseAuthConfigured() {
  return Boolean(firebaseConfig());
}

let authPromise: Promise<Auth> | null = null;

async function getFirebaseAuth(): Promise<Auth> {
  const config = firebaseConfig();
  if (!config) {
    throw new Error("Firebase Auth is not configured. Add the VITE_FIREBASE_* values to the app environment.");
  }

  if (!authPromise) {
    authPromise = (async () => {
      const [{ getApp, getApps, initializeApp }, { getAuth }] = await Promise.all([
        import("firebase/app"),
        import("firebase/auth"),
      ]);
      const app = getApps().some((candidate) => candidate.name === FIREBASE_APP_NAME)
        ? getApp(FIREBASE_APP_NAME)
        : initializeApp(config, FIREBASE_APP_NAME);
      const auth = getAuth(app);
      if (typeof navigator !== "undefined") {
        auth.languageCode = navigator.language || "en";
      }
      return auth;
    })();
  }

  return authPromise;
}

function accountFromFirebaseUser(user: User, provider: LocalAccount["provider"]): FirebaseAccountPayload {
  const email = user.email?.trim().toLowerCase() || undefined;
  const phone = user.phoneNumber?.trim() || undefined;
  return {
    provider,
    identifier: email || phone || user.uid,
    email,
    phone,
    name: user.displayName?.trim() || undefined,
    verifiedAt: new Date().toISOString(),
  };
}

export function firebaseAuthErrorMessage(error: unknown) {
  if (!(error instanceof Error)) return "Authentication failed. Try again.";
  const message = error.message || "Authentication failed. Try again.";
  if (message.includes("auth/popup-closed-by-user")) return "Sign-in was cancelled before it finished.";
  if (message.includes("auth/popup-blocked")) return "The browser blocked the sign-in popup. Allow popups and try again.";
  if (message.includes("auth/invalid-phone-number")) return "Enter the phone number with country code, like +1 555 123 4567.";
  if (message.includes("auth/too-many-requests")) return "Too many attempts. Wait a bit before requesting another code.";
  if (message.includes("auth/invalid-verification-code")) return "That verification code does not match.";
  if (message.includes("auth/code-expired")) return "That verification code expired. Request a new one.";
  if (message.includes("Firebase Auth is not configured")) return message;
  return message;
}

export async function signInWithFirebaseSocial(providerId: FirebaseSocialProvider) {
  const auth = await getFirebaseAuth();
  const { GoogleAuthProvider, OAuthProvider, signInWithPopup } = await import("firebase/auth");

  if (providerId === "google") {
    const provider = new GoogleAuthProvider();
    provider.addScope("profile");
    provider.addScope("email");
    const result = await signInWithPopup(auth, provider);
    return accountFromFirebaseUser(result.user, providerId);
  }

  const provider = new OAuthProvider("apple.com");
  provider.addScope("email");
  provider.addScope("name");
  const result = await signInWithPopup(auth, provider);
  return accountFromFirebaseUser(result.user, providerId);
}

let phoneVerifier: RecaptchaVerifier | null = null;

function ensureRecaptchaContainer() {
  if (typeof document === "undefined") return RECAPTCHA_CONTAINER_ID;
  let container = document.getElementById(RECAPTCHA_CONTAINER_ID);
  if (!container) {
    container = document.createElement("div");
    container.id = RECAPTCHA_CONTAINER_ID;
    container.className = "hint-auth-recaptcha";
    document.body.appendChild(container);
  }
  return RECAPTCHA_CONTAINER_ID;
}

function resetPhoneVerifier() {
  try {
    phoneVerifier?.clear();
  } catch {
    // Best effort only. Firebase recreates the verifier on the next request.
  }
  phoneVerifier = null;
}

export async function requestFirebasePhoneVerification(phone: string) {
  const auth = await getFirebaseAuth();
  const { RecaptchaVerifier, signInWithPhoneNumber } = await import("firebase/auth");
  const containerId = ensureRecaptchaContainer();
  if (!phoneVerifier) {
    phoneVerifier = new RecaptchaVerifier(auth, containerId, {
      size: "invisible",
    });
  }

  try {
    return await signInWithPhoneNumber(auth, phone, phoneVerifier);
  } catch (error) {
    resetPhoneVerifier();
    throw error;
  }
}

export async function confirmFirebasePhoneVerification(confirmation: FirebasePhoneConfirmation, code: string) {
  const result = await confirmation.confirm(code);
  resetPhoneVerifier();
  return accountFromFirebaseUser(result.user, "phone");
}
