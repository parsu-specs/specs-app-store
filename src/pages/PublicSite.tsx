import { ButtonLink } from "../components/Button";
import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";
import { ROUTES, navigateInternalLink } from "./routes";

import HomePage from "./HomePage";
import About from "./About";

export default function PublicSite({ page }: { page: "home" | "about" }) {
  return (
    <div className="flex min-h-screen flex-col pt-27.25 sm:pt-29.25 lg:pt-31.25">
      <SiteHeader />
      <nav aria-label="Site navigation" className="flex flex-wrap justify-center gap-2 px-5 pb-2">
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
            className={`rounded-2xl border-2 border-outline px-3 py-2 text-sm font-black transition-colors ${page === id ? "bg-primary text-primary-foreground" : "bg-transparent text-foreground hover:bg-secondary hover:text-foreground"}`}
          >
            {label}
          </ButtonLink>
        ))}
      </nav>
      <div className="flex-1">{page === "about" ? <About /> : <HomePage />}</div>
      <Footer />
    </div>
  );
}
