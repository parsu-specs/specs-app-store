import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Bell,
  ChatCircleDots,
  Heart,
  RocketLaunch,
  Sparkle,
  ThumbsUp,
  UsersThree,
  X,
} from "@phosphor-icons/react";
import UploadStamp from "./UploadStamp";
import { arrivalKeyOf } from "../utils/notifications";
import type { NotificationItem } from "../data/types";
import { Button } from "./Button";

type NotificationBellProps = {
  items: NotificationItem[];
  unreadIds: Set<string>;
  /** First-seen timestamps per id — vote/collab aggregates display these. */
  arrivalAt: Record<string, string>;
  loading: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenApp: (appId: string) => void;
  onOpenFeed: () => void;
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
  onDeleteAll: () => void;
};

const KIND_ICON: Record<NotificationItem["kind"], typeof Bell> = {
  comment: ChatCircleDots,
  reply: ChatCircleDots,
  vote: Heart,
  like: ThumbsUp,
  project: RocketLaunch,
  update: Sparkle,
  collab: UsersThree,
};

const KIND_LABEL: Record<NotificationItem["kind"], string> = {
  comment: "Comment",
  reply: "Reply",
  vote: "Upvotes",
  like: "Like",
  project: "New project",
  update: "Feed",
  collab: "Collaborator",
};

export default function NotificationBell({
  items,
  unreadIds,
  arrivalAt,
  loading,
  open,
  onOpenChange,
  onOpenApp,
  onOpenFeed,
  onMarkAllRead,
  onMarkRead,
  onDeleteAll,
}: NotificationBellProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const unread = items.filter((i) => unreadIds.has(i.id)).length;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const go = (item: NotificationItem) => {
    onMarkRead(item.id);
    onOpenChange(false);
    if (item.appId) onOpenApp(item.appId);
    else onOpenFeed();
  };

  // Aggregates carry their project's date as createdAt (no event time
  // exists), so their stamp shows the arrival instead — otherwise a fresh
  // tag/vote on an old project reads as a stale reused row. The arrival key
  // versions content, so an edit shows the edit's arrival, not the first.
  const stampTitle = (item: NotificationItem): string | undefined => {
    const arrived = arrivalAt[arrivalKeyOf(item)];
    if (!arrived || Number.isNaN(Date.parse(arrived))) return undefined;
    const when = new Date(arrived).toLocaleString();
    const uploaded = new Date(item.createdAt).toLocaleString();
    return item.kind === "vote"
      ? `New upvotes ${when} · Project uploaded ${uploaded}`
      : item.kind === "like"
        ? `Liked your comment ${when}`
        : `Tagged as collaborator ${when} · Project uploaded ${uploaded}`;
  };

  return (
    <div className="relative">
      <Button
        type="button"
        variant="surface"
        size="compact-icon"
        onClick={() => onOpenChange(!open)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        title="Notifications"
        className="relative text-ink"
      >
        <Bell size={20} weight={unread > 0 ? "fill" : "duotone"} aria-hidden="true" />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-2 -top-2 min-w-5 rounded-full border-2 border-outline bg-alert px-1 text-center text-[10px] font-black leading-4 text-surface"
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </Button>

      {open && (
        <>
          <Button
            variant="text"
            type="button"
            aria-label="Close notifications"
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 z-40 cursor-default bg-transparent"
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-label="Notifications"
            className="min-w-0 toon-card absolute right-0 top-full z-50 mt-2 flex max-h-[70vh] w-80 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl bg-surface text-ink [&>*]:min-w-0"
          >
            <div className="min-w-0 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b-[3px] border-outline p-3 [&>*]:min-w-0 max-w-full">
              <h2 className="text-base font-black">Notifications{unread > 0 && ` (${unread})`}</h2>
              <div className="min-w-0 flex shrink-0 items-center gap-2 [&>*]:min-w-0 max-w-full">
                {unread > 0 && (
                  <Button
                    variant="plain"
                    type="button"
                    onClick={() => onMarkAllRead()}
                    className="text-xs font-black underline decoration-2 underline-offset-4"
                  >
                    Mark all read
                  </Button>
                )}
                {items.length > 0 && (
                  <Button
                    variant="text"
                    type="button"
                    onClick={() => onDeleteAll()}
                    title="Delete all notifications"
                    className="text-xs font-black text-alert underline decoration-2 underline-offset-4"
                  >
                    Delete all
                  </Button>
                )}
                <Button
                  variant="icon"
                  size="compact"
                  type="button"
                  onClick={() => onOpenChange(false)}
                  aria-label="Close notifications"
                  autoFocus
                  className=""
                >
                  <X size={14} weight="bold" />
                </Button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
              {loading ? (
                <p className="p-3 text-sm font-bold text-muted">Checking for updates…</p>
              ) : items.length === 0 ? (
                <div className="p-5 text-center">
                  <Bell size={28} weight="duotone" className="mx-auto text-muted" />
                  <p className="mt-2 font-black">All caught up</p>
                  <p className="mt-1 text-sm font-bold text-muted">
                    Comments, replies, upvotes, new projects, and Feed posts land here.
                  </p>
                </div>
              ) : (
                <ul className="space-y-1">
                  {items.map((item) => {
                    const Icon = KIND_ICON[item.kind];
                    const isUnread = unreadIds.has(item.id);
                    return (
                      <li key={item.id}>
                        <Button
                          variant="icon"
                          size="small"
                          type="button"
                          onClick={() => go(item)}
                          className={`min-w-0 flex w-full items-start gap-2.5 rounded-lg border-2 p-2.5 text-left hover:bg-cream ${
                            isUnread ? "border-outline bg-cream/60" : "border-transparent"
                          } [&>*]:min-w-0 max-w-full`}
                        >
                          <span className="mt-0.5">
                            <Icon size={16} weight="duotone" aria-hidden="true" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="min-w-0 flex flex-wrap items-center gap-2 [&>*]:min-w-0 max-w-full">
                              <span className="rounded-full bg-purple/15 px-1.5 py-0.5 text-[10px] font-black uppercase text-purple">
                                {KIND_LABEL[item.kind]}
                              </span>
                              {isUnread && (
                                <span
                                  aria-label="Unread"
                                  className="h-2 w-2 shrink-0 rounded-full bg-alert"
                                />
                              )}
                            </span>
                            <span className="mt-1 block truncate text-sm font-black">
                              {item.title}
                            </span>
                            <span className="mt-0.5 block line-clamp-2 text-xs font-bold text-muted">
                              {item.body}
                            </span>
                            <span className="min-w-0 mt-1 flex items-center gap-1 [&>*]:min-w-0 max-w-full">
                              {item.kind === "vote" ||
                              item.kind === "collab" ||
                              item.kind === "like" ? (
                                <UploadStamp
                                  createdAt={item.createdAt}
                                  displayAt={arrivalAt[arrivalKeyOf(item)]}
                                  titleText={stampTitle(item)}
                                />
                              ) : (
                                <UploadStamp createdAt={item.createdAt} />
                              )}
                              <ArrowRight
                                size={12}
                                weight="bold"
                                aria-hidden="true"
                                className="ml-auto shrink-0 text-muted"
                              />
                            </span>
                          </span>
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
