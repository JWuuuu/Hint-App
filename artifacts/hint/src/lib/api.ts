import { setBaseUrl } from "@workspace/api-client-react";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") ?? "";

export function configureApiClient() {
  setBaseUrl(apiBaseUrl || null);
}

export function apiUrl(path: `/${string}`) {
  return `${apiBaseUrl}${path}`;
}
