// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import TrophyMark from "./TrophyMark";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

it("renders minimal trophies inside author paragraphs without invalid nesting", async () => {
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  const container = document.createElement("div");
  const root = createRoot(container);
  try {
    await act(async () =>
      root.render(
        createElement("p", null, "Author", createElement(TrophyMark, { place: 1, minimal: true })),
      ),
    );
    expect(container.querySelector('[role="img"]')?.getAttribute("aria-label")).toBe("Ranked #1");
    expect(container.querySelector("p p, p div")).toBeNull();
    expect(error).not.toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
    error.mockRestore();
  }
});
