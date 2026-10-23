# Glass theme experiment

Off by default. Frosts foreground cards, fixed navigation headers/sidebars, and
modal panels while leaving the page background unchanged. Uses the active
palette's light or dark colors. Keeps text, form
controls, borders, and shadows unchanged so the other experiments remain independent.
Browsers without backdrop-filter keep normal surfaces; reduced transparency
preferences get opaque surfaces without blur.

Saved on this device with cross-tab sync and a current-page fallback when storage
is unavailable.

To remove, delete the glassTheme import and `initializeGlassTheme()` call from
`src/main.tsx`, delete the GlassThemeControl import and `<GlassThemeControl />`
from `src/components/SettingsView.tsx`, then delete this folder. The leftover
`cc.experimental.glass-theme.v1` storage entry is inert.
