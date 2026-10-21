import { SITE_PALETTE_IDS } from "../data/types";
import { applyAppearance } from "./appearance";
import { activeViewerId, viewerSettingKey } from "./viewerCache";

export type Palette = {
  id: string;
  label: string;
  /** Preview dots (mirrors the CSS vars in styles/tailwind.css). */
  swatches: string[];
};

type SitePaletteId = (typeof SITE_PALETTE_IDS)[number];

// UI metadata per contract id. Keyed by SitePaletteId so a contract id
// without metadata (or vice versa) fails the build, not the browser.
const META: Record<SitePaletteId, { label: string; swatches: string[] }> = {
  candy: {
    label: "Candy",
    swatches: ["#6558bd", "#e8c451", "#9bcab5", "#dfa0a4", "#91b8c8"],
  },
  ocean: {
    label: "Ocean",
    swatches: ["#2f6df6", "#ffcf5c", "#4fd1b5", "#ff9ec6", "#6fc3e8"],
  },
  sunset: {
    label: "Sunset",
    swatches: ["#9d4edd", "#ff9e00", "#8ac926", "#ff5d8f", "#4cc9f0"],
  },
  forest: {
    label: "Forest",
    swatches: ["#2d6a4f", "#e9c46a", "#74c69d", "#e5989b", "#6aaed6"],
  },
  mono: {
    label: "Mono",
    swatches: ["#3f3f3f", "#8a8a8a", "#b0b0b0", "#c9c9c9", "#dcdcdc"],
  },
  bubblegum: {
    label: "Bubblegum",
    swatches: ["#d6336c", "#ffd166", "#8ce8d2", "#ff5d8f", "#a9def9"],
  },
  citrus: {
    label: "Citrus",
    swatches: ["#65a30d", "#facc15", "#4ade80", "#fb7185", "#22d3ee"],
  },
  grape: {
    label: "Grape",
    swatches: ["#6d28d9", "#e9d5ff", "#c4b5fd", "#f0abfc", "#a5b4fc"],
  },
  midnight: {
    label: "Moonstone",
    swatches: ["#8b7cf6", "#e8c451", "#7dd3b8", "#f2a3b3", "#7cc7e8"],
  },
};

export const PALETTES: Palette[] = SITE_PALETTE_IDS.map((id) => ({ id, ...META[id] }));

const DEFAULT_ID = "candy";
const STORAGE_KEY = "cc.palette.v1";

function isKnown(id: string): boolean {
  return (SITE_PALETTE_IDS as readonly string[]).includes(id);
}

function readStored(): string | null {
  try {
    if (!activeViewerId()) return null;
    return localStorage.getItem(viewerSettingKey(STORAGE_KEY));
  } catch {
    return null;
  }
}

/** Validated device palette id, defaulting to candy (also the CSS default). */
export function loadPalette(): string {
  const stored = readStored();
  return stored !== null && isKnown(stored) ? stored : DEFAULT_ID;
}

/**
 * Effective palette: the account's choice wins when set and valid,
 * otherwise the device choice. Account beats device so a login carries
 * your palette to a new browser; an empty account keeps local behavior.
 */
export function resolvePalette(accountPalette?: string | null): string {
  if (accountPalette !== undefined && accountPalette !== null) {
    const clean = accountPalette.trim();
    if (clean !== "" && isKnown(clean)) return clean;
  }
  return loadPalette();
}

function applyAttribute(id: string): void {
  if (typeof document === "undefined") return;
  if (id === DEFAULT_ID) document.documentElement.removeAttribute("data-palette");
  else document.documentElement.setAttribute("data-palette", id);
  applyAppearance();
}

export function setPalette(id: string): void {
  const next = isKnown(id) ? id : DEFAULT_ID;
  try {
    if (activeViewerId()) localStorage.setItem(viewerSettingKey(STORAGE_KEY), next);
  } catch {
    // Non-fatal.
  }
  applyAttribute(next);
}

// Called by the entry point on every route, before React mounts.
export function initializePalette(): void {
  applyAttribute(loadPalette());
}
