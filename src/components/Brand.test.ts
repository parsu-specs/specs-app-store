// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it } from "vitest";
import Brand from "./Brand";

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

let cleanup = () => {};
afterEach(() => {
  cleanup();
});

function renderBrand(props: Record<string, unknown>) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  cleanup = () => {
    act(() => root.unmount());
    container.remove();
  };
  act(() => root.render(createElement(Brand, props)));
  return container;
}

function accentSpan(container: HTMLElement) {
  return Array.from(container.querySelectorAll("span")).find((el) => el.textContent === "Canvas");
}

it("renders the onPrimary lockup with primary-foreground and secondary accent", () => {
  const container = renderBrand({ onPrimary: true, text: true });
  expect(container.textContent).toContain("CodeCanvas");
  const outer = container.querySelector("span.font-display");
  expect(outer?.className).toContain("text-primary-foreground");
  expect(accentSpan(container)?.className).toContain("text-secondary");
});

it("renders the light lockup with brand tokens for brand surfaces", () => {
  const container = renderBrand({ light: true, text: true });
  const outer = container.querySelector("span.font-display");
  expect(outer?.className).toContain("text-brand-foreground");
  expect(accentSpan(container)?.className).toContain("text-brand-accent");
});

it("renders the default lockup with foreground and primary", () => {
  const container = renderBrand({ text: true });
  const outer = container.querySelector("span.font-display");
  expect(outer?.className).toContain("text-foreground");
  expect(accentSpan(container)?.className).toContain("text-primary");
});

it("colors the monogram accent like the text variant", () => {
  const container = renderBrand({ onPrimary: true, monogram: true });
  expect(container.textContent).toContain("CC");
  const inner = Array.from(container.querySelectorAll("span")).find(
    (el) => el.textContent === "C",
  );
  expect(inner?.className).toContain("text-secondary");
  const outer = container.querySelector("span.font-display");
  expect(outer?.className).toContain("text-primary-foreground");
});
