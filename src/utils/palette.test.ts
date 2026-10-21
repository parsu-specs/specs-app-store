import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadPalette, PALETTES, resolvePalette, setPalette } from "./palette";
import { SITE_PALETTE_IDS } from "../data/types";
import { DARK_PALETTES, palettesForMode } from "./darkPalettes";

import { setActiveViewer } from "./viewerCache";

const store = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: (k: string) => (store.has(k) ? (store.get(k) as string) : null),
  setItem: (k: string, v: string) => void store.set(k, String(v)),
  removeItem: (k: string) => void store.delete(k),
});

beforeEach(() => {
  store.clear();
  setActiveViewer("test-user");
});

describe("palettes", () => {
  it("uses the default visitor palette without losing the account choice", () => {
    setPalette("ocean");
    setActiveViewer(null);
    expect(loadPalette()).toBe("candy");
    setActiveViewer("another-user");
    expect(loadPalette()).toBe("candy");
    setActiveViewer("test-user");
    expect(loadPalette()).toBe("ocean");
  });
  it("offers different names and previews for dark mode across every saved palette", () => {
    const light = palettesForMode("light", PALETTES);
    const dark = palettesForMode("dark", PALETTES);
    expect(dark.map((palette) => palette.id)).toEqual(light.map((palette) => palette.id));
    dark.forEach((palette, index) => {
      expect(palette.label).not.toBe(light[index].label);
      expect(palette.swatches).not.toEqual(light[index].swatches);
    });
    expect(
      new Set(Object.values(DARK_PALETTES).map((palette) => palette.colors.background)).size,
    ).toBe(9);
  });

  it("offers a full shelf with preview swatches", () => {
    expect(PALETTES.length).toBeGreaterThanOrEqual(6);
    for (const p of PALETTES) {
      expect(p.id).toBeTruthy();
      expect(p.swatches.length).toBeGreaterThanOrEqual(4);
    }
  });

  it("defaults to candy and rejects unknown ids", () => {
    expect(loadPalette()).toBe("candy");
    setPalette("ocean");
    expect(loadPalette()).toBe("ocean");
    setPalette("nope");
    expect(loadPalette()).toBe("candy");
  });

  it("covers every contract id exactly once", () => {
    expect(PALETTES.map((p) => p.id).sort()).toEqual([...SITE_PALETTE_IDS].sort());
  });

  it("prefers the account palette, falls back to device", () => {
    setPalette("forest");
    expect(resolvePalette("midnight")).toBe("midnight");
    expect(resolvePalette(undefined)).toBe("forest");
    expect(resolvePalette(null)).toBe("forest");
    expect(resolvePalette("")).toBe("forest");
    expect(resolvePalette("nope")).toBe("forest");
    store.clear();
    expect(resolvePalette(undefined)).toBe("candy");
  });
});
