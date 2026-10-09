export const ROUTES = {
  root: "/",
  landing: "/landing",
  about: "/about",
  signin: "/signin",
  discover: "/discover",
  developers: "/developers",
  feed: "/feed",
  leaderboard: "/leaderboard",
  profile: "/profile",
  settings: "/settings",
} as const;

export function normalizePathname(pathname: string) {
  const clean = pathname.replace(/\/+$/g, "") || "/";
  if (clean === "/") return "/";
  return clean;
}

export function isProtectedRoute(pathname: string) {
  const clean = normalizePathname(pathname);
  return (
    clean === ROUTES.discover ||
    clean === ROUTES.signin ||
    clean === ROUTES.profile ||
    clean === ROUTES.settings ||
    clean === ROUTES.leaderboard ||
    clean === ROUTES.feed ||
    clean === ROUTES.developers ||
    clean.startsWith("/developers/") ||
    clean.startsWith("/discover/") ||
    clean.startsWith("/apps/")
  );
}
