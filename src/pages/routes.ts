export const ROUTES = {
  root: "/",
  landing: "/landing",
  about: "/about",
  signin: "/signin",
  discover: "/discover",
  developers: "/developers",
  feed: "/feed",
  community: "/community",
  leaderboard: "/leaderboard",
  profile: "/profile",
  settings: "/settings",
  apps: "/apps",
} as const;

export function appDetailsPath(appId: string) {
  return `${ROUTES.apps}/${encodeURIComponent(appId)}`;
}

export function developerProfilePath(profileId: string) {
  return `${ROUTES.developers}/${encodeURIComponent(profileId)}`;
}

export function normalizePathname(pathname: string) {
  const clean = pathname.replace(/\/+$/g, "") || ROUTES.root;
  if (clean === ROUTES.root) return ROUTES.root;
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
    clean === ROUTES.community ||
    clean === ROUTES.developers ||
    clean.startsWith(`${ROUTES.developers}/`) ||
    clean.startsWith(`${ROUTES.discover}/`) ||
    clean.startsWith(`${ROUTES.apps}/`)
  );
}
