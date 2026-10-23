// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import Comments from "./Comments";
import MentionInput from "./MentionInput";
import MentionText from "./MentionText";
import { getAppRepo, getProfileRepo } from "../data/factory";
import { indexProfiles } from "../data/profileLinks";
import type { Comment, Profile } from "../data/types";

vi.mock("../data/factory", () => ({ getAppRepo: vi.fn(), getProfileRepo: vi.fn() }));

const profiles: Profile[] = ["Alice", "Bob Smith", "Carla_23", "José"].map((name) => ({
  id: name,
  name,
  bio: "",
  color: "sky",
  role: "Developer",
  createdAt: "2026-10-21",
}));
const comments: Comment[] = profiles.slice(0, 3).map((p, i) => ({
  id: `comment-${i}`,
  appId: "thread",
  authorId: p.id,
  authorName: p.name,
  body: `Comment ${i}`,
  createdAt: "2026-10-21T00:00:00Z",
  parentId: i ? `comment-${i - 1}` : null,
}));
let container: HTMLDivElement;
let root: Root;
const addComment = vi.fn(
  async (appId: string, _user: unknown, body: string, parentId?: string) => ({
    ...comments[0],
    id: "new-comment",
    appId,
    body,
    parentId,
  }),
);

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  vi.clearAllMocks();
  vi.mocked(getAppRepo).mockReturnValue({
    listComments: vi.fn().mockResolvedValue(comments),
    addComment,
  } as never);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

async function renderComments() {
  await act(async () => {
    root.render(
      createElement(Comments, {
        appId: "thread",
        appTitle: "Test",
        currentUser: { id: "viewer", name: "Viewer", email: "v@example.com" },
        profiles: indexProfiles(profiles),
        trophies: new Map(),
        onOpenProfile: vi.fn(),
      }),
    );
  });
}

async function type(input: HTMLInputElement, text: string, cursor = text.length) {
  await act(async () => {
    input.value = text;
    input.setSelectionRange(cursor, cursor);
    Simulate.change(input);
  });
}

async function key(input: HTMLInputElement, value: string) {
  await act(async () => {
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: value, bubbles: true, cancelable: true }),
    );
  });
}

describe("comment replies", () => {
  it.each([0, 1, 2])("prefills an editable mention at nesting level %i", async (level) => {
    await renderComments();
    const body = Array.from(container.querySelectorAll("p")).find(
      (p) => p.textContent === `Comment ${level}`,
    )!;
    const item = body.closest("li")!;
    const reply = Array.from(item.querySelectorAll("button")).find(
      (b) => b.closest("li") === item && b.textContent?.startsWith("Reply"),
    )!;
    await act(async () => reply.click());
    const input = item.querySelector<HTMLInputElement>("input")!;
    expect(input.value).toBe(`@${profiles[level].name} `);
    expect(reply.textContent).toMatch(/^Reply/);
    expect(
      input.parentElement?.querySelector('button[type="submit"]')?.getAttribute("aria-label"),
    ).toBe("Send reply");
    const cancel = input
      .closest("form")!
      .querySelector<HTMLButtonElement>('button[type="button"]')!;
    expect(cancel.textContent).toBe("Cancel");
    expect(input.parentElement?.contains(cancel)).toBe(false);

    await type(input, "Reply without a mention");
    await act(async () => {
      input
        .closest("form")!
        .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    expect(addComment).toHaveBeenCalledWith(
      "thread",
      expect.anything(),
      "Reply without a mention",
      `comment-${level}`,
    );
    expect(container.querySelector('[title^="Replying to"]')).toBeNull();
    expect(container.textContent).toContain("Reply without a mention");
  });

  it("keeps timestamps beside the username without underlines", async () => {
    await renderComments();
    const name = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent === "Alice",
    )!;
    expect(name.className).not.toContain("underline");
    expect(name.parentElement?.querySelector("time")).not.toBeNull();
  });

  it("supports @ search in top-level comments", async () => {
    await renderComments();
    const input = container.querySelector<HTMLInputElement>(
      'input[aria-label="Add feedback for Test"]',
    )!;
    await type(input, "Hello @bo");
    expect(container.querySelector('[role="listbox"]')?.textContent).toContain("Bob Smith");
    await key(input, "Enter");
    expect(input.value).toBe("Hello @Bob Smith ");
    expect(addComment).not.toHaveBeenCalled();
  });
});

function Field({ maxLength = 500 }: { maxLength?: number }) {
  const [value, setValue] = useState("");
  return createElement(MentionInput, { value, onChange: setValue, profiles, maxLength });
}

describe("mention autocomplete", () => {
  it("lists users after @ and supports arrow/Enter selection", async () => {
    await act(async () => root.render(createElement(Field)));
    const input = container.querySelector("input")!;
    await type(input, "@");
    expect(container.querySelectorAll('[role="option"]')).toHaveLength(4);
    await key(input, "ArrowDown");
    await key(input, "Enter");
    expect(input.value).toBe("@Bob Smith ");
    expect(input.getAttribute("aria-expanded")).toBe("false");
    await type(input, "@Bob Smith hello");
    expect(container.querySelector('[role="listbox"]')).toBeNull();
  });

  it("completes Unicode names with the pointer and preserves text after the caret", async () => {
    await act(async () => root.render(createElement(Field)));
    const input = container.querySelector("input")!;
    await type(input, "Hi @jo, welcome", 6);
    const option = container.querySelector<HTMLButtonElement>('[role="option"] button')!;
    await act(async () => {
      option.dispatchEvent(new Event("pointerdown", { bubbles: true, cancelable: true }));
      option.click();
    });
    expect(input.value).toBe("Hi @José, welcome");
  });

  it("dismisses empty results with Escape and rejects completions beyond maxLength", async () => {
    await act(async () => root.render(createElement(Field, { maxLength: 5 })));
    const input = container.querySelector("input")!;
    await type(input, "@zz");
    expect(container.textContent).toContain("No users found");
    await key(input, "Escape");
    expect(container.querySelector('[role="listbox"]')).toBeNull();
    await type(input, "@bo");
    await key(input, "Enter");
    expect(input.value).toBe("@bo");
  });
});

describe("posted mentions", () => {
  it("opens a mentioned user's profile and leaves email/partial-name matches alone", async () => {
    const openProfile = vi.fn();
    await act(async () =>
      root.render(
        createElement(MentionText, {
          text: "@Bob Smith thanks, bob@Alice.com and @AliceJones",
          mentions: [{ name: "Bob Smith", userId: "Bob Smith" }],
          profiles,
          onOpenProfile: openProfile,
        }),
      ),
    );
    const buttons = container.querySelectorAll("button");
    expect(buttons).toHaveLength(1);
    expect(buttons[0].className).not.toContain("underline");
    await act(async () => buttons[0].click());
    expect(openProfile).toHaveBeenCalledWith("Bob Smith");
  });
});

describe("mentions after account changes", () => {
  it("keeps the original label and opens the original ID after a rename and name reuse", async () => {
    const openProfile = vi.fn();
    await act(async () =>
      root.render(
        createElement(MentionText, {
          text: "Thanks @Alice!",
          mentions: [{ name: "Alice", userId: "original" }],
          profiles: [
            { ...profiles[0], id: "original", name: "Alicia" },
            { ...profiles[0], id: "new-owner", name: "Alice" },
          ],
          onOpenProfile: openProfile,
        }),
      ),
    );
    const button = container.querySelector("button")!;
    expect(button.textContent).toBe("@Alice");
    await act(async () => button.click());
    expect(openProfile).toHaveBeenCalledWith("original");
  });

  it("does not redirect deleted users or unbound text to a new owner of the name", async () => {
    for (const mentions of [[{ name: "Alice", userId: "deleted" }], []]) {
      await act(async () =>
        root.render(
          createElement(MentionText, {
            text: "Thanks @Alice!",
            mentions,
            profiles,
            onOpenProfile: vi.fn(),
          }),
        ),
      );
      expect(container.textContent).toBe("Thanks @Alice!");
      expect(container.querySelector("button")).toBeNull();
    }
  });
});

it("previews comment likers without toggling the like", async () => {
  const listCommentLikers = vi.fn().mockResolvedValue({ "comment-0": ["Bob Smith"] });
  const toggleCommentLike = vi.fn();
  vi.mocked(getAppRepo).mockReturnValue({
    listComments: vi.fn().mockResolvedValue(comments),
    listCommentLikers,
    toggleCommentLike,
  } as never);
  vi.mocked(getProfileRepo).mockReturnValue({
    listProfiles: vi.fn().mockResolvedValue(profiles),
  } as never);
  await renderComments();
  expect(listCommentLikers).not.toHaveBeenCalled();
  const trigger = container.querySelector<HTMLButtonElement>('[aria-haspopup="dialog"]')!;
  await act(async () => trigger.click());
  const dialog = document.querySelector('[role="dialog"]')!;
  expect(dialog.textContent).toContain("Liked by (1)");
  expect(dialog.textContent).toContain("Bob Smith");
  expect(toggleCommentLike).not.toHaveBeenCalled();
  await act(async () =>
    document.querySelector<HTMLButtonElement>('[aria-label="Close likes"]')!.click(),
  );
});
