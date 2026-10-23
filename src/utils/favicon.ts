import { subscribeAppearance } from "./appearance";
import favicon from "../favicon.svg?raw";

/** Keep the tab monogram in sync with the same resolved colors as the app. */
export function initializeFavicon(): void {
  const icon = document.querySelector<HTMLLinkElement>("#cc-favicon");
  if (!icon) return;

  const sync = () => {
    const colors = getComputedStyle(document.documentElement);
    // Match <Brand light monogram> on the header's brand surface.
    const ink = colors.getPropertyValue("--color-brand-foreground").trim() || "#ffffff";
    const accent = colors.getPropertyValue("--color-brand-accent").trim() || "#e8c451";
    const surface = colors.getPropertyValue("--color-brand-surface").trim() || "#6558bd";
    const svg = favicon.replace(
      /<style id="colors">[\s\S]*?<\/style>/,
      `<style>:root{--ink:${ink};--accent:${accent};--surface:${surface}}</style>`,
    );
    icon.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  };

  sync();
  // Palette changes also apply appearance, including account and storage updates.
  subscribeAppearance(sync);
}
