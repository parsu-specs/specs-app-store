import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AppItem } from "../data/types";
import { createDebouncedVotes, VOTE_DEBOUNCE_MS, type VoteUpdate } from "./debouncedVotes";

const app: AppItem = {
  id: "a",
  title: "App",
  description: "",
  creator: "Jay",
  category: "Creative",
  votes: 7,
  comments: 3,
  color: "mint",
  createdAt: "",
  viewerHasVoted: false,
};
const updated = (liked: boolean) => ({ ...app, votes: liked ? 8 : 7, viewerHasVoted: liked });
const deferred = () => {
  let resolve!: (value: AppItem) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<AppItem>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("debounced project votes", () => {
  it("updates instantly and sends only the last state after quiet time", async () => {
    const votes = createDebouncedVotes();
    const updates: VoteUpdate[] = [];
    votes.subscribe((update) => updates.push(update));
    const save = vi.fn(async (liked: boolean) => updated(liked));
    for (let i = 0; i < 9; i++) {
      votes.toggle(app, "u", save);
      await vi.advanceTimersByTimeAsync(50);
    }
    expect(updates.at(-1)).toMatchObject({ viewerHasVoted: true, votes: 8, pending: true });
    expect(save).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(VOTE_DEBOUNCE_MS);
    expect(save).toHaveBeenCalledExactlyOnceWith(true);
    expect(updates.at(-1)?.pending).toBe(false);
  });

  it("does not write a burst that cancels itself, including an initially liked project", async () => {
    for (const initial of [app, updated(true)]) {
      const votes = createDebouncedVotes();
      const save = vi.fn(async (liked: boolean) => updated(liked));
      votes.toggle(initial, "u", save);
      votes.toggle(initial, "u", save);
      await vi.advanceTimersByTimeAsync(VOTE_DEBOUNCE_MS);
      expect(save).not.toHaveBeenCalled();
    }
  });

  it("persists an unlike and shares pending intent across surfaces and refreshes", async () => {
    const votes = createDebouncedVotes();
    const save = vi.fn(async (liked: boolean) => updated(liked));
    votes.toggle(updated(true), "u", save);
    const secondSurface = vi.fn();
    const unsubscribe = votes.subscribe(secondSurface);
    expect(secondSurface).toHaveBeenLastCalledWith(
      expect.objectContaining({ viewerHasVoted: false, votes: 7 }),
    );
    expect(votes.project(updated(true), "u")).toMatchObject({ viewerHasVoted: false, votes: 7 });
    expect(votes.project(updated(true), "other").viewerHasVoted).toBe(true);
    unsubscribe();
    await vi.advanceTimersByTimeAsync(VOTE_DEBOUNCE_MS);
    expect(save).toHaveBeenCalledExactlyOnceWith(false);
  });

  it("serializes changes during a request and keeps the newer optimistic state", async () => {
    const votes = createDebouncedVotes();
    const first = deferred();
    const second = deferred();
    const save = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const listener = vi.fn();
    votes.subscribe(listener);
    votes.toggle(app, "u", save);
    await vi.advanceTimersByTimeAsync(VOTE_DEBOUNCE_MS);
    votes.toggle(app, "u", save);
    await vi.advanceTimersByTimeAsync(VOTE_DEBOUNCE_MS);
    expect(save).toHaveBeenCalledTimes(1);
    first.resolve(updated(true));
    await vi.advanceTimersByTimeAsync(0);
    expect(save.mock.calls).toEqual([[true], [false]]);
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({ viewerHasVoted: false, votes: 7 }),
    );
    second.resolve(updated(false));
    await vi.advanceTimersByTimeAsync(0);
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({ pending: false, viewerHasVoted: false }),
    );
  });

  it("waits for the newer debounce even if the previous save finishes first", async () => {
    const votes = createDebouncedVotes();
    const first = deferred();
    const save = vi.fn().mockReturnValueOnce(first.promise).mockResolvedValue(updated(false));
    votes.toggle(app, "u", save);
    await vi.advanceTimersByTimeAsync(VOTE_DEBOUNCE_MS);
    votes.toggle(app, "u", save);
    first.resolve(updated(true));
    await vi.advanceTimersByTimeAsync(VOTE_DEBOUNCE_MS - 1);
    expect(save).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(save.mock.calls).toEqual([[true], [false]]);
  });

  it("rolls back immediately on failure and allows another attempt", async () => {
    const votes = createDebouncedVotes();
    const listener = vi.fn();
    votes.subscribe(listener);
    const save = vi
      .fn()
      .mockRejectedValueOnce(new Error("Offline"))
      .mockResolvedValue(updated(true));
    votes.toggle(app, "u", save);
    await vi.advanceTimersByTimeAsync(VOTE_DEBOUNCE_MS);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Offline", votes: 7, viewerHasVoted: false }),
    );
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({ pending: false, votes: 7 }),
    );
    votes.toggle(app, "u", save);
    await vi.advanceTimersByTimeAsync(VOTE_DEBOUNCE_MS);
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({ pending: false, votes: 8 }),
    );
  });

  it("retains newer intent after a failed request without concurrent writes", async () => {
    const votes = createDebouncedVotes();
    const first = deferred();
    const save = vi.fn().mockReturnValueOnce(first.promise).mockResolvedValue(updated(true));
    votes.toggle(app, "u", save);
    await vi.advanceTimersByTimeAsync(VOTE_DEBOUNCE_MS);
    votes.toggle(app, "u", save);
    votes.toggle(app, "u", save);
    await vi.advanceTimersByTimeAsync(VOTE_DEBOUNCE_MS);
    first.reject(new Error("Offline"));
    await vi.advanceTimersByTimeAsync(0);
    expect(save.mock.calls).toEqual([[true], [true]]);
    expect(votes.project(app, "u")).toEqual(app); // entry drained after success
  });
});

describe("vote session changes", () => {
  it("cancels unsent saves when the account changes", async () => {
    const votes = createDebouncedVotes();
    const save = vi.fn(async (liked: boolean) => updated(liked));
    votes.toggle(app, "u", save);
    votes.cancelUser("u");
    await vi.advanceTimersByTimeAsync(VOTE_DEBOUNCE_MS);
    expect(save).not.toHaveBeenCalled();
  });

  it("does not send a queued follow-up after signout during a request", async () => {
    const votes = createDebouncedVotes();
    const request = deferred();
    const save = vi.fn().mockReturnValue(request.promise);
    votes.toggle(app, "u", save);
    await vi.advanceTimersByTimeAsync(VOTE_DEBOUNCE_MS);
    votes.toggle(app, "u", save);
    votes.cancelUser("u");
    request.resolve(updated(true));
    await vi.advanceTimersByTimeAsync(VOTE_DEBOUNCE_MS);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("subscribing a new surface does not notify existing surfaces again", () => {
    const votes = createDebouncedVotes();
    const first = vi.fn();
    votes.subscribe(first);
    votes.toggle(app, "u", async () => updated(true));
    first.mockClear();
    const second = vi.fn();
    votes.subscribe(second);
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
    votes.cancelUser("u");
  });
});
