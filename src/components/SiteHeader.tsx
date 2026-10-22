import { useAuth } from "../auth/AuthProvider";
import { ROUTES, navigateInternalLink } from "../pages/routes";
import Brand from "./Brand";
import AppearanceControl from "./AppearanceControl";
import { ButtonLink } from "./Button";

export default function SiteHeader({ page }: { page: "home" | "about" }) {
  const { user } = useAuth();
  return (
    <header className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-5 py-6 sm:flex-row sm:flex-wrap sm:items-center sm:px-8 lg:px-10">
      <ButtonLink
        variant="plain"
        href={ROUTES.home}
        onClick={navigateInternalLink}
        aria-label="CodeCanvas home page"
      >
        <Brand />
      </ButtonLink>
      <nav
        aria-label="Site navigation"
        className="flex w-full flex-wrap items-center gap-4 sm:w-auto sm:gap-6"
      >
        <AppearanceControl compact />
        {(
          [
            ["home", "Home", ROUTES.home],
            ["about", "About", ROUTES.about],
          ] as const
        ).map(([id, label, href]) => (
          <ButtonLink
            key={id}
            variant="plain"
            href={href}
            onClick={navigateInternalLink}
            aria-current={page === id ? "page" : undefined}
            className={`text-sm font-black underline-offset-4 hover:underline ${page === id ? "text-primary underline decoration-2" : ""}`}
          >
            {label}
          </ButtonLink>
        ))}
        <ButtonLink
          variant="secondary"
          size="small"
          href={user ? ROUTES.discover : ROUTES.signin}
          onClick={navigateInternalLink}
        >
          {user ? "Back to app" : "Sign in"}
        </ButtonLink>
      </nav>
    </header>
  );
}
