import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyAppearance,
  initializeAppearance,
  loadAppearance,
  resolveAppearance,
  setAppearance,
} from "./appearance";

import { setActiveViewer, viewerSettingKey } from "./viewerCache";

const store = new Map<string, string>();
let systemDark = false;
let mediaChange: () => void;
let storageChange: (event: { key: string | null }) => void;
let root: {
  dataset: { mode?: string; palette?: string };
  style: { setProperty: ReturnType<typeof vi.fn>; removeProperty: ReturnType<typeof vi.fn> };
};

beforeEach(() => {
  store.clear();
  systemDark = false;
  root = { dataset: {}, style: { setProperty: vi.fn(), removeProperty: vi.fn() } };
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
  });
  setActiveViewer("test-user");
  vi.stubGlobal("document", { documentElement: root });
  vi.stubGlobal("window", {
    matchMedia: () => ({
      matches: systemDark,
      addEventListener: (_name: string, listener: () => void) => {
        mediaChange = listener;
      },
    }),
    dispatchEvent: vi.fn(),
    addEventListener: (_name: string, listener: typeof storageChange) => {
      storageChange = listener;
    },
  });
});

afterEach(() => vi.unstubAllGlobals());

describe("appearance", () => {
  it("keeps visitor dark mode separate from account appearance", () => {
    setAppearance("light");
    setActiveViewer(null);
    setAppearance("dark");
    expect(loadAppearance()).toBe("dark");
    setActiveViewer("test-user");
    expect(loadAppearance()).toBe("light");
    setActiveViewer(null);
    expect(loadAppearance()).toBe("dark");
  });
  it("defaults to system, validates saved choices, and preserves legacy Midnight", () => {
    expect(loadAppearance()).toBe("system");
    store.set(viewerSettingKey("cc.appearance.v1"), "invalid");
    expect(loadAppearance()).toBe("system");
    store.set(viewerSettingKey("cc.palette.v1"), "midnight");
    expect(loadAppearance()).toBe("dark");
    setAppearance("light");
    expect(loadAppearance()).toBe("light");
    expect(root.dataset.mode).toBe("light");
  });

  it("resolves system preference while respecting explicit modes", () => {
    expect(resolveAppearance("system", true)).toBe("dark");
    expect(resolveAppearance("system", false)).toBe("light");
    expect(resolveAppearance("light", true)).toBe("light");
    expect(resolveAppearance("dark", false)).toBe("dark");
  });

  it("updates on OS changes only when following the system", () => {
    initializeAppearance();
    expect(root.dataset.mode).toBe("light");
    systemDark = true;
    mediaChange();
    expect(root.dataset.mode).toBe("dark");
    setAppearance("light");
    mediaChange();
    expect(root.dataset.mode).toBe("light");
  });

  it("keeps mode independent of palettes and follows changes from another tab", () => {
    initializeAppearance();
    setAppearance("dark");
    store.set(viewerSettingKey("cc.palette.v1"), "forest");
    applyAppearance();
    expect(root.dataset.mode).toBe("dark");
    store.set(viewerSettingKey("cc.appearance.v1"), "light");
    storageChange({ key: viewerSettingKey("cc.appearance.v1") });
    expect(root.dataset.mode).toBe("light");
  });

  it("still applies and retains a selection when storage is unavailable", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("Unavailable");
      },
      setItem: () => {
        throw new Error("Unavailable");
      },
    });
    setAppearance("dark");
    expect(root.dataset.mode).toBe("dark");
    expect(loadAppearance()).toBe("dark");
  });

  it("applies authored palette colors and removes them when returning to light", () => {
    root.dataset.palette = "ocean";
    setAppearance("dark");
    expect(root.style.setProperty).toHaveBeenCalledWith("--color-background", "#0c151c");
    expect(root.style.setProperty).toHaveBeenCalledWith("--color-primary", "#7bc9e8");
    expect(root.style.setProperty).toHaveBeenCalledWith("--color-brand-surface", "#102532");
    root.dataset.palette = "forest";
    applyAppearance();
    expect(root.style.setProperty).toHaveBeenCalledWith("--color-background", "#101711");
    setAppearance("light");
    expect(root.style.removeProperty).toHaveBeenCalledWith("--color-background");
    expect(root.style.removeProperty).toHaveBeenCalledWith("--color-brand-surface");
  });
});
