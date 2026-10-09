import { describe, expect, it } from "vitest";
import { PUBLISH_BONUS_PTS, rankDevelopers, rankProjects } from "./rank";
import type { AppItem, Profile } from "../data/types";

const dev = (id: string, name: string): Profile => ({
  id,
  name,
  role: "r",
  bio: "",
  color: "sky",
  createdAt: "2026-01-01T00:00:00.000Z",
});

const app = (id: string, creatorId: string, votes: number): AppItem => ({
  id,
  title: id,
  description: "d",
  creator: "x",
  creatorId,
  category: "Games",
  votes,
  comments: 0,
  color: "sky",
  createdAt: "2026-01-02T00:00:00.000Z",
});

describe("publish bonus", () => {
  it("adds 20 developer points per published project on top of votes", () => {
    expect(PUBLISH_BONUS_PTS).toBe(20);
    const [ranked] = rankDevelopers([dev("u1", "Ann")], [app("a", "u1", 5), app("b", "u1", 3)]);
    expect(ranked.projects).toBe(2);
    expect(ranked.points).toBe(5 + 3 + 2 * 20);
  });

  it("ranks a bonus-only newcomer above a voteless veteran", () => {
    const ranked = rankDevelopers([dev("u1", "Ann"), dev("u2", "Bob")], [app("a", "u2", 0)]);
    expect(ranked[0].profile.id).toBe("u2");
    expect(ranked[0].points).toBe(20);
    expect(ranked[1].points).toBe(0);
  });

  it("leaves project ranking purely vote-based", () => {
    const [first] = rankProjects([app("a", "u1", 1), app("b", "u2", 9)]);
    expect(first.id).toBe("b");
  });
});
