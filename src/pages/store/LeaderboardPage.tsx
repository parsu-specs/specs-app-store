import { Heart, Trophy } from "@phosphor-icons/react";
import Avatar from "../../components/Avatar";
import { Button } from "../../components/Button";
import TrophyMark from "../../components/TrophyMark";
import type { StoreController } from "./useStoreController";

type Props = Pick<
  StoreController,
  | "boardTab"
  | "openApp"
  | "openProfile"
  | "profilesLookup"
  | "projectTrophies"
  | "rankedDevelopers"
  | "rankedProjects"
  | "setBoardTab"
  | "trophies"
>;

export default function LeaderboardPage({
  boardTab,
  openApp,
  openProfile,
  profilesLookup,
  projectTrophies,
  rankedDevelopers,
  rankedProjects,
  setBoardTab,
  trophies,
}: Props) {
  return (
    <>
      <section>
        <div className="mb-6">
          <p className="text-xs font-black uppercase text-primary">
            {boardTab === "developers"
              ? "Rank points = upvotes + 20 per published project"
              : "Ranked by project upvotes"}
          </p>
          <h2 className="mt-1 text-2xl font-black">
            {boardTab === "developers" ? "Top developers" : "Top projects"}
          </h2>
          <div
            className="min-w-0 mt-4 flex flex-wrap gap-2 *:min-w-0 max-w-full"
            role="tablist"
            aria-label="Leaderboard view"
          >
            {(["developers", "projects"] as const).map((tab) => (
              <Button
                variant="filter"
                key={tab}
                role="tab"
                aria-selected={boardTab === tab}
                onClick={() => setBoardTab(tab)}
                className="capitalize"
              >
                {tab}
              </Button>
            ))}
          </div>
        </div>
        {boardTab === "developers" ? (
          rankedDevelopers.length ? (
            <ol className="space-y-4">
              {rankedDevelopers.map(({ profile: p, projects, points }, i) => (
                <li
                  key={p.id}
                  className={`min-w-0 toon-card flex flex-wrap items-center gap-3 rounded-lg p-4 sm:flex-nowrap sm:gap-4 sm:p-5 ${i + 1 === 1 ? "bg-podium-gold" : i + 1 === 2 ? "bg-podium-silver" : i + 1 === 3 ? "bg-podium-bronze" : "bg-surface"} *:min-w-0 max-w-full`}
                >
                  <span
                    aria-label={`Rank ${i + 1}`}
                    className={`min-w-0 grid *:min-w-0 h-10 w-10 shrink-0 place-items-center rounded-full border-[3px] border-outline text-base font-black ${i === 0 ? "bg-secondary" : i === 1 ? "bg-success" : i === 2 ? "bg-accent" : "bg-background"} max-w-full`}
                  >
                    {i + 1}
                  </span>
                  <Button
                    variant="plain"
                    onClick={() => openProfile(p.id)}
                    aria-label={`View ${p.name}'s profile`}
                    className="shrink-0"
                  >
                    <Avatar name={p.name} color={p.color} imageUrl={p.imageUrl} size="md" />
                  </Button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-black">
                      <Button
                        variant="text"
                        onClick={() => openProfile(p.id)}
                        className="underline-offset-4 hover:underline"
                      >
                        {p.name}
                      </Button>
                      {trophies.get(p.id) !== undefined && (
                        <TrophyMark place={trophies.get(p.id) as 1 | 2 | 3} />
                      )}
                    </p>
                    <p className="truncate text-sm font-bold text-muted">
                      {projects} {projects === 1 ? "project" : "projects"}
                    </p>
                  </div>
                  <p className="min-w-0 flex shrink-0 items-center gap-1.5 text-base font-black *:min-w-0 max-w-full">
                    <Trophy
                      size={20}
                      weight="duotone"
                      className={i === 0 ? "text-primary" : "text-muted"}
                    />
                    {points}{" "}
                    <span className="text-xs uppercase text-muted">
                      {points === 1 ? "pt" : "pts"}
                    </span>
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <div className="toon-card toon-paper bg-panel rounded-lg p-10 text-center">
              <h3 className="text-xl font-black">No developers yet</h3>
              <p className="font-bold text-muted">Check back once builders join.</p>
            </div>
          )
        ) : rankedProjects.length ? (
          <ol className="space-y-4">
            {rankedProjects.map((app, i) => {
              const creator = app.creatorId
                ? profilesLookup.get(app.creatorId)
                : [...profilesLookup.values()].find(
                    (p) => p.name.toLowerCase() === app.creator.toLowerCase(),
                  );
              return (
                <li
                  key={app.id}
                  className={`min-w-0 toon-card flex flex-wrap items-center gap-3 rounded-lg p-4 sm:flex-nowrap sm:gap-4 sm:p-5 ${i + 1 === 1 ? "bg-podium-gold" : i + 1 === 2 ? "bg-podium-silver" : i + 1 === 3 ? "bg-podium-bronze" : "bg-surface"} max-w-full`}
                >
                  <span
                    aria-label={`Rank ${i + 1}`}
                    className={`min-w-0 grid *:min-w-0 h-10 w-10 shrink-0 place-items-center rounded-full border-[3px] border-outline text-base font-black ${i === 0 ? "bg-secondary" : i === 1 ? "bg-success" : i === 2 ? "bg-accent" : "bg-background"} max-w-full`}
                  >
                    {i + 1}
                  </span>
                  <Button
                    variant="text"
                    onClick={() => openApp(app.id)}
                    aria-label={`Open ${app.title} details`}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block truncate text-lg font-black underline-offset-4 hover:underline">
                      {app.title}
                      {projectTrophies.get(app.id) !== undefined && (
                        <TrophyMark place={projectTrophies.get(app.id) as 1 | 2 | 3} />
                      )}
                    </span>
                    <span className="block truncate text-sm font-bold text-muted">
                      by {creator ? creator.name : app.creator}
                    </span>
                  </Button>
                  <p className="min-w-0 flex shrink-0 items-center gap-1.5 text-base font-black *:min-w-0 max-w-full">
                    <Heart
                      size={20}
                      weight="duotone"
                      className={i === 0 ? "text-vote" : "text-muted"}
                    />
                    {app.votes}{" "}
                    <span className="text-xs uppercase text-muted">
                      {app.votes === 1 ? "vote" : "votes"}
                    </span>
                  </p>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="toon-card toon-paper bg-panel rounded-lg p-10 text-center">
            <h3 className="text-xl font-black">No projects yet</h3>
            <p className="font-bold text-muted">Check back once builders share work.</p>
          </div>
        )}
      </section>
    </>
  );
}
