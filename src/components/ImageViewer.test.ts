// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import ImageViewer from "./ImageViewer";

let root: Root;
let container: HTMLDivElement;
let trigger: HTMLButtonElement;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  container.id = "root";
  trigger = document.createElement("button");
  document.body.appendChild(container);
  document.body.appendChild(trigger);
  trigger.focus();
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  trigger.remove();
  document.body.style.overflow = "";
  vi.unstubAllGlobals();
});

const button = (label: string) =>
  document.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;

async function open(initialIndex = 0, onClose = vi.fn()) {
  await act(async () =>
    root.render(
      createElement(ImageViewer, {
        images: [
          { src: "/first.png", alt: "First screenshot" },
          { src: "/second.png", alt: "Second screenshot" },
        ],
        initialIndex,
        title: "Project screenshots",
        onClose,
      }),
    ),
  );
  return onClose;
}

it("opens the selected screenshot, navigates with buttons and keys, and resets zoom and scroll", async () => {
  await open(1);
  expect(document.querySelector("img")?.getAttribute("src")).toBe("/second.png");
  expect(button("Next image").disabled).toBe(true);
  await act(async () => button("Zoom in").click());
  expect(button("Fit image to view").textContent).toBe("150%");
  const viewport = document.querySelector<HTMLElement>('[aria-label="Image preview"]')!;
  viewport.scrollLeft = 100;
  viewport.scrollTop = 100;
  await act(async () => button("Previous image").click());
  expect(document.querySelector("img")?.getAttribute("src")).toBe("/first.png");
  expect(button("Fit image to view").textContent).toBe("Fit");
  expect(viewport.scrollLeft).toBe(0);
  expect(viewport.scrollTop).toBe(0);
  expect(button("Previous image").disabled).toBe(true);
  await act(async () =>
    document
      .querySelector('[role="dialog"]')!
      .dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })),
  );
  expect(document.querySelector("img")?.getAttribute("src")).toBe("/second.png");
});

it("bounds zoom, offers fit reset, and keeps navigation usable after an image fails", async () => {
  await open();
  await act(async () => button("Zoom in").click());
  await act(async () => button("Zoom in").click());
  expect(button("Zoom in").disabled).toBe(true);
  expect(button("Fit image to view").textContent).toBe("200%");
  await act(async () => button("Fit image to view").click());
  expect(button("Zoom out").disabled).toBe(true);
  await act(async () => document.querySelector("img")!.dispatchEvent(new Event("error")));
  expect(document.querySelector('[role="status"]')?.textContent).toContain("could not be loaded");
  expect(button("Zoom in").disabled).toBe(true);
  await act(async () => button("Next image").click());
  expect(document.querySelector("img")?.getAttribute("src")).toBe("/second.png");
  expect(button("Zoom in").disabled).toBe(false);
});

it("uses modal scroll locking, explicit dismissal, and focus restoration", async () => {
  document.body.style.overflow = "auto";
  const onClose = await open();
  expect(document.body.style.overflow).toBe("hidden");
  expect(container.inert).toBe(true);
  await act(async () => document.querySelector('[role="dialog"]')!.parentElement!.click());
  expect(onClose).not.toHaveBeenCalled();
  await act(async () =>
    document
      .querySelector('[role="dialog"]')!
      .dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })),
  );
  expect(onClose).toHaveBeenCalledOnce();
  await act(async () => root.render(null));
  expect(document.body.style.overflow).toBe("auto");
  expect(container.inert).toBe(false);
  expect(document.activeElement).toBe(trigger);
});

it("drags zoomed images with pointer capture and stops on release, cancellation, and reset", async () => {
  await open();
  const viewport = document.querySelector<HTMLDivElement>('[aria-label="Image preview"]')!;
  const captured = new Set<number>();
  viewport.setPointerCapture = vi.fn((id) => {
    captured.add(id);
  });
  viewport.hasPointerCapture = vi.fn((id) => captured.has(id));
  viewport.releasePointerCapture = vi.fn((id) => {
    captured.delete(id);
  });
  const pointer = { pointerId: 1, isPrimary: true, button: 0, clientX: 100, clientY: 100 };
  await act(async () => Simulate.pointerDown(viewport, pointer));
  expect(viewport.setPointerCapture).not.toHaveBeenCalled();
  await act(async () => button("Zoom in").click());

  for (const end of [Simulate.pointerUp, Simulate.pointerCancel, Simulate.lostPointerCapture]) {
    viewport.scrollLeft = 20;
    viewport.scrollTop = 30;
    await act(async () => Simulate.pointerDown(viewport, pointer));
    expect(captured.has(1)).toBe(true);
    await act(async () => Simulate.pointerMove(viewport, { ...pointer, clientX: 60, clientY: 50 }));
    expect(viewport.scrollLeft).toBe(60);
    expect(viewport.scrollTop).toBe(80);
    await act(async () => end(viewport, pointer));
    expect(captured.has(1)).toBe(false);
    await act(async () => Simulate.pointerMove(viewport, { ...pointer, clientX: 0, clientY: 0 }));
    expect(viewport.scrollLeft).toBe(60);
    expect(viewport.scrollTop).toBe(80);
  }

  await act(async () => Simulate.pointerDown(viewport, pointer));
  await act(async () => button("Fit image to view").click());
  expect(captured.has(1)).toBe(false);
  expect(viewport.scrollLeft).toBe(0);
  expect(viewport.scrollTop).toBe(0);
});
