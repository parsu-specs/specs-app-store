import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { initializePinchZoom } from "./pinchZoom";
let page: EventTarget & { documentElement: { dataset: { pinchZoom?: string } } };
let browser: EventTarget;
function dispatch(target: EventTarget, type: string, props = {}) {
  const event = Object.assign(new Event(type, { cancelable: true }), props);
  target.dispatchEvent(event);
  return event.defaultPrevented;
}
beforeEach(() => {
  page = Object.assign(new EventTarget(), { documentElement: { dataset: {} } });
  browser = new EventTarget();
  vi.stubGlobal("document", page);
  vi.stubGlobal("window", browser);
  vi.stubGlobal("localStorage", { getItem: () => "true" });
});
afterEach(() => vi.unstubAllGlobals());
it("blocks pinch by default without blocking scrolling or physical Ctrl+wheel zoom", () => {
  initializePinchZoom();
  expect(page.documentElement.dataset.pinchZoom).toBe("disabled");
  expect(dispatch(page, "wheel", { ctrlKey: true })).toBe(true);
  expect(dispatch(page, "wheel", { ctrlKey: false })).toBe(false);
  expect(dispatch(page, "gesturestart")).toBe(true);
  expect(dispatch(browser, "keydown", { ctrlKey: true })).toBe(false);
  expect(dispatch(page, "wheel", { ctrlKey: true })).toBe(false);
  dispatch(browser, "keyup", { ctrlKey: false });
  expect(dispatch(page, "wheel", { ctrlKey: true })).toBe(true);
  dispatch(browser, "keydown", { ctrlKey: true });
  dispatch(browser, "blur");
  expect(dispatch(page, "wheel", { ctrlKey: true })).toBe(true);
});
