# Soft edges experiment

Off by default. Lightens shared border colors and replaces hard Tailwind card and
arbitrary shadows with a subtle blurred shadow. Keeps border widths, text colors,
and focus ring layers intact. No borders takes precedence when both are enabled.
Saved on this device, with cross-tab sync and a current-page fallback if storage
is unavailable.

To remove, delete the softEdges import and `initializeSoftEdges()` call from
`src/main.tsx`, delete the SoftEdgesControl import and `<SoftEdgesControl />`
from `src/components/SettingsView.tsx`, then delete this folder. The leftover
`cc.experimental.soft-edges.v1` storage entry is inert.
