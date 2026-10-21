import { MagnifyingGlass } from "@phosphor-icons/react";
import Avatar from "../../components/Avatar";
import { ButtonLink } from "../../components/Button";
import Input from "../../components/Input";
import TrophyMark from "../../components/TrophyMark";
import { developerProfilePath } from "../routes";
import type { StoreController } from "./useStoreController";

type Props = Pick<
  StoreController,
  "countFor" | "devQuery" | "filteredProfiles" | "openProfile" | "setDevQuery" | "trophies" | "view"
>;

export default function DevelopersPage({
  countFor,
  devQuery,
  filteredProfiles,
  openProfile,
  setDevQuery,
  trophies,
}: Props) {
  return (
    <>
      <section id="builders" className="scroll-mt-6">
        <div className="mb-6">
          <label className="relative block max-w-md">
            <span className="sr-only">Search developers</span>
            <MagnifyingGlass
              size={20}
              weight="bold"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
            />
            <Input
              value={devQuery}
              onChange={(event) => setDevQuery(event.target.value)}
              className="py-2.5 pl-11 text-sm"
              placeholder="Search name or role…"
            />
          </label>
        </div>
        <div className="min-w-0 toon-card toon-paper bg-panel grid *:min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-x-6 gap-y-8 rounded-lg p-4 pt-10 sm:p-8 sm:pt-12 max-w-full">
          {filteredProfiles.map((p) => {
            const place = trophies.get(p.id);
            return (
              <article
                key={p.id}
                className={`min-w-0 ${place !== undefined ? "rounded-lg border-[3px] border-outline p-3" : ""} ${place === 1 ? "bg-podium-gold" : place === 2 ? "bg-podium-silver" : place === 3 ? "bg-podium-bronze" : ""}`}
              >
                <div className="min-w-0 flex items-center gap-3 *:min-w-0 max-w-full">
                  <ButtonLink
                    variant="plain"
                    href={developerProfilePath(p.id)}
                    onClick={(e) => {
                      e.preventDefault();
                      openProfile(p.id);
                    }}
                    aria-label={`View ${p.name}'s profile`}
                    className="shrink-0"
                  >
                    <Avatar name={p.name} color={p.color} imageUrl={p.imageUrl} size="md" />
                  </ButtonLink>
                  <h3 className="min-w-0 flex-1 wrap-break-word text-lg font-black">
                    <ButtonLink
                      variant="plain"
                      href={developerProfilePath(p.id)}
                      onClick={(e) => {
                        e.preventDefault();
                        openProfile(p.id);
                      }}
                      className="underline-offset-4 hover:underline"
                    >
                      {p.name}
                    </ButtonLink>
                    {trophies.get(p.id) !== undefined && (
                      <TrophyMark place={trophies.get(p.id) as 1 | 2 | 3} />
                    )}
                  </h3>
                </div>
                <p className="mt-2 text-sm text-muted">{p.role}</p>
                <p className="mt-3 text-xs font-black uppercase">
                  {countFor(p)} project{countFor(p) === 1 ? "" : "s"} shared
                </p>
              </article>
            );
          })}
          {filteredProfiles.length === 0 && (
            <p className="font-bold text-muted col-span-full">
              No developers match “{devQuery.trim()}”.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
