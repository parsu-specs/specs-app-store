import { createPortal } from "react-dom";
import {
  Gear,
  Info,
  House,
  MagnifyingGlass,
  Newspaper,
  SignOut,
  Trophy,
  User as UserIcon,
  UsersThree,
  ArrowSquareUpRight,
} from "@phosphor-icons/react";
import Brand from "../components/Brand";
import AppearanceControl from "../components/AppearanceControl";
import ErrorBoundary from "../components/ErrorBoundary";
import NotificationBell from "../components/NotificationBell";
import Avatar from "../components/Avatar";
import Popover from "../components/Popover";
import { Button, ButtonLink } from "../components/Button";
import { ROUTES, navigateInternalLink } from "./routes";
import useStoreController from "./store/useStoreController";
import DiscoverPage from "./store/DiscoverPage";
import DevelopersPage from "./store/DevelopersPage";
import FeedPage from "./store/FeedPage";
import LeaderboardPage from "./store/LeaderboardPage";
import ProfilePage from "./store/ProfilePage";
import ProjectPage from "./store/ProjectPage";
import SettingsPage from "./store/SettingsPage";

export default function Store() {
  const store = useStoreController();
  const {
    accountMenuOpen,
    changeNotificationsOpen,
    confirmSignOut,
    copyForView,
    crumbs,
    deleteAllNotifications,
    goPath,
    goTab,
    markAllNotificationsRead,
    markNotificationRead,
    myProfile,
    navClass,
    notificationsOpen,
    openApp,
    openFeed,
    openMyProfile,
    publishBonus,
    seenAt,
    setAccountMenuOpen,
    setConfirmSignOut,
    setNotificationsOpen,
    setPublishBonus,
    signIn,
    threadsLoading,
    unreadIds,
    user,
    view,
    visibleItems,
    voteNotice,
  } = store;
  const pageTitle = copyForView[view]?.title?.trim();
  const pageDescription = copyForView[view]?.description?.trim();
  return (
    <div className="min-h-screen overflow-x-clip">
      <aside className="fixed inset-x-0 top-0 z-40 h-21.25 border-b-[3px] border-outline bg-brand-surface px-3 py-5 text-brand-foreground sm:px-5 lg:inset-y-0 lg:left-0 lg:right-auto lg:flex lg:h-screen lg:w-70 lg:flex-col lg:border-b-0 lg:border-r-[3px] lg:p-7">
        <div className="min-w-0 flex items-center justify-between *:min-w-0 max-w-full">
          <Brand light className="max-lg:max-w-[55%]" />
          <AppearanceControl compact />
        </div>
        <nav
          className="min-w-0 fixed inset-x-0 bottom-0 z-50 grid *:min-w-0 h-18 grid-cols-3 gap-1 border-t-2 border-outline bg-brand-surface p-2 sm:gap-2 lg:static lg:mt-12 lg:flex lg:h-auto lg:flex-col lg:gap-2 lg:border-0 lg:bg-transparent lg:p-0 lg:pr-1 max-w-full"
          aria-label="Main navigation"
        >
          <ButtonLink
            variant="plain"
            href={ROUTES.feed}
            onClick={(event) => goTab(event, "feed")}
            className={`${navClass("feed")} lg:order-3`}
          >
            <Newspaper size={22} weight="duotone" />
            <span>Feed</span>
          </ButtonLink>
          <ButtonLink
            variant="plain"
            href={ROUTES.discover}
            onClick={(event) => goTab(event, "discover")}
            className={`${navClass("discover")} lg:order-1`}
          >
            <MagnifyingGlass size={21} weight="duotone" />
            Discover
          </ButtonLink>
          <ButtonLink
            variant="plain"
            href={ROUTES.developers}
            onClick={(event) => goTab(event, "builders")}
            className={`${navClass("builders")} hidden lg:flex lg:order-2`}
          >
            <UsersThree size={22} weight="duotone" />
            Developers
          </ButtonLink>
          <ButtonLink
            variant="plain"
            href={ROUTES.leaderboard}
            onClick={(event) => goTab(event, "leaderboard")}
            className={`${navClass("leaderboard")} hidden lg:flex lg:order-4`}
          >
            <Trophy size={22} weight="duotone" />
            Leaderboard
          </ButtonLink>
          <ButtonLink
            variant="plain"
            href={ROUTES.settings}
            onClick={(event) => goTab(event, "settings")}
            className={`${navClass("settings")} lg:order-6`}
          >
            <Gear size={22} weight="duotone" />
            Settings
          </ButtonLink>
        </nav>
        <nav
          aria-label="Website"
          className="mt-6 hidden border-t-2 border-surface/30 pt-4 lg:mt-auto lg:block"
        >
          <ButtonLink
            variant="plain"
            href={ROUTES.about}
            onClick={navigateInternalLink}
            className="flex w-full items-center justify-between rounded-lg px-4 py-2 text-sm hover:bg-surface/15"
          >
            <span>About</span> <ArrowSquareUpRight size={20} />
          </ButtonLink>
          <ButtonLink
            variant="plain"
            href={ROUTES.landing}
            onClick={navigateInternalLink}
            className="flex w-full items-center justify-between rounded-lg px-4 py-2 text-sm hover:bg-surface/15"
          >
            <span>Landing</span> <ArrowSquareUpRight size={20} />
          </ButtonLink>
        </nav>
      </aside>

      {confirmSignOut &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Confirm sign out"
            onClick={() => setConfirmSignOut(false)}
            className="min-w-0 fixed inset-0 z-100 flex items-center justify-center overflow-y-auto bg-inverse/80 p-4 *:min-w-0 max-w-full"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="toon-card my-auto w-full max-w-sm rounded-lg bg-surface p-6 text-center"
            >
              <SignOut size={28} weight="duotone" className="mx-auto" />
              <h2 className="mt-3 text-xl font-black">Sign out?</h2>
              <p className="mt-1 text-sm font-bold text-muted">
                Are you sure you want to sign out?
              </p>
              <div className="min-w-0 mt-5 flex flex-wrap justify-center gap-3 *:min-w-0 max-w-full">
                <Button
                  variant="surface"
                  size="small"
                  onClick={() => setConfirmSignOut(false)}
                  autoFocus
                >
                  Cancel
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => {
                    setConfirmSignOut(false);
                    void signIn();
                  }}
                >
                  Yes, sign out
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {publishBonus &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Project published"
            onClick={() => setPublishBonus(null)}
            className="min-w-0 fixed inset-0 z-100 flex items-center justify-center overflow-y-auto bg-inverse/80 p-4 *:min-w-0 max-w-full"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="toon-card my-auto w-full max-w-sm rounded-lg bg-surface p-6 text-center"
            >
              <Trophy size={40} weight="duotone" className="mx-auto text-primary" />
              <h2 className="mt-3 text-xl font-black">Project published!</h2>
              <p className="mt-1 text-sm font-bold text-muted">
                {publishBonus.title} is live — plus 20 pts on the developer leaderboard.
              </p>
              <div className="min-w-0 mt-5 flex justify-center gap-3 *:min-w-0 max-w-full">
                <Button
                  variant="surface"
                  size="small"
                  onClick={() => setPublishBonus(null)}
                  autoFocus
                >
                  Keep exploring
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => {
                    openApp(publishBonus.id);
                    setPublishBonus(null);
                  }}
                >
                  View project
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {voteNotice &&
        createPortal(
          <div
            role="alert"
            className="min-w-0 pointer-events-none fixed inset-x-0 bottom-24 z-100 flex justify-center px-4 *:min-w-0 max-w-full"
          >
            <p className="toon-card rounded-xl bg-surface px-5 py-3 text-center text-sm font-black">
              {voteNotice}
            </p>
          </div>,
          document.body,
        )}

      <div className="min-w-0">
        <header className="fixed right-3 top-0 z-60 flex h-21.25 max-w-[45%] items-center sm:right-4 lg:left-70 lg:right-0 lg:z-40 lg:max-w-none lg:justify-between lg:gap-4 lg:border-b-[3px] lg:bg-panel lg:px-8 lg:py-4">
          <nav aria-label="Breadcrumb" className="hidden min-w-0 flex-1 text-sm lg:block">
            <ol className="flex min-w-0 flex-1 flex-wrap items-center gap-2 *:min-w-0 max-w-full">
              {crumbs.map((c, i) => (
                <li
                  key={`${c.label}-${i}`}
                  className="flex min-w-0 items-center gap-3 *:min-w-0 max-w-full"
                >
                  {i > 0 && (
                    <span aria-hidden="true" className="font-black">
                      \
                    </span>
                  )}
                  {c.current || !c.go ? (
                    <span
                      aria-current={c.current ? "page" : undefined}
                      title={c.label}
                      className={`min-w-0 max-w-full wrap-anywhere px-2 py-0.5 font-black ${c.current ? "rounded-md border-2 border-outline bg-secondary" : ""}`}
                    >
                      {c.label}
                    </span>
                  ) : (
                    <Button variant="ghost" onClick={c.go} title={`Go to ${c.label}`} className="">
                      {c.label}
                    </Button>
                  )}
                </li>
              ))}
            </ol>
          </nav>
          <div className="relative min-w-0 max-w-full shrink-0 lg:max-w-[45%]">
            <div className="relative flex min-w-0 max-w-full items-center gap-2 *:min-w-0">
              {user && (
                <NotificationBell
                  items={visibleItems}
                  unreadIds={unreadIds}
                  arrivalAt={seenAt}
                  loading={threadsLoading}
                  open={notificationsOpen}
                  onOpenChange={changeNotificationsOpen}
                  onOpenApp={(appId) => openApp(appId)}
                  onOpenFeed={openFeed}
                  onMarkAllRead={markAllNotificationsRead}
                  onMarkRead={markNotificationRead}
                  onDeleteAll={deleteAllNotifications}
                />
              )}
              <Popover
                open={accountMenuOpen}
                onOpenChange={setAccountMenuOpen}
                id="account-menu"
                label="Profile and site menu"
                className="w-56 p-2 text-sm"
                trigger={
                  <Button
                    type="button"
                    variant="secondary"
                    size="compact"
                    aria-label="Open profile and site menu"
                    title={myProfile?.name ?? "Account"}
                    aria-haspopup="dialog"
                    aria-expanded={accountMenuOpen}
                    aria-controls={accountMenuOpen ? "account-menu" : undefined}
                    onClick={() => {
                      setNotificationsOpen(false);
                      setAccountMenuOpen((open) => !open);
                    }}
                    className="shrink-0 max-md:[&>span:last-child]:p-0! max-md:[&>span:last-child]:will-change-[translate]"
                  >
                    {myProfile ? (
                      <Avatar
                        name={myProfile.name}
                        color={myProfile.color}
                        imageUrl={myProfile.imageUrl}
                        size="sm"
                        className="h-7! w-7! rounded-[13px] border-0! text-xs text-foreground md:h-5! md:w-5! md:rounded-full md:border-2! md:border-outline! md:text-[8px]!"
                      />
                    ) : (
                      <span className="grid h-7 w-7 place-items-center rounded-[13px] md:h-5 md:w-5 md:rounded-full">
                        <UserIcon size={20} weight="bold" />
                      </span>
                    )}
                    <span className="hidden min-w-0 max-w-24 truncate text-xs font-black md:block">
                      {myProfile?.name ?? "Account"}
                    </span>
                  </Button>
                }
              >
                {myProfile && (
                  <Button
                    variant="menu"
                    type="button"
                    onClick={() => openMyProfile()}
                    aria-current={view === "profile" ? "page" : undefined}
                    className="gap-3"
                  >
                    <Avatar
                      name={myProfile.name}
                      color={myProfile.color}
                      imageUrl={myProfile.imageUrl}
                      size="sm"
                      className="border-outline!"
                    />
                    <span className="min-w-0 truncate">My profile</span>
                  </Button>
                )}
                <div className="lg:hidden">
                  <Button
                    variant="menu"
                    type="button"
                    onClick={() => {
                      setAccountMenuOpen(false);
                      goPath(ROUTES.developers, "builders");
                    }}
                    className="gap-3"
                  >
                    <UsersThree size={20} weight="duotone" />
                    Developers
                  </Button>
                  <Button
                    variant="menu"
                    type="button"
                    onClick={() => {
                      setAccountMenuOpen(false);
                      goPath(ROUTES.leaderboard, "leaderboard");
                    }}
                    className="gap-3"
                  >
                    <Trophy size={20} weight="duotone" />
                    Leaderboard
                  </Button>
                  <div className="my-1 border-t-2 border-dashed border-muted" />
                  <ButtonLink
                    variant="menu"
                    href={ROUTES.about}
                    onClick={(event) => {
                      setAccountMenuOpen(false);
                      navigateInternalLink(event);
                    }}
                    className="gap-3"
                  >
                    <Info size={20} weight="duotone" />
                    About
                  </ButtonLink>
                  <ButtonLink
                    variant="menu"
                    href={ROUTES.landing}
                    onClick={navigateInternalLink}
                    className="gap-3"
                  >
                    <House size={20} weight="duotone" /> Landing page
                  </ButtonLink>
                  <div className="my-1 border-t-2 border-dashed border-muted" />
                </div>
                <Button
                  variant="menu"
                  type="button"
                  onClick={() => {
                    setAccountMenuOpen(false);
                    setConfirmSignOut(true);
                  }}
                  className="gap-3 text-danger"
                >
                  <SignOut size={20} weight="bold" />
                  Sign out
                </Button>
              </Popover>
            </div>
          </div>
        </header>
        <div className="min-w-0 max-w-full px-4 pb-23 pt-27.25 sm:px-8 sm:pb-25 sm:pt-29.25 lg:ml-70 lg:p-10 lg:pt-31.25">
          {(pageTitle || pageDescription) && (
            <header id="discover" className="mx-auto max-w-6xl scroll-mt-5">
              <div className="min-w-0 flex flex-wrap items-center justify-between gap-3 *:min-w-0 max-w-full">
                <div className="flex-1">
                  {pageTitle && <h1 className="text-2xl font-black sm:text-3xl">{pageTitle}</h1>}
                  {pageDescription && (
                    <p className="mt-2 hidden max-w-2xl text-muted sm:block">{pageDescription}</p>
                  )}
                </div>
              </div>
            </header>
          )}
          <ErrorBoundary name={view} key={view}>
            <div
              className={`@container/content mx-auto min-w-0 max-w-6xl wrap-anywhere ${pageTitle || pageDescription ? "mt-5 sm:mt-6" : ""}`}
            >
              {view === "discover" && <DiscoverPage {...store} />}

              {view === "project" && <ProjectPage {...store} />}

              {view === "profile" && <ProfilePage {...store} />}

              {view === "builders" && <DevelopersPage {...store} />}

              {view === "feed" && <FeedPage {...store} />}

              {view === "leaderboard" && <LeaderboardPage {...store} />}

              {view === "settings" && <SettingsPage {...store} />}

              <footer className="mb-8 mt-12 border-t-2 border-dashed border-muted py-7 text-center text-sm font-bold text-muted">
                CodeCanvas · Est. 2026 · Society of Programmers and Enthusiasts in Computer Science
                (SPECS)
              </footer>
            </div>
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
