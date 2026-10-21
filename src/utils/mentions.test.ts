import { describe, expect, it } from "vitest";
import { findMentionQuery, suggestMentionProfiles } from "./mentions";
import type { Profile } from "../data/types";

const profile = (name: string, id = name): Profile => ({
  id,
  name,
  role: "Developer",
  color: "sky",
  bio: "",
  createdAt: "2026-10-21",
});

describe("mention search", () => {
  it("opens on @ and supports spaces, digits, underscores, and Unicode", () => {
    for (const query of ["", "Jay Romero", "jay_23", "José", "李明"]) {
      const text = `Hello @${query}`;
      expect(findMentionQuery(text, text.length)).toEqual({ query, start: 6 });
    }
  });

  it("searches the latest mention at the caret without treating email as a mention", () => {
    expect(findMentionQuery("hi @Jay and @Jo tomorrow", 15)).toEqual({ query: "Jo", start: 12 });
    expect(findMentionQuery("hello jay@example.com", 21)).toBeNull();
    expect(findMentionQuery("hello", 5)).toBeNull();
  });

  it("ranks exact matches before prefixes and substrings and removes duplicate profiles", () => {
    const profiles = [
      profile("XJay"),
      profile("Jay Romero"),
      profile("Jay"),
      profile("jay", "alias"),
      profile("Other"),
    ];
    expect(suggestMentionProfiles(profiles, "jAy").map((p) => p.name)).toEqual([
      "Jay",
      "Jay Romero",
      "XJay",
    ]);
    expect(suggestMentionProfiles(profiles, "missing")).toEqual([]);
  });

  it("limits the initial user list to eight suggestions", () => {
    expect(
      suggestMentionProfiles(
        Array.from({ length: 12 }, (_, i) => profile(`User ${i}`)),
        "",
      ),
    ).toHaveLength(8);
  });
});
