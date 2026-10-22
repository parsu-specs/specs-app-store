import type { AppItem } from "../data/types";

/** Retain the exact vote fields, including zero counts, for immediate rollback. */
export function optimisticVote(id: string) {
  const originals = new WeakMap<AppItem, AppItem>();
  return {
    apply(app: AppItem): AppItem {
      if (app.id !== id) return app;
      const next = {
        ...app,
        votes: Math.max(0, app.votes + (app.viewerHasVoted ? -1 : 1)),
        viewerHasVoted: !app.viewerHasVoted,
      };
      originals.set(next, app);
      return next;
    },
    revert(app: AppItem): AppItem {
      // A refreshed server object already supersedes this optimistic update.
      return originals.get(app) ?? app;
    },
  };
}
