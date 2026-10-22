import { useState } from "react";
import { ListBullets, MagnifyingGlass, SquaresFour } from "@phosphor-icons/react";
import Avatar from "../../components/Avatar";
import { Button, ButtonLink } from "../../components/Button";
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
  const [layout, setLayout] = useState<"grid" | "list">("grid");

  return (
    <>
      <section id="builders" className="scroll-mt-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <label className="relative block w-full max-w-md">
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
          <div role="group" aria-label="Developer view" className="flex shrink-0 gap-2">
            <Button
              variant="outline-flat"
              className="px-3 py-2"
              aria-pressed={layout === "grid"}
              onClick={() => setLayout("grid")}
            >
              <SquaresFour size={20} aria-hidden="true" />
              Grid
            </Button>
            <Button
              variant="outline-flat"
              className="px-3 py-2"
              aria-pressed={layout === "list"}
              onClick={() => setLayout("list")}
            >
              <ListBullets size={20} aria-hidden="true" />
              List
            </Button>
          </div>
        </div>
        <div
          className={`min-w-0 toon-card toon-paper bg-panel grid *:min-w-0 gap-4 rounded-lg p-4 pt-10 sm:p-8 sm:pt-12 max-w-full ${layout === "grid" ? "grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))]" : "grid-cols-1"}`}
        >
          {filteredProfiles.map((p) => {
            const place = trophies.get(p.id);
            return (
              <article
                key={p.id}
                className={`min-w-0 rounded-lg border-[3px] p-4 ${place !== undefined ? "border-outline" : "border-transparent"} ${place === 1 ? "bg-podium-gold" : place === 2 ? "bg-podium-silver" : place === 3 ? "bg-podium-bronze" : ""} ${layout === "list" ? "grid items-center gap-x-6 gap-y-2 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]" : ""}`}
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
                      variant="text"
                      href={developerProfilePath(p.id)}
                      onClick={(e) => {
                        e.preventDefault();
                        openProfile(p.id);
                      }}
                      className=""
                    >
                      {p.name}
                    </ButtonLink>
                  </h3>
                  {place !== undefined && <TrophyMark minimal place={place as 1 | 2 | 3} />}
                </div>
                <p
                  className={`min-w-0 wrap-break-word text-sm text-muted ${layout === "grid" ? "mt-2" : ""}`}
                >
                  {p.role}
                </p>
                <p
                  className={`text-xs font-black uppercase ${layout === "grid" ? "mt-3" : "md:text-right"}`}
                >
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
