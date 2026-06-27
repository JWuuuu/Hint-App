type CapacitorGlobal = {
  getPlatform?: () => string;
  isNativePlatform?: () => boolean;
};

declare global {
  interface Window {
    Capacitor?: CapacitorGlobal;
  }
}

export function isNativeShell(): boolean {
  if (typeof window === "undefined") return false;
  if (window.Capacitor?.isNativePlatform?.()) return true;
  return window.location.protocol === "capacitor:" || window.location.protocol === "ionic:";
}

export function getMobilePlatform(): string {
  if (typeof window === "undefined") return "web";
  return window.Capacitor?.getPlatform?.() ?? (isNativeShell() ? "native" : "web");
}

export function configureMobileRuntime() {
  if (typeof window === "undefined") return;

  const root = document.documentElement;
  const syncViewport = () => {
    root.style.setProperty("--hint-vh", `${window.innerHeight * 0.01}px`);
  };

  root.dataset.hintPlatform = getMobilePlatform();
  root.dataset.hintNative = isNativeShell() ? "true" : "false";
  syncViewport();

  window.addEventListener("resize", syncViewport, { passive: true });
  window.visualViewport?.addEventListener("resize", syncViewport, { passive: true });
}
