const LEGACY_APP_PATHS = [
  "/ask",
  "/rooms",
  "/readings",
  "/me",
  "/profile",
  "/settings",
  "/astrology",
  "/compatibility",
  "/dream",
  "/journal",
  "/daily-pull",
  "/daily",
  "/tarot",
  "/animal-tarot",
  "/sky-deck",
  "/collection",
  "/login",
];

export function toAppPath(path: string): string {
  if (path === "/") return "/app";
  if (path === "/app" || path.startsWith("/app/")) return path;
  if (LEGACY_APP_PATHS.some((prefix) => path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(`${prefix}?`))) {
    return `/app${path}`;
  }
  return path;
}
