import {
  ChatCircleDots,
  HandsClapping,
  LinkSimple,
  MagnifyingGlass,
  Newspaper,
  PaperPlaneTilt,
} from "@phosphor-icons/react";
import DeleteMenu from "../../components/DeleteMenu";
import Comments from "../../components/Comments";
import Avatar from "../../components/Avatar";
import Dropdown from "../../components/Dropdown";
import { Button } from "../../components/Button";
import Input, { Textarea } from "../../components/Input";
import TrophyMark from "../../components/TrophyMark";
import MilestoneStamp, { MilestoneTimeProvider } from "../../components/MilestoneStamp";
import type { StoreController } from "./useStoreController";

type Props = Pick<
  StoreController,
  | "cheer"
  | "cheerPending"
  | "deleteMilestone"
  | "filteredMilestones"
  | "fullApps"
  | "loadMilestones"
  | "mAppId"
  | "mBody"
  | "mPostError"
  | "mPosting"
  | "milestones"
  | "milestonesError"
  | "milestonesLoading"
  | "msQuery"
  | "openApp"
  | "openProfile"
  | "openThreads"
  | "postMilestone"
  | "profilesLookup"
  | "projectTrophies"
  | "setMAppId"
  | "setMBody"
  | "setMsQuery"
  | "toggleThread"
  | "trophies"
  | "user"
>;

export default function FeedPage({
  cheer,
  cheerPending,
  deleteMilestone,
  filteredMilestones,
  fullApps,
  loadMilestones,
  mAppId,
  mBody,
  mPostError,
  mPosting,
  milestones,
  milestonesError,
  milestonesLoading,
  msQuery,
  openApp,
  openProfile,
  openThreads,
  postMilestone,
  profilesLookup,
  projectTrophies,
  setMAppId,
  setMBody,
  setMsQuery,
  toggleThread,
  trophies,
  user,
}: Props) {
  return (
    <MilestoneTimeProvider>
      <section id="feed" className="mx-auto max-w-4xl scroll-mt-6">
        <div className="min-w-0">
          <form onSubmit={(e) => void postMilestone(e)} className="">
            <h3 className="min-w-0 flex items-center gap-2 text-lg font-black *:min-w-0 max-w-full">
              <Newspaper size={22} weight="duotone" className="text-primary" />
              Share with the community
            </h3>
            <div className="mt-3">
              <label htmlFor="milestone-body" className="sr-only">
                What's on your mind?
              </label>
              <Textarea
                id="milestone-body"
                value={mBody}
                onChange={(e) => setMBody(e.target.value)}
                maxLength={280}
                showCharacterCount
                required
                placeholder="What's on your mind?"
                rows={3}
                className="min-h-24 leading-7"
              >
                {(characterCount) => (
                  <>
                    <div className="min-w-0 md:w-fit">
                      <Dropdown
                        triggerVariant="minimal"
                        mobileIcon={<LinkSimple size={20} weight="duotone" />}
                        label="Attach one of your projects (optional)"
                        value={mAppId}
                        onChange={setMAppId}
                        options={[
                          { value: "", label: "No linked project" },
                          ...(user
                            ? fullApps
                                .filter((a) =>
                                  a.creatorId ? a.creatorId === user.id : a.creator === user.name,
                                )
                                .map((a) => ({ value: a.id, label: a.title }))
                            : []),
                        ]}
                      />
                    </div>
                    <span className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-3">
                      {characterCount}
                      <Button
                        variant="minimal"
                        size="small"
                        type="submit"
                        disabled={mPosting || !mBody.trim()}
                        aria-label={mPosting ? "Sending update" : "Send update"}
                        aria-busy={mPosting}
                        title={mPosting ? "Sending update" : "Send update"}
                        className="shrink-0"
                      >
                        <PaperPlaneTilt size={20} weight="duotone" aria-hidden="true" />
                      </Button>
                    </span>
                  </>
                )}
              </Textarea>
            </div>
            {mPostError && (
              <p role="alert" className="mt-3 text-sm font-bold">
                {mPostError}
              </p>
            )}
          </form>

          <label className="relative mt-4 block">
            <span className="sr-only">Search updates</span>
            <MagnifyingGlass
              size={20}
              weight="bold"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
            />
            <Input
              type="search"
              value={msQuery}
              onChange={(event) => setMsQuery(event.target.value)}
              className="py-2.5 pl-11 text-sm"
              placeholder="Search posts or builders…"
            />
          </label>

          {milestonesLoading ? (
            <p className="mt-6 font-bold text-muted">Loading feed…</p>
          ) : milestonesError ? (
            <div className="toon-card bg-surface mt-4 rounded-lg p-8 text-center">
              <h3 className="text-xl font-black">Could not load the feed</h3>
              <p className="font-bold text-muted">{milestonesError}</p>
              <Button variant="secondary" onClick={() => void loadMilestones()} className="mt-5">
                Retry
              </Button>
            </div>
          ) : filteredMilestones.length ? (
            <ul className="mt-4 space-y-3">
              {filteredMilestones.map((m) => {
                const p = profilesLookup.get(m.authorId);
                const linked = m.appId ? fullApps.find((a) => a.id === m.appId) : undefined;
                return (
                  <li key={m.id} className="toon-card rounded-lg bg-surface p-4 sm:p-5">
                    <div className="min-w-0 flex items-center gap-3 *:min-w-0 max-w-full">
                      {p ? (
                        <Button
                          variant="plain"
                          onClick={() => openProfile(p.id)}
                          aria-label={`View ${p.name}'s profile`}
                          className="shrink-0"
                        >
                          <Avatar name={p.name} color={p.color} imageUrl={p.imageUrl} size="sm" />
                        </Button>
                      ) : (
                        <Avatar name={m.authorName} color="sky" size="sm" />
                      )}
                      <div className="min-w-0 flex flex-row gap-4 items-center justify-between w-full md:justify-start">
                        <p className="truncate text-sm font-black">
                          {p ? (
                            <Button variant="text" onClick={() => openProfile(p.id)} className="">
                              {m.authorName}
                            </Button>
                          ) : (
                            m.authorName
                          )}
                          {trophies.get(m.authorId) !== undefined && (
                            <TrophyMark place={trophies.get(m.authorId) as 1 | 2 | 3} size={16} />
                          )}
                        </p>
                        <p className="text-xs font-bold text-muted">
                          <MilestoneStamp createdAt={m.createdAt} />
                        </p>
                      </div>
                      {user?.id === m.authorId && (
                        <DeleteMenu
                          label="Options for your update"
                          onDelete={() => deleteMilestone(m)}
                        />
                      )}
                    </div>
                    <p className="mt-3 leading-7">{m.body}</p>
                    <div className="min-w-0 mt-3 flex flex-wrap items-center gap-3 *:min-w-0 max-w-full">
                      {linked && (
                        <Button
                          variant="plain"
                          onClick={() => openApp(linked.id)}
                          className="rounded-md border-2 border-outline bg-background px-2.5 py-1 text-xs font-black hover:bg-secondary"
                        >
                          {linked.title}
                          {projectTrophies.get(linked.id) !== undefined && (
                            <TrophyMark
                              place={projectTrophies.get(linked.id) as 1 | 2 | 3}
                              size={14}
                            />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="vote"
                        onClick={() => void cheer(m)}
                        aria-pressed={Boolean(m.viewerHasCheered)}
                        disabled={!user || cheerPending.has(m.id)}
                        className={m.viewerHasCheered ? "" : "text-muted"}
                      >
                        <HandsClapping size={18} weight={m.viewerHasCheered ? "fill" : "duotone"} />
                        {m.cheers ?? 0}
                        <span className="sr-only">
                          {m.viewerHasCheered ? "Uncheer" : "Cheer this on"}
                        </span>
                      </Button>
                      <Button
                        variant="plain"
                        onClick={() => toggleThread(m.id)}
                        aria-expanded={openThreads.has(m.id)}
                        className="min-w-0 flex items-center gap-1 text-sm font-black text-muted transition-colors hover:text-primary *:min-w-0 max-w-full"
                      >
                        <ChatCircleDots size={18} weight="duotone" />
                        {openThreads.has(m.id) ? "Hide comments" : "Comment"}
                      </Button>
                    </div>
                    {openThreads.has(m.id) && (
                      <div className="mt-3 border-t-2 border-dashed border-divider pt-4">
                        <Comments
                          appId={`ms:${m.id}`}
                          appTitle={`Update by ${m.authorName}`}
                          currentUser={user ?? null}
                          profiles={profilesLookup}
                          trophies={trophies}
                          onOpenProfile={openProfile}
                        />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="toon-card toon-paper bg-panel mt-6 rounded-lg p-10 text-center">
              <h3 className="text-xl font-black">
                {milestones.length ? "No matching posts" : "Your feed starts here"}
              </h3>
              <p className="font-bold text-muted">
                {milestones.length
                  ? "Try a different search."
                  : "Share what you’re building and start a conversation."}
              </p>
            </div>
          )}
        </div>
      </section>
    </MilestoneTimeProvider>
  );
}
