import { describe, expect, it } from "vitest";
import type { AppItem } from "../data/types";
import { optimisticVote } from "./optimisticVote";

const app: AppItem = {
  id: "a",
  title: "App",
  description: "",
  creator: "Jay",
  category: "Creative",
  votes: 0,
  comments: 0,
  color: "",
  createdAt: "",
};

describe("optimistic vote rollback", () => {
  it("restores exact fields after a failed addition or removal, including clamped counts", () => {
    for (const viewerHasVoted of [undefined, false, true]) {
      const original = { ...app, viewerHasVoted };
      const change = optimisticVote(app.id);
      const pending = change.apply(original);
      expect(pending.viewerHasVoted).toBe(!viewerHasVoted);
      expect(change.revert(pending)).toEqual(original);
    }
  });

  it("preserves a newer server refresh and leaves other projects alone", () => {
    const change = optimisticVote(app.id);
    change.apply(app);
    const refreshed = { ...app, votes: 20 };
    expect(change.revert(refreshed)).toBe(refreshed);
    const other = { ...app, id: "b" };
    expect(change.apply(other)).toBe(other);
  });
});
