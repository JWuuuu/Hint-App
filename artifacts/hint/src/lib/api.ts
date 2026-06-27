import { setBaseUrl } from "@workspace/api-client-react";
import { isNativeShell } from "./mobile";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") ?? "";

export function configureApiClient() {
  setBaseUrl(apiBaseUrl || null);

  if (isNativeShell() && !apiBaseUrl) {
    console.warn(
      "Hint native build is missing VITE_API_BASE_URL. API-backed features need a deployed API URL in mobile builds.",
    );
  }
}

export function apiUrl(path: `/${string}`) {
  return `${apiBaseUrl}${path}`;
}
