import type { AppItem } from "../data/types";

// Keep the legacy queue and pause handling available for re-enabling the limiter.
export const VOTE_RATE_LIMIT_ENABLED = false;
export const VOTE_DEBOUNCE_MS = 500;

export type VoteUpdate = {
  appId: string;
  userId: string;
  votes: number;
  viewerHasVoted: boolean;
  pending: boolean;
  saved?: boolean;
  error?: string;
};
export type VoteState = Pick<AppItem, "id" | "votes" | "viewerHasVoted">;
type Entry = {
  app: VoteState;
  userId: string;
  desired: boolean;
  version: number;
  timer?: ReturnType<typeof setTimeout>;
  running: boolean;
  save: (liked: boolean) => Promise<VoteState>;
};

/** Shared by cards and project details; only one request per project/user at a time. */
export function createDebouncedVotes() {
  const entries = new Map<string, Entry>();
  const listeners = new Set<(update: VoteUpdate) => void>();
  const keyOf = (appId: string, userId: string) => JSON.stringify([userId, appId]);
  const snapshot = (entry: Entry, extra: Partial<VoteUpdate> = {}): VoteUpdate => {
    const confirmed = Boolean(entry.app.viewerHasVoted);
    return {
      appId: entry.app.id,
      userId: entry.userId,
      votes: Math.max(0, entry.app.votes + Number(entry.desired) - Number(confirmed)),
      viewerHasVoted: entry.desired,
      pending: entry.running || entry.timer !== undefined,
      ...extra,
    };
  };
  const emit = (entry: Entry, extra: Partial<VoteUpdate> = {}) => {
    for (const listener of listeners) listener(snapshot(entry, extra));
  };
  const finish = (key: string, entry: Entry) => {
    if (!entry.running && entry.timer === undefined) entries.delete(key);
  };
  const flush = async (key: string, entry: Entry) => {
    if (entry.running) return;
    if (entry.desired === Boolean(entry.app.viewerHasVoted)) {
      emit(entry);
      finish(key, entry);
      return;
    }
    const desired = entry.desired;
    const version = entry.version;
    entry.running = true;
    try {
      const app = await entry.save(desired);
      if (entries.get(key) !== entry) return;
      if (Boolean(app.viewerHasVoted) !== desired) {
        throw new Error("Could not save like. Try again.");
      }
      entry.app = app;
      emit(entry, { saved: true });
    } catch (error) {
      if (entries.get(key) !== entry) return;
      // Roll back this failed intent immediately; preserve clicks made during the request.
      if (entry.version === version) entry.desired = Boolean(entry.app.viewerHasVoted);
      emit(entry, { error: error instanceof Error ? error.message : "Could not like. Try again." });
    } finally {
      entry.running = false;
      if (entries.get(key) === entry) {
        emit(entry);
        if (entry.timer === undefined && entry.desired !== Boolean(entry.app.viewerHasVoted)) {
          // A newer intent already completed its debounce while this request was running.
          void flush(key, entry);
        } else finish(key, entry);
      }
    }
  };
  return {
    cancelUser(userId: string) {
      for (const [key, entry] of entries) {
        if (entry.userId !== userId) continue;
        if (entry.timer !== undefined) clearTimeout(entry.timer);
        entry.timer = undefined;
        entry.desired = Boolean(entry.app.viewerHasVoted);
        entries.delete(key);
        emit(entry, { pending: false });
      }
    },
    project<T extends VoteState>(app: T, userId?: string): T {
      const entry = userId ? entries.get(keyOf(app.id, userId)) : undefined;
      if (!entry) return app;
      return {
        ...app,
        votes: Math.max(
          0,
          entry.app.votes + Number(entry.desired) - Number(Boolean(entry.app.viewerHasVoted)),
        ),
        viewerHasVoted: entry.desired,
      };
    },
    subscribe(listener: (update: VoteUpdate) => void) {
      listeners.add(listener);
      for (const entry of entries.values()) listener(snapshot(entry));
      return () => {
        listeners.delete(listener);
      };
    },
    toggle(app: VoteState, userId: string, save: Entry["save"]) {
      const key = keyOf(app.id, userId);
      let entry = entries.get(key);
      if (!entry) {
        entry = {
          app,
          userId,
          desired: Boolean(app.viewerHasVoted),
          version: 0,
          running: false,
          save,
        };
        entries.set(key, entry);
      }
      entry.desired = !entry.desired;
      entry.version++;
      if (entry.timer !== undefined) clearTimeout(entry.timer);
      const current = entry;
      entry.timer = setTimeout(() => {
        current.timer = undefined;
        void flush(key, current);
      }, VOTE_DEBOUNCE_MS);
      emit(entry);
    },
  };
}

export const debouncedVotes = createDebouncedVotes();

export const debouncedFeedVotes = createDebouncedVotes();
