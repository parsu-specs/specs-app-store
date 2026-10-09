import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, EnvelopeSimple, Sparkle, X } from "@phosphor-icons/react";
import Avatar from "../components/Avatar";
import Brand from "../components/Brand";
import Footer from "../components/Footer";
import { APP_INFO, CONTACT_EMAIL, TEAM } from "../data/team";
import { ROUTES } from "./routes";

export default function About() {
  const [lightbox, setLightbox] = useState<{ src: string; name: string } | null>(null);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox]);
  return (
    <div className="min-h-screen">
      <div className="px-5 pt-6 sm:px-8 lg:px-10">
        <a
          href={ROUTES.root}
          className="inline-flex items-center gap-2 text-sm font-black underline-offset-4 hover:underline"
        >
          <ArrowLeft size={18} weight="bold" /> Back to home
        </a>
      </div>

      <header className="mx-auto max-w-6xl px-5 pb-4 pt-10 text-center sm:px-8">
        <Brand className="mb-6 inline-flex" />
        <p className="ink-stamp mx-auto bg-surface">About the app</p>
        <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-black sm:text-5xl">{APP_INFO.name}</h1>
        <p className="mx-auto mt-3 max-w-2xl text-lg font-bold text-muted">{APP_INFO.tagline}</p>
        <p className="mx-auto mt-5 max-w-3xl leading-8 text-body">{APP_INFO.description}</p>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8" aria-label="Features">
        <div className="mb-6 text-center">
          <p className="text-xs font-black uppercase text-purple">What you can do here</p>
          <h2 className="mt-1 text-2xl font-black">Everything in one place.</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {APP_INFO.features.map((f, i) => (
            <article
              key={f.title}
              className={`toon-card paper-note rounded-lg p-6 pt-10 ${i % 3 === 0 ? "rotate-[-1deg]" : i % 3 === 1 ? "rotate-1" : "rotate-[-.5deg]"}`}
            >
              <h3 className="text-xl font-black">{f.title}</h3>
              <p className="mt-2 leading-7 text-body">{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8" aria-label="Team">
        <div className="mb-6 text-center">
          <p className="text-xs font-black uppercase text-purple">The builders</p>
          <h2 className="mt-1 text-2xl font-black">Developers of the Specs App Store.</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TEAM.map((member) => (
            <article key={member.name} className="toon-card rounded-lg bg-surface p-6 text-center">
              <div className="flex justify-center">
                {member.imageUrl ? (
                  <button
                    type="button"
                    onClick={() => setLightbox({ src: member.imageUrl as string, name: member.name })}
                    aria-label={`View ${member.name}'s photo full size`}
                    title="View full size"
                    className="rounded-full transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple"
                  >
                    <Avatar
                      name={member.name}
                      color={member.color}
                      imageUrl={member.imageUrl}
                      size="xl"
                    />
                  </button>
                ) : (
                  <Avatar
                    name={member.name}
                    color={member.color}
                    imageUrl={member.imageUrl}
                    size="xl"
                  />
                )}
              </div>
              <h3 className="mt-4 text-xl font-black">{member.name}</h3>
              <p className="mt-1 text-sm font-black uppercase text-purple">{member.role}</p>
              <p className="mt-2 text-sm leading-6 text-muted">{member.bio}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-10 sm:px-8" aria-label="Contact">
        <div className="mb-6 text-center">
          <p className="text-xs font-black uppercase text-purple">Contact</p>
          <h2 className="mt-1 text-2xl font-black">Suggestions, concerns, or bug reports.</h2>
          <p className="mt-2 font-bold text-muted">
            Reach us directly — we read everything.
          </p>
        </div>
        <div className="toon-card paper-note rounded-lg bg-sky p-6 pt-10 text-center sm:p-8 sm:pt-12">
          <EnvelopeSimple size={40} weight="duotone" className="mx-auto text-purple" />
          <p className="mt-4 font-bold text-body">Email us anytime at</p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="mt-1 inline-block break-all text-xl font-black text-purple underline decoration-2 underline-offset-4 sm:text-2xl"
          >
            {CONTACT_EMAIL}
          </a>
        </div>
      </section>

      <div className="pointer-events-none flex justify-center" aria-hidden="true">
        <Sparkle size={40} weight="duotone" className="text-pink" />
      </div>

      {lightbox &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${lightbox.name}'s photo full size`}
            onClick={() => setLightbox(null)}
            className="fixed inset-0 z-100 flex items-center justify-center overflow-y-auto bg-ink/80 p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="toon-card relative my-auto max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-lg bg-surface"
            >
              <img
                src={lightbox.src}
                alt={`${lightbox.name}'s photo full size`}
                className="max-h-[85vh] w-full object-contain"
              />
              <button
                type="button"
                onClick={() => setLightbox(null)}
                aria-label="Close full size image"
                autoFocus
                className="absolute right-3 top-3 rounded-full border-2 border-ink bg-surface p-2"
              >
                <X size={18} weight="bold" />
              </button>
            </div>
          </div>,
          document.body,
        )}

      <Footer />
    </div>
  );
}
