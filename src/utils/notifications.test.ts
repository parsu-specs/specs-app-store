import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  arrivalKeyOf,
  buildNotifications,
  bumpCollabTag,
  loadNotificationState,
  restampRearrived,
  saveNotificationState,
  type NotificationInput,
} from "./notifications";
import type { AppItem, Comment, Milestone, User } from "../data/types";

const NOW = Date.parse("2026-10-07T12:00:00.000Z");
const H = (h: number) => new Date(NOW - h * 3_600_000).toISOString();

const store = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: (k: string) => (store.has(k) ? (store.get(k) as string) : null),
  setItem: (k: string, v: string) => void store.set(k, String(v)),
  removeItem: (k: string) => void store.delete(k),
});

beforeEach(() => {
  store.clear();
});

const ann: User = { id: "u1", email: "a@x.com", name: "Ann" };

function app(id: string, extra: Partial<AppItem> = {}): AppItem {
  return {
    id,
    title: `App ${id}`,
    description: "a description",
    creator: "Bob",
    creatorId: "u2",
    category: "Games",
    votes: 0,
    comments: 0,
    color: "sky",
    createdAt: H(50),
    ...extra,
  };
}

function comment(id: string, extra: Partial<Comment> = {}): Comment {
  return {
    id,
    appId: "mine",
    authorId: "u2",
    authorName: "Bob",
    body: "hello",
    createdAt: H(3),
    ...extra,
  };
}

function baseInput(over: Partial<NotificationInput> = {}): NotificationInput {
  return {
    user: ann,
    apps: [],
    threads: new Map(),
    milestones: [],
    voters: new Map(),
    voterBaseline: {},
    voteCycles: {},
    likers: new Map(),
    likeBaseline: {},
    likeCycles: {},
    nowMs: NOW,
    ...over,
  };
}

describe("buildNotifications", () => {
  it("orders newest arrival first across kinds", () => {
    const mine = app("mine", { creator: "Ann", creatorId: "u1" });
    const fresh = app("new1", { createdAt: H(4) });
    const threads = new Map<string, Comment[]>([
      [
        "mine",
        [
          comment("c1"),
          { ...comment("c0"), id: "c0", authorId: "u1", authorName: "Ann", createdAt: H(5) },
          { ...comment("c2"), id: "c2", createdAt: H(1), parentId: "c0" },
        ],
      ],
    ]);
    const milestones: Milestone[] = [
      { id: "m1", authorId: "u2", authorName: "Bob", body: "wall", createdAt: H(2) },
    ];
    const kinds = buildNotifications(baseInput({ apps: [mine, fresh], threads, milestones })).map(
      (i) => i.kind,
    );
    expect(kinds).toEqual(["reply", "update", "comment", "project"]);
  });

  it("detects replies once and skips own actions", () => {
    const mine = app("mine", { creator: "Ann", creatorId: "u1" });
    const threads = new Map<string, Comment[]>([
      [
        "mine",
        [
          comment("c1"),
          { ...comment("c2"), id: "c2", authorId: "u1", authorName: "Ann" },
          { ...comment("c3"), id: "c3", authorId: "u3", authorName: "Cat", parentId: "c2" },
          // Orphan reply (unknown parent) is not claimed as a reply to me.
          { ...comment("c9"), id: "c9", authorId: "u3", authorName: "Cat", parentId: "nope" },
        ],
      ],
    ]);
    const items = buildNotifications(baseInput({ apps: [mine], threads }));
    const ids = items.map((i) => i.id);
    expect(ids).toContain("c:c1");
    expect(ids).toContain("c:c3");
    expect(ids).not.toContain("c:c2");
    expect(ids.filter((id) => id === "c:c3")).toHaveLength(1);
    // Orphan reply (unknown parent) on my project still surfaces — as a
    // plain comment on my project, never as a reply to me.
    expect(items.find((i) => i.id === "c:c9")?.kind).toBe("comment");
  });

  it("notifies per-voter appearances, including re-votes after unvotes", () => {
    const mine = app("mine", { creator: "Ann", creatorId: "u1", votes: 1 });
    const bob = { id: "u2", name: "Bob", role: "r", bio: "", color: "sky", createdAt: H(9) };
    const voters = new Map([["mine", [bob]]]);
    const first = buildNotifications(baseInput({ apps: [mine], voters }));
    expect(first.find((i) => i.kind === "vote")?.title).toBe("Bob upvoted App mine");

    // A steady voter never re-fires.
    const steady = buildNotifications(
      baseInput({ apps: [mine], voters, voterBaseline: { mine: ["u2"] } }),
    );
    expect(steady.some((i) => i.kind === "vote")).toBe(false);

    // Unvote (baseline drops the voter) then re-vote notifies under a fresh id.
    const re = buildNotifications(
      baseInput({
        apps: [mine],
        voters,
        voterBaseline: { mine: [] },
        voteCycles: { mine: { u2: 1 } },
      }),
    );
    expect(re.find((i) => i.kind === "vote")?.id).toBe("vote:mine:u2#1");

    // Own votes never notify.
    const self = buildNotifications(
      baseInput({
        apps: [mine],
        voters: new Map([["mine", [{ ...bob, id: "u1", name: "Ann" }]]]),
      }),
    );
    expect(self.some((i) => i.kind === "vote")).toBe(false);
  });

  it("notifies per-liker appearances on my comments, including re-likes", () => {
    const mine = app("mine", { creator: "Ann", creatorId: "u1" });
    const mineThread = new Map([["mine", [comment("c1", { authorId: "u1", authorName: "Ann" })]]]);
    const bobProfile = { id: "u2", name: "Bob", role: "r", bio: "", color: "sky", createdAt: H(9) };
    const likers = new Map([["c1", ["u2"]]]);
    const first = buildNotifications(
      baseInput({ apps: [mine], threads: mineThread, likers, profiles: [bobProfile] }),
    );
    expect(first.find((i) => i.kind === "like")?.title).toBe("Bob liked your comment on App mine");

    // A steady liker never re-fires.
    const steady = buildNotifications(
      baseInput({
        apps: [mine],
        threads: mineThread,
        likers,
        profiles: [bobProfile],
        likeBaseline: { c1: ["u2"] },
      }),
    );
    expect(steady.some((i) => i.kind === "like")).toBe(false);

    // Unlike then re-like notifies again under a fresh id.
    const re = buildNotifications(
      baseInput({
        apps: [mine],
        threads: mineThread,
        likers,
        profiles: [bobProfile],
        likeBaseline: { c1: [] },
        likeCycles: { c1: { u2: 1 } },
      }),
    );
    expect(re.find((i) => i.kind === "like")?.id).toBe("like:c1:u2#1");

    // Likes on other people's comments never notify me, even on my project.
    const others = buildNotifications(
      baseInput({
        apps: [mine],
        threads: new Map([["mine", [comment("c1")]]]),
        likers: new Map([["c1", ["u3"]]]),
        profiles: [bobProfile],
      }),
    );
    expect(others.some((i) => i.kind === "like")).toBe(false);

    // My own likes on my own comments never notify.
    const selfLike = buildNotifications(
      baseInput({
        apps: [mine],
        threads: mineThread,
        likers: new Map([["c1", ["u1"]]]),
        profiles: [bobProfile],
      }),
    );
    expect(selfLike.some((i) => i.kind === "like")).toBe(false);
  });

  it("matches collab tags by id or profile-row name, never strangers", () => {
    const profiles = [
      { id: "mia", name: "Mia Santos", role: "r", bio: "", color: "sky", createdAt: H(9) },
    ];
    const mia: User = { id: "google-1", email: "m@x.com", name: "Mia Santos" };
    const tagged = app("p1", { collaborators: ["mia"] });
    const byName = buildNotifications(baseInput({ user: mia, apps: [tagged], profiles }));
    expect(byName.some((i) => i.kind === "collab")).toBe(true);
    const stranger: User = { id: "u9", email: "z@x.com", name: "Zed" };
    const none = buildNotifications(baseInput({ user: stranger, apps: [tagged], profiles }));
    expect(none.some((i) => i.kind === "collab")).toBe(false);
  });

  it("arrival keys are stable per content and change on edit", () => {
    const a = { id: "vote:x", title: "T", body: "5 total" };
    const b = { id: "vote:x", title: "T", body: "5 total" };
    const c = { id: "vote:x", title: "T", body: "6 total" };
    expect(arrivalKeyOf(a)).toBe(arrivalKeyOf(b));
    expect(arrivalKeyOf(a)).not.toBe(arrivalKeyOf(c));
  });

  it("restamps same-content re-arrivals so renewed news sorts to the top", () => {
    const item = { id: "collab:p1", title: "T", body: "B" };
    const key = arrivalKeyOf(item);
    const oldStamp = "2026-10-01T00:00:00.000Z";
    const nowStamp = "2026-10-07T12:00:00.000Z";
    const seenAt = { [key]: oldStamp };

    // Absent -> present with an already-stamped key: refresh to now.
    const refreshed = restampRearrived([item], new Set(["other"]), seenAt, nowStamp);
    expect(refreshed[key]).toBe(nowStamp);
    expect(seenAt[key]).toBe(oldStamp);

    // Steady items keep their stamp (same object back, no rewrite).
    const steady = restampRearrived([item], new Set(["collab:p1"]), seenAt, nowStamp);
    expect(steady).toBe(seenAt);

    // First sightings (unstamped keys) are left for the missing-key stamping.
    const fresh = restampRearrived(
      [{ id: "c:new", title: "T2", body: "B2" }],
      new Set(["collab:p1"]),
      seenAt,
      nowStamp,
    );
    expect(fresh).toBe(seenAt);

    // No history yet: nothing to compare against.
    expect(restampRearrived([item], null, seenAt, nowStamp)).toBe(seenAt);
  });
});

describe("collab tag snapshots", () => {
  const tagged = () => app("p1", { collaborators: ["u1"] });

  it("fires on first login, stays silent on title-only edits, re-fires on re-tag", () => {
    const load = () => loadNotificationState("u1");
    const input = () =>
      baseInput({
        apps: [tagged()],
        profiles: [],
        collabBaseline: load().collabBaseline,
      });
    const collabs = (uid: string) =>
      buildNotifications({
        ...input(),
        collabBaseline: loadNotificationState(uid).collabBaseline,
      }).filter((i) => i.kind === "collab").length;

    expect(collabs("u1")).toBe(1);

    // Mark all read, then a title-only edit (same tag set, no bump).
    const seen = buildNotifications({ ...input(), collabBaseline: load().collabBaseline });
    saveNotificationState("u1", {
      readIds: seen.map((i) => i.id),
      voteBaseline: {},
      voterBaseline: {},
      voteCycles: {},
      likeBaseline: {},
      likeCycles: {},
      collabBaseline: ["p1"],
      dismissedIds: [],
      seenAt: {},
    });
    expect(collabs("u1")).toBe(0);

    // Untag (offline) then re-tag via edit save: the uploader's bump clears it.
    bumpCollabTag("u1", "p1");
    expect(collabs("u1")).toBe(1);
  });

  it("bumpCollabTag is a no-op for unknown users", () => {
    bumpCollabTag("ghost", "p1");
    expect(loadNotificationState("ghost")).toEqual({
      readIds: [],
      voteBaseline: {},
      voterBaseline: {},
      voteCycles: {},
      likeBaseline: {},
      likeCycles: {},
      collabBaseline: [],
      dismissedIds: [],
      seenAt: {},
    });
  });

  it("tolerates legacy stored state without new fields", () => {
    store.set("cc.notif.v1:u1", JSON.stringify({ readIds: ["c:x"] }));
    expect(loadNotificationState("u1")).toEqual({
      readIds: ["c:x"],
      voteBaseline: {},
      voterBaseline: {},
      voteCycles: {},
      likeBaseline: {},
      likeCycles: {},
      collabBaseline: [],
      dismissedIds: [],
      seenAt: {},
    });
  });
});
