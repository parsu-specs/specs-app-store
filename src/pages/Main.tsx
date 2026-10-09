import React, { Suspense, lazy, useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { ROUTES, isProtectedRoute, normalizePathname } from "./routes";

// Route-split: each page (and its heavy deps like markdown/GitHub readers)
// loads on demand instead of inflating the first paint.
const About = lazy(() => import("./About"));
const Login = lazy(() => import("./Login"));
const Store = lazy(() => import("./Store"));
const Landing = lazy(() => import("./Landing"));

function PageLoader() {
  return (
    <main className="grid min-h-screen place-items-center">
      <div className="font-loader" role="status" aria-label="Loading CodeCanvas">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </main>
  );
}

function currentPath() {
  return normalizePathname(window.location.pathname);
}

export default function Main() {
  const { user, loading } = useAuth();
  const [path, setPath] = useState(currentPath());

  useEffect(() => {
    const onPopState = () => setPath(currentPath());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (loading) return;

    const current = currentPath();
    const normalized = normalizePathname(current);
    const destination = user
      ? normalized === ROUTES.root || normalized === ROUTES.signin
        ? ROUTES.discover
        : null
      : normalized === ROUTES.root
        ? ROUTES.landing
        : isProtectedRoute(normalized)
          ? ROUTES.signin
          : null;

    if (destination && destination !== normalized) {
      window.history.replaceState({}, "", destination);
      setPath(destination);
    } else if (normalized !== current) {
      setPath(normalized);
    }
  }, [loading, path, user]);

  if (loading) return <PageLoader />;

  const normalizedPath = normalizePathname(path);

  let page: React.ReactNode;
  if (normalizedPath === ROUTES.about) page = <About />;
  else if (normalizedPath === ROUTES.landing || (normalizedPath === ROUTES.root && !user))
    page = <Landing />;
  else if (user) page = <Store key={normalizedPath} />;
  else if (isProtectedRoute(normalizedPath) || normalizedPath === ROUTES.signin) page = <Login />;
  else page = <Landing />;

  return (
    <main className="min-h-screen">
      <Suspense fallback={<PageLoader />}>{page}</Suspense>
    </main>
  );
}
