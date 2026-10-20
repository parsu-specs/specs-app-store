import { ButtonLink, Button } from "../components/Button";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { EnvelopeSimple, Sparkle, X } from "@phosphor-icons/react";
import Avatar from "../components/Avatar";
import Brand from "../components/Brand";
import Footer from "../components/Footer";
import SiteHeader from "../components/SiteHeader";
import { APP_INFO, CONTACT_EMAIL, TEAM } from "../data/team";

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
      <SiteHeader page="about" />

      <header className="mx-auto max-w-6xl px-5 pb-4 pt-10 text-center sm:px-8">
        <Brand className="min-w-0 mb-6 inline-flex [&>*]:min-w-0 max-w-full" />
        <p className="min-w-0 inline-flex -rotate-2 items-center gap-2 border-2 border-dashed border-purple px-3 py-1 text-xs font-black uppercase text-purple mx-auto bg-surface [&>*]:min-w-0 max-w-full">
          About the app
        </p>
        <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-black sm:text-5xl">{APP_INFO.name}</h1>
        <p className="mx-auto mt-3 max-w-2xl text-lg font-bold text-muted">{APP_INFO.tagline}</p>
        <p className="mx-auto mt-5 max-w-3xl leading-8 text-body">{APP_INFO.description}</p>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8" aria-label="Features">
        <div className="mb-6 text-center">
          <p className="text-xs font-black uppercase text-purple">What you can do here</p>
          <h2 className="mt-1 text-2xl font-black">Everything in one place.</h2>
        </div>
        <div className="min-w-0 grid [&>*]:min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-6 max-w-full">
          {APP_INFO.features.map((f, i) => (
            <article
              key={f.title}
              className={`toon-card toon-paper bg-paper rounded-lg p-6 pt-10 ${i % 3 === 0 ? "rotate-[-1deg]" : i % 3 === 1 ? "rotate-1" : "rotate-[-.5deg]"}`}
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
        <div className="min-w-0 grid [&>*]:min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-6 max-w-full">
          {TEAM.map((member) => (
            <article key={member.name} className="toon-card rounded-lg bg-surface p-6 text-center">
              <div className="min-w-0 flex justify-center [&>*]:min-w-0 max-w-full">
                {member.imageUrl ? (
                  <Button
                    variant="plain"
                    type="button"
                    onClick={() =>
                      setLightbox({ src: member.imageUrl as string, name: member.name })
                    }
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
                  </Button>
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
          <p className="mt-2 font-bold text-muted">Reach us directly — we read everything.</p>
        </div>
        <div className="toon-card toon-paper rounded-lg bg-sky p-6 pt-10 text-center sm:p-8 sm:pt-12">
          <EnvelopeSimple size={40} weight="duotone" className="mx-auto text-purple" />
          <p className="mt-4 font-bold text-body">Email us anytime at</p>
          <ButtonLink
            variant="plain"
            href={`mailto:${CONTACT_EMAIL}`}
            className="mt-1 inline-block break-all text-xl font-black text-purple underline decoration-2 underline-offset-4 sm:text-2xl"
          >
            {CONTACT_EMAIL}
          </ButtonLink>
        </div>
      </section>

      <div
        className="min-w-0 pointer-events-none flex justify-center [&>*]:min-w-0 max-w-full"
        aria-hidden="true"
      >
        <Sparkle size={40} weight="duotone" className="text-pink" />
      </div>

      {lightbox &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${lightbox.name}'s photo full size`}
            onClick={() => setLightbox(null)}
            className="min-w-0 fixed inset-0 z-100 flex items-center justify-center overflow-y-auto bg-ink/80 p-4 [&>*]:min-w-0 max-w-full"
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
              <Button
                variant="icon"
                size="default"
                type="button"
                onClick={() => setLightbox(null)}
                aria-label="Close full size image"
                autoFocus
                className="absolute right-3 top-3"
              >
                <X size={18} weight="bold" />
              </Button>
            </div>
          </div>,
          document.body,
        )}

      <Footer />
    </div>
  );
}
